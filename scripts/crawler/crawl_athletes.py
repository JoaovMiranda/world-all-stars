#!/usr/bin/env python3
"""Crawler de identificação de atletas campeões (futebol + jiu-jitsu).

Fonte da verdade = Wikipedia. Os outros links só servem para identificar/conferir.
Saída: data/seeds/atletas.csv e data/seeds/relatorio-crawler.md

Uso:  python3 scripts/crawler/crawl_athletes.py   (cache em data/seeds/.cache)
"""
import csv, io, json, re, sys, time, unicodedata, urllib.error, urllib.parse, urllib.request
from collections import OrderedDict, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SEEDS = ROOT / "data" / "seeds"
CACHE = SEEDS / ".cache"
UA = "WorldAllStarsSeedBot/0.1 (athlete identification; polite, cached)"
DELAY = 3.0
FJELSTUL = "https://raw.githubusercontent.com/jfjelstul/worldcup/master/data-csv/"
WIKI = "https://en.wikipedia.org/wiki/"
SEARCH = "https://en.wikipedia.org/w/index.php?search="

report = []          # linhas do relatório
_last = [0.0]


def log(msg):
    print(msg, flush=True)
    report.append(msg)


def fetch(url, cache_name, binary=False):
    """GET com cache em disco, pausa entre requisições e backoff em 429."""
    path = CACHE / cache_name
    if path.exists() and path.stat().st_size > 0:
        return path.read_bytes() if binary else path.read_text(encoding="utf-8", errors="replace")
    path.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(5):
        wait = DELAY - (time.time() - _last[0])
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.time()
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            path.write_bytes(data)
            return data if binary else data.decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code in (429, 503):
                time.sleep(15 * (attempt + 1))
                continue
            raise
    raise RuntimeError(f"falhou: {url}")


def wiki_raw(title):
    safe = re.sub(r"[^\w\-]+", "_", title)[:150]
    url = "https://en.wikipedia.org/w/index.php?" + urllib.parse.urlencode({"title": title, "action": "raw", "redirect": "yes"})
    text = fetch(url, f"wiki/{safe}.wiki")
    if text and text.lstrip().upper().startswith("#REDIRECT"):
        m = re.search(r"\[\[([^\]|#]+)", text)
        if m:
            return wiki_raw(m.group(1).strip())
    return text


NAME_FIELD = re.compile(r"\|\s*name\s*=\s*((?:\[\[[^\]]*\]\]|\{\{[^{}]*\}\}|[^|{}\[])+)")


def player_name(tpl):
    m = NAME_FIELD.search(tpl)
    return link_or_text(m.group(1)) if m else None


def wiki_url(title):
    return WIKI + urllib.parse.quote(title.strip().replace(" ", "_"), safe="()_,'-.")


def search_url(q):
    return SEARCH + urllib.parse.quote_plus(q)


def norm(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z]+", " ", s.lower()).strip()


# ---------------------------------------------------------------- registro de atletas
athletes = OrderedDict()   # chave -> dict


def add(nome, esporte, categoria, titulo, link_title=None, url=None, fonte="", pais=""):
    nome = re.sub(r"\s+", " ", nome).strip()
    if not nome:
        return
    if url is None:
        url = wiki_url(link_title) if link_title else search_url(f"{nome} {'footballer' if esporte == 'futebol' else 'jiu-jitsu'}")
    tipo = "busca" if "index.php?search=" in url else "pagina"
    key = url if tipo == "pagina" else f"{esporte}|{norm(nome)}"
    a = athletes.get(key)
    if not a:
        a = athletes[key] = dict(nome=nome, esporte=esporte, categoria=categoria, pais=pais, titulos=[],
                                 wikipedia_url=url, tipo_link=tipo, fontes=[])
    if titulo and titulo not in a["titulos"]:
        a["titulos"].append(titulo)
    if fonte and fonte not in a["fontes"]:
        a["fontes"].append(fonte)
    if pais and not a["pais"]:
        a["pais"] = pais


LINK = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]")


def strip_markup(s):
    s = re.sub(r"<ref[^>]*/>|<ref[^>]*>.*?</ref>", "", s, flags=re.S)
    s = re.sub(r"\[\[(?:File|Image):[^\]]*\]\]", "", s)
    for _ in range(3):
        s = re.sub(r"\{\{[^{}]*\}\}", "", s)
    return s


def link_or_text(cell):
    """Último [[link]] da célula, ou o texto puro."""
    cell = cell.replace("&nbsp;", " ")
    cell = re.sub(r"\{\{\s*sortname\s*\|([^|}]*)\|([^|}]*)(?:\|([^|}=]*))?[^}]*\}\}",
                  lambda m: f"[[{(m.group(3) or (m.group(1) + ' ' + m.group(2))).strip()}|{m.group(1).strip()} {m.group(2).strip()}]]", cell)
    cell = strip_markup(cell)
    links = [(t, lbl) for t, lbl in LINK.findall(cell) if not t.startswith(("File:", "Image:", "Captain"))]
    if links:
        t, lbl = links[-1]
        return (lbl or t).strip(), t.strip()
    txt = re.sub(r"<[^>]+>|'''?|\(c\)", "", cell).strip(" |- ")
    return txt, None


# ---------------------------------------------------------------- Copa do Mundo (Fjelstul)
def fjelstul():
    tabs = {}
    for name in ("tournaments", "tournament_standings", "squads", "players", "player_appearances", "matches"):
        txt = fetch(FJELSTUL + name + ".csv", f"fjelstul/{name}.csv")
        tabs[name] = list(csv.DictReader(io.StringIO(txt)))
    players = {p["player_id"]: p for p in tabs["players"]}
    champ = {s["tournament_id"]: s["team_id"] for s in tabs["tournament_standings"] if s["position"] == "1"}
    last_match = {}
    for m in tabs["matches"]:
        t = champ.get(m["tournament_id"])
        if t in (m["home_team_id"], m["away_team_id"]):
            k = m["tournament_id"]
            if k not in last_match or (m["match_date"], m["match_id"]) > last_match[k][:2]:
                last_match[k] = (m["match_date"], m["match_id"], m["match_name"])
    starters = defaultdict(set)
    for a in tabs["player_appearances"]:
        lm = last_match.get(a["tournament_id"])
        if lm and a["match_id"] == lm[1] and a["team_id"] == champ[a["tournament_id"]] and a["starter"] == "1":
            starters[a["tournament_id"]].add(a["player_id"])
    tnames = {t["tournament_id"]: t for t in tabs["tournaments"]}
    count = defaultdict(int)
    for s in tabs["squads"]:
        tid = s["tournament_id"]
        if champ.get(tid) != s["team_id"]:
            continue
        t = tnames[tid]
        fem = "Women" in t["tournament_name"]
        p = players.get(s["player_id"], {})
        nome = f"{s['given_name']} {s['family_name']}".replace("not applicable", "").strip()
        tit = "titular na final" if s["player_id"] in starters[tid] else "elenco"
        titulo = f"Copa do Mundo {'feminina' if fem else 'masculina'} {t['year']} · {s['team_name']} ({tit})"
        link = p.get("player_wikipedia_link") or None
        add(nome, "futebol", "feminino" if fem else "masculino", titulo,
            url=link if link and link.startswith("http") else None, fonte="Fjelstul/DataHub", pais=s["team_name"])
        count[tid] += 1
    log(f"- Fjelstul (= DataHub football/worldcup): {len(count)} Copas campeãs, {sum(count.values())} vagas de elenco, "
        f"{sum(len(v) for v in starters.values())} titulares de final")
    for tid in sorted(count):
        n_st = len(starters[tid])
        flag = "" if n_st == 11 else f"  · titulares fora da base ({n_st}), buscando na Wikipedia"
        log(f"  - {tid} {tnames[tid]['winner']}: elenco {count[tid]}{flag}")
    # Fjelstul só tem escalações desde 1970 (e faltam 1999/2011): completa pela página da final na Wikipedia
    for tid in sorted(count):
        if len(starters[tid]) == 11:
            continue
        t = tnames[tid]
        fem = "Women" in t["tournament_name"]
        year = t["year"]
        pages = ["Uruguay v Brazil (1950 FIFA World Cup)", "Maracanazo"] if year == "1950" else \
                [f"{year} FIFA {'Women' + chr(39) + 's ' if fem else ''}World Cup final"]
        got = None
        for pg in pages:
            txt = wiki_raw(pg)
            if txt:
                got = final_starters(txt, [t["winner"]])
                if got:
                    break
        winner = t["winner"]
        label = f"Copa do Mundo {'feminina' if fem else 'masculina'} {year} · {winner}"
        if not got:
            log(f"  - ⚠️ {tid}: titulares não encontrados na Wikipedia")
            continue
        for n, lk in got:
            mark_starter(n, lk, label, "feminino" if fem else "masculino", winner)
        log(f"  - {tid}: {len(got)} titulares da final pela Wikipedia")
    return {tid: tnames[tid]["winner"] for tid in count}


def title_key(url_or_title):
    t = urllib.parse.unquote(url_or_title.split("/wiki/")[-1]).replace("_", " ")
    return norm(t)


def mark_starter(nome, link, label, cat, pais):
    """Troca '(elenco)' por '(titular na final)' no atleta certo; se não achar, cria a linha."""
    keys = {title_key(link)} if link else set()
    keys.add(norm(nome))
    for a in athletes.values():
        if a["esporte"] != "futebol":
            continue
        if title_key(a["wikipedia_url"]) in keys or norm(a["nome"]) in keys:
            for i, tt in enumerate(a["titulos"]):
                if tt.startswith(label):
                    a["titulos"][i] = f"{label} (titular na final)"
                    return
    add(nome, "futebol", cat, f"{label} (titular na final)", link_title=link, fonte="Wikipedia", pais=pais)


# ---------------------------------------------------------------- escalações em páginas da Wikipedia
ROW = re.compile(r"^\|\s*([A-Z]{2,3})\s*\|\|(?:\s*(?:'''\s*)?\d+(?:\s*''')?\s*\|\|)?(.+)$")


def lineup_blocks(text):
    """Lista de blocos de titulares (lista de (nome, link)) na ordem em que aparecem."""
    blocks, cur, in_starters = [], [], True
    for line in text.splitlines():
        ls = line.strip()
        if ls.startswith("{|"):          # nova tabela de escalação
            if len(cur) >= 9:
                blocks.append(cur)
            cur, in_starters = [], True
            continue
        if re.search(r"Substitut|Substitute", ls):
            if cur:
                blocks.append(cur)
            cur, in_starters = [], False
            continue
        if re.search(r"Manager|Coach|Head coach", ls) and not in_starters:
            in_starters = True
            continue
        m = ROW.match(ls)
        if m and in_starters:
            cur.append(link_or_text(m.group(2).split("||")[0]))
    if cur:
        blocks.append(cur)
    return [b for b in blocks if len(b) >= 9]


def section(text, heading_re):
    m = re.search(r"^=+\s*(?:" + heading_re + r")\s*=+\s*$", text, flags=re.M | re.I)
    if not m:
        return None
    level = len(re.match(r"=+", text[m.start():]).group())
    nxt = re.search(r"^={2,%d}[^=]" % level, text[m.end():], flags=re.M)
    return text[m.end(): m.end() + nxt.start()] if nxt else text[m.end():]


def winner_side(box_text, names):
    for line in box_text.splitlines():
        for side in ("team1", "team2"):
            if re.match(r"\s*\|\s*" + side + r"\s*=", line):
                if any(n.lower() in line.lower() for n in names):
                    return 0 if side == "team1" else 1
    return None


def final_starters(text, names):
    blocks = lineup_blocks(text)
    side = winner_side(text, names)
    if side is None or len(blocks) < 2:
        return None
    return blocks[side][:11]


# ---------------------------------------------------------------- Copas 2023 (fem) e 2026 (masc) na Wikipedia
def infobox_winner(text):
    """Campeão pelo infobox da final: placar e, se empatar, pênaltis."""
    f = dict(re.findall(r"^\|\s*(team[12](?:score|penalties)?|penalties[12])\s*=\s*(.*)$", text[:8000], flags=re.M))
    t1, t2 = link_or_text(f.get("team1", ""))[0], link_or_text(f.get("team2", ""))[0]
    num = lambda k: int(re.sub(r"\D", "", f.get(k, "")) or -1)
    s1, s2 = num("team1score"), num("team2score")
    if s1 == s2:
        s1, s2 = num("team1penalties") if "team1penalties" in f else num("penalties1"), \
                 num("team2penalties") if "team2penalties" in f else num("penalties2")
    if s1 == s2 or not t1 or not t2:
        return None
    return t1 if s1 > s2 else t2


def wc_recent():
    for year, fem, squads_page, final_page in (
        (2023, True, "2023 FIFA Women's World Cup squads", "2023 FIFA Women's World Cup final"),
        (2026, False, "2026 FIFA World Cup squads", "2026 FIFA World Cup final"),
    ):
        final = wiki_raw(final_page) or ""
        winner = infobox_winner(final)
        if not winner:
            log(f"- ⚠️ {year}: não identifiquei o campeão em '{final_page}'")
            continue
        starters = final_starters(final, [winner]) or []
        sq = wiki_raw(squads_page) or ""
        sec = section(sq, re.escape(winner)) or ""
        names = []
        for tpl in re.findall(r"\{\{nat fs g player([^}]*(?:\{\{[^}]*\}\}[^}]*)*)\}\}", sec):
            nm = player_name(tpl)
            if nm and nm[0]:
                names.append(nm)
        cat = "feminino" if fem else "masculino"
        label = f"Copa do Mundo {'feminina' if fem else 'masculina'} {year} · {winner}"
        for n, lk in names:
            add(n, "futebol", cat, f"{label} (elenco)", link_title=lk, fonte="Wikipedia", pais=winner)
        for n, lk in starters:
            mark_starter(n, lk, label, cat, winner)
        log(f"- Wikipedia Copa {'feminina' if fem else 'masculina'} {year}: campeão {winner}, elenco {len(names)}, titulares {len(starters)}")


# ---------------------------------------------------------------- Olimpíadas
MEN_YEARS = [1908, 1912, 1920, 1924, 1928, 1936, 1948, 1952, 1956, 1960, 1964, 1968, 1972, 1976, 1980,
             1984, 1988, 1992, 1996, 2000, 2004, 2008, 2012, 2016, 2020, 2024]
WOMEN_YEARS = [1996, 2000, 2004, 2008, 2012, 2016, 2020, 2024]
IOC_NAMES = {"GBR": ["Great Britain"], "BEL": ["Belgium"], "URU": ["Uruguay"], "ITA": ["Italy"], "SWE": ["Sweden"],
             "HUN": ["Hungary"], "URS": ["Soviet Union"], "YUG": ["Yugoslavia"], "POL": ["Poland"],
             "GDR": ["East Germany"], "TCH": ["Czechoslovakia"], "FRA": ["France"], "FRG": ["West Germany"],
             "EUN": ["Unified Team"], "ESP": ["Spain"], "NGR": ["Nigeria"], "CMR": ["Cameroon"], "ARG": ["Argentina"],
             "MEX": ["Mexico"], "BRA": ["Brazil"], "USA": ["United States"], "NOR": ["Norway"], "GER": ["Germany"],
             "CAN": ["Canada"]}
COUNTRY_TPL = re.compile(r"\{\{\s*(?i:flagIOC\w*|fb[\w-]*|flagcountry|flag)\s*\|(?:\s*\d+\s*\|)?\s*([A-Z]{3}\b|[A-Z][a-z][A-Za-z .]+?)\s*(?:\|[^{}]*)?\}\}")


def to_ioc(val):
    """Código FIFA/IOC ou nome do país -> código IOC."""
    val = val.strip()
    if re.fullmatch(r"[A-Z]{3}", val):
        return FIFA_TO_IOC.get(val, val)
    for code, names in IOC_NAMES.items():
        if val in names:
            return code
    return val
SKIP_NAME = re.compile(r"^(?:coach|manager|gold|silver|bronze|men|women|valign|style|width|rowspan|colspan|event)\b", re.I)


def chunk_names(chunk):
    """Nomes de um bloco de medalhistas; separa quem está depois de <hr> (reservas que não jogaram)."""
    chunk = re.sub(r"\{\{\s*Medals table.*?\}\}", "", chunk, flags=re.S)
    chunk = re.sub(r"(?im)^.*\bcoach\b.*$", "", chunk)
    core, reserves = [], []
    for part_i, part in enumerate(re.split(r"<hr\s*/?>", chunk)):
        # depois de um <hr> só é reserva se já havia nomes antes dele
        target = reserves if part_i > 0 and core else core
        for piece in re.split(r"<br\s*/?>|\n", part):
            piece = re.sub(r"''\(captain\)''|\(captain\)", "", piece)
            if not piece.strip() or COUNTRY_TPL.search(piece) and not LINK.search(strip_markup(piece)):
                continue
            n, lk = link_or_text(piece)
            n = re.sub(r"<[^>]+>|\{\{.*|^[|!:;\s]+|[|\s]+$", "", n).strip(" *–-")
            if not n or len(n) < 3 or SKIP_NAME.match(n) or re.search(r"[{}=]|\d{3}", n):
                continue
            target.append((n, lk))
    return core, reserves


# códigos FIFA/antigos da tabela de finais -> código IOC usado nas seções de medalhas
FIFA_TO_IOC = {"SPA": "ESP", "NGA": "NGR", "CSK": "TCH", "DDR": "GDR", "FRG": "FRG", "URS": "URS"}


def olympic_golds():
    """Campeão de cada edição pela tabela de finais de 'Football at the Summer Olympics'."""
    txt = wiki_raw("Football at the Summer Olympics") or ""
    out = {}
    for gender, head in (("Men", r"==Men's tournament=="), ("Women", r"==Women's tournament==")):
        m = re.search(head, txt)
        if not m:
            continue
        body = txt[m.end():]
        stop = re.search(r"^==[^=]", body, flags=re.M)
        body = body[: stop.start()] if stop else body
        for row in re.split(r"\n\|-", body):
            y = re.search(r"\[\[(?:association )?football at the (\d{4}) Summer Olympics", row, flags=re.I)
            g = re.search(r"'''\s*\{\{\s*fb\w*\s*\|(?:\s*\d+\s*\|)?\s*([A-Z]{3}\b|[A-Z][a-z][A-Za-z .]+?)\s*[|}]", row)
            if y and g:
                out[(gender, int(y.group(1)))] = to_ioc(g.group(1))
    return out


def medalists_gold(text, event, code):
    """(titulares/elenco, reservas) do ouro de 'Men' ou 'Women' para o país 'code'."""
    sec = section(text, r"Medal(?:l)?ists|Medal winners|Medal summary") or ""
    if not sec:
        return [], []
    # separa masculino/feminino quando a página tem os dois
    wpos = re.search(r"(?:^|\||=|\])\s*(?:\[\[[^|\]]*\|)?Women(?:'s)?\b", sec, flags=re.M)
    part = (sec[: wpos.start()] if wpos else sec) if event == "Men" else (sec[wpos.start():] if wpos else "")
    hits = list(COUNTRY_TPL.finditer(part))
    best = ([], [])
    for i, h in enumerate(hits):   # bloco do país campeão com mais nomes (ignora o quadro de medalhas)
        if to_ioc(h.group(1)) != code:
            continue
        end = hits[i + 1].start() if i + 1 < len(hits) else len(part)
        core, reserves = chunk_names(part[h.end(): end])
        if len(core) + len(reserves) > len(best[0]) + len(best[1]):
            best = (core, reserves)
    if not best[0]:
        best = (column_table_gold(part, code), [])
    return best


def column_table_gold(part, code):
    """Tabela em colunas: uma linha com os países e a linha seguinte com os elencos, na mesma ordem."""
    rows = re.split(r"\n\|-[^\n]*", part)
    for i, row in enumerate(rows[:-1]):
        countries = [to_ioc(m.group(1)) for m in COUNTRY_TPL.finditer(row)]
        if len(countries) < 2 or code not in countries or LINK.search(strip_markup(row)):
            continue
        cells = [c for c in re.split(r"\n\s*\|(?!\})", "\n" + rows[i + 1].strip()) if c.strip()]
        idx = countries.index(code)
        if idx < len(cells):
            cell = re.sub(r"^[^|\[]*\|(?!\|)", "", cells[idx], count=1)   # tira atributos tipo valign=top|
            return chunk_names(cell)[0]
    return []


def squad_page_names(year, gender, code):
    """Fallback: elenco do país campeão na página de elencos do torneio."""
    names = IOC_NAMES.get(code, [code])
    g = "Men's" if gender == "Men" else "Women's"
    for title in (f"Football at the {year} Summer Olympics – {g} team squads",
                  f"Football at the {year} Summer Olympics – {g} tournament squads",
                  f"Football at the {year} Summer Olympics – Team squads",
                  f"Football at the {year} Summer Olympics squads"):
        txt = wiki_raw(title)
        if not txt:
            continue
        for nm in names:
            sec = section(txt, re.escape(nm))
            if not sec:
                continue
            out = []
            for tpl in re.findall(r"\{\{nat fs (?:g )?player([^}]*(?:\{\{[^}]*\}\}[^}]*)*)\}\}", sec):
                nm = player_name(tpl)
                if nm and nm[0]:
                    out.append(nm)
            if out:
                return out, title
    return [], None


def olympics():
    golds = olympic_golds()
    log(f"- Campeões pela tabela de finais (Football at the Summer Olympics): {len(golds)} edições")
    for gender, years in (("Men", MEN_YEARS), ("Women", WOMEN_YEARS)):
        for y in years:
            base = f"Football at the {y} Summer Olympics"
            if "{{disambiguation" in (wiki_raw(base) or "").lower():
                base = f"Association football at the {y} Summer Olympics"
            code = golds.get((gender, y))
            gold, reserves = [], []
            for page in (base, f"{base} – {gender}'s tournament"):
                if code and not gold:
                    gold, reserves = medalists_gold(wiki_raw(page) or "", gender, code)
            src_note = ""
            if code and len(gold) < 11:
                sq, src = squad_page_names(y, gender, code)
                if len(sq) > len(gold):
                    gold, reserves, src_note = sq, [], f" (elenco via '{src}')"
            cat = "masculino" if gender == "Men" else "feminino"
            country = (IOC_NAMES.get(code) or [code])[0] if code else "?"
            # titulares do jogo pela medalha de ouro
            starters = None
            tname = f"{gender}'s tournament"
            for page in (f"{base} – {tname} final", f"{base} – {tname} – Knockout stage", f"{base} – {tname}", base):
                pt = wiki_raw(page)
                if not pt:
                    continue
                sec = pt if page.endswith(" final") else \
                    (section(pt, r"Gold medal match|Final|Gold medal final|Final round|Gold Medal match") or "")
                if "#lst:" in sec and not lineup_blocks(sec):
                    continue
                st = final_starters(sec, IOC_NAMES.get(code, []) + [code] + [k for k, v in FIFA_TO_IOC.items() if v == code]) if sec and code else None
                if st:
                    starters = st
                    break
            label = f"Olimpíadas {y} · futebol {cat} · {country}"
            for n, lk in gold:
                tag = "elenco" if starters else "elenco; titular não verificado"
                add(n, "futebol", cat, f"{label} ({tag})", link_title=lk, fonte="Wikipedia", pais=country)
            for n, lk in reserves:
                add(n, "futebol", cat, f"{label} (elenco, não entrou em campo)", link_title=lk, fonte="Wikipedia", pais=country)
            for n, lk in (starters or []):
                mark_starter(n, lk, label, cat, country)
            flag = "" if gold else "  ⚠️ ouro não encontrado"
            sflag = f"titulares {len(starters)}" if starters else "titulares ⚠️ não extraídos"
            log(f"  - Olimpíadas {y} {cat}: ouro {country}, medalhistas {len(gold)}+{len(reserves)} reservas{src_note}, {sflag}{flag}")


# ---------------------------------------------------------------- Jiu-jitsu (ADCC + Mundial IBJJF faixa-preta)
CHAMP = re.compile(r"(?:<small>|\{\{\s*small\s*\|)\s*\(\s*\d+\s*/\s*\d+\s*\)")


def bjj_champions(text, start_re, end_re):
    m1 = re.search(start_re, text, flags=re.M)
    m2 = re.search(end_re, text[m1.end():], flags=re.M) if m1 else None
    if not m1:
        return []
    body = text[m1.start(): m1.end() + (m2.start() if m2 else len(text))]
    out, gender = [], "masculino"
    for line in body.splitlines():
        if re.match(r"^=+.*Women", line):
            gender = "feminino"
        elif re.match(r"^=+.*(Men|Superfight)", line) and "Women" not in line:
            gender = "masculino"
        for cell in line.split("||"):
            mm = CHAMP.search(cell)
            if not mm:
                continue
            n, lk = link_or_text(cell[: mm.start()])
            n = re.sub(r"^\d{4}\s*", "", n).strip(" |")
            if n and not re.match(r"^\d", n):
                out.append((n, lk, gender))
    return out


def bjj():
    adcc = wiki_raw("ADCC Submission Fighting World Championship") or ""
    a = bjj_champions(adcc, r"^=== List of ADCC Champions in Men", r"^=== List of winners by total titles")
    for n, lk, g in a:
        add(n, "jiu-jitsu", g, "Campeão ADCC (peso, absoluto ou superluta)", link_title=lk, fonte="Wikipedia ADCC")
    ib = wiki_raw("World IBJJF Jiu-Jitsu Championship") or ""
    b = bjj_champions(ib, r"^=== Men's black belt world champions", r"^== List of winners by total titles")
    for n, lk, g in b:
        add(n, "jiu-jitsu", g, "Campeão Mundial IBJJF faixa-preta", link_title=lk, fonte="Wikipedia IBJJF")
    log(f"- ADCC: {len(a)} títulos lidos, {len({(x[1] or x[0]) for x in a})} atletas")
    log(f"- Mundial IBJJF faixa-preta: {len(b)} títulos lidos, {len({(x[1] or x[0]) for x in b})} atletas")


USER_BJJ = [  # lista enviada pelo usuário (mantida mesmo se o parser não achar)
    # links sem página na lista original apontam para o título que a própria Wikipedia usa nas tabelas ADCC/IBJJF
    ("André Galvão", "André Galvão"), ("Baret Yoshida", None), ("Braulio Estima", "Braulio Estima"),
    ("Dean Lister", "Dean Lister"), ("Fabrício Werdum", "Fabrício Werdum"), ("Jean-Jacques Machado", "Jean Jacques Machado"),
    ("Marcelo Garcia", "Marcelo Garcia (grappler)"), ("Mark Kerr", "Mark Kerr (fighter)"), ("Mário Sperry", "Mario Sperry"),
    ("Orlando Sanchez", "Orlando Sanchez (grappler)"), ("Rafael Mendes", "Rafael Mendes"), ("Ricardo Arona", "Ricardo Arona"),
    ("Ronaldo Jacaré Souza", "Ronaldo Souza"), ("Renzo Gracie", "Renzo Gracie"), ("Roger Gracie", "Roger Gracie"),
    ("Royler Gracie", "Royler Gracie"), ("Rubens Charles Maciel (Cobrinha)", "Rubens Charles Maciel"),
    ("Saulo Ribeiro", "Saulo Ribeiro"), ("Vinny Magalhães", "Vinny Magalhães"), ("Xande Ribeiro", "Alexandre Ribeiro"),
]


def merge_duplicates():
    """Une linhas do mesmo atleta (mesmo título de página sem acento, ou mesmo nome)."""
    merged, index = OrderedDict(), {}
    for a in athletes.values():
        keys = [(a["esporte"], "n:" + norm(a["nome"]))]
        if a["tipo_link"] == "pagina":
            keys.append((a["esporte"], "t:" + title_key(a["wikipedia_url"])))
        hit = next((index[k] for k in keys if k in index), None)
        if hit is not None and hit["tipo_link"] == a["tipo_link"] == "pagina" and \
                title_key(hit["wikipedia_url"]) != title_key(a["wikipedia_url"]):
            hit = None   # mesmo nome, páginas diferentes = pessoas diferentes
        if hit is None:
            merged[id(a)] = a
            for k in keys:
                index[k] = a
            continue
        if hit["tipo_link"] == "busca" and a["tipo_link"] == "pagina":
            hit["wikipedia_url"], hit["tipo_link"] = a["wikipedia_url"], "pagina"
        for f in ("titulos", "fontes"):
            hit[f] += [x for x in a[f] if x not in hit[f]]
        hit["pais"] = hit["pais"] or a["pais"]
        for k in keys:
            index.setdefault(k, hit)
    removed = len(athletes) - len(merged)
    athletes.clear()
    for a in merged.values():
        athletes[id(a)] = a
    log(f"- Duplicatas unidas: {removed}")


# ---------------------------------------------------------------- links de apoio (só identificação/checagem)
def support_links():
    log("\n## Links de apoio (identificação/conferência)")
    rsssf = fetch("https://www.rsssf.org/miscellaneous/wcwinners.html", "rsssf/wcwinners.html", binary=True)
    txt = re.sub(r"<[^>]+>", "", rsssf.decode("latin-1"))
    years = re.findall(r"^(\d{4}) ([A-Z][A-Za-z ]+)$", txt, flags=re.M)
    log(f"- RSSSF wcwinners: acessado, {len(years)} edições listadas ({years[0][0]}–{years[-1][0]}). "
        f"Usado para conferir campeões: {', '.join(f'{y} {t.strip()}' for y, t in years[-3:])}")
    for url, name in (("https://datahub.io/football/worldcup", "datahub.html"),
                      ("https://www.worldcups.ai/", "worldcups_ai.html"),
                      ("https://www.fifatrainingcentre.com/en/", "fifatrainingcentre.html")):
        try:
            body = fetch(url, f"support/{name}")
            log(f"- {url}: acessado ({len(body or '')} bytes)")
        except Exception as e:
            log(f"- {url}: erro {e}")
    ioc = ("https://library.olympics.com/digitalCollection/DigitalCollectionAttachmentDownloadHandler.ashx"
           "?documentId=848633&parentDocumentId=72685&skipCopyright=true&skipWatermark=true")
    try:
        pdf = fetch(ioc, "support/ioc_mens_olympic_football_kit.bin", binary=True) or b""
        if pdf.startswith(b"%PDF"):
            log(f"- IOC Men's Olympic Football Statistical Kit: PDF baixado ({len(pdf)} bytes)")
        else:
            (CACHE / "support/ioc_mens_olympic_football_kit.bin").unlink(missing_ok=True)
            log("- IOC Men's Olympic Football Statistical Kit: ⚠️ bloqueado — o site exige JavaScript e cookies "
                "(proteção anti-robô). Não foi contornado; as Olimpíadas vieram da Wikipedia.")
    except Exception as e:
        log(f"- IOC Statistical Kit: erro {e}")
    return years


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    log("# Relatório do crawler de atletas\n")
    log("## Futebol · Copa do Mundo")
    fj = fjelstul()
    wc_recent()
    log("\n## Futebol · Olimpíadas (medalhistas de ouro, Wikipedia)")
    olympics()
    log("\n## Jiu-jitsu")
    bjj()
    for n, lk in USER_BJJ:
        add(n, "jiu-jitsu", "masculino", "Lista enviada pelo usuário", link_title=lk, fonte="usuário")
    add("Kyra Gracie", "jiu-jitsu", "feminino", "Lista enviada pelo usuário", link_title="Kyra Gracie", fonte="usuário")
    years = support_links()
    merge_duplicates()

    rows = sorted(athletes.values(), key=lambda a: (a["esporte"], a["categoria"], norm(a["nome"])))
    out = SEEDS / "atletas.csv"
    with out.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["nome", "esporte", "categoria", "pais", "titulos", "wikipedia_url", "tipo_link", "fontes"])
        for a in rows:
            w.writerow([a["nome"], a["esporte"], a["categoria"], a["pais"], " | ".join(a["titulos"]),
                        a["wikipedia_url"], a["tipo_link"], " | ".join(a["fontes"])])
    tot = defaultdict(int)
    for a in rows:
        tot[(a["esporte"], a["categoria"], a["tipo_link"])] += 1
    log("\n## Totais em atletas.csv")
    for k in sorted(tot):
        log(f"- {k[0]} · {k[1]} · link {k[2]}: {tot[k]}")
    log(f"- **Total: {len(rows)} atletas**")
    (SEEDS / "relatorio-crawler.md").write_text("\n".join(report) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

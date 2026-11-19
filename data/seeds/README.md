# Seeds do crawler

Lista de atletas campeões para popular o site. **Fonte da verdade = Wikipedia.** Os outros sites servem só para identificar e conferir os atletas.

## Como rodar
```bash
python3 scripts/crawler/crawl_athletes.py
```
Usa só a biblioteca padrão do Python. As páginas baixadas ficam em `data/seeds/.cache/` (fora do git), então rodar de novo é rápido. Para forçar o download, apague o cache. Há uma pausa de 3 s entre requisições, porque a Wikipedia bloqueia quem pede rápido demais.

## Arquivos
| Arquivo | Conteúdo |
|---|---|
| [atletas.csv](atletas.csv) | **1430 atletas**, um por linha (gerado) |
| [relatorio-crawler.md](relatorio-crawler.md) | O que foi lido em cada fonte, edição por edição, com avisos (gerado) |
| [fontes-crawler.csv](fontes-crawler.csv) | Links de entrada do crawler |

## Escopo
| Esporte | O que entra | Fonte |
|---|---|---|
| Futebol · Copa masculina 1930–2026 (23) | Elenco campeão inteiro + quem foi titular na final | Fjelstul/DataHub (1930–2022), Wikipedia (2026) |
| Futebol · Copa feminina 1991–2023 (9) | Idem | Fjelstul/DataHub (1991–2019), Wikipedia (2023) |
| Futebol · Olimpíadas masculinas 1908–2024 (26) | Elenco medalhista de ouro + titulares do jogo pelo ouro | Wikipedia |
| Futebol · Olimpíadas femininas 1996–2024 (8) | Idem | Wikipedia |
| Jiu-jitsu · ADCC | Campeões por peso, absoluto e superluta, masculino e feminino | Wikipedia (ADCC) |
| Jiu-jitsu · Mundial IBJJF faixa-preta | Campeões por peso e absoluto, masculino e feminino | Wikipedia (World IBJJF Jiu-Jitsu Championship) |
| Jiu-jitsu · lista do usuário | Os 21 nomes enviados (todos também estão no ADCC) | Usuário |

## atletas.csv
| Coluna | Significado |
|---|---|
| `nome` | Nome de exibição (como na Wikipedia) |
| `esporte` | `futebol` · `jiu-jitsu` |
| `categoria` | `masculino` · `feminino` |
| `pais` | Seleção campeã (só futebol) |
| `titulos` | Títulos separados por `\|`. Ex.: `Copa do Mundo masculina 1970 · Brazil (titular na final)` |
| `wikipedia_url` | Página da Wikipedia (en) ou URL de busca |
| `tipo_link` | `pagina` = página direta · `busca` = atleta sem artigo; o crawler de perfil precisa resolver |
| `fontes` | De onde o atleta foi identificado |

No futebol, a marca do título diz o papel na conquista: `titular na final`, `elenco` (estava no grupo, não foi titular na final), `elenco, não entrou em campo` ou `elenco; titular não verificado`.

## Pendências
- **Titulares não extraídos em 9 edições olímpicas:** masc. 1920, 1936, 1952, 1960, 1964, 1968; fem. 1996, 2000, 2008. O elenco campeão está completo; só falta marcar quem começou o jogo pelo ouro.
- **Biblioteca do COI (Statistical Kit 1908–2012):** o site exige JavaScript e cookies, uma proteção anti-robô, e não foi contornado. Não fez falta, porque a Wikipedia cobre o mesmo período.
- **Sem artigo na Wikipedia:** 99 atletas (95 de jiu-jitsu, 4 de futebol) (`tipo_link = busca`), principalmente campeões antigos do Mundial IBJJF. Como a fonte da verdade é a Wikipedia, os perfis deles vão ficar curtos.
- **Possível duplicata por grafia:** "Fernanda Mazelli" e "Fernanda Mazzelli" (IBJJF). Não uni automaticamente.

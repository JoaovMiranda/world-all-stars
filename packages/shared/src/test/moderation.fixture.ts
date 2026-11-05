import type { BannedWordRule } from '../types/banned-word.type';
import type { SourceDomainRule } from '../types/source-rule.type';

/** Initial banned list of the prototype (mock/db/seeds/comments.seed.js). */
export const BANNED_WORDS_FIXTURE: BannedWordRule[] = (
  [
    ['porra', 'word'], ['caralho', 'contains'], ['merda', 'contains'], ['puta', 'word'], ['puto', 'word'], ['fdp', 'word'],
    ['filho da puta', 'word'], ['vagabundo', 'word'], ['otario', 'word'], ['idiota', 'word'], ['imbecil', 'word'],
    ['lixo humano', 'word'], ['arrombado', 'contains'], ['fuck', 'contains'], ['shit', 'word'], ['mierda', 'contains'], ['pendejo', 'word'],
  ] as const
).map(([term, matchMode]) => ({ term, matchMode }));

/** Part of the sources registry of the prototype (mock/db/seeds/aspects.seed.js). */
export const SOURCES_FIXTURE: SourceDomainRule[] = [
  { name: 'Wikidata', baseUrl: 'https://www.wikidata.org', usageStatus: 'active' },
  { name: 'Wikipedia (en)', baseUrl: 'https://en.wikipedia.org', usageStatus: 'active' },
  { name: 'Liquipedia', baseUrl: 'https://liquipedia.net/counterstrike', usageStatus: 'active' },
  { name: 'HLTV', baseUrl: 'https://www.hltv.org', usageStatus: 'link_only' },
  { name: 'BoxRec', baseUrl: 'https://boxrec.com', usageStatus: 'link_only' },
  { name: 'rdy.gg', baseUrl: 'https://rdy.gg', usageStatus: 'rejected' },
  { name: 'AllSportDB', baseUrl: 'https://allsportdb.com', usageStatus: 'rejected' },
];

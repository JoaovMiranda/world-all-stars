import { describe, expect, it } from 'vitest';

import { parseMedalList } from './olympic-medalists.provider';
import { wikidataFacts } from './wikidata.provider';

describe('olympic medal lists (F03)', () => {
  const page = `== Men ==
=== 100 metre freestyle ===
{| class="wikitable"
! Games !! Gold !! Silver !! Bronze
|-
| 2016 Rio de Janeiro || {{flagIOCmedalist|[[Kyle Chalmers]]|AUS|2016 Summer}} || {{flagIOCmedalist|[[Pieter Timmers]]|BEL|2016 Summer}} || {{flagIOCmedalist|[[Nathan Adrian]]|USA|2016 Summer}}
|}
=== 4 × 100 metre freestyle relay ===
{|
|-
| 2016 Rio de Janeiro || {{flagIOCmedalist|[[Caeleb Dressel]]|USA|2016 Summer}}<br>{{flagIOCmedalist|[[Michael Phelps]]|USA|2016 Summer}} || x || y
|}`;
  it('reads event, Games, medal, country and every medallist (relays have several)', () => {
    const cells = parseMedalList(page);
    expect(cells).toHaveLength(4);
    expect(cells[0]).toMatchObject({ event: '100 metre freestyle', year: 2016, medal: 'gold', country: 'AUS', athletes: [{ name: 'Kyle Chalmers', link: 'Kyle Chalmers' }] });
    expect(cells[3]).toMatchObject({ event: '4 × 100 metre freestyle relay', medal: 'gold', athletes: [{ name: 'Caeleb Dressel' }, { name: 'Michael Phelps' }] });
  });
});

describe('wikidata facts', () => {
  it('takes the QID from the sitelinked entity, a day-precision birth date and the gender', () => {
    const f = wikidataFacts({
      id: 'Q12897', sitelinks: { enwiki: { title: 'Pelé' } },
      claims: { P569: [{ mainsnak: { datavalue: { value: { time: '+1940-10-23T00:00:00Z', precision: 11 } } } }], P21: [{ mainsnak: { datavalue: { value: { id: 'Q6581097' } } } }] },
    });
    expect(f).toEqual({ qid: 'Q12897', title: 'Pelé', birthDate: '1940-10-23', birthYear: 1940, gender: 'male' });
    expect(wikidataFacts({ id: 'Q1', claims: { P569: [{ mainsnak: { datavalue: { value: { time: '+1880-00-00T00:00:00Z', precision: 9 } } } }] } }).birthDate).toBeNull();
  });
});

import { profileFacts } from './wikidata-profile.provider';

describe('wikidata profile facts', () => {
  it('reads description, birth place, height in cm, position, clubs with periods and the photo', () => {
    const f = profileFacts({
      id: 'Q12', descriptions: { en: { value: 'Brazilian footballer' }, pt: { value: 'futebolista brasileiro' } },
      claims: {
        P19: [{ mainsnak: { datavalue: { value: { id: 'Q1' } } } }],
        P2048: [{ mainsnak: { datavalue: { value: { amount: '+1.76', unit: 'http://www.wikidata.org/entity/Q11573' } } } }],
        P413: [{ mainsnak: { datavalue: { value: { id: 'Q2' } } } }],
        P18: [{ mainsnak: { datavalue: { value: 'Cafu 2010.jpg' } } }],
        P54: [{ mainsnak: { datavalue: { value: { id: 'Q3' } } }, qualifiers: { P580: [{ datavalue: { value: { time: '+1990-01-01T00:00:00Z', precision: 9 } } }], P582: [{ datavalue: { value: { time: '+1995-01-01T00:00:00Z', precision: 9 } } }] } }],
      },
    });
    expect(f).toMatchObject({ description: { en: 'Brazilian footballer', pt: 'futebolista brasileiro', es: null }, birthPlace: 'Q1', heightCm: 176, position: 'Q2', image: 'Cafu 2010.jpg', clubs: [{ qid: 'Q3', from: 1990, to: 1995 }] });
  });
});

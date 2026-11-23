/** Career/achievement extraction prompt (answer: `{"facts":[…]}`). */
export const extractionPrompt = (name: string, section: string) =>
  [
    'You extract facts about an athlete from the text below. Answer ONLY JSON: {"facts":[{"field","value","year","evidence_quote"}]}.',
    'Rules: evidence_quote must be COPIED LITERALLY from the text (5–30 words); never translate, never invent; when unsure, omit the fact.',
    'Fields: birth_date, birth_place, position, club, title, medal, record. Values in English.',
    `Athlete: ${name}`,
    '---',
    section.slice(0, 6000),
  ].join('\n');

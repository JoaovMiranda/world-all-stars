// Demo activity of the test reader, run against the prototype API right after loading it. Shared by the fixture
// exporter (apps/web sample JSON) and the database seed (packages/db), so both start from the same state.
// `readerEmail` = DEMO_SESSION_EMAILS.reader of @was/shared (the account behind `?as=reader`).
export const runDemoActivity = (A, readerEmail) => {
  const mine = A.postComment(readerEmail, 'pele', 'Vi o milésimo gol num documentário. Que dia para o futebol!', null, '2026-10-20T18:00:00.000Z');
  A.postComment('leitor09@exemplo.invalid', 'pele', 'Foi em 1969, no Maracanã, de pênalti.', mine.id, '2026-10-21T09:30:00.000Z');
  A.submitSuggestion({ athleteName: 'Éder Jofre', sport: 'boxe', urls: ['https://en.wikipedia.org/wiki/%C3%89der_Jofre'], why: 'Campeão mundial em duas categorias.' });
  A.submitSuggestion({ athleteName: 'Marta', sport: 'futebol', urls: ['https://boxrec.com/x', 'https://www.wikidata.org/wiki/Q221'], why: '' });
  A.submitContact({ name: 'Ana Repórter', email: 'ana@exemplo.invalid', topic: 'press', body: 'Gostaria de entrevistar a curadoria sobre os critérios do Hall of Greats.' });
  A.submitContact({ name: 'Bruno', email: 'bruno@exemplo.invalid', topic: 'data_error', body: 'A altura do atleta está diferente da Wikipedia: https://en.wikipedia.org/wiki/Exemplo' });
};

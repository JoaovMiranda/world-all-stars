// pt-BR strings of DocumentPageLayout (legal, accessibility and "about" pages). Ready for i18n.
export const DOCUMENT_PAGE_TEXT = {
  toc: 'Nesta página',
  version: (v: string) => `Versão ${v}`,
  effectiveSince: (date: string) => `Vigente desde ${date}`,
  updatedAt: (date: string) => `Atualizado em ${date}`,
  backToTop: 'Voltar ao topo',
} as const;

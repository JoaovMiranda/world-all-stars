import { useCallback, useId, useState } from 'react';

/** Open/close state + ids for a disclosure button (aria-expanded/aria-controls). */
export function useDisclosure(initial = false) {
  const [open, setOpen] = useState(initial);
  const id = useId();
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);
  return { open, toggle, close, setOpen, contentId: `${id}-content`, buttonProps: { 'aria-expanded': open, 'aria-controls': `${id}-content`, onClick: toggle } };
}

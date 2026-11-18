// @vitest-environment jsdom
// Keyboard and focus behaviour that axe cannot see in static HTML (WCAG 2.4.3 focus order, 4.1.3 status messages).
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Button } from './button.component';
import { CharCounter } from './char-counter.component';
import { Pagination } from './pagination.component';
import { useDisclosure } from './use-disclosure.hook';
import { useDismiss } from './use-dismiss.hook';

afterEach(cleanup);

function Menu() {
  const menu = useDisclosure();
  const root = useRef<HTMLDivElement>(null);
  useDismiss(root, menu.open, menu.close);
  return (
    <div ref={root}>
      <button type="button" {...menu.buttonProps}>
        Idioma
      </button>
      {menu.open && (
        <div id={menu.contentId}>
          <button type="button" onClick={menu.close}>
            English
          </button>
        </div>
      )}
    </div>
  );
}

describe('focus is never lost (WCAG 2.4.3)', () => {
  it('Escape closes a menu and returns focus to its button', () => {
    render(<Menu />);
    const trigger = screen.getByRole('button', { name: 'Idioma' });
    fireEvent.click(trigger);
    screen.getByRole('button', { name: 'English' }).focus();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(screen.queryByRole('button', { name: 'English' })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('choosing a menu item returns focus to the menu button', () => {
    render(<Menu />);
    const trigger = screen.getByRole('button', { name: 'Idioma' });
    fireEvent.click(trigger);
    const item = screen.getByRole('button', { name: 'English' });
    item.focus();
    fireEvent.click(item);
    expect(document.activeElement).toBe(trigger);
  });

  it('a pending button stays focusable and ignores clicks', () => {
    const onClick = vi.fn();
    render(
      <Button pending onClick={onClick}>
        Publicar
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Publicar' });
    expect(button).not.toHaveProperty('disabled', true);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    button.focus();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(button);
  });

  it('pagination: Previous on the first page is aria-disabled (still focusable) and does nothing', () => {
    const onChange = vi.fn();
    render(<Pagination page={1} pageCount={5} onChange={onChange} />);
    const nav = screen.getByRole('navigation');
    expect(nav.querySelector('ul > li')).not.toBeNull();
    const prev = nav.querySelector('li:first-child button') as HTMLButtonElement;
    expect(prev.disabled).toBe(false);
    expect(prev.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(prev);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(nav.querySelector('li:last-child button') as HTMLButtonElement);
    expect(onChange).toHaveBeenCalledWith(2);
  });
});

describe('status messages without noise (WCAG 4.1.3)', () => {
  it('the character counter only speaks near and over the limit', () => {
    const { rerender, container } = render(<CharCounter value="abc" max={10} />);
    const live = container.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(live.textContent).toBe('');
    rerender(<CharCounter value="abcdefghi" max={10} />);
    expect(live.textContent).toMatch(/1/);
    rerender(<CharCounter value="abcdefghijkl" max={10} />);
    expect(live.textContent).toMatch(/2/);
    // The visible n/max is hidden from screen readers (it would be read on every keystroke).
    expect(container.querySelector('.char-counter')?.getAttribute('aria-hidden')).toBe('true');
  });
});

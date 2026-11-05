import { SESSION_KIND_VALUES } from '@was/shared';
import { Link } from '@tanstack/react-router';
import { useRef } from 'react';

import { SESSION_TEXT } from '@/session/session.const';
import { useSession } from '@/session/use-session.hook';

import { Button } from './button.component';
import { useDisclosure } from './use-disclosure.hook';
import { useDismiss } from './use-dismiss.hook';

/** Header menu of the simulated session (doc 17): pick Visitante/Leitor/Admin, account links, reset demo. */
export function SessionMenu() {
  const { kind, user, isSignedIn, isAdmin, setKind, resetDemo } = useSession();
  const menu = useDisclosure();
  const root = useRef<HTMLDivElement>(null);
  useDismiss(root, menu.open, menu.close);

  return (
    <div className="menu" ref={root}>
      <Button variant={isSignedIn ? 'secondary' : 'primary'} {...menu.buttonProps} aria-haspopup="true">
        {user?.name.split(' ')[0] ?? SESSION_TEXT.signIn} <span aria-hidden="true">▾</span>
      </Button>
      {menu.open && (
        <div className="menu-pop" id={menu.contentId}>
          <span className="label px-2.5">{SESSION_TEXT.menuLabel}</span>
          <p className="menu-hint">{SESSION_TEXT.hint}</p>
          <div role="group" aria-label={SESSION_TEXT.menuLabel}>
            {SESSION_KIND_VALUES.map((k) => (
              <button key={k} type="button" className="menu-item" aria-checked={k === kind} role="menuitemradio" onClick={() => { setKind(k); menu.close(); }}>
                {SESSION_TEXT.profiles[k]}
              </button>
            ))}
          </div>
          {isSignedIn && (
            <>
              <hr className="menu-sep" />
              <Link className="menu-item" to="/me" onClick={menu.close}>{SESSION_TEXT.myProfile}</Link>
              <Link className="menu-item" to="/me/notifications" onClick={menu.close}>{SESSION_TEXT.notifications}</Link>
              <Link className="menu-item" to="/me/data" onClick={menu.close}>{SESSION_TEXT.myData}</Link>
            </>
          )}
          {isAdmin && <Link className="menu-item" to="/admin" onClick={menu.close}>{SESSION_TEXT.admin}</Link>}
          <hr className="menu-sep" />
          <button type="button" className="menu-item" onClick={() => { resetDemo(); menu.close(); }}>
            {SESSION_TEXT.resetDemo}
          </button>
        </div>
      )}
    </div>
  );
}

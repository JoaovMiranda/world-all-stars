import { SESSION_KIND_VALUES } from '@was/shared';
import { Link } from '@tanstack/react-router';
import { useRef } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { SESSION_MESSAGES } from '@/session/session.const';
import { useSession } from '@/session/use-session.hook';

import { Button } from './button.component';
import { useDisclosure } from './use-disclosure.hook';
import { useDismiss } from './use-dismiss.hook';

/**
 * Header account menu: visitor → "Entrar" (login popup); signed in → avatar + first name, account links, "Sair".
 * Dev only (fixtures or AUTH_SIMULATED): the simulated profile switcher and the demo reset.
 */
export function SessionMenu() {
  const t = useText(SESSION_MESSAGES);
  const { kind, user, isSignedIn, isAdmin, simulationAvailable, setKind, signOut, requireLogin, resetDemo } = useSession();
  const menu = useDisclosure();
  const root = useRef<HTMLDivElement>(null);
  useDismiss(root, menu.open, menu.close);

  if (!isSignedIn && !simulationAvailable) {
    return (
      <Button variant="primary" onClick={() => requireLogin()}>
        {t.signIn}
      </Button>
    );
  }

  return (
    <div className="menu" ref={root}>
      <Button variant={isSignedIn ? 'secondary' : 'primary'} className="session-btn" {...menu.buttonProps} aria-haspopup="true" aria-label={user ? t.accountMenu(user.name) : undefined}>
        {user?.avatarUrl && <img className="session-avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />}
        {user?.name.split(' ')[0] ?? t.signIn} <span aria-hidden="true">▾</span>
      </Button>
      {menu.open && (
        <div className="menu-pop" id={menu.contentId}>
          {user && <p className="menu-hint">{t.signedInAs(user.email)}</p>}
          {!isSignedIn && (
            <button type="button" className="menu-item" onClick={() => { menu.close(); requireLogin(); }}>
              {t.signIn}
            </button>
          )}
          {isSignedIn && (
            <>
              <Link className="menu-item" to="/me" onClick={menu.close}>{t.myProfile}</Link>
              <Link className="menu-item" to="/me/notifications" onClick={menu.close}>{t.notifications}</Link>
              <Link className="menu-item" to="/me/data" onClick={menu.close}>{t.myData}</Link>
            </>
          )}
          {isAdmin && <Link className="menu-item" to="/admin" onClick={menu.close}>{t.admin}</Link>}
          {isSignedIn && (
            <button type="button" className="menu-item" onClick={() => { menu.close(); void signOut(); }}>
              {t.signOut}
            </button>
          )}
          {simulationAvailable && (
            <>
              <hr className="menu-sep" />
              <span className="label px-2.5">{t.menuLabel}</span>
              <p className="menu-hint">{t.hint}</p>
              <div role="group" aria-label={t.menuLabel}>
                {SESSION_KIND_VALUES.map((k) => (
                  <button key={k} type="button" className="menu-item" aria-checked={k === kind} role="menuitemradio" onClick={() => { setKind(k); menu.close(); }}>
                    {t.profiles[k]}
                  </button>
                ))}
              </div>
              <hr className="menu-sep" />
              <button type="button" className="menu-item" onClick={() => { resetDemo(); menu.close(); }}>
                {t.resetDemo}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

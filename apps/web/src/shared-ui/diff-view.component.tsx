import './review-kit.css';

import type { ReactNode } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { cx } from './class-names.helper';
import { Notice } from './notice.component';
import { REVIEW_KIT_MESSAGES } from './review-kit.const';

interface DiffViewProps {
  base: string | null;
  current: string | null;
  proposed: string | null;
  /** Shown under the proposed value (e.g. the evidence quote that supports it). */
  proposedNote?: ReactNode;
  labels?: { base?: string; current?: string; proposed?: string };
}

/**
 * 3-way diff (doc 03): base (when the proposal was created) · current (published) · proposed. Cells that differ
 * from the base are highlighted (text + color); a changed current value means a version conflict.
 */
export function DiffView({ base, current, proposed, proposedNote, labels }: DiffViewProps) {
  const kit = useText(REVIEW_KIT_MESSAGES);
  const cells = [
    { key: 'base', label: labels?.base ?? kit.diffBase, value: base, changed: false },
    { key: 'current', label: labels?.current ?? kit.diffCurrent, value: current, changed: current !== base },
    { key: 'proposed', label: labels?.proposed ?? kit.diffProposed, value: proposed, changed: proposed !== base },
  ];
  const conflict = base !== null && current !== base;
  return (
    <div>
      <dl className="diff-view">
        {cells.map((c) => (
          <div key={c.key} className={cx('diff-cell', c.changed && 'is-changed')}>
            <dt>{c.label}</dt>
            <dd>
              {c.value ?? kit.emptyValue}
              {c.changed && <span className="diff-flag">{kit.diffChanged}</span>}
              {c.key === 'proposed' && proposedNote && <div className="diff-note">{proposedNote}</div>}
            </dd>
          </div>
        ))}
      </dl>
      {conflict && (
        <Notice tone="warning" className="diff-note">
          {kit.diffConflict}
        </Notice>
      )}
    </div>
  );
}

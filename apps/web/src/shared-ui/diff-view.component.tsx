import './review-kit.css';

import type { ReactNode } from 'react';

import { cx } from './class-names.helper';
import { Notice } from './notice.component';
import { REVIEW_KIT_TEXT } from './review-kit.const';

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
  const cells = [
    { key: 'base', label: labels?.base ?? REVIEW_KIT_TEXT.diffBase, value: base, changed: false },
    { key: 'current', label: labels?.current ?? REVIEW_KIT_TEXT.diffCurrent, value: current, changed: current !== base },
    { key: 'proposed', label: labels?.proposed ?? REVIEW_KIT_TEXT.diffProposed, value: proposed, changed: proposed !== base },
  ];
  const conflict = base !== null && current !== base;
  return (
    <div>
      <dl className="diff-view">
        {cells.map((c) => (
          <div key={c.key} className={cx('diff-cell', c.changed && 'is-changed')}>
            <dt>{c.label}</dt>
            <dd>
              {c.value ?? REVIEW_KIT_TEXT.emptyValue}
              {c.changed && <span className="diff-flag">{REVIEW_KIT_TEXT.diffChanged}</span>}
              {c.key === 'proposed' && proposedNote && <div className="diff-note">{proposedNote}</div>}
            </dd>
          </div>
        ))}
      </dl>
      {conflict && (
        <Notice tone="warning" className="diff-note">
          {REVIEW_KIT_TEXT.diffConflict}
        </Notice>
      )}
    </div>
  );
}

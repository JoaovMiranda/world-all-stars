import { type ReactNode, useId } from 'react';

import { cx } from './class-names.helper';

/** Props a FormField hands to its control so label, hint and error are wired for assistive tech. */
export interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  required?: boolean;
}

interface FormFieldProps {
  label: ReactNode;
  /** Helper text below the label (linked via aria-describedby). */
  hint?: ReactNode;
  /** Error message (linked via aria-describedby, sets aria-invalid). */
  error?: string | undefined;
  required?: boolean;
  /** Right side of the footer (e.g. <CharCounter/>). */
  counter?: ReactNode;
  className?: string;
  /** Render the control with the given props: `{(p) => <Input {...p} />}` */
  children: (props: FieldControlProps) => ReactNode;
}

/** Label + control + hint + error, accessible by construction (doc 21: errors under each field, aria-describedby). */
export function FormField({ label, hint, error, required = false, counter, className, children }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');
  return (
    <div className={cx('field', className)}>
      <label className="field-label" htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true">*</span>}
      </label>
      {hint && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
      {children({ id, ...(describedBy ? { 'aria-describedby': describedBy } : {}), ...(error ? { 'aria-invalid': true as const } : {}), required })}
      {(error || counter) && (
        <div className="field-foot">
          {error ? (
            <p className="field-error" id={errorId}>
              {error}
            </p>
          ) : (
            <span />
          )}
          {counter}
        </div>
      )}
    </div>
  );
}

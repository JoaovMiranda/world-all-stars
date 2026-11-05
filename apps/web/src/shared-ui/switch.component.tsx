import './switch.css';

import { type ReactNode, useId } from 'react';

interface SwitchProps {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** Accessible on/off setting: native checkbox with role="switch", visible label and description (consents, preferences). */
export function Switch({ label, description, checked, onChange, disabled = false }: SwitchProps) {
  const id = useId();
  return (
    <div className="switch-row">
      <div className="switch-text">
        <label className="switch-label" htmlFor={id}>
          {label}
        </label>
        {description && (
          <p className="switch-desc" id={`${id}-desc`}>
            {description}
          </p>
        )}
      </div>
      <input
        id={id}
        className="switch-input"
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-describedby={description ? `${id}-desc` : undefined}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}

"use client";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
}

export function Switch({ checked, onChange, label, disabled = false, id }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-pill border-0 bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        aria-hidden="true"
        className={`relative block h-6 w-[42px] rounded-pill border transition-[background-color,border-color] duration-150 ${
          checked
            ? "border-accent-border bg-accent-btn"
            : "border-border-strong bg-surface-muted"
        }`}
      >
        <span
          className={`absolute top-[2px] left-[2px] block h-[18px] w-[18px] rounded-pill bg-white transition-transform duration-150 ${
            checked ? "translate-x-[18px]" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

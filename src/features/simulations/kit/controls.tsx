import { useId, type ReactNode } from "react";

import styles from "./Sim.module.css";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** How the value is shown next to the label. */
  format?: (value: number) => string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = String,
}: SliderProps): ReactNode {
  const id = useId();
  return (
    <div className={styles.control}>
      <label htmlFor={id} className={styles.controlLabel}>
        <span>{label}</span>
        <output htmlFor={id}>{format(value)}</output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          onChange(Number(event.target.value));
        }}
      />
    </div>
  );
}

interface ToggleProps {
  label: string;
  isOn: boolean;
  onChange: (isOn: boolean) => void;
}

export function Toggle({ label, isOn, onChange }: ToggleProps): ReactNode {
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        checked={isOn}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
      <span>{label}</span>
    </label>
  );
}

interface ChoiceProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** A segmented control for a few mutually exclusive options. */
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: ChoiceProps<T>): ReactNode {
  const name = useId();
  return (
    <fieldset className={styles.choice}>
      <legend className={styles.controlLabel}>{label}</legend>
      <div className={styles.choiceOptions}>
        {options.map((option) => (
          <label key={option.value} data-checked={option.value === value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => {
                onChange(option.value);
              }}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface ButtonProps {
  onClick: () => void;
  children: ReactNode;
  isPrimary?: boolean;
  isDisabled?: boolean;
}

export function SimButton({
  onClick,
  children,
  isPrimary = false,
  isDisabled = false,
}: ButtonProps): ReactNode {
  return (
    <button
      type="button"
      className={styles.button}
      data-primary={isPrimary}
      onClick={onClick}
      disabled={isDisabled}
    >
      {children}
    </button>
  );
}

export function ButtonRow({ children }: { children: ReactNode }): ReactNode {
  return <div className={styles.buttonRow}>{children}</div>;
}

interface StatProps {
  label: string;
  value: ReactNode;
  tone?: "default" | "good" | "bad";
}

export function Stat({ label, value, tone = "default" }: StatProps): ReactNode {
  return (
    <div className={styles.stat} data-tone={tone}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}

/** Small explanatory text inside the controls column. */
export function ControlNote({ children }: { children: ReactNode }): ReactNode {
  return <p className={styles.note}>{children}</p>;
}

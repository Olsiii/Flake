"use client";

import { useId, useState } from "react";
import { useLanguage } from "@/i18n/language-provider";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minLength?: number;
  autoComplete?: string;
  /** Extra classes appended after `.input` — e.g. to pin light styling on
   * a themed (always-colored) panel that shouldn't follow the site's
   * light/dark toggle. */
  inputClassName?: string;
}

export function PasswordInput({
  value,
  onChange,
  placeholder,
  minLength,
  autoComplete,
  inputClassName,
}: PasswordInputProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div className="relative">
      <input
        id={id}
        required
        type={visible ? "text" : "password"}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input pr-10 ${inputClassName ?? ""}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t.auth.hidePassword : t.auth.showPassword}
        aria-controls={id}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <path
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M6.5 6.7C4.2 8.2 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1.1M9.9 5.2A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a15.6 15.6 0 0 1-3.2 4.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

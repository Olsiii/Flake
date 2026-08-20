"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/format";

interface FormattedNumberInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  className?: string;
}

/** A price/size input that shows the "." thousands separator live while
 * typing (e.g. "150.000"), which a plain `type="number"` input can't do —
 * browsers reject non-digit characters in those. Tracks the formatted
 * string in local state and re-derives the numeric value from digits only
 * on every change. When `value` changes from outside (e.g. a "Clear"
 * button), the displayed text is resynced during render rather than in an
 * effect, per React's guidance for adjusting state from props. */
export function FormattedNumberInput({
  value,
  onChange,
  placeholder,
  className,
}: FormattedNumberInputProps) {
  const [text, setText] = useState(value != null ? formatNumber(value) : "");
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setText(value != null ? formatNumber(value) : "");
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    if (digitsOnly === "") {
      setText("");
      onChange(null);
      return;
    }
    const n = Number(digitsOnly);
    setText(formatNumber(n));
    onChange(n);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={text}
      onChange={handleChange}
      className={className}
    />
  );
}

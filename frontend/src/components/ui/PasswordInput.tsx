"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { inputClass, invalidInputClass } from "./Field";

interface PasswordInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoFocus?: boolean;
  required?: boolean;
  error?: boolean;
  "aria-label"?: string;
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  autoFocus,
  required,
  error,
  ...rest
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        required={required}
        autoFocus={autoFocus}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`${inputClass} pr-10 ${error ? invalidInputClass : ""}`}
        {...rest}
      />

      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

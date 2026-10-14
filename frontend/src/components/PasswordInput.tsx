import { useState } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Password field with a Show / Hide button. */
export default function PasswordInput({ value, onChange, placeholder }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        className="input pr-16"
        type={visible ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute inset-y-0 right-3 text-sm font-semibold text-muted hover:text-ink"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

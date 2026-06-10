import React, { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

const PasswordInput = ({
  value,
  onChange,
  placeholder,
  disabled,
  showStrength = false,
  autoComplete = "current-password",
}) => {
  const [isShowPassword, setIsShowPassword] = useState(false);

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: "", color: "", checks: {} };

    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };

    const passed = Object.values(checks).filter(Boolean).length;

    let strength = 0;
    let label = "";
    let color = "";

    if (passed <= 1) {
      strength = 1;
      label = "Molto debole";
      color = "bg-red-500";
    } else if (passed === 2) {
      strength = 2;
      label = "Debole";
      color = "bg-orange-500";
    } else if (passed === 3) {
      strength = 3;
      label = "Media";
      color = "bg-yellow-500";
    } else if (passed === 4) {
      strength = 4;
      label = "Forte";
      color = "bg-lime-500";
    } else {
      strength = 5;
      label = "Molto forte";
      color = "bg-green-500";
    }

    return { strength, label, color, checks };
  };

  const { strength, label, color, checks } = getPasswordStrength(value);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-2xl border border-[#E9E2DB] bg-white px-4 py-3 shadow-[0_12px_30px_-24px_rgba(43,33,27,0.5)] focus-within:border-[#F26A00]">
        <span className="select-none text-[#F26A00]">🔒</span>

        <input
          value={value}
          onChange={onChange}
          type={isShowPassword ? "text" : "password"}
          placeholder={placeholder || "Password"}
          disabled={disabled}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-sm text-[#2B211B] outline-none placeholder:text-[#6A5B52]/60"
        />

        <button
          type="button"
          onClick={() => setIsShowPassword((s) => !s)}
          disabled={disabled}
          className="text-[#F26A00] transition-colors hover:text-[#D95C00] disabled:opacity-50"
          aria-label={isShowPassword ? "Nascondi password" : "Mostra password"}
        >
          {isShowPassword ? <FaRegEyeSlash size={20} /> : <FaRegEye size={20} />}
        </button>
      </div>

      {showStrength && value && (
        <div className="space-y-3">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6A5B52]">
                Forza password:
              </span>

              <span
                className={`text-xs font-black ${
                  strength <= 2
                    ? "text-red-600"
                    : strength === 3
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                {label}
              </span>
            </div>

            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    level <= strength ? color : "bg-[#E9E2DB]"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-[#E9E2DB] bg-[#FFF7F0] px-4 py-3">
            <div className="mb-2 text-xs font-black text-[#2B211B]">
              Requisiti:
            </div>

            <RequirementItem met={checks.length} text="Almeno 8 caratteri" />

            <RequirementItem
              met={checks.uppercase}
              text="Una lettera maiuscola (A-Z)"
            />

            <RequirementItem
              met={checks.lowercase}
              text="Una lettera minuscola (a-z)"
            />

            <RequirementItem met={checks.number} text="Un numero (0-9)" />

            <RequirementItem
              met={checks.special}
              text="Un carattere speciale (!@#$%...)"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const RequirementItem = ({ met, text }) => (
  <div className="flex items-center gap-2 text-xs">
    <span
      className={`flex-shrink-0 font-black ${
        met ? "text-green-600" : "text-[#6A5B52]/40"
      }`}
    >
      {met ? "✓" : "○"}
    </span>

    <span className={met ? "font-semibold text-[#2B211B]" : "text-[#6A5B52]"}>
      {text}
    </span>
  </div>
);

export default PasswordInput;
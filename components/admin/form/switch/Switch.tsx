"use client";
import React, { useEffect, useState } from "react";

interface SwitchProps {
  label: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  color?: "blue" | "gray"; // Added prop to toggle color theme
}

const Switch: React.FC<SwitchProps> = ({
  label,
  defaultChecked = false,
  disabled = false,
  onChange,
  color = "blue", // Default to blue color
}) => {
  const [isChecked, setIsChecked] = useState(defaultChecked);

  // Keep in sync when the parent value changes (e.g. after async load).
  useEffect(() => {
    setIsChecked(defaultChecked);
  }, [defaultChecked]);

  const handleToggle = () => {
    if (disabled) return;
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);
    if (onChange) {
      onChange(newCheckedState);
    }
  };

  const switchColors =
    color === "blue"
      ? {
          background: isChecked
            ? "bg-[#7ec9c4]"
            : "bg-gray-200 dark:bg-white/10",
          knob: isChecked
            ? "translate-x-full bg-white"
            : "translate-x-0 bg-white",
        }
      : {
          background: isChecked
            ? "bg-gray-900 dark:bg-[#B7E1DF]"
            : "bg-gray-200 dark:bg-white/10",
          knob: isChecked
            ? "translate-x-full bg-white"
            : "translate-x-0 bg-white",
        };

  return (
    <label
      className={`flex cursor-pointer select-none items-center gap-3 text-[13.5px] font-medium ${
        disabled ? "text-gray-400" : "text-gray-700 dark:text-gray-300"
      }`}
      onClick={handleToggle}
    >
      <div className="relative">
        <div
          className={`block h-6 w-11 rounded-full transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            disabled
              ? "pointer-events-none bg-gray-100 dark:bg-gray-800"
              : switchColors.background
          }`}
        />
        <div
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full shadow-[0_1px_2px_rgba(16,24,40,0.2)] transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${switchColors.knob}`}
        />
      </div>
      {label}
    </label>
  );
};

export default Switch;

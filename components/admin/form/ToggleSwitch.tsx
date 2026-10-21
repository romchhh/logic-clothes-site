"use client";
import React from "react";
import Switch from "./switch/Switch";

interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  setEnabled: (val: boolean) => void;
}

export default function ToggleSwitch({
  label,
  enabled,
  setEnabled,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch label={label} defaultChecked={enabled} onChange={setEnabled} />
    </div>
  );
}

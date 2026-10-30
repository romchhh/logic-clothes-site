"use client";

import React, { useEffect, useState } from "react";
import Label from "@/components/admin/form/Label";
import Input from "@/components/admin/form/input/InputField";
import {
  loadModelPresets,
  saveModelPresets,
  type ModelPreset,
} from "@/lib/adminProductPresets";

type Props = {
  photoSize: string;
  modelParams: string;
  onChange: (next: { photoSize: string; modelParams: string }) => void;
};

export default function ModelPresetPicker({
  photoSize,
  modelParams,
  onChange,
}: Props) {
  const [presets, setPresets] = useState<ModelPreset[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setPresets(loadModelPresets());
  }, []);

  function persist(next: ModelPreset[]) {
    setPresets(next);
    saveModelPresets(next);
  }

  function apply(p: ModelPreset) {
    onChange({ photoSize: p.photoSize, modelParams: p.modelParams });
  }

  function saveCurrent() {
    const name = newName.trim() || photoSize.trim() || "Модель";
    if (!photoSize.trim() && !modelParams.trim()) return;
    const entry: ModelPreset = {
      id: `p-${Date.now()}`,
      internalName: name,
      photoSize: photoSize.trim(),
      modelParams: modelParams.trim(),
    };
    persist([entry, ...presets.filter((p) => p.internalName !== name)].slice(0, 40));
    setNewName("");
  }

  function remove(id: string) {
    persist(presets.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-4">
      <p className="hidden text-[13px] text-gray-500 sm:block dark:text-gray-400">
        Пресет моделі для себе в адмінці.
      </p>
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <div key={p.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => apply(p)}
                className="admin-chip max-w-[140px] truncate"
                title={`${p.photoSize} · ${p.modelParams}`}
              >
                {p.internalName}
              </button>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="admin-btn-ghost !px-2 text-xs text-red-600"
                aria-label="Видалити пресет"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="photoSize">На фото розмір</Label>
          <Input
            id="photoSize"
            value={photoSize}
            onChange={(e) =>
              onChange({ photoSize: e.target.value, modelParams })
            }
            placeholder="S / M"
          />
        </div>
        <div>
          <Label htmlFor="modelParams">Параметри моделі</Label>
          <Input
            id="modelParams"
            value={modelParams}
            onChange={(e) =>
              onChange({ photoSize, modelParams: e.target.value })
            }
            placeholder="Зріст 175 см, параметри 86-64-90"
          />
        </div>
      </div>
      <div className="flex max-w-md flex-wrap items-end gap-2">
        <div className="min-w-[140px] flex-1">
          <Label htmlFor="modelPresetName">Імʼя пресета (тільки адмін)</Label>
          <Input
            id="modelPresetName"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Вася"
          />
        </div>
        <button
          type="button"
          onClick={saveCurrent}
          className="admin-btn-secondary shrink-0"
        >
          Зберегти пресет
        </button>
      </div>
    </div>
  );
}

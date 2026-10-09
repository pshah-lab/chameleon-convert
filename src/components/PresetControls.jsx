import { useState } from "react";
import {
  listPresets,
  saveCustomPreset,
  renameCustomPreset,
  deleteCustomPreset,
  applyPreset,
} from "../lib/presets.js";

const MESSAGES = {
  "empty-name": "Enter a name for the preset.",
  limit: "You can save up to 20 presets.",
  storage: "Couldn't save — browser storage is unavailable.",
  "not-found": "That preset no longer exists.",
};

export default function PresetControls({ settings, onChange }) {
  const [presets, setPresets] = useState(() => listPresets());
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");

  const selected = presets.find((preset) => preset.id === selectedId);
  const builtIn = presets.filter((preset) => preset.builtIn);
  const custom = presets.filter((preset) => !preset.builtIn);
  const refresh = () => setPresets(listPresets());

  const fail = (result) => setMessage(MESSAGES[result.reason] ?? MESSAGES.storage);

  const choose = (event) => {
    const id = event.target.value;
    setSelectedId(id);
    setMessage("");
    const preset = presets.find((item) => item.id === id);
    if (preset) onChange(applyPreset(preset, settings));
  };

  const save = () => {
    const name = window.prompt("Name this look");
    if (name === null) return;
    const result = saveCustomPreset(name, settings);
    if (!result.ok) return fail(result);
    setMessage("");
    refresh();
    setSelectedId(result.preset.id);
  };

  const rename = () => {
    const name = window.prompt("Rename preset", selected.name);
    if (name === null) return;
    const result = renameCustomPreset(selected.id, name);
    if (!result.ok) return fail(result);
    setMessage("");
    refresh();
  };

  const remove = () => {
    deleteCustomPreset(selected.id);
    setMessage("");
    setSelectedId("");
    refresh();
  };

  return (
    <div className="text-style-panel__field text-style-panel__presets">
      <label htmlFor="ts-preset">Preset</label>
      <select id="ts-preset" value={selectedId} onChange={choose}>
        <option value="" disabled>
          Choose a preset…
        </option>
        <optgroup label="Built-in">
          {builtIn.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </optgroup>
        {custom.length > 0 && (
          <optgroup label="Yours">
            {custom.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <div className="text-style-panel__preset-actions">
        <button type="button" onClick={save}>
          Save current look…
        </button>
        {selected && !selected.builtIn && (
          <>
            <button type="button" onClick={rename}>
              Rename
            </button>
            <button type="button" onClick={remove}>
              Delete
            </button>
          </>
        )}
      </div>
      {message && (
        <p role="alert" className="text-style-panel__error">
          {message}
        </p>
      )}
    </div>
  );
}

import { useRef, useState } from "react";
import TextStylePanel from "./TextStylePanel.jsx";
import "./Toolbar.css";

export default function Toolbar({ settings, onChange, isPdf = false }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);

  function handleKeyDown(event) {
    if (event.key === "Escape" && open) {
      setOpen(false);
      buttonRef.current?.focus();
    }
  }

  return (
    <div className="toolbar-wrap" onKeyDown={handleKeyDown}>
    <div className="toolbar">
      <label>
        Mode
        <select
          value={settings.mode}
          onChange={(event) => onChange({ mode: event.target.value })}
        >
          <option value="smart">Smart Dark</option>
          <option value="invert">Invert</option>
          <option value="sepia">Sepia</option>
          <option value="original">Original</option>
        </select>
      </label>

      <label>
        Background
        <input
          type="color"
          value={settings.backgroundColor}
          onChange={(event) => onChange({ backgroundColor: event.target.value })}
        />
      </label>

      <label>
        Text
        <input
          type="color"
          value={settings.textColor}
          onChange={(event) => onChange({ textColor: event.target.value })}
        />
      </label>

      <label>
        Contrast
        <input
          type="range"
          min="80"
          max="135"
          value={settings.contrast}
          onChange={(event) => onChange({ contrast: Number(event.target.value) })}
        />
      </label>

      <button
        type="button"
        ref={buttonRef}
        className="toolbar-toggle"
        aria-expanded={open}
        aria-controls="text-style-panel"
        onClick={() => setOpen((value) => !value)}
      >
        Text style
      </button>
    </div>
    {open && (
      <div id="text-style-panel" className="toolbar-panel">
        <TextStylePanel settings={settings} onChange={onChange} isPdf={isPdf} />
      </div>
    )}
    </div>
  );
}

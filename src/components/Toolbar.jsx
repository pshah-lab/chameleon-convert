import "./Toolbar.css";

export default function Toolbar({ settings, onChange }) {
  return (
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
        Size
        <input
          type="range"
          min="14"
          max="24"
          value={settings.fontSize}
          onChange={(event) => onChange({ fontSize: Number(event.target.value) })}
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
    </div>
  );
}

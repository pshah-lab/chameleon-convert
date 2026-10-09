import { FONT_OPTIONS } from "../lib/fonts.js";
import { DEFAULT_SETTINGS, TEXT_STYLE_KEYS } from "../lib/settings.js";
import PresetControls from "./PresetControls.jsx";
import "./TextStylePanel.css";

const PDF_NOTE = "PDF layout is fixed — these apply to Word and PowerPoint files.";
const NOTE_ID = "text-style-pdf-note";
const DEFAULT_WIDTH = 72;

export default function TextStylePanel({ settings, onChange, isPdf = false }) {
  const isFull = settings.textWidth === "full";
  const describedBy = isPdf ? NOTE_ID : undefined;

  const reset = () => {
    onChange(Object.fromEntries(TEXT_STYLE_KEYS.map((key) => [key, DEFAULT_SETTINGS[key]])));
  };

  return (
    <section className="text-style-panel" aria-label="Text style">
      <PresetControls settings={settings} onChange={onChange} />

      <div className="text-style-panel__field">
        <label htmlFor="ts-font">Font</label>
        <select
          id="ts-font"
          value={settings.fontFamily}
          disabled={isPdf}
          aria-describedby={describedBy}
          onChange={(event) => onChange({ fontFamily: event.target.value })}
        >
          {FONT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="text-style-panel__field">
        <div className="text-style-panel__head">
          <label htmlFor="ts-size">Size</label>
          <output htmlFor="ts-size">{settings.fontSize}px</output>
        </div>
        <input
          id="ts-size"
          type="range"
          min="14"
          max="24"
          step="1"
          value={settings.fontSize}
          onChange={(event) => onChange({ fontSize: Number(event.target.value) })}
        />
      </div>

      <div className="text-style-panel__field">
        <div className="text-style-panel__head">
          <label htmlFor="ts-line-height">Line height</label>
          <output htmlFor="ts-line-height">{Number(settings.lineHeight).toFixed(1)}</output>
        </div>
        <input
          id="ts-line-height"
          type="range"
          min="1.3"
          max="2.2"
          step="0.1"
          value={settings.lineHeight}
          disabled={isPdf}
          aria-describedby={describedBy}
          onChange={(event) => onChange({ lineHeight: Number(event.target.value) })}
        />
      </div>

      <div className="text-style-panel__field">
        <div className="text-style-panel__head">
          <label htmlFor="ts-paragraph-spacing">Paragraph spacing</label>
          <output htmlFor="ts-paragraph-spacing">{Number(settings.paragraphSpacing).toFixed(1)}</output>
        </div>
        <input
          id="ts-paragraph-spacing"
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={settings.paragraphSpacing}
          disabled={isPdf}
          aria-describedby={describedBy}
          onChange={(event) => onChange({ paragraphSpacing: Number(event.target.value) })}
        />
      </div>

      <div className="text-style-panel__field">
        <div className="text-style-panel__head">
          <label htmlFor="ts-text-width">Text width</label>
          <output htmlFor="ts-text-width">{isFull ? "Full" : `${settings.textWidth}ch`}</output>
        </div>
        <input
          id="ts-text-width"
          type="range"
          min="45"
          max="100"
          step="1"
          value={isFull ? DEFAULT_WIDTH : settings.textWidth}
          disabled={isPdf || isFull}
          aria-describedby={describedBy}
          onChange={(event) => onChange({ textWidth: Number(event.target.value) })}
        />
        <div className="text-style-panel__check">
          <input
            id="ts-full-width"
            type="checkbox"
            checked={isFull}
            disabled={isPdf}
            aria-describedby={describedBy}
            onChange={(event) => onChange({ textWidth: event.target.checked ? "full" : DEFAULT_WIDTH })}
          />
          <label htmlFor="ts-full-width">Full width</label>
        </div>
      </div>

      {isPdf && (
        <p id={NOTE_ID} className="text-style-panel__note">
          {PDF_NOTE}
        </p>
      )}

      <button type="button" className="text-style-panel__reset" onClick={reset}>
        Reset text style
      </button>
    </section>
  );
}

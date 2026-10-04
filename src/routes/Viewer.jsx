import { useState } from "react";
import Toolbar from "../components/Toolbar.jsx";
import FileDropzone from "../components/FileDropzone.jsx";
import PdfPageCanvas from "../components/PdfPageCanvas.jsx";
import DocumentPanel from "../components/DocumentPanel.jsx";
import { getSettings, setSettings } from "../lib/settings.js";
import "./Viewer.css";

function detectKind(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".doc")) return "legacy-doc";
  if (name.endsWith(".ppt")) return "legacy-ppt";
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".pptx")) return "pptx";
  return "unsupported";
}

export default function Viewer() {
  const [settings, setSettingsState] = useState(() => getSettings());
  const [file, setFile] = useState(null);
  const [kind, setKind] = useState(null);

  function handleSettingsChange(partial) {
    const next = { ...settings, ...partial };
    setSettingsState(next);
    setSettings(partial);
  }

  function handleFile(newFile) {
    setFile(newFile);
    setKind(detectKind(newFile));
  }

  function handleReset() {
    setFile(null);
    setKind(null);
  }

  return (
    <div className="viewer-page">
      <Toolbar settings={settings} onChange={handleSettingsChange} />

      {!file && <FileDropzone onFile={handleFile} />}

      {file && (
        <button type="button" className="open-another" onClick={handleReset}>
          Open another file
        </button>
      )}

      {file && kind === "legacy-doc" && (
        <p className="legacy-notice">
          This is an older .doc file — convert it to .docx first, then open it here.
        </p>
      )}

      {file && kind === "legacy-ppt" && (
        <p className="legacy-notice">
          This is an older .ppt file — convert it to .pptx first, then open it here.
        </p>
      )}

      {file && kind === "pdf" && <PdfPageCanvas file={file} settings={settings} />}

      {file && (kind === "docx" || kind === "pptx") && (
        <DocumentPanel kind={kind} file={file} settings={settings} />
      )}

      {file && kind === "unsupported" && (
        <p className="legacy-notice">This file type isn't supported yet.</p>
      )}
    </div>
  );
}

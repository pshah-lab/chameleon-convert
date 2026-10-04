import { useRef } from "react";
import "./FileDropzone.css";

const ACCEPT =
  ".pdf,.docx,.pptx,.doc,.ppt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/msword,application/vnd.ms-powerpoint";

export default function FileDropzone({ onFile }) {
  const inputRef = useRef(null);

  function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  function handleChange(event) {
    const file = event.target.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      className="dropzone"
      data-testid="dropzone"
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
    >
      <p>Drag a file here</p>
      <button type="button" onClick={() => inputRef.current?.click()}>
        Browse
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        data-testid="file-input"
        onChange={handleChange}
        hidden
      />
    </div>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Landing placeholder</div>} />
        <Route path="/viewer" element={<div>Viewer placeholder</div>} />
      </Routes>
    </BrowserRouter>
  );
}

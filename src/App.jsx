import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./routes/Landing";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/viewer" element={<div>Viewer placeholder</div>} />
      </Routes>
    </BrowserRouter>
  );
}

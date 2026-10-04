import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./routes/Landing";
import Viewer from "./routes/Viewer";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/viewer" element={<Viewer />} />
      </Routes>
    </BrowserRouter>
  );
}

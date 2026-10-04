import { Link } from "react-router-dom";
import "./Landing.css";

const TOOLS = [
  {
    name: "Dark Document Viewer",
    description: "PDF, Word, and PowerPoint files — rendered dark, entirely offline.",
    href: "/viewer",
    live: true,
  },
  {
    name: "Excel Dark Mode",
    description: "Spreadsheets with full sheet/cell-style support.",
    href: null,
    live: false,
  },
  {
    name: "Edit & Export",
    description: "Edit documents in place and download the result.",
    href: null,
    live: false,
  },
];

export default function Landing() {
  return (
    <main className="landing">
      <section className="landing-hero">
        <h1>Chameleon Convert</h1>
        <p>File tools that stay on your device. No uploads, no tracking.</p>
      </section>

      <section className="landing-tools" aria-label="Tools">
        {TOOLS.map((tool) => (
          <article className="tool-card" key={tool.name}>
            <h2>{tool.name}</h2>
            <p>{tool.description}</p>
            {tool.live ? (
              <Link to={tool.href} className="tool-card-cta" aria-label={`Open tool: ${tool.name}`}>
                Open tool
              </Link>
            ) : (
              <span className="tool-card-badge">Coming Soon</span>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}

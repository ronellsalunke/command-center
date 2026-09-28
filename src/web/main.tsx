import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles.css";
import { LoginPage } from "./features/auth/LoginPage";
import { ProjectPage } from "./features/project-detail/ProjectPage";
import { ProjectsPage } from "./features/projects/ProjectsPage";

function App() {
  const path = window.location.pathname;
  if (path === "/login") return <LoginPage />;
  if (path === "/projects/new") return <ProjectPage id="new" />;
  const match = path.match(/^\/projects\/(\d+)\/?$/);
  if (match) return <ProjectPage id={match[1]} />;
  return <ProjectsPage />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

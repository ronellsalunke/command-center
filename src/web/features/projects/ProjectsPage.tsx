import { useEffect, useState } from "react";
import { PlusIcon, TrashIcon } from "../../components/icons";
import { deleteButtonClass, ErrorMessage, Layout } from "../../components/layout";
import { api, type Project } from "../../lib/api";

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void api<{ projects: Project[] }>("/api/projects")
      .then((data) => setProjects(data.projects))
      .catch((caught) => setError(String(caught)));
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (event.key === "/" && (!target || (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA"))) {
        event.preventDefault();
        document.getElementById("project-search")?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function createProject() {
    window.location.assign("/projects/new");
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`Delete “${project.name}” and all its fields?`)) return;
    try {
      await api(`/api/projects/${project.id}`, { method: "DELETE" });
      setProjects((current) => current.filter((item) => item.id !== project.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete project.");
    }
  }

  const visible = projects.filter((project) => project.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight">Projects</h1>
        <div className="flex min-w-0 items-center gap-2">
          <input
            id="project-search"
            aria-label="Search projects"
            type="search"
            placeholder="Search  ( / )"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-8 w-56 min-w-0 appearance-none rounded-md border border-neutral-200 bg-white px-2 text-sm leading-none dark:border-neutral-800 dark:bg-neutral-900"
          />
          <button
            aria-label="New project"
            title="New project"
            onClick={() => void createProject()}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
          >
            <PlusIcon />
          </button>
        </div>
      </div>
      <ErrorMessage message={error} />
      <section className="mt-2 grid gap-2" aria-label="Projects">
        {visible.map((project) => (
          <article
            key={project.id}
            className="relative flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            <div className="min-w-0">
              <a href={`/projects/${project.id}`} className="block truncate font-medium after:absolute after:inset-0 after:rounded-xl">
                {project.name}
              </a>
              <small className="block text-xs text-neutral-500 dark:text-neutral-400">
                Updated {new Date(project.updated_at).toLocaleString()}
              </small>
            </div>
            <button
              title="Delete project"
              aria-label={`Delete ${project.name}`}
              className={deleteButtonClass + " relative z-10"}
              onClick={(event) => {
                event.stopPropagation();
                void deleteProject(project);
              }}
            >
              <TrashIcon />
            </button>
          </article>
        ))}
        {visible.length === 0 && <p className="py-6 text-center text-sm text-neutral-500">No projects found.</p>}
      </section>
    </Layout>
  );
}

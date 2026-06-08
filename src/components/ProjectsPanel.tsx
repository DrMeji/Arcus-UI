import { useMemo, useState } from "react";
import { ProjectsIcon } from "./icons/sidebar/SidebarNavIcons";
import "./ProjectsPanel.css";

type ProjectFilter = "all" | "created" | "shared";

interface Project {
  id: string;
  name: string;
  createdByYou: boolean;
  shared: boolean;
}

const PROJECTS: Project[] = [
  { id: "1", name: "Arcus Shell", createdByYou: true, shared: false },
  { id: "2", name: "Mission Control", createdByYou: true, shared: true },
  { id: "3", name: "Memory Vault", createdByYou: false, shared: true },
  { id: "4", name: "Workspace Alpha", createdByYou: true, shared: false },
  { id: "5", name: "Agent Builder", createdByYou: true, shared: true },
  { id: "6", name: "Research Hub", createdByYou: false, shared: true },
  { id: "7", name: "Reminders", createdByYou: true, shared: false },
];

const FILTERS: { id: ProjectFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "created", label: "Created by you" },
  { id: "shared", label: "Shared with you" },
];

export function ProjectsPanel() {
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleProjects = useMemo(() => {
    let list = PROJECTS;
    if (filter === "created") {
      list = PROJECTS.filter((project) => project.createdByYou);
    } else if (filter === "shared") {
      list = PROJECTS.filter((project) => project.shared);
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [filter]);

  return (
    <section className="projects-panel" aria-label="Projects">
      <div className="projects-panel__filters" role="tablist" aria-label="Project filters">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            className={`projects-panel__filter ${filter === id ? "projects-panel__filter--active" : ""}`}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="projects-panel__column-label">Name</p>

      <ul className="projects-panel__list">
        {visibleProjects.map((project) => (
          <li key={project.id}>
            <button
              type="button"
              className={`projects-panel__row ${selectedId === project.id ? "projects-panel__row--selected" : ""}`}
              onClick={() => setSelectedId(project.id)}
            >
              <span className="projects-panel__icon" aria-hidden>
                <ProjectsIcon />
              </span>
              <span className="projects-panel__name">{project.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

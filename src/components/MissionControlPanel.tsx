import { useMemo, useState } from "react";
import { BackIcon } from "./icons/sidebar/SidebarNavIcons";
import "./MissionControlPanel.css";

interface MissionControlPanelProps {
  onBack: () => void;
}

function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

type McTab = "agents" | "skills";

type AgentStatus = "online" | "idle" | "offline";

interface Agent {
  id: string;
  name: string;
  initial: string;
  model: string;
  provider: string;
  status: AgentStatus;
  sessions: number;
  skills: number;
  tokens: string;
  channels: string[];
  linkedSkills: string[];
  memoryFiles: string[];
  tokensUsed: number;
  lastActive: string;
}

const TABS: { id: McTab; label: string }[] = [
  { id: "agents", label: "Agents" },
  { id: "skills", label: "Skills" },
];

const AGENTS: Agent[] = [
  {
    id: "atlas",
    name: "Atlas",
    initial: "A",
    model: "claude-4-sonnet",
    provider: "Anthropic",
    status: "online",
    sessions: 3,
    skills: 3,
    tokens: "1245k",
    channels: ["WhatsApp", "Telegram", "Slack"],
    linkedSkills: ["code-review", "git-manager", "file-organizer"],
    memoryFiles: ["agent.md", "identity.md", "memory.md", "skills.md", "heartbeat.md"],
    tokensUsed: 1245000,
    lastActive: "2m ago",
  },
  {
    id: "nova",
    name: "Nova",
    initial: "N",
    model: "gpt-5-mini",
    provider: "OpenAI",
    status: "online",
    sessions: 2,
    skills: 3,
    tokens: "892k",
    channels: ["Discord", "Slack"],
    linkedSkills: ["code-review", "git-manager", "file-organizer"],
    memoryFiles: ["agent.md", "identity.md", "memory.md", "skills.md", "heartbeat.md"],
    tokensUsed: 892100,
    lastActive: "5m ago",
  },
  {
    id: "sentinel",
    name: "Sentinel",
    initial: "S",
    model: "gemini-2.5-pro",
    provider: "Google",
    status: "idle",
    sessions: 0,
    skills: 2,
    tokens: "457k",
    channels: ["Telegram"],
    linkedSkills: ["monitoring", "alerts"],
    memoryFiles: ["agent.md", "memory.md"],
    tokensUsed: 457000,
    lastActive: "1h ago",
  },
  {
    id: "pixel",
    name: "Pixel",
    initial: "P",
    model: "claude-4-haiku",
    provider: "Anthropic",
    status: "offline",
    sessions: 0,
    skills: 2,
    tokens: "235k",
    channels: ["Slack"],
    linkedSkills: ["design-review", "ui-audit"],
    memoryFiles: ["agent.md", "identity.md"],
    tokensUsed: 235000,
    lastActive: "3h ago",
  },
  {
    id: "scribe",
    name: "Scribe",
    initial: "S",
    model: "gpt-5",
    provider: "OpenAI",
    status: "online",
    sessions: 5,
    skills: 3,
    tokens: "2105k",
    channels: ["WhatsApp", "Discord"],
    linkedSkills: ["summarize", "draft-email", "notes"],
    memoryFiles: ["agent.md", "memory.md", "skills.md"],
    tokensUsed: 2105000,
    lastActive: "1m ago",
  },
  {
    id: "watchtower",
    name: "Watchtower",
    initial: "W",
    model: "llama-3.3-70b",
    provider: "OpenRouter",
    status: "idle",
    sessions: 1,
    skills: 2,
    tokens: "178k",
    channels: ["Slack"],
    linkedSkills: ["cron-watch", "health-check"],
    memoryFiles: ["agent.md", "heartbeat.md"],
    tokensUsed: 178000,
    lastActive: "12m ago",
  },
];

const SKILLS = [
  { id: "code-review", name: "code-review", agents: 4, description: "Review pull requests and suggest improvements." },
  { id: "git-manager", name: "git-manager", agents: 3, description: "Manage branches, commits, and repository hygiene." },
  { id: "file-organizer", name: "file-organizer", agents: 2, description: "Sort, rename, and structure project files." },
  { id: "monitoring", name: "monitoring", agents: 1, description: "Track system health and uptime signals." },
  { id: "summarize", name: "summarize", agents: 2, description: "Condense long documents into actionable briefs." },
  { id: "design-review", name: "design-review", agents: 1, description: "Evaluate UI layouts and visual consistency." },
];

function StatusDot({ status }: { status: AgentStatus }) {
  return (
    <span
      className={`mission-control__status-dot mission-control__status-dot--${status}`}
      aria-label={status}
      title={status}
    />
  );
}

export function MissionControlPanel({ onBack }: MissionControlPanelProps) {
  const [activeTab, setActiveTab] = useState<McTab>("agents");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>("atlas");

  const agents = useMemo(() => sortByName(AGENTS), []);
  const skills = useMemo(() => sortByName(SKILLS), []);
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? null;

  return (
    <section className="mission-control" aria-label="Mission Control">
      <header className="mission-control__header">
        <div className="mission-control__header-top" aria-hidden="true" />
        <div className="mission-control__header-row">
          <button
            type="button"
            className="mission-control__back"
            onClick={onBack}
            aria-label="Back to main menu"
          >
            <span className="mission-control__back-icon" aria-hidden>
              <BackIcon />
            </span>
            Back
          </button>
          <nav className="mission-control__tabs" aria-label="Mission Control sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`mission-control__tab ${activeTab === tab.id ? "mission-control__tab--active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className={`mission-control__body ${selectedAgent ? "mission-control__body--detail" : ""}`}>
        <div className="mission-control__main">
          {activeTab === "agents" && (
            <div className="mission-control__agents-grid">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  className={`mission-control__agent-card ${selectedAgentId === agent.id ? "mission-control__agent-card--selected" : ""}`}
                  onClick={() => setSelectedAgentId(agent.id)}
                >
                  <div className="mission-control__agent-card-top">
                    <span className="mission-control__agent-avatar">{agent.initial}</span>
                    <div className="mission-control__agent-title">
                      <span className="mission-control__agent-name-row">
                        <span className="mission-control__agent-name">{agent.name}</span>
                        <StatusDot status={agent.status} />
                      </span>
                    </div>
                  </div>
                  <p className="mission-control__agent-model">{agent.model}</p>
                  <p className="mission-control__agent-provider">{agent.provider}</p>
                  <div className="mission-control__agent-stats">
                    <div>
                      <span className="mission-control__stat-label">Sessions</span>
                      <span className="mission-control__stat-value">{agent.sessions}</span>
                    </div>
                    <div>
                      <span className="mission-control__stat-label">Skills</span>
                      <span className="mission-control__stat-value">{agent.skills}</span>
                    </div>
                    <div>
                      <span className="mission-control__stat-label">Tokens</span>
                      <span className="mission-control__stat-value">{agent.tokens}</span>
                    </div>
                  </div>
                  <p className="mission-control__agent-last">Last active {agent.lastActive}</p>
                </button>
              ))}
            </div>
          )}

          {activeTab === "skills" && (
            <ul className="mission-control__skills-list">
              {skills.map((skill) => (
                <li key={skill.id}>
                  <button type="button" className="mission-control__skill-row">
                    <div className="mission-control__skill-info">
                      <span className="mission-control__skill-name">{skill.name}</span>
                      <span className="mission-control__skill-desc">{skill.description}</span>
                    </div>
                    <span className="mission-control__skill-count">{skill.agents} agents</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedAgent && activeTab === "agents" && (
          <aside className="mission-control__detail">
            <div className="mission-control__detail-header">
              <div className="mission-control__detail-title">
                <span className="mission-control__agent-avatar">{selectedAgent.initial}</span>
                <div className="mission-control__agent-name-row">
                  <h2>{selectedAgent.name}</h2>
                  <StatusDot status={selectedAgent.status} />
                </div>
              </div>
              <button
                type="button"
                className="mission-control__detail-close"
                aria-label="Close agent details"
                onClick={() => setSelectedAgentId(null)}
              >
                ×
              </button>
            </div>

            <div className="mission-control__detail-body">
              <section className="mission-control__detail-section">
                <h3>Configuration</h3>
                <dl>
                  <div><dt>Model</dt><dd>{selectedAgent.model}</dd></div>
                  <div><dt>Provider</dt><dd>{selectedAgent.provider}</dd></div>
                  <div><dt>Sessions</dt><dd>{selectedAgent.sessions}</dd></div>
                  <div><dt>Tokens Used</dt><dd>{selectedAgent.tokensUsed.toLocaleString()}</dd></div>
                </dl>
              </section>

              <section className="mission-control__detail-section">
                <h3>Channels</h3>
                <div className="mission-control__chips">
                  {[...selectedAgent.channels].sort((a, b) => a.localeCompare(b)).map((channel) => (
                    <span key={channel} className="mission-control__chip">{channel}</span>
                  ))}
                </div>
              </section>

              <section className="mission-control__detail-section">
                <h3>Linked Skills</h3>
                <div className="mission-control__chips">
                  {[...selectedAgent.linkedSkills].sort((a, b) => a.localeCompare(b)).map((skill) => (
                    <span key={skill} className="mission-control__chip">{skill}</span>
                  ))}
                </div>
              </section>

              <section className="mission-control__detail-section">
                <h3>Memory Files</h3>
                <div className="mission-control__chips">
                  {[...selectedAgent.memoryFiles].sort((a, b) => a.localeCompare(b)).map((file) => (
                    <span key={file} className="mission-control__chip">{file}</span>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}

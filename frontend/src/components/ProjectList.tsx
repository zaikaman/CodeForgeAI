import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/theme.css'
import './ProjectList.css'

export interface Project {
  id: string
  name: string
  description: string
  language: string
  filesCount: number
  lastGenerated?: Date
  createdAt: Date
  status: 'active' | 'archived'
}

interface ProjectListProps {
  projects: Project[]
  viewMode?: 'grid' | 'list'
  onProjectClick?: (project: Project) => void
  onProjectDelete?: (projectId: string) => void
  className?: string
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  viewMode: initialViewMode = 'grid',
  onProjectClick,
  onProjectDelete,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLanguage, setFilterLanguage] = useState<string>('all')

  const languages = ['all', ...Array.from(new Set(projects.map((p) => p.language)))]

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLanguage = filterLanguage === 'all' || project.language === filterLanguage
    return matchesSearch && matchesLanguage
  })

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getLanguageIcon = (language: string) => {
    const icons: Record<string, string> = {
      typescript: '▣',
      javascript: '◆',
      python: '◉',
      java: '◈',
      go: '▲',
      rust: '▼',
    }
    return icons[language.toLowerCase()] || '●'
  }

  return (
    <div className={`project-list terminal-window ${className}`}>
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="terminal-button close"></div>
        <div className="terminal-button minimize"></div>
        <div className="terminal-button maximize"></div>
        <div className="terminal-title">PROJECT DATABASE</div>
      </div>

      {/* Control Bar */}
      <div className="project-controls">
        {/* Search */}
        <div className="search-box">
          <span className="search-icon phosphor-glow">◉</span>
          <input
            type="text"
            className="input search-input"
            placeholder="SEARCH PROJECTS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Language Filter */}
        <div className="language-filter">
          <span className="filter-label text-muted">&gt; LANG:</span>
          <select
            className="input filter-select"
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <span>▣</span>
          </button>
          <button
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <span>☰</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="projects-stats">
        <div className="stat-item">
          <span className="text-muted">&gt; TOTAL:</span>
          <span className="text-primary phosphor-glow"> {projects.length}</span>
        </div>
        <div className="stat-item">
          <span className="text-muted">&gt; FILTERED:</span>
          <span className="text-success"> {filteredProjects.length}</span>
        </div>
        <div className="stat-item">
          <span className="text-muted">&gt; VIEW:</span>
          <span className="text-primary"> {viewMode.toUpperCase()}</span>
        </div>
      </div>

      {/* Projects Container */}
      <div className={`projects-container ${viewMode}-view`}>
        {filteredProjects.length === 0 ? (
          <div className="empty-projects">
            <pre className="empty-ascii phosphor-glow">
{`    ╔═══════════════════════════╗
    ║                           ║
    ║      NO PROJECTS FOUND    ║
    ║                           ║
    ║   ► Create a new project  ║
    ║   ► Adjust filters        ║
    ║                           ║
    ╚═══════════════════════════╝`}
            </pre>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div key={project.id} className="project-card terminal-window">
              <div className="project-header">
                <div className="project-icon phosphor-glow">
                  {getLanguageIcon(project.language)}
                </div>
                <div className="project-meta">
                  <h3 className="project-name phosphor-glow">{project.name}</h3>
                  <div className="project-language">
                    <span className="badge badge-success">{project.language.toUpperCase()}</span>
                    <span className="project-files text-muted">
                      {project.filesCount} files
                    </span>
                  </div>
                </div>
                <div className="project-status">
                  <span
                    className={`status-dot ${
                      project.status === 'active' ? 'status-active' : 'status-archived'
                    }`}
                  >
                    ●
                  </span>
                </div>
              </div>

              <div className="project-body">
                <p className="project-description">{project.description}</p>

                <div className="project-dates">
                  <div className="date-item">
                    <span className="text-muted">&gt; CREATED:</span>
                    <span className="text-primary"> {formatDate(project.createdAt)}</span>
                  </div>
                  {project.lastGenerated && (
                    <div className="date-item">
                      <span className="text-muted">&gt; LAST GEN:</span>
                      <span className="text-success"> {formatDate(project.lastGenerated)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="project-footer">
                <Link
                  to={`/generate?project=${project.id}`}
                  className="btn btn-primary project-btn"
                  onClick={() => onProjectClick?.(project)}
                >
                  ► GENERATE
                </Link>
                <Link
                  to={`/projects/${project.id}`}
                  className="btn project-btn"
                >
                  VIEW
                </Link>
                {onProjectDelete && (
                  <button
                    className="btn btn-danger project-btn"
                    onClick={() => onProjectDelete(project.id)}
                  >
                    DELETE
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Compact version for sidebars
export const ProjectListCompact: React.FC<{
  projects: Project[]
  maxItems?: number
  className?: string
}> = ({ projects, maxItems = 5, className = '' }) => {
  const recentProjects = projects.slice(0, maxItems)

  return (
    <div className={`project-list-compact terminal-window ${className}`}>
      <div className="terminal-content">
        <div className="compact-header phosphor-glow">
          <span>◆</span> RECENT PROJECTS
        </div>
        <div className="compact-list mt-md">
          {recentProjects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="compact-project-item"
            >
              <span className="project-icon-small">
                {project.language.charAt(0).toUpperCase()}
              </span>
              <div className="project-info">
                <div className="project-name-small">{project.name}</div>
                <div className="project-lang-small text-muted">{project.language}</div>
              </div>
              <span className="project-arrow">►</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

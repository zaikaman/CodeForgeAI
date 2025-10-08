import React from 'react'
import { Layout } from '../components/Layout'
import { ProjectList } from '../components/ProjectList'
import { ProjectListCompact } from '../components/ProjectList'
import { AgentChatCompact } from '../components/AgentChat'
import { useProjects } from '../hooks/useProjects'
import { useGenerationStore } from '../stores/generationStore'
import { Link } from 'react-router-dom'
import '../styles/theme.css'
import './DashboardPage.css'

export const DashboardPage: React.FC = () => {
  const { projects, isLoading } = useProjects()
  const { history } = useGenerationStore()

  const recentGenerations = history.slice(0, 5)
  const stats = {
    totalProjects: projects.length,
    totalGenerations: history.length,
    successRate: history.length > 0
      ? ((history.filter(h => h.status === 'completed').length / history.length) * 100).toFixed(1)
      : '0',
    activeProjects: projects.filter(p => p.status === 'active').length,
  }

  return (
    <Layout>
      <div className="dashboard-page">
        {/* Header */}
        <div className="dashboard-header terminal-window">
          <div className="terminal-header">
            <div className="terminal-button close"></div>
            <div className="terminal-button minimize"></div>
            <div className="terminal-button maximize"></div>
            <div className="terminal-title">OPERATOR DASHBOARD</div>
          </div>
          <div className="terminal-content">
            <h1 className="dashboard-title phosphor-glow">◆ SYSTEM OVERVIEW</h1>
            <p className="dashboard-subtitle">&gt; Mission control for AI-powered development</p>
          </div>
        </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card terminal-window">
          <div className="terminal-content">
            <div className="stat-icon phosphor-glow">◆</div>
            <div className="stat-value phosphor-glow">{stats.totalProjects}</div>
            <div className="stat-label">TOTAL PROJECTS</div>
          </div>
        </div>
        <div className="stat-card terminal-window">
          <div className="terminal-content">
            <div className="stat-icon phosphor-glow">▣</div>
            <div className="stat-value phosphor-glow">{stats.totalGenerations}</div>
            <div className="stat-label">CODE GENERATIONS</div>
          </div>
        </div>
        <div className="stat-card terminal-window">
          <div className="terminal-content">
            <div className="stat-icon phosphor-glow">◉</div>
            <div className="stat-value phosphor-glow">{stats.successRate}%</div>
            <div className="stat-label">SUCCESS RATE</div>
          </div>
        </div>
        <div className="stat-card terminal-window">
          <div className="terminal-content">
            <div className="stat-icon phosphor-glow">▲</div>
            <div className="stat-value phosphor-glow">{stats.activeProjects}</div>
            <div className="stat-label">ACTIVE PROJECTS</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Projects Section */}
        <div className="dashboard-section projects-section">
          <ProjectList
            projects={projects}
            viewMode="grid"
          />
        </div>

        {/* Sidebar */}
        <div className="dashboard-sidebar">
          {/* Quick Actions */}
          <div className="quick-actions-card terminal-window">
            <div className="terminal-content">
              <h3 className="section-title phosphor-glow">◆ QUICK ACTIONS</h3>
              <div className="actions-list mt-md">
                <Link to="/generate" className="action-btn btn btn-primary full-width">
                  ► NEW GENERATION
                </Link>
                <Link to="/review" className="action-btn btn full-width mt-sm">
                  REVIEW CODE
                </Link>
                <Link to="/history" className="action-btn btn full-width mt-sm">
                  VIEW HISTORY
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="recent-activity terminal-window mt-md">
            <div className="terminal-content">
              <h3 className="section-title phosphor-glow">◆ RECENT ACTIVITY</h3>
              <div className="activity-list mt-md">
                {recentGenerations.length === 0 ? (
                  <div className="empty-state text-muted">
                    &gt; No recent activity
                  </div>
                ) : (
                  recentGenerations.map((gen) => (
                    <div key={gen.id} className="activity-item">
                      <div className="activity-icon">
                        {gen.status === 'completed' ? '✓' : gen.status === 'error' ? '✗' : '◉'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-title">
                          {gen.prompt.substring(0, 40)}...
                        </div>
                        <div className="activity-time text-muted">
                          {new Date(gen.startedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  )
}

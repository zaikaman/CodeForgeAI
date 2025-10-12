import { useState, useEffect, useCallback } from 'react'
import { useUIStore } from '../stores/uiStore'
import apiClient from '../services/apiClient'
import { Project } from '../types/project'

export interface UseProjectsReturn {
  // State
  projects: Project[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchProjects: () => Promise<void>
  refreshProjects: () => Promise<void>
  getProject: (projectId: string) => Project | undefined
}

export const useProjects = (autoFetch: boolean = true): UseProjectsReturn => {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { showToast } = useUIStore()

  const fetchProjects = useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)

      const response = await apiClient.getProjects()

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch projects')
      }

      // Map API response to Project format
      const mappedProjects: Project[] = response.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || 'No description',
        language: p.language || 'unknown',
        filesCount: p.filesCount || p.files_count || 0,
        lastGenerated: p.lastGenerated ? new Date(p.lastGenerated) : undefined,
        createdAt: new Date(p.createdAt || p.created_at),
        status: p.status || 'active',
      }))

      setProjects(mappedProjects)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch projects'
      setError(errorMessage)
      showToast('error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  const refreshProjects = useCallback(async () => {
    await fetchProjects()
  }, [fetchProjects])

  const getProject = useCallback(
    (projectId: string) => {
      return projects.find((p) => p.id === projectId)
    },
    [projects]
  )

  useEffect(() => {
    if (autoFetch) {
      fetchProjects()
    }
  }, [autoFetch, fetchProjects])

  return {
    projects,
    isLoading,
    error,
    fetchProjects,
    refreshProjects,
    getProject,
  }
}

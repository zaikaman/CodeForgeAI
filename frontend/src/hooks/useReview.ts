import { useState, useCallback } from 'react'
import { useUIStore } from '../stores/uiStore'
import apiClient, { ReviewRequest, ReviewResponse } from '../services/apiClient'
import { Finding } from '../components/ReviewPanel'

export interface UseReviewReturn {
  // State
  isReviewing: boolean
  findings: Finding[]
  overallScore: number | null
  summary: string | null
  error: string | null

  // Actions
  review: (request: ReviewRequest) => Promise<void>
  clear: () => void
}

export const useReview = (): UseReviewReturn => {
  const [isReviewing, setIsReviewing] = useState(false)
  const [findings, setFindings] = useState<Finding[]>([])
  const [overallScore, setOverallScore] = useState<number | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { setLoading, showToast } = useUIStore()

  const review = useCallback(
    async (request: ReviewRequest) => {
      try {
        setError(null)
        setIsReviewing(true)
        setLoading(true, 'Analyzing code...')

        const response = await apiClient.review(request)

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Review failed')
        }

        // Map findings to component format
        const mappedFindings: Finding[] = response.data.findings.map((f, idx) => ({
          id: `finding_${idx}`,
          severity: f.severity,
          title: f.title,
          description: f.description,
          file: f.file || 'unknown',
          line: f.line,
          category: f.category,
          suggestion: f.suggestion,
        }))

        setFindings(mappedFindings)
        setOverallScore(response.data.overallScore)
        setSummary(response.data.summary)

        const criticalCount = mappedFindings.filter((f) => f.severity === 'critical').length
        if (criticalCount > 0) {
          showToast('warning', `Found ${criticalCount} critical issue(s)`)
        } else {
          showToast('success', 'Code review completed')
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to review code'
        setError(errorMessage)
        showToast('error', errorMessage)
      } finally {
        setIsReviewing(false)
        setLoading(false)
      }
    },
    [setLoading, showToast]
  )

  const clear = useCallback(() => {
    setFindings([])
    setOverallScore(null)
    setSummary(null)
    setError(null)
  }, [])

  return {
    isReviewing,
    findings,
    overallScore,
    summary,
    error,
    review,
    clear,
  }
}

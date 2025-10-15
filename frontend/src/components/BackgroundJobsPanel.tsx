import React, { useEffect, useRef } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import { useUIStore } from '../stores/uiStore';
import { useRealtimeJobsList } from '../hooks/useRealtimeJobsList';
import './BackgroundJobsPanel.css';

interface BackgroundJobsPanelProps {
  onClose: () => void;
  onActiveJobsCountChange?: (count: number) => void;
}

export const BackgroundJobsPanel: React.FC<BackgroundJobsPanelProps> = ({ onClose, onActiveJobsCountChange }) => {
  const { user } = useAuthContext();
  const { showToast } = useUIStore();
  const previousJobStatusesRef = useRef<Record<string, string>>({});

  // Use realtime WebSocket updates (no polling!)
  const { 
    jobs: realtimeJobs,
    loading: realtimeLoading,
    refresh,
    isConnected 
  } = useRealtimeJobsList({
    enabled: !!user,
    onActiveJobsChange: (count) => {
      onActiveJobsCountChange?.(count);
    },
  });

  const jobs = realtimeJobs;
  const loading = realtimeLoading;

  // Show notifications on job status changes
  useEffect(() => {
    jobs.forEach(job => {
      const previousStatus = previousJobStatusesRef.current[job.id];
      
      // New job started processing
      if (previousStatus === 'pending' && job.status === 'processing') {
        showToast('info', `🚀 Background job started: ${job.user_message.substring(0, 50)}...`, 4000);
      }
      
      // Job completed successfully
      if ((previousStatus === 'processing' || previousStatus === 'pending') && job.status === 'completed') {
        showToast('success', `✅ Background job completed: ${job.user_message.substring(0, 50)}...`, 6000);
      }
      
      // Job failed
      if ((previousStatus === 'processing' || previousStatus === 'pending') && job.status === 'failed') {
        showToast('error', `❌ Background job failed: ${job.user_message.substring(0, 50)}...`, 6000);
      }
      
      // Update previous status
      previousJobStatusesRef.current[job.id] = job.status;
    });
  }, [jobs, showToast]);

  // Cancel a job
  const handleCancelJob = async (jobId: string) => {
    try {
      const response = await apiClient.cancelJob(jobId);
      
      if (response.success) {
        refresh(); // Refresh jobs list
      } else {
        console.error('Failed to cancel job:', response.error);
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  // Retry a failed job
  const handleRetryJob = async (jobId: string) => {
    try {
      const response = await apiClient.retryJob(jobId);
      
      if (response.success) {
        refresh(); // Refresh jobs list
      } else {
        console.error('Failed to retry job:', response.error);
      }
    } catch (error) {
      console.error('Error retrying job:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '⚙️';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'cancelled': return '⏸️';
      default: return '❓';
    }
  };

  const activeJobs = jobs.filter(j => j.status === 'processing' || j.status === 'pending');
  const hasActiveJobs = activeJobs.length > 0;

  if (!user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content bg-gray-900 rounded-lg shadow-2xl border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔧</span>
            <h2 className="text-xl font-semibold text-white">Background Jobs</h2>
            {hasActiveJobs && (
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                {activeJobs.length} active
              </span>
            )}
            {isConnected && (
              <span className="text-xs text-green-400">● realtime</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              disabled={loading}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              {loading ? '⟳ Loading...' : '↻ Refresh'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl transition-colors"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Jobs List */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          {jobs.length === 0 ? (
            <div className="px-6 py-16 text-center text-gray-400">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-lg">No background jobs yet</p>
              <p className="text-sm mt-2">Submit tasks with "background mode" enabled to see them here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {jobs.map(job => (
                <div key={job.id} className="px-6 py-4 hover:bg-gray-800 transition-colors">
                  {/* Job Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xl">{getStatusIcon(job.status)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">
                          {job.user_message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`
                      text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap
                      ${getStatusColor(job.status)} text-white
                    `}>
                      {job.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {(job.status === 'processing' || job.status === 'pending') && (
                    <div className="mb-2">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{job.progress || 0}%</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {job.status === 'failed' && job.error && (
                    <div className="mb-2 p-2 bg-red-900/20 border border-red-700 rounded text-xs text-red-400">
                      {job.error}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {(job.status === 'processing' || job.status === 'pending') && (
                      <button
                        onClick={() => handleCancelJob(job.id)}
                        className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                      >
                        Cancel
                      </button>
                    )}
                    {job.status === 'failed' && (
                      <button
                        onClick={() => handleRetryJob(job.id)}
                        className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                      >
                        Retry
                      </button>
                    )}
                    {job.status === 'completed' && job.result && (
                      <button
                        onClick={() => {
                          // Navigate to the chat session where result was posted
                          window.location.href = `/terminal?generation=${job.session_id}`;
                          onClose();
                        }}
                        className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                      >
                        View Result
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
        className="modal-content bg-[#0a0e0f] rounded border-2 border-[#4fc3f7] shadow-[0_0_20px_rgba(79,195,247,0.4)] max-w-3xl w-full max-h-[85vh] overflow-hidden font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="sticky top-0 bg-[#000000] px-6 py-4 border-b-2 border-[#4fc3f7]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <h2 className="text-lg font-bold text-[#4fc3f7] tracking-wider">BACKGROUND_JOBS.log</h2>
            </div>
            <button
              onClick={onClose}
              className="text-[#ff3333] hover:text-[#ff6666] text-2xl transition-colors font-bold"
              title="Close"
            >
              ✕
            </button>
          </div>
          
          {/* Status Bar */}
          <div className="flex items-center gap-4 text-xs">
            {hasActiveJobs && (
              <div className="flex items-center gap-2 text-[#00ff41]">
                <span className="animate-pulse">●</span>
                <span className="font-bold">{activeJobs.length} ACTIVE</span>
              </div>
            )}
            {isConnected && (
              <div className="flex items-center gap-2 text-[#00aa2a]">
                <span>●</span>
                <span>REALTIME</span>
              </div>
            )}
            <div className="flex-1"></div>
            <button
              onClick={refresh}
              disabled={loading}
              className="text-[#4fc3f7] hover:text-[#81d4fa] font-bold transition-colors disabled:opacity-50"
            >
              {loading ? '[LOADING...]' : '[REFRESH]'}
            </button>
          </div>
        </div>

        {/* Jobs List */}
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] scrollbar-terminal">
          {jobs.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-6xl mb-4 text-[#4fc3f7]">▓</div>
              <p className="text-lg text-[#bdbdbd] mb-2">NO JOBS FOUND</p>
              <p className="text-sm text-[#00aa2a]">
                &gt; Submit tasks with background mode to track them here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#4fc3f7]/20">
              {jobs.map(job => (
                <div key={job.id} className="px-6 py-4 hover:bg-[#141a1c] transition-colors border-l-2 border-transparent hover:border-[#4fc3f7]">
                  {/* Job Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-xl flex-shrink-0">{getStatusIcon(job.status)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-bold mb-1 break-words">
                          {job.user_message}
                        </p>
                        <p className="text-xs text-[#00aa2a]">
                          {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`
                      text-xs px-3 py-1 rounded font-bold whitespace-nowrap tracking-wider border
                      ${job.status === 'pending' ? 'bg-[#ffb000]/20 text-[#ffb000] border-[#ffb000]' : ''}
                      ${job.status === 'processing' ? 'bg-[#4fc3f7]/20 text-[#4fc3f7] border-[#4fc3f7] animate-pulse' : ''}
                      ${job.status === 'completed' ? 'bg-[#00ff41]/20 text-[#00ff41] border-[#00ff41]' : ''}
                      ${job.status === 'failed' ? 'bg-[#ff3333]/20 text-[#ff3333] border-[#ff3333]' : ''}
                      ${job.status === 'cancelled' ? 'bg-[#bdbdbd]/20 text-[#bdbdbd] border-[#bdbdbd]' : ''}
                    `}>
                      [{job.status.toUpperCase()}]
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {(job.status === 'processing' || job.status === 'pending') && (
                    <div className="mb-3">
                      <div className="w-full bg-[#141a1c] rounded-full h-2 border border-[#4fc3f7]/30 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#4fc3f7] to-[#00ff41] h-full transition-all duration-300 shadow-[0_0_5px_rgba(79,195,247,0.5)]"
                          style={{ width: `${job.progress || 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-[#4fc3f7] font-bold">{job.progress || 0}%</p>
                        <p className="text-xs text-[#00aa2a]">PROCESSING...</p>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {job.status === 'failed' && job.error && (
                    <div className="mb-3 p-3 bg-[#ff3333]/10 border border-[#ff3333] rounded font-mono text-xs text-[#ff3333] leading-relaxed">
                      <div className="font-bold mb-1">[ERROR]:</div>
                      <div className="text-[#ff6666]">{job.error}</div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {(job.status === 'processing' || job.status === 'pending') && (
                      <button
                        onClick={() => handleCancelJob(job.id)}
                        className="text-xs px-3 py-1.5 bg-[#ff3333]/20 hover:bg-[#ff3333]/30 text-[#ff3333] border border-[#ff3333] rounded font-bold transition-all hover:shadow-[0_0_5px_rgba(255,51,51,0.5)]"
                      >
                        [CANCEL]
                      </button>
                    )}
                    {job.status === 'failed' && (
                      <button
                        onClick={() => handleRetryJob(job.id)}
                        className="text-xs px-3 py-1.5 bg-[#4fc3f7]/20 hover:bg-[#4fc3f7]/30 text-[#4fc3f7] border border-[#4fc3f7] rounded font-bold transition-all hover:shadow-[0_0_5px_rgba(79,195,247,0.5)]"
                      >
                        [RETRY]
                      </button>
                    )}
                    {job.status === 'completed' && job.result && (
                      <button
                        onClick={() => {
                          // Navigate to the chat session where result was posted
                          window.location.href = `/terminal?generation=${job.session_id}`;
                          onClose();
                        }}
                        className="text-xs px-3 py-1.5 bg-[#00ff41]/20 hover:bg-[#00ff41]/30 text-[#00ff41] border border-[#00ff41] rounded font-bold transition-all hover:shadow-[0_0_5px_rgba(0,255,65,0.5)]"
                      >
                        [VIEW RESULT]
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

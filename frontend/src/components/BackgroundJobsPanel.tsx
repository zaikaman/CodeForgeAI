import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthContext } from '../contexts/AuthContext';
import './BackgroundJobsPanel.css';

interface Job {
  id: string;
  type: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  data: {
    userMessage: string;
    sessionId: string;
  };
  result?: {
    success: boolean;
    result?: any;
    error?: string;
  };
  progress?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedReason?: string;
}

interface JobUpdate {
  jobId: string;
  status: string;
  progress: number;
  logs: string[];
  result?: any;
  timestamp: string;
}

interface BackgroundJobsPanelProps {
  onClose: () => void;
}

export const BackgroundJobsPanel: React.FC<BackgroundJobsPanelProps> = ({ onClose }) => {
  const { user } = useAuthContext();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  // Connect to Socket.IO for real-time updates
  useEffect(() => {
    if (!user) return;

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const newSocket = io(backendUrl);

    newSocket.on('connect', () => {
      console.log('✅ Connected to background jobs socket');
      // Join user-specific room
      newSocket.emit('join:user', user.id);
    });

    newSocket.on('job:update', (update: JobUpdate) => {
      console.log('📊 Job update received:', update);
      
      // Update job in list
      setJobs(prev => {
        const existingIndex = prev.findIndex(j => j.id === update.jobId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            status: update.status as any,
            progress: update.progress,
            result: update.result,
          };
          return updated;
        }
        return prev;
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Fetch user's jobs
  const fetchJobs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/jobs/user/${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  // Cancel a job
  const handleCancelJob = async (jobId: string) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/jobs/${jobId}?type=agent_task`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      if (data.success) {
        // Refresh jobs
        fetchJobs();
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  // Retry a failed job
  const handleRetryJob = async (jobId: string) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/jobs/${jobId}/retry?type=agent_task`, {
        method: 'POST',
      });
      
      const data = await response.json();
      if (data.success) {
        // Refresh jobs
        fetchJobs();
      }
    } catch (error) {
      console.error('Error retrying job:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-500';
      case 'active': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'delayed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return '⏳';
      case 'active': return '⚙️';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'delayed': return '⏸️';
      default: return '❓';
    }
  };

  const activeJobs = jobs.filter(j => j.status === 'active' || j.status === 'waiting');
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
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchJobs}
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
                          {job.data.userMessage}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(job.createdAt).toLocaleString()}
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
                  {(job.status === 'active' || job.status === 'waiting') && (
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
                  {job.status === 'failed' && job.failedReason && (
                    <div className="mb-2 p-2 bg-red-900/20 border border-red-700 rounded text-xs text-red-400">
                      {job.failedReason}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {(job.status === 'active' || job.status === 'waiting') && (
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
                    {job.status === 'completed' && job.result?.result && (
                      <button
                        onClick={() => {
                          // TODO: Navigate to the result or show details
                          console.log('View result:', job.result);
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

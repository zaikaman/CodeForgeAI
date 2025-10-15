/**
 * Telegram Authentication Page
 * Completes the Telegram bot authentication flow
 * 
 * Flow:
 * 1. User clicks "Sign In" button in Telegram
 * 2. Opens this page with auth token
 * 3. User signs in to CodeForge (if not already)
 * 4. This page completes the linking
 * 5. Redirects to dashboard
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export default function TelegramAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting your Telegram account...');
  
  useEffect(() => {
    completeAuth();
  }, []);
  
  const completeAuth = async () => {
    try {
      // Get auth token from URL
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid authentication link. Please try again from Telegram.');
        return;
      }
      
      // Check if user is signed in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // User not signed in - redirect to sign in page with return URL
        const returnUrl = `/telegram-auth?token=${token}`;
        // Store return URL in sessionStorage for after login
        sessionStorage.setItem('telegram_auth_return_url', returnUrl);
        navigate('/login');
        return;
      }
      
      setMessage('Linking your Telegram account...');
      
      // Complete the authentication
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/telegram/complete-auth`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ token }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to link Telegram account');
      }
      
      // Success!
      setStatus('success');
      setMessage(
        `Successfully linked your Telegram account! ` +
        `You can now use CodeForge AI directly from Telegram. ` +
        `Go back to Telegram and send me a message to get started!`
      );
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (error: any) {
      console.error('Telegram auth error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to complete authentication');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 mb-6 flex items-center justify-center">
            {status === 'loading' && (
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {status === 'loading' && 'Connecting Telegram...'}
            {status === 'success' && 'Successfully Connected!'}
            {status === 'error' && 'Connection Failed'}
          </h1>
          
          {/* Message */}
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {message}
          </p>
          
          {/* Actions */}
          {status === 'success' && (
            <div className="space-y-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
              
              <a
                href="https://t.me/your_bot_username"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Open Telegram Bot
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
          
          {status === 'loading' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This may take a few seconds...
            </p>
          )}
        </div>
        
        {/* Help text */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            What's happening?
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>✓ Verifying your identity</li>
            <li>✓ Linking Telegram account</li>
            <li>✓ Setting up bot access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

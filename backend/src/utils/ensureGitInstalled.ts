/**
 * Ensure Git is installed on Heroku
 * 
 * Git is installed to /app/bin during the build phase via install-git-binary.sh
 * This ensures it's part of the dyno slug and persists even if cache is flushed
 */

import { execSync } from 'child_process';

let gitCheckResult: { available: boolean; version?: string; error?: string } | null = null;

/**
 * Check if git is available
 */
export function isGitAvailable(): boolean {
  if (gitCheckResult === null) {
    gitCheckResult = checkGitInstallation();
  }
  return gitCheckResult.available;
}

/**
 * Get git version
 */
export function getGitVersion(): string | undefined {
  if (gitCheckResult === null) {
    gitCheckResult = checkGitInstallation();
  }
  return gitCheckResult.version;
}

/**
 * Get environment variables needed for git to work with HTTPS on Heroku
 */
export function getGitEnv(): NodeJS.ProcessEnv {
  const isHeroku = process.env.HEROKU_APP_NAME || process.env.DYNO;
  
  if (isHeroku) {
    return {
      ...process.env,
      PATH: '/app/bin:/app/bin/libexec/git-core:/app/bin/lib/git-core:' + (process.env.PATH || ''),
      LD_LIBRARY_PATH: '/app/bin/lib:/usr/lib/x86_64-linux-gnu:/usr/lib:/lib/x86_64-linux-gnu:/lib',
      SSL_CERT_FILE: '/app/bin/etc/ssl/certs/ca-bundle.crt',
      SSL_CERT_DIR: '/app/bin/etc/ssl/certs',
      GIT_EXEC_PATH: '/app/bin/libexec/git-core',
      GIT_AUTHOR_NAME: process.env.GIT_AUTHOR_NAME || 'CodeForge Bot',
      GIT_AUTHOR_EMAIL: process.env.GIT_AUTHOR_EMAIL || 'bot@codeforge.ai',
      GIT_COMMITTER_NAME: process.env.GIT_COMMITTER_NAME || 'CodeForge Bot',
      GIT_COMMITTER_EMAIL: process.env.GIT_COMMITTER_EMAIL || 'bot@codeforge.ai'
    };
  }
  
  return process.env;
}

/**
 * Check and install git if needed
 */
function checkGitInstallation(): { available: boolean; version?: string; error?: string } {
  const isHeroku = process.env.HEROKU_APP_NAME || process.env.DYNO;
  
  // Priority 1: On Heroku, check /app/bin/git first (from slug)
  if (isHeroku) {
    try {
      // Set LD_LIBRARY_PATH to find git's dependencies
      const env = { 
        ...process.env,
        PATH: '/app/bin:/app/bin/libexec/git-core:/app/bin/lib/git-core:' + (process.env.PATH || ''),
        LD_LIBRARY_PATH: '/app/bin/lib:/usr/lib/x86_64-linux-gnu:/usr/lib:/lib/x86_64-linux-gnu:/lib',
        SSL_CERT_FILE: '/app/bin/etc/ssl/certs/ca-bundle.crt',
        SSL_CERT_DIR: '/app/bin/etc/ssl/certs',
        GIT_EXEC_PATH: '/app/bin/libexec/git-core'
      };
      const version = execSync('/app/bin/git --version', { encoding: 'utf-8', stdio: 'pipe', env }).trim();
      console.log(`[EnsureGitInstalled] ✅ Git found in slug: ${version}`);
      console.log(`[EnsureGitInstalled] 📍 Git location: /app/bin/git`);
      return { available: true, version };
    } catch (error) {
      // Git not in /app/bin, continue to check PATH
    }
  }
  
  // Priority 2: Try git from PATH (system installation or env PATH)
  try {
    const version = execSync('git --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    console.log(`[EnsureGitInstalled] ✅ Git found in PATH: ${version}`);
    try {
      const location = execSync('which git', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      console.log(`[EnsureGitInstalled] 📍 Git location: ${location}`);
    } catch {
      // which command might not be available, that's ok
    }
    return { available: true, version };
  } catch (error: any) {
    console.warn(`[EnsureGitInstalled] ⚠️ Git not found: ${error.message}`);
    
    if (isHeroku) {
      console.error(
        `[EnsureGitInstalled] ❌ Git is not available on Heroku.`
      );
      console.error(
        `[EnsureGitInstalled] 💡 Ensure install-git-binary.sh copies git to /app/bin/git during build.`
      );
      return { available: false, error: 'Git not available in /app/bin or PATH' };
    }
    
    // On local development, provide helpful error message
    console.error(
      `[EnsureGitInstalled] ❌ Git is not installed. Please install git locally before running.`
    );
    return { available: false, error: 'Git not available' };
  }
}

/**
 * Initialize git at startup
 */
export function ensureGitReady(): void {
  const result = checkGitInstallation();
  if (result.available) {
    console.log('[EnsureGitInstalled] ✅ Git is ready for repository operations');
  } else {
    console.warn(
      `[EnsureGitInstalled] ⚠️ Git is not available. Repository operations will use API-only mode.`
    );
    console.log('[EnsureGitInstalled] 💡 This is OK - the system will fall back to GitHub API for file operations.');
  }
}

/**
 * Initialize git on startup (call this from server.ts)
 */
export async function initializeGit(): Promise<void> {
  console.log('[EnsureGitInstalled] Initializing git...');
  ensureGitReady();
}

/**
 * Execute a git command with proper environment setup
 * Useful for other parts of the codebase that need to run git
 */
export function execGitCommand(args: string[], cwd: string = process.cwd()): string {
  try {
    const command = `git ${args.join(' ')}`;
    const result = execSync(command, {
      cwd,
      encoding: 'utf-8',
      env: getGitEnv(),
      maxBuffer: 10 * 1024 * 1024,
    });
    return result;
  } catch (error: any) {
    console.error(`[EnsureGitInstalled] Git command failed: ${error.message}`);
    throw error;
  }
}


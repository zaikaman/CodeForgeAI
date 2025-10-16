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
 * Check and install git if needed
 */
function checkGitInstallation(): { available: boolean; version?: string; error?: string } {
  const isHeroku = process.env.HEROKU_APP_NAME || process.env.DYNO;
  
  // Priority 1: On Heroku, check /app/bin/git first (from slug)
  if (isHeroku) {
    try {
      const version = execSync('/app/bin/git --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
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


/**
 * Ensure Git is installed on Heroku
 * 
 * Heroku buildpacks don't always include git, so we install it at runtime
 * This runs once during server initialization
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
  try {
    const version = execSync('git --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    console.log(`[EnsureGitInstalled] ✅ Git is available: ${version}`);
    try {
      const location = execSync('which git', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      console.log(`[EnsureGitInstalled] 📍 Git location: ${location}`);
    } catch {
      // which command might not be available, that's ok
    }
    return { available: true, version };
  } catch (error: any) {
    console.warn(`[EnsureGitInstalled] ⚠️ Git not found in PATH: ${error.message}`);
    console.log(`[EnsureGitInstalled] 📦 Attempting to install git...`);

    const isHeroku = process.env.HEROKU_APP_NAME || process.env.DYNO;
    if (!isHeroku) {
      console.error(
        `[EnsureGitInstalled] ❌ Not running on Heroku and git is missing. Please install git locally.`
      );
      return { available: false, error: 'Git not available' };
    }

    // Try to install git on Heroku (Linux-based)
    try {
      console.log('[EnsureGitInstalled] 🔄 Running apt-get update...');
      execSync('apt-get update -qq', { stdio: 'ignore' });
      
      console.log('[EnsureGitInstalled] 🔄 Installing git via apt-get...');
      execSync('apt-get install -y -qq git', { stdio: 'pipe' });
      
      const version = execSync('git --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      console.log(`[EnsureGitInstalled] ✅ Git installed successfully: ${version}`);
      
      // Configure git for safe use in container
      try {
        execSync('git config --global --add safe.directory /tmp', { stdio: 'ignore' });
        execSync('git config --global --add safe.directory /app', { stdio: 'ignore' });
        console.log('[EnsureGitInstalled] ✓ Git global config updated');
      } catch (configError) {
        console.warn('[EnsureGitInstalled] ⚠️ Could not configure git globally');
      }
      
      return { available: true, version };
    } catch (installError: any) {
      console.error(`[EnsureGitInstalled] ❌ Failed to install git: ${installError.message}`);
      
      // Check if git is available despite the error
      try {
        const version = execSync('git --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
        console.log(`[EnsureGitInstalled] ℹ️ Git is available after installation attempt: ${version}`);
        return { available: true, version };
      } catch {
        console.error(`[EnsureGitInstalled] ❌ Git installation failed and git is not available`);
        return { available: false, error: installError.message };
      }
    }
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


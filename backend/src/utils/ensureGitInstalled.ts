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
    const version = execSync('git --version', { encoding: 'utf-8' }).trim();
    console.log(`[EnsureGitInstalled] ✅ Git is available: ${version}`);
    return { available: true, version };
  } catch (error: any) {
    console.warn(`[EnsureGitInstalled] ⚠️ Git not found: ${error.message}`);
    console.log(`[EnsureGitInstalled] 📦 Attempting to install git...`);

    const isHeroku = process.env.HEROKU_APP_NAME || process.env.DYNO;
    if (!isHeroku) {
      console.error(
        `[EnsureGitInstalled] ❌ Not running on Heroku and git is missing. Please install git locally.`
      );
      return { available: false, error: 'Git not available' };
    }

    // Try to install git using apt-get
    try {
      console.log(`[EnsureGitInstalled] Running: apt-get update && apt-get install -y git`);
      execSync('apt-get update && apt-get install -y git', {
        encoding: 'utf-8',
        stdio: 'inherit', // Show installation output
      });

      // Verify installation
      const version = execSync('git --version', { encoding: 'utf-8' }).trim();
      console.log(`[EnsureGitInstalled] ✅ Git installed successfully: ${version}`);
      return { available: true, version };
    } catch (installError: any) {
      console.error(
        `[EnsureGitInstalled] ❌ Failed to install git: ${installError.message}`
      );
      console.error(
        `[EnsureGitInstalled] 💡 Tip: Consider adding git to your Heroku buildpack`
      );
      return { available: false, error: installError.message };
    }
  }
}

/**
 * Initialize git on startup (call this from server.ts)
 */
export async function initializeGit(): Promise<void> {
  console.log('[EnsureGitInstalled] Initializing git...');

  const available = isGitAvailable();

  if (available) {
    console.log(`[EnsureGitInstalled] ✅ Git is ready for repository operations`);
  } else {
    console.error(
      `[EnsureGitInstalled] ❌ Git could not be installed. Cache will use API-only fallback mode.`
    );
  }
}

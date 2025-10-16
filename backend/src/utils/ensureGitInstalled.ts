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

    // Try apt-get (Debian/Ubuntu-based systems)
    try {
      console.log(`[EnsureGitInstalled] Attempting apt-get install...`);
      
      // First try to update (may fail silently in some Heroku environments)
      try {
        execSync('apt-get update', { 
          encoding: 'utf-8', 
          stdio: 'pipe',
          timeout: 30000,
        });
      } catch (e) {
        console.warn(`[EnsureGitInstalled] apt-get update skipped (may not be available)`);
      }

      // Install git
      execSync('apt-get install -y git', {
        encoding: 'utf-8',
        stdio: 'inherit',
        timeout: 60000,
      });

      // Verify installation
      const version = execSync('git --version', { encoding: 'utf-8' }).trim();
      console.log(`[EnsureGitInstalled] ✅ Git installed successfully: ${version}`);
      return { available: true, version };
    } catch (aptError: any) {
      console.error(`[EnsureGitInstalled] ❌ apt-get installation failed: ${aptError.message}`);
      
      // Try yum (RedHat/CentOS-based systems) as fallback
      try {
        console.log(`[EnsureGitInstalled] Attempting yum install as fallback...`);
        execSync('yum install -y git', {
          encoding: 'utf-8',
          stdio: 'inherit',
          timeout: 60000,
        });

        const version = execSync('git --version', { encoding: 'utf-8' }).trim();
        console.log(`[EnsureGitInstalled] ✅ Git installed via yum: ${version}`);
        return { available: true, version };
      } catch (yumError: any) {
        console.error(`[EnsureGitInstalled] ❌ yum installation also failed`);
        console.error(`[EnsureGitInstalled] 💡 Solution options:`);
        console.error(`[EnsureGitInstalled]   1. Add Heroku apt-buildpack via: heroku buildpacks:add https://github.com/heroku-community/apt-buildpack`);
        console.error(`[EnsureGitInstalled]   2. Add Aptfile with 'git' in backend folder`);
        console.error(`[EnsureGitInstalled]   3. Use buildpacks config: .buildpacks file`);
        
        return { available: false, error: 'Could not install git via apt or yum' };
      }
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
    console.error(`[EnsureGitInstalled] 💡 Performance will be slower, but operations will still work.`);
  }
}


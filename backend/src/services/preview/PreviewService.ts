import { spawn } from 'child_process';
import tmp from 'tmp';
import fs from 'fs';
import path from 'path';

export interface IPreviewService {
  generatePreview(generationId: string, files: Array<{ path: string; content: string }>): Promise<{ previewUrl: string }>;
}

export class PreviewService implements IPreviewService {
  private flyApiToken: string;

  constructor() {
    if (!process.env.FLY_API_TOKEN) {
      throw new Error('FLY_API_TOKEN environment variable is not set.');
    }
    this.flyApiToken = process.env.FLY_API_TOKEN;
  }

  async generatePreview(generationId: string, files: Array<{ path: string; content: string }>): Promise<{ previewUrl: string }> {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true });
    const appName = `preview-${generationId.replace(/_/g, "-")}`.toLowerCase();

    try {
      // 1. Write files to temp directory
      for (const file of files) {
        const filePath = path.join(tmpDir.name, file.path);
        const dirName = path.dirname(filePath);
        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }
        fs.writeFileSync(filePath, file.content);
      }

      // 2. Create Dockerfile
      const dockerfileContent = this.createDockerfile();
      fs.writeFileSync(path.join(tmpDir.name, 'Dockerfile'), dockerfileContent);

      // 3. Create a fly.toml file
      const flyTomlContent = this.createFlyToml(appName);
      fs.writeFileSync(path.join(tmpDir.name, 'fly.toml'), flyTomlContent);

      // 4. Deploy using flyctl
      await this.deployWithFlyctl(tmpDir.name, appName);

      return { previewUrl: `https://${appName}.fly.dev` };

    } finally {
      tmpDir.removeCallback();
    }
  }

  private runCommand(command: string, args: string[], workDir: string): Promise<{ code: number | null, stdout: string, stderr: string }> {
    return new Promise((resolve) => {
        const child = spawn(command, args, {
            cwd: workDir,
            env: { ...process.env, FLY_API_TOKEN: this.flyApiToken },
            shell: true
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`${command} stdout: ${output}`);
            stdout += output;
        });

        child.stderr.on('data', (data) => {
            const output = data.toString();
            console.error(`${command} stderr: ${output}`);
            stderr += output;
        });

        child.on('close', (code) => {
            resolve({ code, stdout, stderr });
        });
    });
  }

  private async deployWithFlyctl(workDir: string, appName: string): Promise<void> {
    const createResult = await this.runCommand('flyctl', ['apps', 'create', appName, '--org', 'personal'], workDir);

    if (createResult.code !== 0 && !createResult.stderr.includes('already exists')) {
        throw new Error(`flyctl apps create failed with code ${createResult.code}: ${createResult.stderr}`);
    }

    const deployResult = await this.runCommand('flyctl', ['deploy', '--remote-only'], workDir);

    if (deployResult.code !== 0) {
        throw new Error(`flyctl deploy failed with code ${deployResult.code}: ${deployResult.stderr}`);
    }
  }

  private createDockerfile(): string {
    return `
      # Stage 1: Build the application
      FROM node:18-alpine AS build
      WORKDIR /app
      COPY . .
      RUN yarn install --frozen-lockfile
      RUN yarn build

      # Stage 2: Serve the application with Nginx
      FROM nginx:1.21-alpine
      COPY --from=build /app/dist /usr/share/nginx/html
      EXPOSE 80
      CMD ["nginx", "-g", "daemon off;"]
    `;
  }

  private createFlyToml(appName: string): string {
    return `
      app = "${appName}"
      primary_region = "sjc"

      [build]
        dockerfile = "Dockerfile"

      [http_service]
        internal_port = 80
        force_https = true
        auto_stop_machines = true
        auto_start_machines = true
        min_machines_running = 0
    `;
  }
}


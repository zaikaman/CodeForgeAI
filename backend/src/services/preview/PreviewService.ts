import Docker from 'dockerode';
import tmp from 'tmp';
import fs from 'fs';
import path from 'path';

const FLY_API_URL = 'https://api.fly.io/graphql';

export interface IPreviewService {
  generatePreview(generationId: string, files: Array<{ path: string; content: string }>): Promise<{ previewUrl: string }>;
}

export class PreviewService implements IPreviewService {
  private docker: Docker;
  private flyApiToken: string;
  private dockerHubUsername: string;
  private dockerHubToken: string;

  constructor() {
    this.docker = new Docker();
    if (!process.env.FLY_API_TOKEN) {
      throw new Error('FLY_API_TOKEN environment variable is not set.');
    }
    if (!process.env.DOCKER_HUB_USERNAME) {
      throw new Error('DOCKER_HUB_USERNAME environment variable is not set.');
    }
    if (!process.env.DOCKER_HUB_TOKEN) {
      throw new Error('DOCKER_HUB_TOKEN environment variable is not set.');
    }
    this.flyApiToken = process.env.FLY_API_TOKEN;
    this.dockerHubUsername = process.env.DOCKER_HUB_USERNAME;
    this.dockerHubToken = process.env.DOCKER_HUB_TOKEN;
  }

  async generatePreview(generationId: string, files: Array<{ path: string; content: string }>): Promise<{ previewUrl: string }> {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true });
    const imageName = `preview-${generationId}`.toLowerCase();
    const repositoryName = `${this.dockerHubUsername}/${imageName}`;

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

      // 3. Build and push the image
      const publicImageUrl = await this.buildAndPushImage(tmpDir.name, repositoryName);

      // 4. Deploy to Fly.io
      const previewUrl = await this.deployToFly(generationId, publicImageUrl);
      return { previewUrl };

    } finally {
      tmpDir.removeCallback();
    }
  }

  private async buildAndPushImage(buildContext: string, repositoryName: string): Promise<string> {
    // 1. Build the image
    const stream = await this.docker.buildImage({ context: buildContext, src: fs.readdirSync(buildContext) }, { t: repositoryName });
    await new Promise((resolve, reject) => {
      this.docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
    });

    // 2. Push the image
    const image = this.docker.getImage(repositoryName);
    const pushStream = await image.push({ authconfig: { username: this.dockerHubUsername, password: this.dockerHubToken } });
    await new Promise((resolve, reject) => {
      this.docker.modem.followProgress(pushStream, (err, res) => err ? reject(err) : resolve(res));
    });

    return `${repositoryName}:latest`;
  }

  private async deployToFly(generationId: string, imageUrl: string): Promise<string> {
    const appName = `preview-${generationId}`.toLowerCase();

    // 1. Check if app exists, create if not
    let app = await this.findFlyApp(appName);
    if (!app) {
      app = await this.createFlyApp(appName);
    }

    // 2. Deploy the image
    await this.deployFlyImage(appName, imageUrl);

    // 3. Return the app's URL
    return `https://${appName}.fly.dev`;
  }

  private async findFlyApp(appName: string): Promise<any> {
    const query = `query($name: String!) { app(name: $name) { id name } }`;
    const response = await this.flyApiRequest(query, { name: appName });
    return response.data.app;
  }

  private async createFlyApp(appName: string): Promise<any> {
    const mutation = `mutation($input: CreateAppInput!) { createApp(input: $input) { app { id name } } }`;
    const orgId = await this.getPrimaryOrganizationId(); 
    const variables = { input: { name: appName, organizationId: orgId } };
    const response = await this.flyApiRequest(mutation, variables);
    return response.data.createApp.app;
  }

  private async getPrimaryOrganizationId(): Promise<string> {
    const query = `query { organizations { nodes { id name } } }`;
    const response = await this.flyApiRequest(query);
    return response.data.organizations.nodes[0].id;
  }

  private async deployFlyImage(appName: string, imageUrl: string): Promise<void> {
    const mutation = `mutation($input: DeployImageInput!) { deployImage(input: $input) { release { id version } } }`;
    const variables = { input: { appId: appName, image: imageUrl, strategy: 'CANARY' } };
    await this.flyApiRequest(mutation, variables);
  }

  private async flyApiRequest(query: string, variables: object = {}): Promise<any> {
    const response = await fetch(FLY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.flyApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Fly.io API request failed: ${response.status} ${errorBody}`);
    }

    return response.json();
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
}


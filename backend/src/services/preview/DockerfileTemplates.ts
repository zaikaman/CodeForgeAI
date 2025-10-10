/**
 * Dockerfile templates for different programming languages
 */

export type SupportedLanguage = 'typescript' | 'javascript' | 'python' | 'unknown';

/**
 * Detect primary programming language from files
 */
export function detectLanguageFromFiles(files: Array<{ path: string; content: string }>): SupportedLanguage {
  const extensionCounts: Record<string, number> = {};
  
  // Count file extensions
  files.forEach(file => {
    const ext = file.path.split('.').pop()?.toLowerCase() || '';
    extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
  });

  // Check for specific configuration files that indicate language
  const hasPackageJson = files.some(f => f.path === 'package.json' || f.path.endsWith('/package.json'));
  const hasRequirementsTxt = files.some(f => f.path === 'requirements.txt' || f.path.endsWith('/requirements.txt'));
  const hasPyprojectToml = files.some(f => f.path === 'pyproject.toml' || f.path.endsWith('/pyproject.toml'));
  
  // Python indicators
  const pythonFileCount = (extensionCounts['py'] || 0);
  
  // TypeScript/JavaScript indicators
  const tsFileCount = (extensionCounts['ts'] || 0) + (extensionCounts['tsx'] || 0);
  const jsFileCount = (extensionCounts['js'] || 0) + (extensionCounts['jsx'] || 0);
  const nodeFileCount = tsFileCount + jsFileCount;

  // Decision logic
  if (hasPyprojectToml || hasRequirementsTxt || (pythonFileCount > 0 && !hasPackageJson)) {
    console.log(`Detected Python project (${pythonFileCount} .py files)`);
    return 'python';
  }
  
  if (hasPackageJson || nodeFileCount > 0) {
    if (tsFileCount > jsFileCount) {
      console.log(`Detected TypeScript project (${tsFileCount} .ts files)`);
      return 'typescript';
    }
    console.log(`Detected JavaScript project (${jsFileCount} .js files)`);
    return 'javascript';
  }

  // Fallback: check which has more files
  if (pythonFileCount > nodeFileCount) {
    console.log(`Detected Python project by file count (${pythonFileCount} .py files)`);
    return 'python';
  } else if (nodeFileCount > 0) {
    console.log(`Detected JavaScript/TypeScript project by file count (${nodeFileCount} files)`);
    return tsFileCount > jsFileCount ? 'typescript' : 'javascript';
  }

  console.warn('Could not detect language from files, defaulting to TypeScript');
  return 'unknown';
}

/**
 * Create Dockerfile for Node.js/TypeScript/JavaScript projects
 */
export function createNodeDockerfile(): string {
  return `# Stage 1: Build the application
FROM node:18-alpine AS build
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile || npm install
RUN yarn build || npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.21-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
}

/**
 * Create Dockerfile for Python projects
 */
export function createPythonDockerfile(): string {
  return `# Python application Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Expose port (default 8080 for Python web apps)
EXPOSE 8080

# Run the application
# Try common Python entry points and web servers
CMD if [ -f "main.py" ]; then \\
        python main.py; \\
    elif [ -f "app.py" ]; then \\
        # Check if app.py uses argparse with serve command
        if grep -q "argparse\\|ArgumentParser" app.py && grep -q "serve" app.py; then \\
            python app.py serve; \\
        # Try different ways to run Flask/FastAPI apps
        elif grep -q "Flask" app.py; then \\
            python app.py; \\
        elif grep -q "FastAPI" app.py; then \\
            uvicorn app:app --host 0.0.0.0 --port 8080 || python app.py; \\
        else \\
            python app.py; \\
        fi; \\
    elif [ -f "server.py" ]; then \\
        python server.py; \\
    elif [ -f "wsgi.py" ]; then \\
        gunicorn wsgi:app --bind 0.0.0.0:8080; \\
    else \\
        echo "No entry point found (main.py, app.py, server.py). Starting Python shell..."; \\
        python -c "print('Please add main.py or app.py with a web server')"; \\
        tail -f /dev/null; \\
    fi
`;
}

/**
 * Get Dockerfile content based on detected language
 */
export function getDockerfileForLanguage(language: SupportedLanguage): string {
  switch (language) {
    case 'python':
      return createPythonDockerfile();
    case 'typescript':
    case 'javascript':
      return createNodeDockerfile();
    case 'unknown':
    default:
      console.warn('Unknown language, using Node.js Dockerfile as fallback');
      return createNodeDockerfile();
  }
}

/**
 * Detect language and generate appropriate Dockerfile
 */
export function generateDockerfile(files: Array<{ path: string; content: string }>): string {
  const language = detectLanguageFromFiles(files);
  return getDockerfileForLanguage(language);
}

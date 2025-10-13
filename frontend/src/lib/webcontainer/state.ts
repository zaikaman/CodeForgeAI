import type { WebContainerProcess } from '@webcontainer/api';

/**
 * WebContainer state manager to prevent redundant initialization
 */
export class WebContainerState {
  private static instance: WebContainerState;
  
  private mounted: boolean = false;
  private installed: boolean = false;
  private serverProcess: WebContainerProcess | null = null;
  private serverUrl: string | null = null;
  private currentFilesHash: string | null = null;
  private refreshCallbacks: Array<() => void> = [];

  private constructor() {}

  static getInstance(): WebContainerState {
    if (!WebContainerState.instance) {
      WebContainerState.instance = new WebContainerState();
    }
    return WebContainerState.instance;
  }

  isMounted(): boolean {
    return this.mounted;
  }

  setMounted(value: boolean): void {
    this.mounted = value;
  }

  isInstalled(): boolean {
    return this.installed;
  }

  setInstalled(value: boolean): void {
    this.installed = value;
  }

  getServerProcess(): WebContainerProcess | null {
    return this.serverProcess;
  }

  setServerProcess(process: WebContainerProcess | null): void {
    this.serverProcess = process;
  }

  getServerUrl(): string | null {
    return this.serverUrl;
  }

  setServerUrl(url: string | null): void {
    this.serverUrl = url;
  }

  getCurrentFilesHash(): string | null {
    return this.currentFilesHash;
  }

  setCurrentFilesHash(hash: string): void {
    this.currentFilesHash = hash;
  }

  isServerRunning(): boolean {
    return this.serverProcess !== null && this.serverUrl !== null;
  }

  async stopServer(): Promise<void> {
    if (this.serverProcess) {
      try {
        this.serverProcess.kill();
        console.log('[WebContainerState] Server process killed');
      } catch (error) {
        console.error('[WebContainerState] Error killing server:', error);
      }
      this.serverProcess = null;
      this.serverUrl = null;
    }
  }

  async reset(): Promise<void> {
    await this.stopServer();
    this.mounted = false;
    this.installed = false;
    this.currentFilesHash = null;
    console.log('[WebContainerState] State reset');
  }

  /**
   * Register a callback to be called when refresh is needed
   */
  onRefresh(callback: () => void): () => void {
    this.refreshCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
      const index = this.refreshCallbacks.indexOf(callback);
      if (index > -1) {
        this.refreshCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Trigger all registered refresh callbacks
   */
  triggerRefresh(): void {
    console.log('[WebContainerState] Triggering refresh callbacks:', this.refreshCallbacks.length);
    this.refreshCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[WebContainerState] Error in refresh callback:', error);
      }
    });
  }
}

export const webcontainerState = WebContainerState.getInstance();

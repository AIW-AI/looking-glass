/**
 * Transport Layer - Abstractions for MCP communication
 *
 * Supports multiple transport mechanisms:
 * - HTTP+SSE (primary for web)
 * - WebSocket (full duplex)
 * - Embedded (in-process for testing)
 */

import type { Transport, Notification, TransportConfig } from '../types/index.js';

// ============================================================================
// Base Transport
// ============================================================================

export abstract class BaseTransport implements Transport {
  protected toolCallHandler?: (tool: string, params: unknown) => Promise<unknown>;
  protected resourceReadHandler?: (uri: string) => Promise<unknown>;
  protected connected = false;

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract sendNotification(notification: Notification): void;

  onToolCall(handler: (tool: string, params: unknown) => Promise<unknown>): void {
    this.toolCallHandler = handler;
  }

  onResourceRead(handler: (uri: string) => Promise<unknown>): void {
    this.resourceReadHandler = handler;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// ============================================================================
// HTTP+SSE Transport
// ============================================================================

export interface HttpSseTransportOptions {
  baseUrl: string;
  endpoints?: {
    tools?: string;
    resources?: string;
    notifications?: string;
  };
  headers?: Record<string, string>;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class HttpSseTransport extends BaseTransport {
  private options: HttpSseTransportOptions;
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;

  constructor(options: HttpSseTransportOptions) {
    super();
    this.options = {
      endpoints: {
        tools: '/mcp/tools',
        resources: '/mcp/resources',
        notifications: '/mcp/notifications',
      },
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...options,
    };
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    const notificationsUrl = `${this.options.baseUrl}${this.options.endpoints!.notifications}`;

    return new Promise((resolve, reject) => {
      this.eventSource = new EventSource(notificationsUrl);

      this.eventSource.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        console.log('[Transport] SSE connected');
        resolve();
      };

      this.eventSource.onerror = (error) => {
        console.error('[Transport] SSE error:', error);

        if (this.connected) {
          // Try to reconnect
          this.connected = false;
          this.reconnect();
        } else {
          reject(new Error('Failed to connect SSE'));
        }
      };

      // Handle incoming notifications
      this.eventSource.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          console.log('[Transport] Received notification:', notification);
        } catch (error) {
          console.error('[Transport] Failed to parse notification:', error);
        }
      };

      // Handle tool call requests from server (for bidirectional control)
      this.eventSource.addEventListener('tool_call', async (event) => {
        if (!this.toolCallHandler) return;

        try {
          const { id, tool, params } = JSON.parse((event as MessageEvent).data);
          const result = await this.toolCallHandler(tool, params);

          // Send result back
          await this.sendToolResult(id, result);
        } catch (error) {
          console.error('[Transport] Tool call handling error:', error);
        }
      });

      // Handle resource read requests from server
      this.eventSource.addEventListener('resource_read', async (event) => {
        if (!this.resourceReadHandler) return;

        try {
          const { id, uri } = JSON.parse((event as MessageEvent).data);
          const result = await this.resourceReadHandler(uri);

          // Send result back
          await this.sendResourceResult(id, result);
        } catch (error) {
          console.error('[Transport] Resource read handling error:', error);
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.connected = false;
    console.log('[Transport] Disconnected');
  }

  sendNotification(notification: Notification): void {
    // For HTTP+SSE, notifications are typically sent via POST
    fetch(`${this.options.baseUrl}${this.options.endpoints!.notifications}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.options.headers,
      },
      body: JSON.stringify(notification),
    }).catch((error) => {
      console.error('[Transport] Failed to send notification:', error);
    });
  }

  /**
   * Call a tool on the remote server (client → server direction)
   */
  async callTool(tool: string, params: unknown): Promise<unknown> {
    const response = await fetch(`${this.options.baseUrl}${this.options.endpoints!.tools}/${tool}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.options.headers,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Tool call failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Read a resource from the remote server
   */
  async readResource(uri: string): Promise<unknown> {
    const response = await fetch(
      `${this.options.baseUrl}${this.options.endpoints!.resources}?uri=${encodeURIComponent(uri)}`,
      {
        headers: this.options.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Resource read failed: ${response.statusText}`);
    }

    return response.json();
  }

  private async sendToolResult(id: string, result: unknown): Promise<void> {
    await fetch(`${this.options.baseUrl}${this.options.endpoints!.tools}/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.options.headers,
      },
      body: JSON.stringify({ id, result }),
    });
  }

  private async sendResourceResult(id: string, result: unknown): Promise<void> {
    await fetch(`${this.options.baseUrl}${this.options.endpoints!.resources}/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.options.headers,
      },
      body: JSON.stringify({ id, result }),
    });
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts!) {
      console.error('[Transport] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[Transport] Reconnecting (attempt ${this.reconnectAttempts})...`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[Transport] Reconnect failed:', error);
      });
    }, this.options.reconnectInterval);
  }
}

// ============================================================================
// WebSocket Transport
// ============================================================================

export interface WebSocketTransportOptions {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketTransport extends BaseTransport {
  private options: WebSocketTransportOptions;
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private pendingRequests = new Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  private requestCounter = 0;

  constructor(options: WebSocketTransportOptions) {
    super();
    this.options = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...options,
    };
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.options.url, this.options.protocols);

      this.socket.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        console.log('[Transport] WebSocket connected');
        resolve();
      };

      this.socket.onerror = (error) => {
        console.error('[Transport] WebSocket error:', error);
        if (!this.connected) {
          reject(new Error('Failed to connect WebSocket'));
        }
      };

      this.socket.onclose = () => {
        if (this.connected) {
          this.connected = false;
          this.reconnect();
        }
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    });
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
    this.pendingRequests.clear();
    console.log('[Transport] Disconnected');
  }

  sendNotification(notification: Notification): void {
    this.send({ type: 'notification', data: notification });
  }

  /**
   * Call a tool via WebSocket
   */
  async callTool(tool: string, params: unknown): Promise<unknown> {
    return this.request('tool_call', { tool, params });
  }

  /**
   * Read a resource via WebSocket
   */
  async readResource(uri: string): Promise<unknown> {
    return this.request('resource_read', { uri });
  }

  private send(message: unknown): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('[Transport] Cannot send: not connected');
      return;
    }

    this.socket.send(JSON.stringify(message));
  }

  private async request(type: string, data: unknown): Promise<unknown> {
    const id = `req_${++this.requestCounter}`;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      this.send({ type, id, data });

      // Timeout after 30 seconds
      setTimeout(() => {
        const pending = this.pendingRequests.get(id);
        if (pending) {
          this.pendingRequests.delete(id);
          pending.reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'response':
          this.handleResponse(message);
          break;

        case 'tool_call':
          this.handleToolCall(message);
          break;

        case 'resource_read':
          this.handleResourceRead(message);
          break;

        case 'notification':
          console.log('[Transport] Received notification:', message.data);
          break;

        default:
          console.warn('[Transport] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[Transport] Failed to handle message:', error);
    }
  }

  private handleResponse(message: { id: string; result?: unknown; error?: string }): void {
    const pending = this.pendingRequests.get(message.id);
    if (!pending) return;

    this.pendingRequests.delete(message.id);

    if (message.error) {
      pending.reject(new Error(message.error));
    } else {
      pending.resolve(message.result);
    }
  }

  private async handleToolCall(message: { id: string; data: { tool: string; params: unknown } }): Promise<void> {
    if (!this.toolCallHandler) {
      this.send({ type: 'response', id: message.id, error: 'No tool handler registered' });
      return;
    }

    try {
      const result = await this.toolCallHandler(message.data.tool, message.data.params);
      this.send({ type: 'response', id: message.id, result });
    } catch (error) {
      this.send({ type: 'response', id: message.id, error: String(error) });
    }
  }

  private async handleResourceRead(message: { id: string; data: { uri: string } }): Promise<void> {
    if (!this.resourceReadHandler) {
      this.send({ type: 'response', id: message.id, error: 'No resource handler registered' });
      return;
    }

    try {
      const result = await this.resourceReadHandler(message.data.uri);
      this.send({ type: 'response', id: message.id, result });
    } catch (error) {
      this.send({ type: 'response', id: message.id, error: String(error) });
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts!) {
      console.error('[Transport] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[Transport] Reconnecting (attempt ${this.reconnectAttempts})...`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[Transport] Reconnect failed:', error);
      });
    }, this.options.reconnectInterval);
  }
}

// ============================================================================
// Embedded Transport (for testing and in-process use)
// ============================================================================

export class EmbeddedTransport extends BaseTransport {
  private notificationListeners: Array<(notification: Notification) => void> = [];

  async connect(): Promise<void> {
    this.connected = true;
    console.log('[Transport] Embedded transport connected');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.notificationListeners = [];
    console.log('[Transport] Embedded transport disconnected');
  }

  sendNotification(notification: Notification): void {
    for (const listener of this.notificationListeners) {
      listener(notification);
    }
  }

  /**
   * Add a notification listener
   */
  onNotification(listener: (notification: Notification) => void): () => void {
    this.notificationListeners.push(listener);
    return () => {
      this.notificationListeners = this.notificationListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Simulate a tool call (for testing)
   */
  async simulateToolCall(tool: string, params: unknown): Promise<unknown> {
    if (!this.toolCallHandler) {
      throw new Error('No tool handler registered');
    }
    return this.toolCallHandler(tool, params);
  }

  /**
   * Simulate a resource read (for testing)
   */
  async simulateResourceRead(uri: string): Promise<unknown> {
    if (!this.resourceReadHandler) {
      throw new Error('No resource handler registered');
    }
    return this.resourceReadHandler(uri);
  }
}

// ============================================================================
// Transport Factory
// ============================================================================

export function createTransport(config: TransportConfig): Transport {
  switch (config.type) {
    case 'http-sse':
      if (!config.url) throw new Error('URL required for HTTP+SSE transport');
      return new HttpSseTransport({ baseUrl: config.url });

    case 'websocket':
      if (!config.url) throw new Error('URL required for WebSocket transport');
      return new WebSocketTransport({ url: config.url });

    case 'embedded':
      return new EmbeddedTransport();

    default:
      throw new Error(`Unknown transport type: ${config.type}`);
  }
}

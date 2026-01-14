/**
 * MCP Server Implementation for Looking Glass
 *
 * This is the core protocol layer that handles:
 * - Tool registration and dispatch
 * - Resource registration and retrieval
 * - Notification emission
 * - Subscription management
 */

import type {
  ToolDefinition,
  ToolHandler,
  ToolResult,
  ResourceDefinition,
  Notification,
  Transport,
} from '../types/index.js';
import { getEventBus, Events } from '../events/index.js';

// ============================================================================
// MCP Server
// ============================================================================

export interface MCPServerOptions {
  debug?: boolean;
}

export class MCPServer {
  private tools = new Map<string, ToolDefinition>();
  private resources = new Map<string, ResourceDefinition>();
  private resourceHandlers = new Map<string, (uri: string) => Promise<unknown>>();
  private transport: Transport | null = null;
  private debug: boolean;
  private eventBus = getEventBus();

  constructor(options: MCPServerOptions = {}) {
    this.debug = options.debug ?? false;
  }

  // --------------------------------------------------------------------------
  // Tool Management
  // --------------------------------------------------------------------------

  /**
   * Register a tool with the MCP server
   */
  registerTool(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      console.warn(`[MCP] Tool already registered: ${tool.name}, replacing`);
    }

    this.tools.set(tool.name, tool);

    if (this.debug) {
      console.log(`[MCP] Registered tool: ${tool.name}`);
    }
  }

  /**
   * Unregister a tool
   */
  unregisterTool(name: string): void {
    this.tools.delete(name);

    if (this.debug) {
      console.log(`[MCP] Unregistered tool: ${name}`);
    }
  }

  /**
   * Get a tool definition
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * List all registered tools
   */
  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Call a tool by name
   */
  async callTool(name: string, params: unknown): Promise<ToolResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${name}`,
      };
    }

    if (!tool.handler) {
      return {
        success: false,
        error: `Tool has no handler: ${name}`,
      };
    }

    this.eventBus.emit(Events.MCP_TOOL_CALL, { name, params });

    if (this.debug) {
      console.log(`[MCP] Calling tool: ${name}`, params);
    }

    try {
      const result = await tool.handler(params);
      this.eventBus.emit(Events.MCP_TOOL_RESULT, { name, params, result });
      return result;
    } catch (error) {
      const errorResult: ToolResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
      this.eventBus.emit(Events.MCP_TOOL_RESULT, { name, params, result: errorResult });
      return errorResult;
    }
  }

  // --------------------------------------------------------------------------
  // Resource Management
  // --------------------------------------------------------------------------

  /**
   * Register a resource
   */
  registerResource(resource: ResourceDefinition, handler: (uri: string) => Promise<unknown>): void {
    this.resources.set(resource.uri, resource);
    this.resourceHandlers.set(resource.uri, handler);

    if (this.debug) {
      console.log(`[MCP] Registered resource: ${resource.uri}`);
    }
  }

  /**
   * Unregister a resource
   */
  unregisterResource(uri: string): void {
    this.resources.delete(uri);
    this.resourceHandlers.delete(uri);

    if (this.debug) {
      console.log(`[MCP] Unregistered resource: ${uri}`);
    }
  }

  /**
   * List all registered resources
   */
  listResources(): ResourceDefinition[] {
    return Array.from(this.resources.values());
  }

  /**
   * Read a resource
   */
  async readResource(uri: string): Promise<unknown> {
    // Try exact match first
    let handler = this.resourceHandlers.get(uri);

    // Try prefix matching for dynamic URIs
    if (!handler) {
      for (const [pattern, h] of this.resourceHandlers) {
        if (uri.startsWith(pattern.replace(/\*$/, ''))) {
          handler = h;
          break;
        }
      }
    }

    if (!handler) {
      throw new Error(`Resource not found: ${uri}`);
    }

    this.eventBus.emit(Events.MCP_RESOURCE_READ, { uri });

    if (this.debug) {
      console.log(`[MCP] Reading resource: ${uri}`);
    }

    return handler(uri);
  }

  // --------------------------------------------------------------------------
  // Notifications
  // --------------------------------------------------------------------------

  /**
   * Emit a notification to connected clients
   */
  emit(notification: Notification): void {
    const enrichedNotification = {
      ...notification,
      timestamp: notification.timestamp ?? Date.now(),
    };

    this.eventBus.emit(Events.MCP_NOTIFICATION, enrichedNotification);

    if (this.transport) {
      this.transport.sendNotification(enrichedNotification);
    }

    if (this.debug) {
      console.log(`[MCP] Emitted notification: ${notification.type}`, notification.data);
    }
  }

  // --------------------------------------------------------------------------
  // Transport Management
  // --------------------------------------------------------------------------

  /**
   * Set the transport layer
   */
  setTransport(transport: Transport): void {
    this.transport = transport;

    // Wire up transport to MCP
    transport.onToolCall(async (tool: string, params: unknown) => {
      return this.callTool(tool, params);
    });

    transport.onResourceRead(async (uri: string) => {
      return this.readResource(uri);
    });
  }

  /**
   * Get the current transport
   */
  getTransport(): Transport | null {
    return this.transport;
  }

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  /**
   * Start the MCP server with the configured transport
   */
  async start(): Promise<void> {
    if (!this.transport) {
      throw new Error('No transport configured');
    }

    await this.transport.connect();
    this.eventBus.emit(Events.MCP_CONNECTED, {});

    if (this.debug) {
      console.log('[MCP] Server started');
    }
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    if (this.transport) {
      await this.transport.disconnect();
    }

    this.eventBus.emit(Events.MCP_DISCONNECTED, {});

    if (this.debug) {
      console.log('[MCP] Server stopped');
    }
  }

  /**
   * Get server info for protocol negotiation
   */
  getServerInfo(): MCPServerInfo {
    return {
      name: 'looking-glass',
      version: '0.1.0',
      capabilities: {
        tools: this.listTools().map((t) => ({ name: t.name, description: t.description })),
        resources: this.listResources().map((r) => ({ uri: r.uri, name: r.name })),
      },
    };
  }
}

export interface MCPServerInfo {
  name: string;
  version: string;
  capabilities: {
    tools: Array<{ name: string; description: string }>;
    resources: Array<{ uri: string; name: string }>;
  };
}

// ============================================================================
// Tool Builder Helper
// ============================================================================

export class ToolBuilder {
  private tool: Partial<ToolDefinition> = {};

  name(name: string): this {
    this.tool.name = name;
    return this;
  }

  description(description: string): this {
    this.tool.description = description;
    return this;
  }

  input(schema: ToolDefinition['inputSchema']): this {
    this.tool.inputSchema = schema;
    return this;
  }

  handler(handler: ToolHandler): this {
    this.tool.handler = handler;
    return this;
  }

  build(): ToolDefinition {
    if (!this.tool.name) throw new Error('Tool name is required');
    if (!this.tool.description) throw new Error('Tool description is required');
    if (!this.tool.inputSchema) {
      this.tool.inputSchema = { type: 'object', properties: {} };
    }

    return this.tool as ToolDefinition;
  }
}

export function defineTool(): ToolBuilder {
  return new ToolBuilder();
}

// ============================================================================
// Default Tools for Looking Glass
// ============================================================================

import { useLookingGlassStore } from '../state/index.js';

export function registerCoreTools(server: MCPServer): void {
  const store = useLookingGlassStore.getState();

  // ui.registerTheme
  server.registerTool(
    defineTool()
      .name('ui.registerTheme')
      .description('Register a new theme definition')
      .input({
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique theme identifier' },
          name: { type: 'string', description: 'Human-readable theme name' },
          description: { type: 'string', description: 'Theme description' },
          variables: {
            type: 'object',
            description: 'CSS custom properties map (e.g., {"--color-bg": "#000000"})',
          },
          meta: {
            type: 'object',
            description: 'Optional metadata',
            properties: {
              author: { type: 'string' },
              version: { type: 'string' },
              category: { type: 'string', enum: ['dark', 'light', 'high-contrast'] },
            },
          },
        },
        required: ['id', 'name', 'variables'],
      })
      .handler(async (params: unknown) => {
        const theme = params as { id: string; name: string; description?: string; variables: Record<string, string>; meta?: { author?: string; version?: string; category?: 'dark' | 'light' | 'high-contrast' } };
        useLookingGlassStore.getState().registerTheme(theme);
        return { success: true, data: { id: theme.id, name: theme.name } };
      })
      .build()
  );

  // ui.listThemes
  server.registerTool(
    defineTool()
      .name('ui.listThemes')
      .description('List all registered themes')
      .input({ type: 'object', properties: {} })
      .handler(async () => {
        const themes = useLookingGlassStore.getState().listThemes();
        return {
          success: true,
          data: {
            themes: themes.map((t) => ({
              id: t.id,
              name: t.name,
              description: t.description,
              category: t.meta?.category,
            })),
            activeTheme: useLookingGlassStore.getState().ui.theme,
          },
        };
      })
      .build()
  );

  // ui.setTheme
  server.registerTool(
    defineTool()
      .name('ui.setTheme')
      .description('Activate a registered theme by ID')
      .input({
        type: 'object',
        properties: {
          theme: { type: 'string', description: 'Theme ID to activate' },
        },
        required: ['theme'],
      })
      .handler(async (params: unknown) => {
        const { theme } = params as { theme: string };
        const themeObj = useLookingGlassStore.getState().getTheme(theme);
        if (!themeObj) {
          return { success: false, error: `Theme not found: ${theme}. Use ui.listThemes to see available themes.` };
        }
        useLookingGlassStore.getState().setTheme(theme);
        return { success: true, data: { theme, name: themeObj.name } };
      })
      .build()
  );

  // ui.showNotification
  server.registerTool(
    defineTool()
      .name('ui.showNotification')
      .description('Display a notification to the user')
      .input({
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Notification title' },
          message: { type: 'string', description: 'Notification message' },
          type: {
            type: 'string',
            enum: ['info', 'success', 'warning', 'error'],
            description: 'Notification type',
          },
          duration: { type: 'number', description: 'Auto-dismiss duration in ms (optional)' },
        },
        required: ['title', 'message', 'type'],
      })
      .handler(async (params: unknown) => {
        const notification = params as { title: string; message: string; type: 'info' | 'success' | 'warning' | 'error'; duration?: number };
        store.showNotification(notification);
        return { success: true };
      })
      .build()
  );

  // ui.setLayout
  server.registerTool(
    defineTool()
      .name('ui.setLayout')
      .description('Set the UI layout mode')
      .input({
        type: 'object',
        properties: {
          mode: {
            type: 'string',
            enum: ['chat', 'dashboard', 'split', 'focus'],
            description: 'Layout mode',
          },
        },
        required: ['mode'],
      })
      .handler(async (params: unknown) => {
        const { mode } = params as { mode: 'chat' | 'dashboard' | 'split' | 'focus' };
        store.setLayout(mode);
        return { success: true, data: { mode } };
      })
      .build()
  );

  // chat.addMessage
  server.registerTool(
    defineTool()
      .name('chat.addMessage')
      .description('Inject a message into the chat')
      .input({
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['user', 'assistant', 'system'], description: 'Message role' },
          content: { type: 'string', description: 'Message content' },
        },
        required: ['role', 'content'],
      })
      .handler(async (params: unknown) => {
        const message = params as { role: 'user' | 'assistant' | 'system'; content: string };
        store.addMessage(message);
        return { success: true };
      })
      .build()
  );

  // shell.configure
  server.registerTool(
    defineTool()
      .name('shell.configure')
      .description('Configure shell options')
      .input({
        type: 'object',
        properties: {
          header: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              logo: { type: 'string' },
              showNav: { type: 'boolean' },
            },
          },
          sidebar: {
            type: 'object',
            properties: {
              collapsed: { type: 'boolean' },
              width: { type: 'number' },
            },
          },
        },
      })
      .handler(async (params: unknown) => {
        store.configureShell(params as Parameters<typeof store.configureShell>[0]);
        return { success: true };
      })
      .build()
  );

  // shell.toggleSidebar
  server.registerTool(
    defineTool()
      .name('shell.toggleSidebar')
      .description('Toggle the sidebar visibility')
      .input({ type: 'object', properties: {} })
      .handler(async () => {
        store.toggleSidebar();
        return { success: true, data: { collapsed: useLookingGlassStore.getState().shell.sidebarCollapsed } };
      })
      .build()
  );

  // tabs.open
  server.registerTool(
    defineTool()
      .name('tabs.open')
      .description('Open a new tab')
      .input({
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Tab ID' },
          label: { type: 'string', description: 'Tab label' },
          icon: { type: 'string', description: 'Tab icon (optional)' },
          closable: { type: 'boolean', description: 'Whether tab can be closed', default: true },
          content: { type: 'string', description: 'Content identifier' },
        },
        required: ['id', 'label'],
      })
      .handler(async (params: unknown) => {
        const tab = params as { id: string; label: string; icon?: string; closable?: boolean; content?: string };
        store.openTab({ ...tab, closable: tab.closable ?? true });
        return { success: true };
      })
      .build()
  );

  // tabs.close
  server.registerTool(
    defineTool()
      .name('tabs.close')
      .description('Close a tab')
      .input({
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Tab ID to close' },
        },
        required: ['id'],
      })
      .handler(async (params: unknown) => {
        const { id } = params as { id: string };
        store.closeTab(id);
        return { success: true };
      })
      .build()
  );

  // tabs.activate
  server.registerTool(
    defineTool()
      .name('tabs.activate')
      .description('Activate a tab')
      .input({
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Tab ID to activate' },
        },
        required: ['id'],
      })
      .handler(async (params: unknown) => {
        const { id } = params as { id: string };
        store.activateTab(id);
        return { success: true };
      })
      .build()
  );
}

// ============================================================================
// Singleton
// ============================================================================

let globalMCPServer: MCPServer | null = null;

export function getMCPServer(options?: MCPServerOptions): MCPServer {
  if (!globalMCPServer) {
    globalMCPServer = new MCPServer(options);
  }
  return globalMCPServer;
}

export function resetMCPServer(): void {
  globalMCPServer = null;
}

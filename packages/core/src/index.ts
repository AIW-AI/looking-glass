/**
 * @looking-glass/core
 *
 * Core infrastructure for Looking Glass - the programmable chat UI.
 *
 * This package provides:
 * - MCP server implementation
 * - State management (Zustand)
 * - Event bus for internal communication
 * - Transport abstractions (HTTP+SSE, WebSocket, embedded)
 */

// Re-export all types
export * from './types/index.js';

// Re-export events
export * from './events/index.js';

// Re-export state
export * from './state/index.js';

// Re-export MCP
export * from './mcp/index.js';

// Re-export transports
export * from './transports/index.js';

// ============================================================================
// Main Entry Point
// ============================================================================

import type { CoreConfig } from './types/index.js';
import { MCPServer, getMCPServer, registerCoreTools } from './mcp/index.js';
import { useLookingGlassStore } from './state/index.js';
import { getEventBus } from './events/index.js';
import { createTransport } from './transports/index.js';

export interface LookingGlassInstance {
  // Core
  server: MCPServer;
  store: typeof useLookingGlassStore;
  eventBus: ReturnType<typeof getEventBus>;

  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;

  // State shortcuts
  getState(): ReturnType<typeof useLookingGlassStore.getState>;
}

/**
 * Create a Looking Glass instance
 */
export function createLookingGlass(config: CoreConfig): LookingGlassInstance {
  const server = getMCPServer({ debug: config.logLevel === 'debug' });
  const store = useLookingGlassStore;
  const eventBus = getEventBus({ debug: config.logLevel === 'debug' });

  // Create and configure transport
  const transport = createTransport(config.transport);
  server.setTransport(transport);

  // Register core tools
  registerCoreTools(server);

  // Apply default theme if provided
  if (config.theme) {
    store.getState().setTheme(config.theme);
  }

  return {
    server,
    store,
    eventBus,

    async start() {
      await server.start();

      // Emit ready event
      eventBus.emit('looking-glass:ready', {
        version: '0.1.0',
        config,
      });

      if (config.logLevel === 'debug' || config.logLevel === 'info') {
        console.log('[LookingGlass] Started');
        console.log(`[LookingGlass] Registered ${server.listTools().length} tools`);
        console.log(`[LookingGlass] Registered ${server.listResources().length} resources`);
      }
    },

    async stop() {
      await server.stop();
      eventBus.emit('looking-glass:stopped', {});

      if (config.logLevel === 'debug' || config.logLevel === 'info') {
        console.log('[LookingGlass] Stopped');
      }
    },

    getState() {
      return store.getState();
    },
  };
}

// ============================================================================
// Version
// ============================================================================

export const VERSION = '0.1.0';

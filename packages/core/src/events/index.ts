/**
 * Event Bus - Internal communication system for Looking Glass
 *
 * Provides pub/sub messaging between modules without tight coupling.
 */

export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

export interface EventBusOptions {
  debug?: boolean;
}

interface Subscription {
  id: string;
  handler: EventHandler;
  once: boolean;
}

export class EventBus {
  private subscriptions = new Map<string, Subscription[]>();
  private subscriptionCounter = 0;
  private debug: boolean;

  constructor(options: EventBusOptions = {}) {
    this.debug = options.debug ?? false;
  }

  /**
   * Subscribe to an event
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    return this.subscribe(event, handler as EventHandler, false);
  }

  /**
   * Subscribe to an event, but only fire once
   */
  once<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    return this.subscribe(event, handler as EventHandler, true);
  }

  /**
   * Emit an event
   */
  emit<T = unknown>(event: string, data?: T): void {
    if (this.debug) {
      console.log(`[EventBus] emit: ${event}`, data);
    }

    const subs = this.subscriptions.get(event);
    if (!subs) return;

    const toRemove: string[] = [];

    for (const sub of subs) {
      try {
        sub.handler(data);
        if (sub.once) {
          toRemove.push(sub.id);
        }
      } catch (error) {
        console.error(`[EventBus] Error in handler for ${event}:`, error);
      }
    }

    // Clean up once handlers
    if (toRemove.length > 0) {
      this.subscriptions.set(
        event,
        subs.filter((s) => !toRemove.includes(s.id))
      );
    }
  }

  /**
   * Emit an event and wait for all handlers to complete
   */
  async emitAsync<T = unknown>(event: string, data?: T): Promise<void> {
    if (this.debug) {
      console.log(`[EventBus] emitAsync: ${event}`, data);
    }

    const subs = this.subscriptions.get(event);
    if (!subs) return;

    const toRemove: string[] = [];

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await sub.handler(data);
          if (sub.once) {
            toRemove.push(sub.id);
          }
        } catch (error) {
          console.error(`[EventBus] Error in async handler for ${event}:`, error);
        }
      })
    );

    // Clean up once handlers
    if (toRemove.length > 0) {
      this.subscriptions.set(
        event,
        subs.filter((s) => !toRemove.includes(s.id))
      );
    }
  }

  /**
   * Remove all subscriptions for an event
   */
  off(event: string): void {
    this.subscriptions.delete(event);
  }

  /**
   * Remove all subscriptions
   */
  clear(): void {
    this.subscriptions.clear();
  }

  /**
   * Get count of subscribers for an event
   */
  listenerCount(event: string): number {
    return this.subscriptions.get(event)?.length ?? 0;
  }

  private subscribe(event: string, handler: EventHandler, once: boolean): () => void {
    const id = `sub_${++this.subscriptionCounter}`;

    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }

    this.subscriptions.get(event)!.push({ id, handler, once });

    if (this.debug) {
      console.log(`[EventBus] subscribe: ${event} (${id})`);
    }

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(event);
      if (subs) {
        this.subscriptions.set(
          event,
          subs.filter((s) => s.id !== id)
        );
        if (this.debug) {
          console.log(`[EventBus] unsubscribe: ${event} (${id})`);
        }
      }
    };
  }
}

// Singleton instance for global use
let globalEventBus: EventBus | null = null;

export function getEventBus(options?: EventBusOptions): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus(options);
  }
  return globalEventBus;
}

export function resetEventBus(): void {
  globalEventBus?.clear();
  globalEventBus = null;
}

// ============================================================================
// Standard Event Types
// ============================================================================

export const Events = {
  // MCP Events
  MCP_CONNECTED: 'mcp:connected',
  MCP_DISCONNECTED: 'mcp:disconnected',
  MCP_TOOL_CALL: 'mcp:tool:call',
  MCP_TOOL_RESULT: 'mcp:tool:result',
  MCP_RESOURCE_READ: 'mcp:resource:read',
  MCP_NOTIFICATION: 'mcp:notification',

  // UI Events
  UI_THEME_CHANGED: 'ui:theme:changed',
  UI_LAYOUT_CHANGED: 'ui:layout:changed',
  UI_NOTIFICATION: 'ui:notification',
  UI_MODAL_OPEN: 'ui:modal:open',
  UI_MODAL_CLOSE: 'ui:modal:close',

  // Shell Events
  SHELL_CONFIGURED: 'shell:configured',
  SHELL_SIDEBAR_TOGGLED: 'shell:sidebar:toggled',
  SHELL_NAV_ITEM_ADDED: 'shell:nav:added',
  SHELL_TAB_OPENED: 'shell:tab:opened',
  SHELL_TAB_CLOSED: 'shell:tab:closed',
  SHELL_TAB_ACTIVATED: 'shell:tab:activated',

  // Chat Events
  CHAT_MESSAGE_ADDED: 'chat:message:added',
  CHAT_STREAMING_START: 'chat:streaming:start',
  CHAT_STREAMING_END: 'chat:streaming:end',
  CHAT_CONVERSATION_STARTED: 'chat:conversation:started',
  CHAT_CONVERSATION_ENDED: 'chat:conversation:ended',

  // Component Events
  COMPONENT_RENDERED: 'component:rendered',
  COMPONENT_UPDATED: 'component:updated',
  COMPONENT_REMOVED: 'component:removed',
  COMPONENT_ACTION: 'component:action',

  // Visualization Events
  VIZ_REGISTERED: 'viz:registered',
  VIZ_CREATED: 'viz:created',
  VIZ_DESTROYED: 'viz:destroyed',
  VIZ_PARAMS_CHANGED: 'viz:params:changed',
  VIZ_STATE_CHANGED: 'viz:state:changed',

  // Token Events
  TOKENS_LOADED: 'tokens:loaded',
  TOKENS_CHANGED: 'tokens:changed',
  TOKENS_MODE_CHANGED: 'tokens:mode:changed',

  // UI Set Events
  UISET_REGISTERED: 'uiset:registered',
  UISET_ACTIVATED: 'uiset:activated',
  UISET_DEACTIVATED: 'uiset:deactivated',
} as const;

export type EventType = (typeof Events)[keyof typeof Events];

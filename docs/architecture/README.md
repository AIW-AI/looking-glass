# Looking Glass Architecture

This document describes the system architecture of Looking Glass, a programmable chat UI implementing the Model Context Protocol (MCP).

## Overview

Looking Glass follows a three-layer architecture:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LOOKING GLASS                                  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                       RENDER LAYER (React)                          ││
│  │  Components subscribe to state and render UI                        ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    ▲                                     │
│                                    │ subscribe                           │
│                                    │                                     │
│  ┌─────────────────────────────────┴───────────────────────────────────┐│
│  │                       STATE LAYER (Zustand)                         ││
│  │  Centralized, reactive state management                             ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    ▲                                     │
│                                    │ mutate                              │
│                                    │                                     │
│  ┌─────────────────────────────────┴───────────────────────────────────┐│
│  │                       MCP LAYER (Protocol)                          ││
│  │  Tool calls, resources, notifications, transports                   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                    ▲                                     │
│                                    │                                     │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
                           External MCP Clients
                        (AI, Dashboards, Services)
```

## Layer Details

### 1. MCP Layer

The MCP (Model Context Protocol) layer is the foundation. It handles:

- **Tools**: Named functions that can be called to manipulate UI
- **Resources**: Named data endpoints that can be read
- **Notifications**: Outbound messages to connected clients
- **Transports**: Communication channels (HTTP+SSE, WebSocket, embedded)

```typescript
// MCP Server handles protocol operations
interface MCPServer {
  // Tool management
  registerTool(tool: ToolDefinition): void;
  callTool(name: string, params: unknown): Promise<ToolResult>;
  listTools(): ToolDefinition[];

  // Resource management
  registerResource(resource: ResourceDefinition, handler: ResourceHandler): void;
  readResource(uri: string): Promise<unknown>;

  // Notifications
  emit(notification: Notification): void;

  // Transport
  setTransport(transport: Transport): void;
}
```

#### Built-in Tools

| Tool | Description |
|------|-------------|
| `ui.setTheme` | Change the UI theme |
| `ui.showNotification` | Display a notification |
| `ui.setLayout` | Change layout mode |
| `shell.configure` | Configure shell options |
| `shell.toggleSidebar` | Toggle sidebar visibility |
| `tabs.open` | Open a new tab |
| `tabs.close` | Close a tab |
| `tabs.activate` | Activate a tab |
| `chat.addMessage` | Inject a chat message |

### 2. State Layer

The state layer uses Zustand for reactive state management. All UI state lives in a single store with clearly defined slices:

```typescript
interface LookingGlassState {
  // UI Sets - bundled UI configurations
  uiSets: {
    registered: Map<string, UISetDefinition>;
    activeId: string | null;
    transients: Map<string, TransientElement>;
  };

  // Shell - application chrome
  shell: {
    config: ShellConfig;
    navItems: { header: NavItem[]; footer: NavItem[]; sidebar: NavItem[] };
    tabs: { items: TabInfo[]; activeId: string | null };
    sidebarCollapsed: boolean;
  };

  // UI - general UI state
  ui: {
    theme: string;
    accentColor: string;
    layout: LayoutMode;
    panels: Panel[];
    focus: string | null;
    notifications: NotificationItem[];
    modals: Modal[];
    progress: ProgressTask[];
  };

  // Components - rendered component instances
  components: Map<string, ComponentInstance>;

  // Visualizations - WebGL/Canvas renderers
  visualizations: {
    types: Map<string, VisualizationType>;
    instances: Map<string, VisualizationInstance>;
  };

  // Tokens - design token system
  tokens: {
    primitives: Record<string, unknown>;
    semantics: Record<string, string>;
    modes: Record<string, Record<string, string>>;
    currentMode: string;
  };

  // Chat - conversation state
  chat: {
    messages: Message[];
    conversationId: string | null;
    isStreaming: boolean;
  };
}
```

#### State Access Patterns

```typescript
// Reading state in components
const theme = useLookingGlassStore(state => state.ui.theme);

// Actions are part of the store
const setTheme = useLookingGlassStore(state => state.setTheme);
setTheme('terminal-amber');

// Subscribing to changes
const unsubscribe = useLookingGlassStore.subscribe(
  state => state.chat.messages,
  (messages) => console.log('Messages changed:', messages)
);
```

### 3. Render Layer

React components that subscribe to state and render UI. Components are organized into packages:

```
@looking-glass/shell     → Header, Footer, Sidebar, TabBar, Shell
@looking-glass/chat      → MessageList, Message, ChatInput, Chat
@looking-glass/components → CardGrid, DataTable, Accordion, etc.
@looking-glass/visualizations → VisualizationHost, Orb, Waveform
```

#### Component Hierarchy

```
<Shell>
  <Header />
  <TabBar />
  <div class="shell__body">
    <Sidebar />
    <main>
      {children}  ← Usually <Chat /> or dashboard content
    </main>
  </div>
  <Footer />
</Shell>
```

## Data Flow

### Tool Call Flow

```
External Client                 Looking Glass
      │                              │
      │  callTool("ui.setTheme",    │
      │           {theme: "amber"}) │
      │ ─────────────────────────►  │
      │                              │
      │                     ┌────────┴────────┐
      │                     │   MCP Server    │
      │                     │                 │
      │                     │ 1. Validate     │
      │                     │ 2. Find handler │
      │                     │ 3. Execute      │
      │                     └────────┬────────┘
      │                              │
      │                     ┌────────▼────────┐
      │                     │   State Store   │
      │                     │                 │
      │                     │ setTheme(...)   │
      │                     └────────┬────────┘
      │                              │
      │                     ┌────────▼────────┐
      │                     │   Event Bus     │
      │                     │                 │
      │                     │ UI_THEME_CHANGED│
      │                     └────────┬────────┘
      │                              │
      │                     ┌────────▼────────┐
      │                     │    React        │
      │                     │   Components    │
      │                     │                 │
      │                     │ (re-render)     │
      │                     └─────────────────┘
      │                              │
      │  ◄───────────────────────────│
      │  {success: true}             │
```

### Event Bus

The event bus provides decoupled communication between modules:

```typescript
// Standard events
Events.MCP_TOOL_CALL        // Tool was called
Events.MCP_TOOL_RESULT      // Tool returned result
Events.UI_THEME_CHANGED     // Theme changed
Events.CHAT_MESSAGE_ADDED   // Message added
Events.SHELL_TAB_OPENED     // Tab opened
Events.VIZ_STATE_CHANGED    // Visualization state changed
```

## Transport Layer

Transports abstract the communication mechanism:

### HTTP + SSE Transport

```
Client                              Server
  │                                    │
  │ POST /mcp/tools/ui.setTheme       │
  │ ──────────────────────────────►   │
  │                                    │
  │ ◄────────────────────────────────  │
  │ 200 OK {success: true}             │
  │                                    │
  │ GET /mcp/notifications (SSE)       │
  │ ──────────────────────────────►   │
  │                                    │
  │ ◄──── event: notification ──────  │
  │       data: {...}                  │
```

### WebSocket Transport

```
Client                              Server
  │                                    │
  │ ◄──────── WebSocket ───────────►  │
  │                                    │
  │ {type: "tool_call",               │
  │  id: "123",                        │
  │  data: {tool: "...", params: {}}} │
  │ ──────────────────────────────►   │
  │                                    │
  │ ◄──────────────────────────────   │
  │ {type: "response",                 │
  │  id: "123",                        │
  │  result: {success: true}}          │
```

### Embedded Transport

For testing and in-process use:

```typescript
const transport = new EmbeddedTransport();
await transport.connect();

// Simulate external tool call
const result = await transport.simulateToolCall('ui.setTheme', {
  theme: 'terminal'
});

// Listen for notifications
transport.onNotification((notification) => {
  console.log('Received:', notification);
});
```

## Package Dependencies

```
@looking-glass/core
        │
        ├──────────────────┬──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
@looking-glass/shell  @looking-glass/chat  @looking-glass/components
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                           ▼
                    @looking-glass/demo
```

All packages depend on `core` for:
- State management (`useLookingGlassStore`)
- Type definitions
- Event bus access

## Design Decisions

### Why Zustand?

- Minimal boilerplate compared to Redux
- Built-in subscriptions with selectors
- TypeScript-first design
- Small bundle size (~1KB)
- Works outside React (for MCP handlers)

### Why Custom MCP Implementation?

- Tight integration with state layer
- Custom transport requirements
- Control over protocol evolution
- Specific subscription patterns needed

### Why CSS Custom Properties?

- Runtime theming without rebuilds
- Token-based design system
- Easy programmatic manipulation
- Good performance (GPU-accelerated)

### Why Monorepo?

- Shared tooling and configuration
- Atomic commits across packages
- Easier local development
- Consistent versioning

## Security Considerations

### Tool Validation

All tool inputs are validated against JSON Schema before execution:

```typescript
server.registerTool({
  name: 'example',
  inputSchema: {
    type: 'object',
    properties: {
      dangerous: { type: 'string', maxLength: 1000 }
    },
    required: ['dangerous']
  },
  handler: async (params) => {
    // params are validated before this runs
  }
});
```

### Content Sanitization

Message content is sanitized before rendering:
- HTML is escaped
- URLs are validated
- Code blocks are syntax-highlighted safely

### Transport Security

- HTTP transport uses HTTPS in production
- WebSocket transport uses WSS
- Session tokens for authentication (when enabled)

## Performance Considerations

### State Updates

- Use granular selectors to minimize re-renders
- State mutations are batched
- Computed values are memoized

### Bundle Size

- Tree-shakeable exports
- Lazy loading for visualizations
- CSS loaded on-demand per theme

### Rendering

- Virtual scrolling for long message lists
- Debounced input handling
- RequestAnimationFrame for visualizations

## Future Architecture

### Planned Additions

1. **UI Sets**: Bundled UI configurations that can be activated atomically
2. **Visualization Pipeline**: WebGL renderer with state machine integration
3. **Token Resolution**: Semantic token indirection with mode switching
4. **Plugin System**: Runtime-loadable components and visualizations

See [Implementation Plan](../../LOOKING-GLASS-IMPLEMENTATION-PLAN.md) for roadmap.

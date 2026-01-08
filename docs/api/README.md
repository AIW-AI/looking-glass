# API Reference

Complete API documentation for Looking Glass packages.

## Table of Contents

- [@looking-glass/core](#looking-glasscore)
  - [createLookingGlass](#createlookingglass)
  - [useLookingGlassStore](#uselookingglassstore)
  - [MCPServer](#mcpserver)
  - [EventBus](#eventbus)
  - [Transports](#transports)
- [@looking-glass/shell](#looking-glassshell)
  - [Shell](#shell)
  - [Header](#header)
  - [Footer](#footer)
  - [Sidebar](#sidebar)
  - [TabBar](#tabbar)
- [@looking-glass/chat](#looking-glasschat)
  - [Chat](#chat)
  - [MessageList](#messagelist)
  - [Message](#message)
  - [ChatInput](#chatinput)

---

## @looking-glass/core

The core package provides MCP protocol implementation, state management, and infrastructure.

### createLookingGlass

Creates a Looking Glass instance with configured transport and options.

```typescript
function createLookingGlass(config: CoreConfig): LookingGlassInstance
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `config` | `CoreConfig` | Configuration options |

#### CoreConfig

```typescript
interface CoreConfig {
  transport: TransportConfig;
  theme?: string;
  defaultUISet?: string;
  enableAudio?: boolean;
  enableVisualization?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

interface TransportConfig {
  type: 'http-sse' | 'websocket' | 'embedded';
  url?: string;
  port?: number;
}
```

#### Returns

```typescript
interface LookingGlassInstance {
  server: MCPServer;
  store: typeof useLookingGlassStore;
  eventBus: EventBus;
  start(): Promise<void>;
  stop(): Promise<void>;
  getState(): LookingGlassState;
}
```

#### Example

```typescript
import { createLookingGlass } from '@looking-glass/core';

const lg = createLookingGlass({
  transport: { type: 'embedded' },
  theme: 'terminal',
  logLevel: 'info',
});

await lg.start();
console.log(lg.getState().ui.theme); // 'terminal'
await lg.stop();
```

---

### useLookingGlassStore

Zustand store hook for accessing and updating UI state.

```typescript
const useLookingGlassStore: UseBoundStore<StoreApi<LookingGlassState & LookingGlassActions>>
```

#### State

```typescript
interface LookingGlassState {
  uiSets: {
    registered: Map<string, UISetDefinition>;
    activeId: string | null;
    transients: Map<string, TransientElement>;
  };
  shell: {
    config: ShellConfig;
    navItems: { header: NavItem[]; footer: NavItem[]; sidebar: NavItem[] };
    tabs: { items: TabInfo[]; activeId: string | null };
    sidebarCollapsed: boolean;
  };
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
  components: Map<string, ComponentInstance>;
  visualizations: {
    types: Map<string, VisualizationType>;
    instances: Map<string, VisualizationInstance>;
  };
  tokens: {
    primitives: Record<string, unknown>;
    semantics: Record<string, string>;
    modes: Record<string, Record<string, string>>;
    currentMode: string;
  };
  chat: {
    messages: Message[];
    conversationId: string | null;
    isStreaming: boolean;
  };
}
```

#### Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `setTheme` | `(theme: string) => void` | Set UI theme |
| `setAccentColor` | `(color: string) => void` | Set accent color |
| `setLayout` | `(mode: LayoutMode) => void` | Set layout mode |
| `showNotification` | `(notification: Omit<NotificationItem, 'id' \| 'timestamp'>) => void` | Show notification |
| `dismissNotification` | `(id: string) => void` | Dismiss notification |
| `openModal` | `(modal: Omit<Modal, 'id'>) => void` | Open modal |
| `closeModal` | `(id: string) => void` | Close modal |
| `configureShell` | `(config: Partial<ShellConfig>) => void` | Configure shell |
| `toggleSidebar` | `() => void` | Toggle sidebar |
| `setSidebarCollapsed` | `(collapsed: boolean) => void` | Set sidebar state |
| `addNavItem` | `(position: 'header' \| 'footer' \| 'sidebar', item: NavItem) => void` | Add nav item |
| `removeNavItem` | `(position: string, id: string) => void` | Remove nav item |
| `openTab` | `(tab: TabInfo) => void` | Open tab |
| `closeTab` | `(id: string) => void` | Close tab |
| `activateTab` | `(id: string) => void` | Activate tab |
| `addMessage` | `(message: Omit<Message, 'id' \| 'timestamp'>) => void` | Add chat message |
| `clearMessages` | `() => void` | Clear all messages |
| `setStreaming` | `(isStreaming: boolean) => void` | Set streaming state |
| `setConversationId` | `(id: string \| null) => void` | Set conversation ID |
| `renderComponent` | `(instance: ComponentInstance) => void` | Render component |
| `updateComponent` | `(id: string, updates: Partial<ComponentInstance>) => void` | Update component |
| `removeComponent` | `(id: string) => void` | Remove component |
| `reset` | `() => void` | Reset to initial state |

#### Usage Examples

```typescript
import { useLookingGlassStore } from '@looking-glass/core';

// In React component
function MyComponent() {
  // Read state
  const theme = useLookingGlassStore(state => state.ui.theme);
  const messages = useLookingGlassStore(state => state.chat.messages);

  // Get actions
  const setTheme = useLookingGlassStore(state => state.setTheme);
  const addMessage = useLookingGlassStore(state => state.addMessage);

  return (
    <button onClick={() => setTheme('terminal-amber')}>
      Current: {theme}
    </button>
  );
}

// Outside React
const state = useLookingGlassStore.getState();
state.addMessage({ role: 'assistant', content: 'Hello!' });
```

---

### MCPServer

MCP protocol server for tool and resource management.

```typescript
class MCPServer {
  constructor(options?: MCPServerOptions);
}
```

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `registerTool` | `(tool: ToolDefinition) => void` | Register a tool |
| `unregisterTool` | `(name: string) => void` | Unregister a tool |
| `getTool` | `(name: string) => ToolDefinition \| undefined` | Get tool definition |
| `listTools` | `() => ToolDefinition[]` | List all tools |
| `callTool` | `(name: string, params: unknown) => Promise<ToolResult>` | Call a tool |
| `registerResource` | `(resource: ResourceDefinition, handler: ResourceHandler) => void` | Register resource |
| `unregisterResource` | `(uri: string) => void` | Unregister resource |
| `listResources` | `() => ResourceDefinition[]` | List all resources |
| `readResource` | `(uri: string) => Promise<unknown>` | Read a resource |
| `emit` | `(notification: Notification) => void` | Emit notification |
| `setTransport` | `(transport: Transport) => void` | Set transport |
| `start` | `() => Promise<void>` | Start server |
| `stop` | `() => Promise<void>` | Stop server |

#### ToolDefinition

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  handler?: (params: unknown) => Promise<ToolResult>;
}

interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
```

#### Example

```typescript
import { getMCPServer, defineTool } from '@looking-glass/core';

const server = getMCPServer();

// Register a tool
server.registerTool(
  defineTool()
    .name('example.greet')
    .description('Greets a person')
    .input({
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Person name' },
      },
      required: ['name'],
    })
    .handler(async (params) => {
      const { name } = params as { name: string };
      return { success: true, data: { greeting: `Hello, ${name}!` } };
    })
    .build()
);

// Call a tool
const result = await server.callTool('example.greet', { name: 'Alice' });
console.log(result.data.greeting); // 'Hello, Alice!'
```

---

### EventBus

Pub/sub event bus for decoupled communication.

```typescript
class EventBus {
  constructor(options?: EventBusOptions);
}
```

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `on` | `<T>(event: string, handler: EventHandler<T>) => () => void` | Subscribe to event |
| `once` | `<T>(event: string, handler: EventHandler<T>) => () => void` | Subscribe once |
| `emit` | `<T>(event: string, data?: T) => void` | Emit event |
| `emitAsync` | `<T>(event: string, data?: T) => Promise<void>` | Emit and await handlers |
| `off` | `(event: string) => void` | Remove all handlers for event |
| `clear` | `() => void` | Remove all handlers |
| `listenerCount` | `(event: string) => number` | Count handlers |

#### Standard Events

```typescript
const Events = {
  // MCP Events
  MCP_CONNECTED: 'mcp:connected',
  MCP_DISCONNECTED: 'mcp:disconnected',
  MCP_TOOL_CALL: 'mcp:tool:call',
  MCP_TOOL_RESULT: 'mcp:tool:result',
  MCP_NOTIFICATION: 'mcp:notification',

  // UI Events
  UI_THEME_CHANGED: 'ui:theme:changed',
  UI_LAYOUT_CHANGED: 'ui:layout:changed',
  UI_NOTIFICATION: 'ui:notification',

  // Shell Events
  SHELL_CONFIGURED: 'shell:configured',
  SHELL_SIDEBAR_TOGGLED: 'shell:sidebar:toggled',
  SHELL_TAB_OPENED: 'shell:tab:opened',
  SHELL_TAB_CLOSED: 'shell:tab:closed',
  SHELL_TAB_ACTIVATED: 'shell:tab:activated',

  // Chat Events
  CHAT_MESSAGE_ADDED: 'chat:message:added',
  CHAT_STREAMING_START: 'chat:streaming:start',
  CHAT_STREAMING_END: 'chat:streaming:end',
};
```

#### Example

```typescript
import { getEventBus, Events } from '@looking-glass/core';

const eventBus = getEventBus();

// Subscribe
const unsubscribe = eventBus.on(Events.CHAT_MESSAGE_ADDED, (message) => {
  console.log('New message:', message);
});

// Emit
eventBus.emit(Events.UI_THEME_CHANGED, { theme: 'terminal' });

// Cleanup
unsubscribe();
```

---

### Transports

Communication transports for MCP protocol.

#### HttpSseTransport

HTTP requests + Server-Sent Events for notifications.

```typescript
new HttpSseTransport(options: HttpSseTransportOptions)
```

```typescript
interface HttpSseTransportOptions {
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
```

#### WebSocketTransport

Full-duplex WebSocket communication.

```typescript
new WebSocketTransport(options: WebSocketTransportOptions)
```

```typescript
interface WebSocketTransportOptions {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}
```

#### EmbeddedTransport

In-process transport for testing.

```typescript
new EmbeddedTransport()
```

Additional methods:
- `simulateToolCall(tool: string, params: unknown): Promise<unknown>`
- `simulateResourceRead(uri: string): Promise<unknown>`
- `onNotification(listener: (notification: Notification) => void): () => void`

---

## @looking-glass/shell

Shell components for application chrome.

### Shell

Main shell container component.

```typescript
function Shell(props: ShellProps): JSX.Element
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Content to render in main area |
| `className` | `string` | `''` | Additional CSS classes |
| `showHeader` | `boolean` | `true` | Show header |
| `showFooter` | `boolean` | `true` | Show footer |
| `showSidebar` | `boolean` | `true` | Show sidebar |
| `showTabBar` | `boolean` | `true` | Show tab bar (if tabs exist) |

#### Example

```tsx
import { Shell } from '@looking-glass/shell';
import { Chat } from '@looking-glass/chat';

function App() {
  return (
    <Shell showSidebar={false}>
      <Chat />
    </Shell>
  );
}
```

---

### Header

Application header component.

```typescript
function Header(props: HeaderProps): JSX.Element
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |

Configured via state: `useLookingGlassStore.shell.config.header`

---

### Footer

Application footer component.

```typescript
function Footer(props: FooterProps): JSX.Element
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |

---

### Sidebar

Collapsible sidebar navigation.

```typescript
function Sidebar(props: SidebarProps): JSX.Element
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |

Navigation items configured via: `useLookingGlassStore.shell.navItems.sidebar`

---

### TabBar

Tab bar for multi-tab interfaces.

```typescript
function TabBar(props: TabBarProps): JSX.Element
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |

Tabs managed via: `useLookingGlassStore.shell.tabs`

---

## @looking-glass/chat

Chat interface components.

### Chat

Complete chat interface with message list and input.

```typescript
function Chat(props: ChatProps): JSX.Element
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `onSendMessage` | `(message: string) => void` | - | Callback when user sends message |

#### Example

```tsx
import { Chat } from '@looking-glass/chat';

function App() {
  const handleSend = async (message: string) => {
    // Send to AI API
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    // Response is handled via state
  };

  return <Chat onSendMessage={handleSend} />;
}
```

---

### MessageList

Scrollable list of chat messages.

```typescript
function MessageList(props: MessageListProps): JSX.Element
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `autoScroll` | `boolean` | `true` | Auto-scroll on new messages |

---

### Message

Individual message component.

```typescript
function Message(props: MessageProps): JSX.Element
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `Message` | - | Message object |
| `className` | `string` | `''` | Additional CSS classes |

#### Message Type

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: MessageMetadata;
}
```

---

### ChatInput

Message input with send button.

```typescript
function ChatInput(props: ChatInputProps): JSX.Element
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `placeholder` | `string` | `'Type a message...'` | Input placeholder |
| `onSend` | `(message: string) => void` | - | Send callback |
| `disabled` | `boolean` | `false` | Disable input |

---

## Types Reference

### Common Types

```typescript
type LayoutMode = 'chat' | 'dashboard' | 'split' | 'focus';

interface NavItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  action?: string;
  children?: NavItem[];
}

interface TabInfo {
  id: string;
  label: string;
  icon?: string;
  closable?: boolean;
  content?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  duration?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: MessageMetadata;
}
```

---

## Built-in MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `ui.setTheme` | Set UI theme | `{ theme: string }` |
| `ui.showNotification` | Show notification | `{ title, message, type, duration? }` |
| `ui.setLayout` | Set layout mode | `{ mode: LayoutMode }` |
| `shell.configure` | Configure shell | `{ header?, sidebar?, footer? }` |
| `shell.toggleSidebar` | Toggle sidebar | `{}` |
| `tabs.open` | Open tab | `{ id, label, icon?, closable?, content? }` |
| `tabs.close` | Close tab | `{ id }` |
| `tabs.activate` | Activate tab | `{ id }` |
| `chat.addMessage` | Add message | `{ role, content }` |

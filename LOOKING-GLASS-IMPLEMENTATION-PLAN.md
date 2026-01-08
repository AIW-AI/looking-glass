# Looking Glass: Implementation Plan

> *"But I don't want to go among mad people," Alice remarked.*
> *"Oh, you can't help that," said the Cat: "we're all mad here."*

---

## Executive Summary

**Looking Glass** is an open-source, self-controllable chat UI that implements the MCP-based control surface specification. It serves as the visual interface layer for AI systems that need to express themselves beyond text—through navigation, visualization, theming, and rich component layouts.

Looking Glass is the window through which users peer into Wonderland.

---

## 1. Vision

### 1.1 The Problem

Current chat interfaces are dumb terminals. They render text, accept input, and nothing more. The AI behind them—no matter how capable—is trapped in a text box, unable to:

- Restructure the interface based on context
- Surface relevant tools and navigation dynamically
- Express state through visualization
- Adapt the UI to match user workflows
- Create dashboard views for complex tasks

The AI is Alice, but she's stuck in the rabbit hole with no way to reshape Wonderland.

### 1.2 The Solution

Looking Glass inverts control. The UI becomes a programmable surface that external processes—including the AI itself—can manipulate through a standardized protocol (MCP). The chat application is no longer the brain; it's the body, waiting for instructions.

This enables:
- **Adaptive interfaces** that reshape based on task context
- **AI self-expression** through visual state (orbs, waveforms, status indicators)
- **Dashboard-as-conversation** where complex UIs emerge from chat interaction
- **Seamless transitions** between minimal chat and rich application views

### 1.3 The Wonderland Ecosystem

Looking Glass exists within a broader mythology:

| Codename | Component | Role |
|----------|-----------|------|
| **Looking Glass** | Chat UI | The window into Wonderland—programmable, controllable, expressive |
| **Alice** | Cognitive Platform | System 1/2 architecture—the mind that peers through the glass |
| **Cheshire** | Memory Subsystem | The cat that appears and disappears—knows everything, reveals selectively |
| **Vorpal** | Governance Platform | The blade that cuts through chaos—policy, guardrails, compliance |
| **Wonderland** | Runtime Environment | The world where it all runs—containers, orchestration, deployment |
| **Rabbit** | Message Router | Routes messages down the right holes—pub/sub, event dispatch |
| **Caterpillar** | Transformation Engine | "Who are you?"—identity resolution, context transformation |
| **Queen** | Orchestrator | "Off with their heads!"—process management, lifecycle control |

Looking Glass is intentionally **headless** in philosophy—it has no intelligence of its own. It's a perfect mirror, reflecting whatever Alice (or any MCP client) projects onto it.

---

## 2. Motivation

### 2.1 Why "Looking Glass"?

In *Through the Looking-Glass*, Alice steps through a mirror into a world where:
- Everything is reversed but internally consistent
- The rules can be learned but are different from the real world
- Language and meaning are playfully malleable
- Movement through space is movement through a game

This maps perfectly to a programmable UI:
- The interface reflects the AI's internal state (reversed: inside→outside)
- It follows MCP rules, different from traditional UI frameworks
- Components and layouts are semantically meaningful but dynamically composed
- Navigation through the UI is navigation through a task/conversation space

The mirror metaphor also captures the bidirectional nature: Alice peers through the glass at us, and we peer back at her.

### 2.2 Why Open Source?

1. **Ecosystem Growth**: A standardized controllable UI benefits all AI systems, not just Zoe
2. **Community Validation**: The spec needs real-world testing across diverse use cases
3. **Trust**: Users should be able to inspect what's rendering their AI's outputs
4. **Extensibility**: Custom visualizations, components, and themes from the community
5. **Reference Implementation**: Proves the spec is implementable and practical

### 2.3 Why Now?

- MCP is gaining adoption as the standard for AI tool interfaces
- Chat UIs are commoditized; differentiation requires capability, not just polish
- Agentic AI systems need richer expression than text permits
- Zoe's System 1/2 architecture requires a UI that can shift between modes

---

## 3. Design Principles

### 3.1 Terminal Aesthetic

Looking Glass adopts a **terminal emulator / matrix** visual language:

```
┌─────────────────────────────────────────────────────────────────┐
│ LOOKING GLASS v0.1.0                           ◉ ◉ ◉  │ ▢ │ ✕ │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  > System initialized                                           │
│  > Alice connected via MCP                                      │
│  > Cheshire memory loaded (2,847 vectors)                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ █████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  42%      │   │
│  │ Loading context...                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  USER: What's my schedule today?                                │
│                                                                 │
│  ALICE: Checking calendar...                                    │
│                                                                 │
│  ┌─ TODAY ──────────────────────────────────────────────────┐  │
│  │ 09:00  ▪ Team standup                                    │  │
│  │ 11:00  ▪ Architecture review                             │  │
│  │ 14:00  ▪ 1:1 with Sarah                                  │  │
│  │ 16:00  ▪ Sprint planning                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ▌                                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Visual Language:**
- Monospace typography (JetBrains Mono, Fira Code)
- Box-drawing characters for structure
- Accent color on black/dark background
- Status indicators using Unicode blocks and symbols
- Subtle scan-line or CRT effects (optional)
- Green/amber/cyan color schemes (user-selectable)

**Rationale:**
- Signals "this is a technical tool" not a consumer chatbot
- Scales beautifully to terminal environments
- High information density
- Nostalgic appeal to technical users
- Easy to theme (just change accent color)
- Accessibility: high contrast by default

### 3.2 Progressive Enhancement

Looking Glass works at multiple capability levels:

| Level | Capabilities | Use Case |
|-------|-------------|----------|
| **Terminal** | Text only, no MCP | SSH, basic terminals |
| **Basic** | Text + notifications | Simple chat apps |
| **Standard** | + Shell, tabs, panels | Most deployments |
| **Rich** | + Components, tokens | Dashboard views |
| **Full** | + Visualizations, audio | Immersive experiences |

Each level is a superset. A Looking Glass instance can run at any level based on:
- Client capabilities
- Server configuration
- User preferences
- Device constraints

### 3.3 Composition Over Configuration

Rather than a monolithic app with feature flags, Looking Glass is composed of:

```
looking-glass/
├── core/           # MCP server, state management, event bus
├── shell/          # Header, footer, sidebar, tab bar
├── components/     # Card grid, table, accordion, etc.
├── visualizations/ # Orb, waveform, graph renderers
├── tokens/         # Design token system
├── themes/         # Terminal, light, custom themes
└── transports/     # HTTP+SSE, WebSocket, stdio
```

Deployers choose which modules to include. A minimal deployment might only include `core` + `shell`. A full Zoe deployment includes everything.

---

## 4. Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LOOKING GLASS                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         RENDER LAYER                                │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │  Shell   │ │   Chat   │ │Components│ │   Viz    │ │  Tokens  │ │ │
│  │  │ Renderer │ │ Renderer │ │ Renderer │ │ Renderer │ │ Resolver │ │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │ │
│  └───────┼────────────┼────────────┼────────────┼────────────┼───────┘ │
│          │            │            │            │            │          │
│  ┌───────┴────────────┴────────────┴────────────┴────────────┴───────┐ │
│  │                         STATE LAYER                                │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │ UI Sets  │ │  Shell   │ │   UI     │ │Component │ │  Token   │ │ │
│  │  │  Store   │ │  Store   │ │  Store   │ │  Store   │ │  Store   │ │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │ │
│  └───────┼────────────┼────────────┼────────────┼────────────┼───────┘ │
│          │            │            │            │            │          │
│  ┌───────┴────────────┴────────────┴────────────┴────────────┴───────┐ │
│  │                         MCP LAYER                                  │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │                      MCP Server                               │ │ │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │ │ │
│  │  │  │  Tools  │  │Resources│  │ Notifs  │  │ Subscriptions   │  │ │ │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘  │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                    │                                    │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              ┌─────┴─────┐   ┌──────┴──────┐  ┌─────┴─────┐
              │   Alice   │   │  Dashboard  │  │  External │
              │ (Claude)  │   │   Agent     │  │  Service  │
              └───────────┘   └─────────────┘  └───────────┘
```

### 4.2 Module Breakdown

#### 4.2.1 Core (`@looking-glass/core`)

The foundation. Always required.

```typescript
// Responsibilities:
// - MCP server implementation
// - State management (Zustand)
// - Event bus for internal communication
// - Tool/resource/notification dispatch
// - Transport abstraction

export interface LookingGlassCore {
  // MCP interface
  registerTool(tool: ToolDefinition): void;
  registerResource(resource: ResourceDefinition): void;
  emit(notification: Notification): void;

  // State interface
  getState(): LookingGlassState;
  subscribe(selector: Selector, callback: Callback): Unsubscribe;

  // Lifecycle
  start(config: CoreConfig): Promise<void>;
  stop(): Promise<void>;
}
```

#### 4.2.2 Shell (`@looking-glass/shell`)

The application chrome. Header, footer, sidebar, tab bar.

```typescript
// Components:
// - ShellProvider (context)
// - Header, Footer, Sidebar, TabBar
// - NavItem, TabItem
// - CollapsibleSidebar

// Registers tools:
// - shell.configure
// - shell.registerNavItem
// - shell.toggleSidebar
// - tabs.open, tabs.close, tabs.activate
```

#### 4.2.3 Chat (`@looking-glass/chat`)

The conversation interface. Messages, input, streaming.

```typescript
// Components:
// - ChatProvider
// - MessageList, Message, MessageContent
// - ChatInput, StreamingIndicator
// - SystemMessage, NotificationMessage

// Features:
// - Markdown rendering
// - Code syntax highlighting
// - Streaming text display
// - Message injection via MCP
```

#### 4.2.4 Components (`@looking-glass/components`)

Rich, structured UI components.

```typescript
// Components:
// - CardGrid, Card
// - DataTable
// - Accordion
// - StatsGrid
// - Timeline
// - Carousel
// - Form

// Registers tools:
// - component.render
// - component.update
// - component.remove
```

#### 4.2.5 Visualizations (`@looking-glass/visualizations`)

WebGL/Canvas visualization hosts.

```typescript
// Components:
// - VisualizationHost
// - VisualizationRegistry

// Built-in renderers:
// - Orb (Three.js)
// - Waveform (Canvas 2D)
// - Graph (D3/Canvas)

// Registers tools:
// - viz.register, viz.create, viz.destroy
// - viz.setParams, viz.applyPreset
// - audio.subscribe, audio.bind
```

#### 4.2.6 Tokens (`@looking-glass/tokens`)

Design token system with primitive/semantic hierarchy.

```typescript
// Features:
// - Token loading and resolution
// - Mode switching (light/dark/custom)
// - CSS custom property generation
// - Transition animations

// Registers tools:
// - tokens.load, tokens.set
// - tokens.setMode, tokens.defineMode
// - tokens.resolve, tokens.query
```

#### 4.2.7 Themes (`@looking-glass/themes`)

Pre-built theme packages.

```typescript
// Themes:
// - terminal (default) - green on black, matrix aesthetic
// - terminal-amber - amber on black
// - terminal-cyan - cyan on black
// - light - light mode for accessibility
// - custom - user-defined via token overrides

// Each theme is a token set + CSS
```

### 4.3 State Management

Using Zustand for lightweight, subscription-based state:

```typescript
interface LookingGlassState {
  // UI Sets
  uiSets: {
    registered: Map<string, UISetDefinition>;
    activeId: string | null;
    transients: Map<string, TransientElement>;
  };

  // Shell
  shell: {
    config: ShellConfig;
    navItems: { header: NavItem[]; footer: NavItem[]; sidebar: NavItem[] };
    tabs: { items: TabInfo[]; activeId: string };
    sidebarCollapsed: boolean;
  };

  // UI
  ui: {
    theme: string;
    accentColor: string;
    layout: LayoutMode;
    panels: Panel[];
    focus: string | null;
    notifications: Notification[];
    modals: Modal[];
    progress: ProgressTask[];
  };

  // Components
  components: Map<string, ComponentInstance>;

  // Visualizations
  visualizations: {
    types: Map<string, VisualizationType>;
    instances: Map<string, VisualizationInstance>;
  };

  // Tokens
  tokens: {
    primitives: Record<string, unknown>;
    semantics: Record<string, string>;
    modes: Record<string, Record<string, string>>;
    currentMode: string;
  };

  // Chat
  chat: {
    messages: Message[];
    conversationId: string | null;
    isStreaming: boolean;
  };
}
```

### 4.4 Transport Layer

Looking Glass supports multiple transports:

```typescript
interface Transport {
  // Incoming
  onToolCall(handler: (tool: string, params: unknown) => Promise<unknown>): void;
  onResourceRead(handler: (uri: string) => Promise<unknown>): void;

  // Outgoing
  sendNotification(notification: Notification): void;

  // Lifecycle
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

// Implementations:
// - HttpSseTransport: HTTP for calls, SSE for notifications
// - WebSocketTransport: Full duplex WebSocket
// - StdioTransport: For CLI/pipe usage
// - EmbeddedTransport: In-process for testing
```

---

## 5. Implementation Phases

### Phase 0: Foundation (Week 1-2)
**Goal: Project scaffolding and core infrastructure**

- [ ] Repository setup (monorepo with Turborepo)
- [ ] Core package structure
- [ ] Basic MCP server implementation
- [ ] State management foundation (Zustand)
- [ ] Event bus implementation
- [ ] HTTP+SSE transport
- [ ] Development environment (Vite, TypeScript, ESLint)
- [ ] Basic documentation site

**Deliverable:** Empty shell that accepts MCP connections and logs tool calls.

---

### Phase 1: Basic Chat (Week 3-4)
**Goal: Functional chat interface with terminal aesthetic**

- [ ] Chat module implementation
  - [ ] MessageList component
  - [ ] ChatInput component
  - [ ] Streaming text display
  - [ ] Markdown rendering
- [ ] Terminal theme
  - [ ] Base CSS variables
  - [ ] Typography (JetBrains Mono)
  - [ ] Color scheme (green on black)
  - [ ] Box-drawing utilities
- [ ] Core UI tools
  - [ ] `ui.setTheme`
  - [ ] `ui.showNotification`
  - [ ] `ui.injectMessage`
- [ ] Basic layout (single-pane chat)

**Deliverable:** "Alice Demo" - a standalone chat interface that works with any MCP-compatible LLM backend. Can be deployed independently.

```
┌─ LOOKING GLASS ─────────────────────────────────────────────────────────┐
│                                                                         │
│  > Connected to Alice                                                   │
│                                                                         │
│  USER: Hello, Alice.                                                    │
│                                                                         │
│  ALICE: Hello! I'm Alice, running through Looking Glass. I can see     │
│         you're using the terminal theme. Would you like to explore     │
│         what I can do with this interface?                             │
│                                                                         │
│  USER: ▌                                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 2: Shell & Navigation (Week 5-6)
**Goal: Application chrome with tabs and navigation**

- [ ] Shell module implementation
  - [ ] Header component
  - [ ] Footer component
  - [ ] Sidebar component (collapsible)
  - [ ] TabBar component
- [ ] Shell tools
  - [ ] `shell.configure`
  - [ ] `shell.registerNavItem`
  - [ ] `shell.toggleSidebar`
  - [ ] `tabs.open`, `tabs.close`, `tabs.activate`
- [ ] Navigation system
  - [ ] Route handling
  - [ ] Tab content areas
  - [ ] Panel positions
- [ ] Responsive breakpoints

**Deliverable:** Multi-tab interface with navigation. Alice can open tabs, show/hide sidebar, register nav items.

```
┌─ LOOKING GLASS ──────────────────────────────────────┬──────────────────┐
│ ▣ Chat  │ Dashboard │ + │                            │ ◉ connected      │
├─────────┴───────────┴───┴────────────────────────────┴──────────────────┤
│ ┌────────────┐                                                          │
│ │ ▸ Chat     │  USER: Show me my tasks                                 │
│ │ ▸ Tasks    │                                                          │
│ │ ▸ Calendar │  ALICE: Opening tasks view...                           │
│ │ ▸ Memory   │                                                          │
│ │            │  [Tab "Tasks" opened]                                   │
│ │            │                                                          │
│ │            │                                                          │
│ └────────────┘                                                          │
│                 USER: ▌                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ MCP: alice@localhost │ Latency: 42ms │ v0.2.0                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 3: Rich Components (Week 7-8)
**Goal: Structured UI components beyond raw HTML**

- [ ] Components module implementation
  - [ ] CardGrid + Card
  - [ ] DataTable (sortable, paginated)
  - [ ] Accordion
  - [ ] StatsGrid
  - [ ] Timeline
  - [ ] Form
- [ ] Component tools
  - [ ] `component.render`
  - [ ] `component.update`
  - [ ] `component.remove`
- [ ] Component registry
- [ ] Action handling (callbacks from components)

**Deliverable:** Alice can render structured data views. Dashboard-style layouts are possible.

```
┌─ Tasks ─────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐│
│  │ TASK                          │ STATUS    │ DUE        │ PRIORITY ││
│  ├───────────────────────────────┼───────────┼────────────┼──────────┤│
│  │ Review PR #142                │ ● In Prog │ Today      │ ▲ High   ││
│  │ Update documentation          │ ○ Pending │ Tomorrow   │ ▬ Medium ││
│  │ Fix memory leak in Cheshire   │ ○ Pending │ Friday     │ ▲ High   ││
│  │ Plan Q2 roadmap               │ ○ Pending │ Next week  │ ▼ Low    ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ◂ 1 2 3 ▸                                               4 items shown │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 4: UI Sets (Week 9-10)
**Goal: Bundled UI configurations**

- [ ] UI Sets module
  - [ ] Registration storage
  - [ ] Activation/deactivation logic
  - [ ] Transition orchestration
  - [ ] Transient element management
- [ ] UI Set tools
  - [ ] `uiset.register`, `uiset.update`, `uiset.unregister`
  - [ ] `uiset.list`, `uiset.get`, `uiset.checkCompatibility`
  - [ ] `uiset.activate`, `uiset.deactivate`, `uiset.switch`
  - [ ] `uiset.updateComponent`, `uiset.addTransient`, `uiset.saveAs`
- [ ] Built-in UI Sets
  - [ ] `minimal-chat` - Just chat, no chrome
  - [ ] `standard-chat` - Chat with sidebar
  - [ ] `dashboard` - Full dashboard layout

**Deliverable:** Complete UI configurations can be shipped and switched atomically.

---

### Phase 5: Design Tokens (Week 11-12)
**Goal: Semantic theming system**

- [ ] Tokens module
  - [ ] Primitive/semantic hierarchy
  - [ ] Mode resolution (light/dark/custom)
  - [ ] CSS custom property generation
  - [ ] Transition animations
- [ ] Token tools
  - [ ] `tokens.load`, `tokens.set`, `tokens.setBatch`
  - [ ] `tokens.setMode`, `tokens.defineMode`
  - [ ] `tokens.resolve`, `tokens.query`
- [ ] Theme packages
  - [ ] Terminal (default)
  - [ ] Terminal-amber
  - [ ] Terminal-cyan
  - [ ] Light mode
- [ ] Theme preview/switcher UI

**Deliverable:** Runtime theming with semantic token indirection. Users can create custom themes.

---

### Phase 6: Visualizations (Week 13-14)
**Goal: WebGL/Canvas visualization hosting**

- [ ] Visualization module
  - [ ] VisualizationHost component
  - [ ] Renderer registry
  - [ ] Parameter interpolation engine
  - [ ] State machine integration
- [ ] Visualization tools
  - [ ] `viz.register`, `viz.create`, `viz.destroy`
  - [ ] `viz.setParams`, `viz.applyPreset`, `viz.definePreset`
  - [ ] `state.define`, `state.transition`, `state.query`
- [ ] Built-in renderers
  - [ ] Orb (Three.js) - Zoe's visual embodiment
  - [ ] Waveform (Canvas 2D) - Audio visualization
  - [ ] Status indicator - Simple state display
- [ ] Audio subscription
  - [ ] `audio.subscribe`, `audio.unsubscribe`, `audio.bind`

**Deliverable:** Rich visualizations can be registered, instantiated, and controlled via MCP.

---

### Phase 7: Zoe Integration (Week 15-16)
**Goal: Looking Glass becomes zoe.mr0.us**

- [ ] Zoe-specific UI Set
  - [ ] Dashboard replication (service mesh, logs, memory)
  - [ ] System 1/2 mode indicator
  - [ ] Orb visualization integration
  - [ ] Memory browser (Cheshire)
  - [ ] Task tracker (Todoist integration)
- [ ] MCP client integration
  - [ ] Connect to Brain container
  - [ ] Connect to Chat container
  - [ ] System 1/2 switching logic
- [ ] Deployment
  - [ ] Docker container
  - [ ] Caddy reverse proxy config
  - [ ] Environment variable handling
- [ ] Migration from current dashboard

**Deliverable:** zoe.mr0.us runs Looking Glass, fully replicating and extending current dashboard.

---

### Phase 8: Polish & Release (Week 17-18)
**Goal: Production readiness**

- [ ] Performance optimization
  - [ ] Bundle size analysis
  - [ ] Lazy loading modules
  - [ ] Virtual scrolling for long lists
- [ ] Accessibility
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  - [ ] Reduced motion support
  - [ ] High contrast themes
- [ ] Documentation
  - [ ] API reference
  - [ ] Integration guides
  - [ ] Example applications
  - [ ] Video tutorials
- [ ] Testing
  - [ ] Unit tests (Vitest)
  - [ ] Component tests (Testing Library)
  - [ ] E2E tests (Playwright)
  - [ ] MCP protocol compliance tests
- [ ] Release
  - [ ] npm package publishing
  - [ ] GitHub release
  - [ ] Demo site
  - [ ] Announcement

**Deliverable:** Looking Glass v1.0.0 public release.

---

## 6. Deployment Configurations

Looking Glass supports three deployment modes, each building on the previous:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT PROGRESSION                           │
│                                                                         │
│   Alice Demo          Through the           Zoe Full                   │
│   (Minimal)           Looking Glass         (Production)               │
│                       (Showcase)                                        │
│   ┌─────────┐         ┌─────────┐          ┌─────────┐                 │
│   │  Chat   │    →    │  Chat   │     →    │  Chat   │                 │
│   │  Shell  │         │  Shell  │          │  Shell  │                 │
│   │         │         │Dashboard│          │Dashboard│                 │
│   │         │         │   Orb   │          │   Orb   │                 │
│   │         │         │         │          │ Memory  │                 │
│   │         │         │         │          │  Tasks  │                 │
│   │         │         │         │          │ System  │                 │
│   └─────────┘         └─────────┘          └─────────┘                 │
│                                                                         │
│   Direct API          Direct API           Brain + Chat                │
│   No persistence      Demo persistence     Full persistence            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 6.1 Alice Demo (Minimal)

The simplest deployment—a terminal-style chat interface for evaluating Looking Glass or integrating with any MCP-compatible backend.

**Use cases:**
- Quick evaluation of Looking Glass
- Integration testing with custom backends
- Embedding in documentation/tutorials
- Lightweight chat UI for simple AI applications

```yaml
# docker-compose.alice-demo.yml
services:
  looking-glass:
    image: ghcr.io/zoehq/looking-glass:latest
    ports:
      - "3000:3000"
    environment:
      - LOOKING_GLASS_MODE=alice-demo
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - THEME=terminal
      - LOG_LEVEL=info
```

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ALICE DEMO                                     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Looking Glass                                │   │
│  │  ┌───────────┐  ┌───────────────────────────────────────────┐   │   │
│  │  │   Shell   │  │                Chat                        │   │   │
│  │  │  (basic)  │  │  ┌─────────────────────────────────────┐  │   │   │
│  │  │           │  │  │         Message List                │  │   │   │
│  │  │ [no nav]  │  │  │                                     │  │   │   │
│  │  │           │  │  │  USER: Hello                        │  │   │   │
│  │  │           │  │  │  ALICE: Hello! I'm running in       │  │   │   │
│  │  │           │  │  │         demo mode...                │  │   │   │
│  │  │           │  │  │                                     │  │   │   │
│  │  │           │  │  └─────────────────────────────────────┘  │   │   │
│  │  │           │  │  ┌─────────────────────────────────────┐  │   │   │
│  │  │           │  │  │         Chat Input                  │  │   │   │
│  │  │           │  │  └─────────────────────────────────────┘  │   │   │
│  │  └───────────┘  └───────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│                          ┌─────────────────┐                           │
│                          │  Claude API     │                           │
│                          │  (Direct)       │                           │
│                          └─────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────┘
```

**Capabilities:**
- ✓ Terminal aesthetic chat
- ✓ Basic shell (header/footer)
- ✓ Notifications/toasts
- ✓ Theme switching
- ✓ Markdown rendering
- ✓ Code syntax highlighting
- ✗ Sidebar navigation
- ✗ Tabs
- ✗ Rich components
- ✗ Visualizations
- ✗ Persistence

**Included modules:**
```typescript
import { LookingGlass } from '@looking-glass/core';
import { Chat } from '@looking-glass/chat';
import { Shell } from '@looking-glass/shell'; // minimal config
import { TerminalTheme } from '@looking-glass/themes';
```

**Sample interaction:**
```
┌─ ALICE DEMO ────────────────────────────────────────────────────────────┐
│                                                                         │
│  > Looking Glass v0.1.0 | Alice Demo Mode                               │
│  > Connected to Claude API                                              │
│                                                                         │
│  USER: What can you do in this demo?                                    │
│                                                                         │
│  ALICE: In Alice Demo mode, I can:                                      │
│                                                                         │
│    • Have conversations with full markdown support                      │
│    • Show notifications and progress indicators                         │
│    • Switch between terminal color themes                               │
│    • Render code with syntax highlighting                               │
│                                                                         │
│  For the full experience with dashboards, visualizations, and the      │
│  Orb, try "Through the Looking Glass" mode!                            │
│                                                                         │
│  USER: ▌                                                                │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ alice-demo │ claude-3-5-sonnet │ theme: terminal                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 6.2 Alice Through the Looking Glass (Showcase)

A rich demo deployment showcasing Looking Glass's full UI capabilities—including the Orb visualization, dashboard layouts, and rich components—without requiring Zoe's backend infrastructure.

**Use cases:**
- Showcasing Looking Glass at conferences/demos
- Evaluating full capabilities before Zoe integration
- Standalone AI assistant with visual personality
- Template for building custom AI applications

```yaml
# docker-compose.looking-glass-demo.yml
services:
  looking-glass:
    image: ghcr.io/zoehq/looking-glass:latest
    ports:
      - "3000:3000"
    environment:
      - LOOKING_GLASS_MODE=showcase
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - THEME=terminal
      - DEFAULT_UI_SET=alice-showcase
      - ENABLE_ORB=true
      - ENABLE_AUDIO=true
      - LOG_LEVEL=info
    volumes:
      - looking-glass-data:/data  # Demo persistence

  # Optional: Redis for session state
  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data

volumes:
  looking-glass-data:
  redis-data:
```

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ALICE THROUGH THE LOOKING GLASS                      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Looking Glass (Full UI)                      │   │
│  │                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │ LOOKING GLASS    ▣ Chat │ Dashboard │ +      ◉ connected │   │   │
│  │  ├──────────────────────────────────────────────────────────┤   │   │
│  │  │ ┌──────────┐ ┌──────────────────────────────────────────┐│   │   │
│  │  │ │ ▸ Chat   │ │                                          ││   │   │
│  │  │ │ ▸ Explore│ │      ┌────────────────────┐              ││   │   │
│  │  │ │ ▸ About  │ │      │                    │              ││   │   │
│  │  │ │          │ │      │       ORB          │              ││   │   │
│  │  │ │          │ │      │    ◉ ════ ◉       │              ││   │   │
│  │  │ │          │ │      │                    │              ││   │   │
│  │  │ │          │ │      └────────────────────┘              ││   │   │
│  │  │ │          │ │                                          ││   │   │
│  │  │ │          │ │  USER: Tell me about yourself            ││   │   │
│  │  │ │          │ │                                          ││   │   │
│  │  │ │          │ │  ALICE: *orb pulses warmly*              ││   │   │
│  │  │ │          │ │         I'm Alice, and this is my        ││   │   │
│  │  │ │          │ │         Looking Glass...                 ││   │   │
│  │  │ └──────────┘ └──────────────────────────────────────────┘│   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                    ┌───────────────┼───────────────┐                   │
│                    ▼               ▼               ▼                    │
│           ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│           │ Claude API  │  │    Redis    │  │  Local FS   │            │
│           │  (Direct)   │  │ (sessions)  │  │  (prefs)    │            │
│           └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
```

**Capabilities:**
- ✓ Everything in Alice Demo, plus:
- ✓ Full shell with sidebar navigation
- ✓ Tab management
- ✓ Rich components (cards, tables, stats)
- ✓ UI Sets (switchable layouts)
- ✓ Orb visualization
- ✓ Audio reactivity (microphone)
- ✓ State machines for Orb
- ✓ Demo dashboard with sample data
- ✓ Session persistence
- ✗ Real integrations (calendar, tasks, memory)
- ✗ System 1/2 architecture
- ✗ Multi-user support

**Included modules:**
```typescript
import { LookingGlass } from '@looking-glass/core';
import { Chat } from '@looking-glass/chat';
import { Shell, Sidebar, TabBar } from '@looking-glass/shell';
import { CardGrid, DataTable, StatsGrid } from '@looking-glass/components';
import { VisualizationHost, OrbRenderer } from '@looking-glass/visualizations';
import { TokenStore } from '@looking-glass/tokens';
import { TerminalTheme } from '@looking-glass/themes';
import { AliceShowcaseUISet } from '@looking-glass/ui-sets';
```

**Pre-built UI Sets included:**

1. **`alice-showcase`** (default)
   - Orb in center panel
   - Chat below orb
   - Sidebar with demo navigation
   - Audio reactive

2. **`alice-dashboard`**
   - Sample dashboard with stats
   - Demo data tables
   - Showcase of all components

3. **`alice-minimal`**
   - Clean chat-only view
   - Hidden sidebar
   - Focus mode

**Sample interaction:**
```
┌─ LOOKING GLASS ─────────────────────────────────┬───────────────────────┐
│ ▣ Chat │ Dashboard │ Components │ +             │ ◉ alice │ 🎤 active  │
├─────────────────────────────────────────────────┴───────────────────────┤
│ ┌───────────┐                                                           │
│ │ ▸ Chat    │     ┌─────────────────────────────────────────────┐      │
│ │ ▸ Dashboard│     │                                             │      │
│ │ ▸ Components│    │              ╭──────────────╮               │      │
│ │ ▸ Themes  │     │              │   ◉    ◉    │               │      │
│ │ ▸ About   │     │              │  ╭──────────╮│               │      │
│ │           │     │              │  │ ▓▓▓▓▓▓▓▓ ││               │      │
│ │           │     │              │  ╰──────────╯│               │      │
│ │           │     │              ╰──────────────╯               │      │
│ │           │     │                  LISTENING                   │      │
│ │           │     └─────────────────────────────────────────────┘      │
│ │           │                                                           │
│ │           │  USER: Show me what you can do with the dashboard        │
│ │           │                                                           │
│ │           │  ALICE: *orb shifts to curious state*                    │
│ │           │                                                           │
│ │           │  Opening the dashboard with sample data...               │
│ │           │                                                           │
│ │           │  ┌─ SAMPLE STATS ─────────────────────────────────────┐  │
│ │           │  │ Messages    │ Sessions   │ Uptime      │ Status    │  │
│ │           │  │ ▲ 1,247     │ ▲ 42       │ 99.9%       │ ● Online  │  │
│ │           │  └─────────────────────────────────────────────────────┘  │
│ └───────────┘                                                           │
│               USER: ▌                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ showcase │ claude-3-5-sonnet │ orb: listening │ audio: active          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Orb States in Showcase:**

| State | Visual | Trigger |
|-------|--------|---------|
| `idle` | Slow pulse, dim | No activity |
| `listening` | Gentle expansion, warm | User typing or speaking |
| `processing` | Faster pulse, brighter | Waiting for Claude |
| `speaking` | Rhythmic pulse, luminous | Streaming response |
| `curious` | Slight tilt, color shift | Question detected |
| `thinking` | Swirling internal motion | Complex reasoning |

---

### 6.3 Zoe Full (Production)

The complete production deployment—Looking Glass as the primary interface for Zoe, replacing the current dashboard and serving as the window into the full Wonderland ecosystem.

**Use cases:**
- Production Zoe deployment at zoe.mr0.us
- Full System 1/2 cognitive architecture visualization
- Complete integration with Cheshire (memory), Brain, Chat
- Multi-modal interaction (text, voice, visualization)

```yaml
# In docker-compose.yml (main Zoe deployment)
services:
  looking-glass:
    build: ./docker/looking-glass
    environment:
      - LOOKING_GLASS_MODE=production
      - MCP_BRAIN_URL=http://brain:8080
      - MCP_CHAT_URL=http://chat:8081
      - MCP_CHESHIRE_URL=http://qdrant:6333
      - THEME=terminal
      - DEFAULT_UI_SET=zoe-main
      - ENABLE_ORB=true
      - ENABLE_AUDIO=true
      - ENABLE_SYSTEM_1_2=true
      - SESSION_SECRET=${SESSION_SECRET}
      - ROSS_DISCORD_ID=${ROSS_DISCORD_ID}
    volumes:
      - /var/zoe/looking-glass:/data
    depends_on:
      - brain
      - chat
      - qdrant
    labels:
      caddy: zoe.mr0.us
      caddy.reverse_proxy: "{{upstreams 3000}}"

  # Existing Zoe services...
  brain:
    # ...
  chat:
    # ...
  qdrant:
    # ...
```

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                            ZOE FULL                                     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  Looking Glass (Production)                      │   │
│  │                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │ ZOE    ▣ Chat │ Dashboard │ Memory │ Tasks │ +   ◉ S2   │   │   │
│  │  ├──────────────────────────────────────────────────────────┤   │   │
│  │  │ ┌──────────┐ ┌──────────────────────────────────────────┐│   │   │
│  │  │ │ ▸ Chat   │ │  ┌─────────────────┐ ┌────────────────┐ ││   │   │
│  │  │ │ ▸ Dashboard│ │  │  SERVICE MESH   │ │  SYSTEM STATE  │ ││   │   │
│  │  │ │ ▸ Memory │ │  │  brain ◉────◉ chat│ │  Mode: S2     │ ││   │   │
│  │  │ │ ▸ Tasks  │ │  │    │      │     │ │  Thinking: ON  │ ││   │   │
│  │  │ │ ▸ Logs   │ │  │  qdrant◉  │     │ │  Memory: 2.8K  │ ││   │   │
│  │  │ │ ▸ Settings│ │  └─────────────────┘ └────────────────┘ ││   │   │
│  │  │ │          │ │                                          ││   │   │
│  │  │ │ ───────  │ │     ┌────────────────────┐               ││   │   │
│  │  │ │ SYSTEM   │ │     │                    │               ││   │   │
│  │  │ │ ◉ S1     │ │     │       ORB          │               ││   │   │
│  │  │ │ ◉ S2 ←   │ │     │    ◉ ════ ◉       │               ││   │   │
│  │  │ │          │ │     │     THINKING       │               ││   │   │
│  │  │ │          │ │     └────────────────────┘               ││   │   │
│  │  │ └──────────┘ └──────────────────────────────────────────┘│   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│          ┌─────────────────────────┼─────────────────────────┐         │
│          ▼                         ▼                         ▼          │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐   │
│  │    Brain    │           │    Chat     │           │   Cheshire  │   │
│  │   (MCP)     │           │   (MCP)     │           │   (Qdrant)  │   │
│  │             │           │             │           │             │   │
│  │ System 2    │           │ System 1    │           │  Memories   │   │
│  │ Reasoning   │           │ Fast resp   │           │  2,847 vec  │   │
│  └─────────────┘           └─────────────┘           └─────────────┘   │
│          │                         │                         │          │
│          └─────────────────────────┼─────────────────────────┘         │
│                                    ▼                                    │
│                          ┌─────────────────┐                           │
│                          │ External APIs   │                           │
│                          │ Calendar, Tasks │                           │
│                          │ Discord, etc.   │                           │
│                          └─────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────┘
```

**Capabilities:**
- ✓ Everything in Through the Looking Glass, plus:
- ✓ Full Zoe backend integration
- ✓ System 1/2 mode visualization and switching
- ✓ Cheshire memory browser
- ✓ Real task integration (Todoist, Google Tasks)
- ✓ Calendar integration
- ✓ Service mesh monitoring (replaces current dashboard)
- ✓ Log viewer
- ✓ Container health status
- ✓ Discord message relay
- ✓ Persistent user preferences
- ✓ Session management
- ✓ Authentication (Ross only for now)

**Included modules:**
```typescript
// All showcase modules, plus:
import { BrainMCPClient, ChatMCPClient } from '@looking-glass/zoe-clients';
import { CheshireMemoryBrowser } from '@looking-glass/cheshire';
import { ServiceMeshMonitor } from '@looking-glass/zoe-dashboard';
import { SystemModeSwitcher } from '@looking-glass/zoe-system';
import { ZoeMainUISet, ZoeDashboardUISet } from '@looking-glass/zoe-ui-sets';
```

**Pre-built UI Sets for Zoe:**

1. **`zoe-main`** (default)
   - Orb prominent with System 1/2 indicator
   - Chat below orb
   - Sidebar with all Zoe navigation
   - Status bar showing container health

2. **`zoe-dashboard`**
   - Full dashboard layout (replaces current)
   - Service mesh visualization
   - Container status grid
   - Log viewer panel
   - Memory stats

3. **`zoe-memory`**
   - Cheshire memory browser
   - Vector similarity visualization
   - Memory timeline
   - Search interface

4. **`zoe-tasks`**
   - Task list from Todoist/Google Tasks
   - Calendar view
   - @Zoe task queue

5. **`zoe-focus`**
   - Minimal orb + chat
   - Hidden chrome
   - Distraction-free interaction

**System 1/2 Integration:**

The Orb and UI visually represent which cognitive mode Zoe is operating in:

| Mode | Orb State | UI Indicators | Behavior |
|------|-----------|---------------|----------|
| **System 1** | Calm, steady | "S1" badge, blue accent | Fast responses, no deep reasoning |
| **System 2** | Active, pulsing | "S2" badge, amber accent | Deliberate thinking, tool use |
| **Transition** | Morphing | Animated badge | Switching between modes |

**Dashboard Parity:**

The current dashboard (ServiceMesh.tsx) maps to Looking Glass:

| Current | Looking Glass |
|---------|---------------|
| Service mesh SVG | `ServiceMeshMonitor` component |
| Container boxes | `ContainerStatusGrid` component |
| Status indicators | Orb state + status bar |
| Health dots | `StatsGrid` with health data |

---

### 6.4 Configuration Matrix

| Feature | Alice Demo | Through the Looking Glass | Zoe Full |
|---------|------------|---------------------------|----------|
| **Core** |
| Terminal Chat | ✓ | ✓ | ✓ |
| Markdown/Code | ✓ | ✓ | ✓ |
| Notifications | ✓ | ✓ | ✓ |
| Theme Switching | ✓ | ✓ | ✓ |
| **Shell** |
| Header/Footer | basic | full | full |
| Sidebar | - | ✓ | ✓ |
| Tab Bar | - | ✓ | ✓ |
| Navigation | - | demo | full |
| **Components** |
| Rich Components | - | ✓ | ✓ |
| UI Sets | - | ✓ | ✓ |
| Data Tables | - | demo data | real data |
| **Visualizations** |
| Orb | - | ✓ | ✓ |
| Audio Reactive | - | ✓ | ✓ |
| State Machines | - | ✓ | ✓ |
| **Integrations** |
| Claude API (direct) | ✓ | ✓ | - |
| Brain MCP | - | - | ✓ |
| Chat MCP | - | - | ✓ |
| Cheshire Memory | - | - | ✓ |
| Calendar/Tasks | - | - | ✓ |
| Discord | - | - | ✓ |
| **System** |
| System 1/2 | - | - | ✓ |
| Service Mesh | - | - | ✓ |
| Container Status | - | - | ✓ |
| Log Viewer | - | - | ✓ |
| **Persistence** |
| Session State | - | ✓ | ✓ |
| Preferences | - | ✓ | ✓ |
| Conversation History | - | demo | full |
| **Deployment** |
| Single Container | ✓ | ✓ | - |
| Docker Compose | ✓ | ✓ | ✓ |
| Requires Zoe Stack | - | - | ✓ |

---

### 6.5 Migration Path

```
                    ┌─────────────────┐
                    │   Alice Demo    │
                    │   (evaluate)    │
                    └────────┬────────┘
                             │
                             │ Add: shell, components,
                             │      visualizations
                             ▼
              ┌──────────────────────────────┐
              │  Through the Looking Glass   │
              │  (showcase / standalone)     │
              └──────────────┬───────────────┘
                             │
                             │ Add: Zoe backends,
                             │      real integrations
                             ▼
                    ┌─────────────────┐
                    │    Zoe Full     │
                    │  (production)   │
                    └─────────────────┘
```

**Upgrade paths:**

1. **Alice Demo → Through the Looking Glass**
   - Add `LOOKING_GLASS_MODE=showcase`
   - Add visualization/component modules
   - Optionally add Redis for session state

2. **Through the Looking Glass → Zoe Full**
   - Deploy within Zoe docker-compose
   - Configure MCP backend URLs
   - Switch to `zoe-main` UI Set
   - Remove direct Claude API key (Brain handles LLM)

---

## 7. Technical Decisions

### 7.1 Framework Choice: React + Vite

**Why React:**
- Mature ecosystem
- Component model fits spec well
- Zustand integrates naturally
- Three.js/D3 integration well-documented
- Team familiarity

**Why Vite:**
- Fast development builds
- ESM-native
- Good monorepo support
- Simple configuration

### 7.2 Styling: CSS Custom Properties + Tailwind

**Approach:**
- Design tokens generate CSS custom properties
- Tailwind for utility classes
- Component-scoped styles via CSS modules
- No runtime CSS-in-JS (performance)

```css
/* Generated from tokens */
:root {
  --color-bg: #0a0a0a;
  --color-text: #00ff00;
  --color-accent: #00ff00;
  --font-mono: 'JetBrains Mono', monospace;
}

/* Component styles reference tokens */
.message {
  font-family: var(--font-mono);
  color: var(--color-text);
}
```

### 7.3 State: Zustand

**Why Zustand over Redux/MobX:**
- Minimal boilerplate
- Built-in subscriptions with selectors
- Middleware for persistence
- TypeScript-first
- Small bundle size

### 7.4 MCP: Custom Implementation

**Why not use an existing MCP library:**
- Need tight integration with state
- Custom transport requirements
- Specific resource/subscription patterns
- Control over protocol evolution

### 7.5 Visualizations: Three.js + Canvas 2D

**Why not just WebGL directly:**
- Three.js abstracts boilerplate
- Better shader management
- Scene graph for complex visualizations
- Post-processing pipeline

**Why Canvas 2D for some renderers:**
- Simpler for 2D visualizations (waveforms)
- Better performance for non-3D
- Easier to debug

---

## 8. Repository Structure

```
looking-glass/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── release.yml
│   │   └── deploy-demo.yml
│   └── ISSUE_TEMPLATE/
├── packages/
│   ├── core/                 # @looking-glass/core
│   │   ├── src/
│   │   │   ├── mcp/          # MCP server implementation
│   │   │   ├── state/        # Zustand stores
│   │   │   ├── events/       # Event bus
│   │   │   └── transports/   # HTTP, WebSocket, stdio
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── shell/                # @looking-glass/shell
│   │   ├── src/
│   │   │   ├── components/   # Header, Footer, Sidebar, TabBar
│   │   │   ├── tools/        # MCP tool implementations
│   │   │   └── hooks/        # useShell, useTabs
│   │   └── package.json
│   ├── chat/                 # @looking-glass/chat
│   │   ├── src/
│   │   │   ├── components/   # MessageList, ChatInput
│   │   │   ├── hooks/        # useChat, useStreaming
│   │   │   └── markdown/     # Renderer config
│   │   └── package.json
│   ├── components/           # @looking-glass/components
│   │   ├── src/
│   │   │   ├── CardGrid/
│   │   │   ├── DataTable/
│   │   │   ├── Accordion/
│   │   │   ├── StatsGrid/
│   │   │   ├── Timeline/
│   │   │   └── Form/
│   │   └── package.json
│   ├── visualizations/       # @looking-glass/visualizations
│   │   ├── src/
│   │   │   ├── host/         # VisualizationHost component
│   │   │   ├── registry/     # Type registry
│   │   │   ├── renderers/    # Built-in renderers
│   │   │   │   ├── orb/
│   │   │   │   ├── waveform/
│   │   │   │   └── graph/
│   │   │   └── audio/        # Audio analysis
│   │   └── package.json
│   ├── tokens/               # @looking-glass/tokens
│   │   ├── src/
│   │   │   ├── store/        # Token store
│   │   │   ├── resolver/     # Resolution algorithm
│   │   │   └── css/          # CSS generation
│   │   └── package.json
│   ├── themes/               # @looking-glass/themes
│   │   ├── terminal/
│   │   ├── terminal-amber/
│   │   ├── terminal-cyan/
│   │   └── light/
│   └── app/                  # Main application
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── config/
│       ├── public/
│       └── package.json
├── apps/
│   └── demo/                 # Alice Demo standalone app
├── docs/                     # Documentation site
│   ├── getting-started.md
│   ├── api/
│   ├── guides/
│   └── examples/
├── examples/
│   ├── basic-chat/
│   ├── dashboard/
│   └── visualization/
├── docker/
│   ├── Dockerfile
│   ├── Dockerfile.demo
│   └── nginx.conf
├── turbo.json
├── package.json
├── tsconfig.json
├── LICENSE                   # MIT
└── README.md
```

---

## 9. Integration Points

### 9.1 With Alice (Cognitive Platform)

Looking Glass receives control commands from Alice:

```typescript
// Alice (System 2) decides to show a dashboard
await mcp.callTool("uiset.activate", {
  id: "task-dashboard",
  transition: { duration: 300 }
});

// Alice updates task status
await mcp.callTool("component.update", {
  instanceId: "task-table",
  data: { rows: updatedTasks }
});

// Alice transitions to thinking state
await mcp.callTool("viz.applyPreset", {
  instanceId: "main-orb",
  preset: "processing"
});
```

### 9.2 With Cheshire (Memory)

Looking Glass can browse Cheshire's memory:

```typescript
// Memory browser component requests data
const memories = await mcp.readResource("cheshire://memories/recent");
const vectors = await mcp.readResource("cheshire://vectors/similar?query=...");

// Display in Looking Glass
await mcp.callTool("component.render", {
  instanceId: "memory-browser",
  target: "memory-tab",
  component: {
    type: "data-table",
    data: { columns: memoryColumns, rows: memories }
  }
});
```

### 9.3 With Vorpal (Governance)

Looking Glass displays policy status:

```typescript
// Vorpal sends policy notifications
mcp.onNotification("vorpal/policyViolation", (violation) => {
  mcp.callTool("ui.showNotification", {
    title: "Policy Violation",
    message: violation.message,
    type: "warning"
  });
});

// Display governance dashboard
await mcp.callTool("uiset.activate", { id: "governance-dashboard" });
```

### 9.4 With Current Dashboard

The existing dashboard functionality maps to Looking Glass:

| Current Dashboard | Looking Glass Equivalent |
|-------------------|--------------------------|
| Service mesh SVG | `ServiceMesh` component in `zoe-dashboard` UI Set |
| Container status | `StatsGrid` component with status badges |
| Log viewer | `DataTable` component with log entries |
| Health indicators | `StatusIndicator` visualization |
| Memory stats | `Cheshire` integration + `StatsGrid` |

---

## 10. Success Metrics

### 10.1 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial load time | < 2s | Lighthouse |
| Time to interactive | < 3s | Lighthouse |
| MCP tool call latency | < 50ms | Internal metrics |
| Bundle size (core) | < 100KB | Bundlesize |
| Bundle size (full) | < 500KB | Bundlesize |
| Test coverage | > 80% | Jest/Vitest |

### 10.2 Adoption Metrics

| Metric | Target (6 months) | Measurement |
|--------|-------------------|-------------|
| GitHub stars | 500 | GitHub |
| npm downloads/week | 1,000 | npm stats |
| Integrations | 5 | Community reports |
| Contributors | 10 | GitHub |
| Issues resolved | 50 | GitHub |

### 10.3 Zoe-Specific Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Dashboard parity | 100% | Feature checklist |
| User preference | 80% prefer | User feedback |
| System 1/2 visibility | Clear | User testing |
| Response time | < 100ms | Internal metrics |

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| MCP spec changes | Medium | High | Version pinning, migration guides |
| Three.js bundle size | Medium | Medium | Lazy loading, tree shaking |
| Browser compatibility | Low | Medium | Progressive enhancement |
| Performance on mobile | Medium | Medium | Reduced motion, simpler renderers |
| Scope creep | High | Medium | Strict phase gates, MVP focus |
| Community adoption | Medium | Low | Good docs, examples, demos |

---

## 12. Open Questions

1. **Licensing**: MIT seems right for maximum adoption. Confirm?

2. **Branding**: Should Looking Glass have its own visual identity separate from Zoe, or be clearly "part of" the Wonderland ecosystem?

3. **Plugin System**: Should third-party components/visualizations be loadable at runtime, or only at build time?

4. **Offline Support**: Worth implementing service worker for offline usage?

5. **Mobile**: Dedicated mobile UI, or responsive terminal aesthetic?

6. **Accessibility**: How far to push terminal aesthetic while maintaining accessibility?

---

## 13. Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 0. Foundation | Week 1-2 | Core infrastructure |
| 1. Basic Chat | Week 3-4 | **Alice Demo** (standalone) |
| 2. Shell & Navigation | Week 5-6 | Multi-tab interface |
| 3. Rich Components | Week 7-8 | Dashboard-style layouts |
| 4. UI Sets | Week 9-10 | Bundled configurations |
| 5. Design Tokens | Week 11-12 | Runtime theming |
| 6. Visualizations | Week 13-14 | Orb, waveforms |
| 7. Zoe Integration | Week 15-16 | **zoe.mr0.us migration** |
| 8. Polish & Release | Week 17-18 | **v1.0.0 release** |

**Total: ~18 weeks to v1.0.0**

---

## 14. Next Steps

1. **Create repository**: `ZoeHQ/looking-glass` or `looking-glass-ui/looking-glass`?
2. **Initialize monorepo**: Turborepo + pnpm
3. **Implement Phase 0**: Core package skeleton
4. **Write contribution guidelines**: For future community
5. **Design logo/branding**: Looking Glass visual identity

---

*"Begin at the beginning," the King said, very gravely, "and go on till you come to the end: then stop."*

---

**Document Version:** 1.0.0
**Last Updated:** 2026-01-07
**Author:** Ross + Claude (Architect Mode)

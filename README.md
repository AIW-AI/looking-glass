# Looking Glass

> *"But I don't want to go among mad people," Alice remarked.*
> *"Oh, you can't help that," said the Cat: "we're all mad here."*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)

**Looking Glass** is an open-source, self-controllable chat UI that implements the MCP (Model Context Protocol) control surface specification. It serves as the visual interface layer for AI systems that need to express themselves beyond text—through navigation, visualization, theming, and rich component layouts.

Looking Glass is the window through which users peer into Wonderland.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Packages](#packages)
- [Architecture](#architecture)
- [Core Concepts](#core-concepts)
- [Usage Examples](#usage-examples)
- [Deployment Modes](#deployment-modes)
- [Development](#development)
- [Documentation](#documentation)
- [The Wonderland Ecosystem](#the-wonderland-ecosystem)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Terminal Aesthetic
Matrix/terminal visual language designed for technical users:
- Monospace typography (JetBrains Mono)
- Box-drawing characters for structure
- Green-on-black default theme (amber, cyan variants available)
- High contrast for accessibility
- Optional CRT/scanline effects

### MCP Protocol
Full implementation of the Model Context Protocol:
- **Tools**: Register and call UI manipulation tools
- **Resources**: Expose UI state as readable resources
- **Notifications**: Real-time updates via SSE or WebSocket
- **Subscriptions**: Subscribe to state changes

### Progressive Enhancement
Works at multiple capability levels:

| Level | Capabilities | Use Case |
|-------|-------------|----------|
| Terminal | Text only | SSH, basic terminals |
| Basic | Text + notifications | Simple chat apps |
| Standard | + Shell, tabs, panels | Most deployments |
| Rich | + Components, tokens | Dashboard views |
| Full | + Visualizations, audio | Immersive experiences |

### Modular Architecture
Use only what you need:
```typescript
// Minimal setup
import { createLookingGlass } from '@looking-glass/core';
import { Chat } from '@looking-glass/chat';

// Full setup
import { Shell, Sidebar, TabBar } from '@looking-glass/shell';
import { CardGrid, DataTable } from '@looking-glass/components';
import { OrbRenderer } from '@looking-glass/visualizations';
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone git@github.com:AIW-AI/looking-glass.git
cd looking-glass

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start the demo
pnpm dev
```

Open http://localhost:3000 to see the Alice Demo.

### Using in Your Project

```bash
pnpm add @looking-glass/core @looking-glass/chat @looking-glass/shell
```

```tsx
import { createLookingGlass, useLookingGlassStore } from '@looking-glass/core';
import { Shell } from '@looking-glass/shell';
import { Chat } from '@looking-glass/chat';

// Initialize
const lg = createLookingGlass({
  transport: { type: 'embedded' },
  theme: 'terminal',
});

function App() {
  useEffect(() => {
    lg.start();
    return () => lg.stop();
  }, []);

  return (
    <Shell>
      <Chat onSendMessage={(msg) => console.log(msg)} />
    </Shell>
  );
}
```

---

## Packages

| Package | Description | Size |
|---------|-------------|------|
| [`@looking-glass/core`](packages/core) | MCP server, state management, event bus, transports | ~41KB |
| [`@looking-glass/shell`](packages/shell) | Header, footer, sidebar, tab bar components | ~8KB |
| [`@looking-glass/chat`](packages/chat) | Message list, chat input, streaming support | ~8KB |
| `@looking-glass/components` | Rich UI components (cards, tables, accordions) | *Planned* |
| `@looking-glass/visualizations` | WebGL/Canvas visualizations (orb, waveform) | *Planned* |
| `@looking-glass/tokens` | Design token system | *Planned* |
| `@looking-glass/themes` | Pre-built theme packages | *Planned* |

---

## Architecture

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
│  │                         STATE LAYER (Zustand)                      │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │ │
│  │  │ UI Sets │ │  Shell  │ │   UI    │ │  Chat   │ │ Tokens  │     │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                    │                                    │
│  ┌─────────────────────────────────┴───────────────────────────────────┐│
│  │                         MCP LAYER                                   ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐        ││
│  │  │  Tools  │  │Resources│  │ Notifs  │  │   Transports    │        ││
│  │  │         │  │         │  │         │  │ HTTP/WS/Embedded│        ││
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘        ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                   ┌─────────────────┼─────────────────┐
                   │                 │                 │
             ┌─────┴─────┐    ┌──────┴──────┐   ┌─────┴─────┐
             │    AI     │    │  Dashboard  │   │  External │
             │  (Claude) │    │    Agent    │   │  Service  │
             └───────────┘    └─────────────┘   └───────────┘
```

### Layer Breakdown

1. **MCP Layer**: Protocol implementation handling tool calls, resources, and notifications
2. **State Layer**: Zustand-based reactive state management
3. **Render Layer**: React components subscribing to state changes

See [Architecture Documentation](docs/architecture/README.md) for details.

---

## Core Concepts

### MCP Tools

Looking Glass exposes UI manipulation as MCP tools:

```typescript
// Built-in tools
await mcp.callTool('ui.setTheme', { theme: 'terminal-amber' });
await mcp.callTool('ui.showNotification', {
  title: 'Hello',
  message: 'World',
  type: 'info'
});
await mcp.callTool('shell.toggleSidebar', {});
await mcp.callTool('tabs.open', { id: 'tasks', label: 'Tasks' });
await mcp.callTool('chat.addMessage', {
  role: 'assistant',
  content: 'Hello!'
});
```

### State Management

All UI state is managed through Zustand stores:

```typescript
import { useLookingGlassStore } from '@looking-glass/core';

function MyComponent() {
  // Subscribe to specific state slices
  const theme = useLookingGlassStore(state => state.ui.theme);
  const messages = useLookingGlassStore(state => state.chat.messages);
  const isStreaming = useLookingGlassStore(state => state.chat.isStreaming);

  // Get actions
  const addMessage = useLookingGlassStore(state => state.addMessage);
  const setTheme = useLookingGlassStore(state => state.setTheme);
}
```

### Event Bus

Internal pub/sub for decoupled communication:

```typescript
import { getEventBus, Events } from '@looking-glass/core';

const eventBus = getEventBus();

// Subscribe to events
const unsubscribe = eventBus.on(Events.CHAT_MESSAGE_ADDED, (message) => {
  console.log('New message:', message);
});

// Emit events
eventBus.emit(Events.UI_THEME_CHANGED, { theme: 'terminal' });
```

### Transports

Multiple transport options for MCP communication:

```typescript
import { createLookingGlass } from '@looking-glass/core';

// HTTP + Server-Sent Events (web)
const lg = createLookingGlass({
  transport: { type: 'http-sse', url: 'https://api.example.com' }
});

// WebSocket (full duplex)
const lg = createLookingGlass({
  transport: { type: 'websocket', url: 'wss://api.example.com' }
});

// Embedded (testing/in-process)
const lg = createLookingGlass({
  transport: { type: 'embedded' }
});
```

---

## Usage Examples

### Basic Chat Application

```tsx
import { useEffect } from 'react';
import { createLookingGlass, useLookingGlassStore } from '@looking-glass/core';
import { Shell } from '@looking-glass/shell';
import { Chat } from '@looking-glass/chat';

const lg = createLookingGlass({
  transport: { type: 'embedded' },
  theme: 'terminal',
});

export function App() {
  const addMessage = useLookingGlassStore(s => s.addMessage);
  const setStreaming = useLookingGlassStore(s => s.setStreaming);

  useEffect(() => {
    lg.start();
    return () => lg.stop();
  }, []);

  const handleSend = async (message: string) => {
    setStreaming(true);

    // Call your AI API here
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    const data = await response.json();

    addMessage({ role: 'assistant', content: data.response });
    setStreaming(false);
  };

  return (
    <Shell showSidebar={false}>
      <Chat onSendMessage={handleSend} />
    </Shell>
  );
}
```

### Programmatic UI Control

```typescript
// From an AI agent or external process
const lg = createLookingGlass({ transport: { type: 'websocket', url: '...' } });
await lg.start();

// Show a notification
lg.server.callTool('ui.showNotification', {
  title: 'Task Complete',
  message: 'Your analysis is ready',
  type: 'success',
});

// Open a new tab
lg.server.callTool('tabs.open', {
  id: 'results',
  label: 'Results',
  content: 'analysis-results',
});

// Inject a message
lg.server.callTool('chat.addMessage', {
  role: 'assistant',
  content: 'I\'ve completed the analysis. Check the **Results** tab.',
});
```

### Custom Tool Registration

```typescript
import { getMCPServer, defineTool } from '@looking-glass/core';

const server = getMCPServer();

server.registerTool(
  defineTool()
    .name('custom.myTool')
    .description('Does something custom')
    .input({
      type: 'object',
      properties: {
        param1: { type: 'string', description: 'First parameter' },
      },
      required: ['param1'],
    })
    .handler(async (params) => {
      const { param1 } = params as { param1: string };
      // Your logic here
      return { success: true, data: { result: param1.toUpperCase() } };
    })
    .build()
);
```

---

## Deployment Modes

### Alice Demo (Minimal)

Simple terminal-style chat interface for evaluating Looking Glass.

```bash
# Local development
pnpm dev

# Docker
docker build -f docker/Dockerfile.demo -t looking-glass-demo .
docker run -p 3000:3000 looking-glass-demo
```

**Capabilities:**
- Terminal aesthetic chat
- Basic shell (header/footer)
- Notifications
- Theme switching
- Markdown rendering

### Through the Looking Glass (Showcase)

Full UI capabilities with visualizations and rich components.

```bash
docker run -p 3000:3000 \
  -e LOOKING_GLASS_MODE=showcase \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  ghcr.io/aiw-ai/looking-glass:latest
```

**Additional capabilities:**
- Sidebar navigation
- Tab management
- Rich components
- Orb visualization
- Audio reactivity

### Zoe Full (Production)

Complete integration with the Wonderland ecosystem.

See [Deployment Guide](docs/guides/deployment.md) for production configuration.

---

## Development

### Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Development mode (watch)
pnpm dev

# Run tests
pnpm test

# Lint
pnpm lint

# Format code
pnpm format

# Clean build artifacts
pnpm clean
```

### Project Structure

```
looking-glass/
├── packages/
│   ├── core/           # @looking-glass/core
│   │   ├── src/
│   │   │   ├── mcp/        # MCP server implementation
│   │   │   ├── state/      # Zustand stores
│   │   │   ├── events/     # Event bus
│   │   │   ├── transports/ # HTTP, WebSocket, embedded
│   │   │   └── types/      # TypeScript definitions
│   │   └── package.json
│   ├── shell/          # @looking-glass/shell
│   │   ├── src/
│   │   │   └── components/ # Header, Footer, Sidebar, TabBar
│   │   └── package.json
│   └── chat/           # @looking-glass/chat
│       ├── src/
│       │   └── components/ # Message, MessageList, ChatInput
│       └── package.json
├── apps/
│   └── demo/           # Alice Demo application
├── docs/               # Documentation
├── turbo.json          # Turborepo config
└── package.json        # Root package.json
```

### Tech Stack

- **Build**: Turborepo + pnpm workspaces
- **Language**: TypeScript 5.3
- **UI**: React 18
- **State**: Zustand
- **Bundler**: tsup (libraries), Vite (apps)
- **Styling**: CSS custom properties + Tailwind utilities

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture/README.md) | System design and data flow |
| [Developer Guide](docs/guides/developer-guide.md) | Getting started for contributors |
| [API Reference](docs/api/README.md) | Complete API documentation |
| [Deployment](docs/guides/deployment.md) | Production deployment guide |
| [Contributing](CONTRIBUTING.md) | Contribution guidelines |

---

## The Wonderland Ecosystem

Looking Glass exists within a broader mythology of AI infrastructure components:

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

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Commit with conventional commits: `git commit -m "feat: add new feature"`
6. Push and open a PR

### Code Style

- TypeScript strict mode
- Functional React components
- Explicit return types on exports
- No `any` types

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <i>"Begin at the beginning," the King said, very gravely, "and go on till you come to the end: then stop."</i>
</p>

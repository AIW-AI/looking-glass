# Looking Glass

> *"But I don't want to go among mad people," Alice remarked.*
> *"Oh, you can't help that," said the Cat: "we're all mad here."*

**Looking Glass** is an open-source, self-controllable chat UI that implements the MCP-based control surface specification. It serves as the visual interface layer for AI systems that need to express themselves beyond text—through navigation, visualization, theming, and rich component layouts.

Looking Glass is the window through which users peer into Wonderland.

## Features

- **Terminal Aesthetic**: Matrix/terminal visual language with monospace typography, box-drawing characters, and high contrast
- **MCP Protocol**: Full implementation of the Model Context Protocol for programmatic UI control
- **Progressive Enhancement**: Works from basic text-only to rich visualizations
- **Modular Architecture**: Use only what you need - core, shell, chat, components, visualizations

## Packages

| Package | Description |
|---------|-------------|
| `@looking-glass/core` | MCP server, state management, event bus, transports |
| `@looking-glass/shell` | Header, footer, sidebar, tab bar components |
| `@looking-glass/chat` | Message list, chat input, streaming support |
| `@looking-glass/components` | Rich UI components (cards, tables, accordions) |
| `@looking-glass/visualizations` | WebGL/Canvas visualizations (orb, waveform) |
| `@looking-glass/tokens` | Design token system |
| `@looking-glass/themes` | Pre-built theme packages |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/looking-glass.git
cd looking-glass

# Install dependencies
pnpm install

# Start the demo
pnpm dev
```

## Development

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint

# Format
pnpm format
```

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
│  └───────────────────────────────────────────────────────────────────┘ │
│                                    │                                    │
│  ┌─────────────────────────────────┴───────────────────────────────────┐│
│  │                         MCP LAYER                                   ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐        ││
│  │  │  Tools  │  │Resources│  │ Notifs  │  │ Subscriptions   │        ││
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘        ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

## Deployment Modes

### Alice Demo (Minimal)
Simple terminal-style chat interface for evaluating Looking Glass.

```bash
docker run -p 3000:3000 ghcr.io/your-org/looking-glass:demo
```

### Through the Looking Glass (Showcase)
Full UI capabilities including orb visualization and rich components.

### Zoe Full (Production)
Complete integration with the Wonderland ecosystem.

## License

MIT

---

*"Begin at the beginning," the King said, very gravely, "and go on till you come to the end: then stop."*

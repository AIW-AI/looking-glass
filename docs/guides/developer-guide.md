# Developer Guide

This guide covers everything you need to know to develop Looking Glass or build applications with it.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Creating Components](#creating-components)
5. [Working with State](#working-with-state)
6. [Registering Tools](#registering-tools)
7. [Styling Guide](#styling-guide)
8. [Testing](#testing)
9. [Building Packages](#building-packages)
10. [Common Patterns](#common-patterns)

---

## Getting Started

### Prerequisites

- **Node.js 20+**: Required for modern JavaScript features
- **pnpm 8+**: Package manager (faster, more efficient than npm)
- **Git**: Version control

### Initial Setup

```bash
# Clone the repository
git clone git@github.com:AIW-AI/looking-glass.git
cd looking-glass

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development server
pnpm dev
```

The development server runs at http://localhost:3000.

### IDE Setup

**VS Code** (recommended):

```json
// .vscode/settings.json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

**Extensions**:
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar) - for better TS support

---

## Project Structure

```
looking-glass/
├── packages/                 # Library packages
│   ├── core/                 # @looking-glass/core
│   │   ├── src/
│   │   │   ├── mcp/          # MCP protocol implementation
│   │   │   ├── state/        # Zustand state management
│   │   │   ├── events/       # Event bus
│   │   │   ├── transports/   # Communication transports
│   │   │   └── types/        # TypeScript types
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── shell/                # @looking-glass/shell
│   │   └── src/components/   # Shell components
│   └── chat/                 # @looking-glass/chat
│       └── src/components/   # Chat components
├── apps/
│   └── demo/                 # Demo application
│       ├── src/
│       │   ├── App.tsx       # Main app component
│       │   ├── main.tsx      # Entry point
│       │   └── styles/       # CSS files
│       └── index.html
├── docs/                     # Documentation
├── turbo.json                # Turborepo configuration
├── pnpm-workspace.yaml       # Workspace configuration
└── package.json              # Root package.json
```

### Package Naming

- `@looking-glass/core` - Core functionality
- `@looking-glass/shell` - Shell components
- `@looking-glass/chat` - Chat components
- `@looking-glass/demo` - Demo app (private)

---

## Development Workflow

### Running Development Server

```bash
# Run all packages in dev mode
pnpm dev

# Run specific package
pnpm --filter @looking-glass/core dev
pnpm --filter @looking-glass/demo dev
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @looking-glass/core build

# Clean and rebuild
pnpm clean && pnpm build
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @looking-glass/core test

# Watch mode
pnpm --filter @looking-glass/core test:watch
```

### Linting

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format
```

---

## Creating Components

### Shell Component Example

```tsx
// packages/shell/src/components/MyComponent.tsx
import { useLookingGlassStore } from '@looking-glass/core';

export interface MyComponentProps {
  className?: string;
  title?: string;
}

export function MyComponent({ className = '', title }: MyComponentProps) {
  // Access state
  const theme = useLookingGlassStore(state => state.ui.theme);

  // Access actions
  const setTheme = useLookingGlassStore(state => state.setTheme);

  return (
    <div className={`lg-my-component ${className}`}>
      <h2>{title}</h2>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('terminal-amber')}>
        Change Theme
      </button>
    </div>
  );
}
```

### Export from Package

```typescript
// packages/shell/src/index.ts
export { MyComponent } from './components/MyComponent.js';
export type { MyComponentProps } from './components/MyComponent.js';
```

### Component Guidelines

1. **Prefix classes with `lg-`**: All CSS classes should start with `lg-` (looking-glass)
2. **Use state from core**: Import `useLookingGlassStore` from `@looking-glass/core`
3. **Accept `className` prop**: Allow consumers to add custom classes
4. **Export types**: Always export prop interfaces
5. **Use `.js` extensions**: Required for ESM imports

---

## Working with State

### Reading State

```typescript
import { useLookingGlassStore } from '@looking-glass/core';

function MyComponent() {
  // Select specific slices for performance
  const theme = useLookingGlassStore(state => state.ui.theme);
  const messages = useLookingGlassStore(state => state.chat.messages);

  // Multiple values (creates object reference - careful with re-renders)
  const { theme, layout } = useLookingGlassStore(state => ({
    theme: state.ui.theme,
    layout: state.ui.layout,
  }));
}
```

### Updating State

```typescript
import { useLookingGlassStore } from '@looking-glass/core';

function MyComponent() {
  // Get actions
  const setTheme = useLookingGlassStore(state => state.setTheme);
  const addMessage = useLookingGlassStore(state => state.addMessage);
  const showNotification = useLookingGlassStore(state => state.showNotification);

  // Use them
  const handleClick = () => {
    setTheme('terminal-amber');
    addMessage({ role: 'system', content: 'Theme changed!' });
    showNotification({
      title: 'Success',
      message: 'Theme updated',
      type: 'success',
    });
  };
}
```

### Subscribing to Changes

```typescript
import { useLookingGlassStore } from '@looking-glass/core';
import { useEffect } from 'react';

function MyComponent() {
  useEffect(() => {
    // Subscribe to theme changes
    const unsubscribe = useLookingGlassStore.subscribe(
      state => state.ui.theme,
      (theme, prevTheme) => {
        console.log(`Theme changed: ${prevTheme} → ${theme}`);
      }
    );

    return unsubscribe;
  }, []);
}
```

### State Outside React

```typescript
import { useLookingGlassStore } from '@looking-glass/core';

// Get current state
const state = useLookingGlassStore.getState();
console.log(state.ui.theme);

// Call actions
useLookingGlassStore.getState().setTheme('terminal');
```

---

## Registering Tools

### Basic Tool Registration

```typescript
import { getMCPServer, defineTool } from '@looking-glass/core';

const server = getMCPServer();

server.registerTool(
  defineTool()
    .name('mypackage.doSomething')
    .description('Does something useful')
    .input({
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The message to process',
        },
        count: {
          type: 'number',
          description: 'Number of times to repeat',
          default: 1,
        },
      },
      required: ['message'],
    })
    .handler(async (params) => {
      const { message, count = 1 } = params as { message: string; count?: number };

      // Do something
      const result = message.repeat(count);

      return {
        success: true,
        data: { result },
      };
    })
    .build()
);
```

### Tool with State Access

```typescript
import { getMCPServer, defineTool, useLookingGlassStore } from '@looking-glass/core';

const server = getMCPServer();

server.registerTool(
  defineTool()
    .name('mypackage.updateUI')
    .description('Updates the UI based on input')
    .input({
      type: 'object',
      properties: {
        theme: { type: 'string' },
        message: { type: 'string' },
      },
    })
    .handler(async (params) => {
      const { theme, message } = params as { theme?: string; message?: string };
      const store = useLookingGlassStore.getState();

      if (theme) {
        store.setTheme(theme);
      }

      if (message) {
        store.addMessage({ role: 'assistant', content: message });
      }

      return { success: true };
    })
    .build()
);
```

### Tool Naming Conventions

- Use dot notation: `package.action`
- Examples: `ui.setTheme`, `shell.toggleSidebar`, `tabs.open`
- Custom tools: `custom.myTool` or `myapp.doThing`

---

## Styling Guide

### CSS Custom Properties

All styling uses CSS custom properties defined in themes:

```css
/* Using tokens */
.lg-my-component {
  background: var(--color-bg);
  color: var(--color-text);
  border: var(--border-width) solid var(--color-border);
  font-family: var(--font-mono);
  padding: var(--space-4);
}
```

### Available Tokens

```css
/* Colors */
--color-bg
--color-bg-elevated
--color-bg-hover
--color-text
--color-text-dim
--color-text-muted
--color-accent
--color-accent-bright
--color-border
--color-error
--color-warning
--color-success
--color-info

/* Typography */
--font-mono
--font-size-xs
--font-size-sm
--font-size-base
--font-size-lg
--font-size-xl

/* Spacing */
--space-1  (0.25rem)
--space-2  (0.5rem)
--space-3  (0.75rem)
--space-4  (1rem)
--space-6  (1.5rem)
--space-8  (2rem)

/* Borders */
--radius-sm
--radius-md
--border-width

/* Transitions */
--transition-fast
--transition-normal
```

### BEM Naming

Use BEM (Block Element Modifier) with `lg-` prefix:

```css
/* Block */
.lg-message { }

/* Element */
.lg-message__header { }
.lg-message__content { }

/* Modifier */
.lg-message--user { }
.lg-message--assistant { }
.lg-message--system { }
```

### Adding Styles

For demo app:
```
apps/demo/src/styles/terminal.css
```

For packages (when CSS modules are added):
```
packages/shell/src/components/MyComponent.module.css
```

---

## Testing

### Unit Tests

```typescript
// packages/core/src/events/index.test.ts
import { describe, it, expect, vi } from 'vitest';
import { EventBus } from './index';

describe('EventBus', () => {
  it('should emit events to subscribers', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('test', handler);
    bus.emit('test', { data: 'hello' });

    expect(handler).toHaveBeenCalledWith({ data: 'hello' });
  });

  it('should support once subscriptions', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.once('test', handler);
    bus.emit('test', {});
    bus.emit('test', {});

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
```

### Component Tests

```typescript
// packages/chat/src/components/Message.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Message } from './Message';

describe('Message', () => {
  it('should render user messages', () => {
    render(
      <Message
        message={{
          id: '1',
          role: 'user',
          content: 'Hello world',
          timestamp: Date.now(),
        }}
      />
    );

    expect(screen.getByText('USER:')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});
```

### Test Configuration

Tests use Vitest. Configuration in `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

---

## Building Packages

### Package Build (tsup)

Libraries use `tsup` for building:

```bash
# Build command in package.json
"build": "tsup src/index.ts --format esm --dts --clean"
```

Options:
- `--format esm`: ESM output only
- `--dts`: Generate TypeScript declarations
- `--clean`: Clean output directory first
- `--external react`: Don't bundle React

### App Build (Vite)

The demo app uses Vite:

```bash
# Build command
"build": "tsc && vite build"
```

### Turborepo Caching

Builds are cached by Turborepo. To force rebuild:

```bash
pnpm clean && pnpm build
```

---

## Common Patterns

### Conditional Rendering

```tsx
function MyComponent() {
  const isStreaming = useLookingGlassStore(state => state.chat.isStreaming);
  const hasTabs = useLookingGlassStore(state => state.shell.tabs.items.length > 0);

  return (
    <div>
      {hasTabs && <TabBar />}
      {isStreaming && <LoadingIndicator />}
    </div>
  );
}
```

### Event Handling

```tsx
function ChatInput({ onSend }: { onSend?: (msg: string) => void }) {
  const [value, setValue] = useState('');
  const addMessage = useLookingGlassStore(state => state.addMessage);

  const handleSend = () => {
    if (!value.trim()) return;

    addMessage({ role: 'user', content: value });
    onSend?.(value);
    setValue('');
  };

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
    />
  );
}
```

### Initialization

```tsx
function App() {
  const lg = useMemo(() => createLookingGlass({
    transport: { type: 'embedded' },
    theme: 'terminal',
  }), []);

  useEffect(() => {
    lg.start();
    return () => { lg.stop(); };
  }, [lg]);

  return <Shell><Chat /></Shell>;
}
```

### Custom Hooks

```typescript
// useTheme hook
function useTheme() {
  const theme = useLookingGlassStore(state => state.ui.theme);
  const setTheme = useLookingGlassStore(state => state.setTheme);
  return { theme, setTheme };
}

// useMessages hook
function useMessages() {
  const messages = useLookingGlassStore(state => state.chat.messages);
  const addMessage = useLookingGlassStore(state => state.addMessage);
  const clearMessages = useLookingGlassStore(state => state.clearMessages);
  return { messages, addMessage, clearMessages };
}
```

---

## Troubleshooting

### Build Errors

**"Cannot find module"**:
- Check `.js` extensions on imports
- Run `pnpm build` to rebuild packages
- Check `exports` in package.json

**TypeScript errors**:
- Run `pnpm build` (DTS build happens during build)
- Check `tsconfig.json` extends correctly

### Development Issues

**Changes not appearing**:
- Check if running `pnpm dev` (watch mode)
- Try hard refresh (Cmd+Shift+R)
- Clear Vite cache: `rm -rf node_modules/.vite`

**State not updating**:
- Check selector is returning new reference for objects
- Use primitive selectors when possible
- Check action is being called correctly

---

## Next Steps

- Read [Architecture Documentation](../architecture/README.md) for system design
- See [API Reference](../api/README.md) for complete API docs
- Check [Contributing Guide](../../CONTRIBUTING.md) for contribution process

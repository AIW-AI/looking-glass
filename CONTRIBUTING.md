# Contributing to Looking Glass

Thank you for your interest in contributing to Looking Glass! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Guidelines](#issue-guidelines)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

**In short**: Be respectful, be constructive, be patient.

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone git@github.com:YOUR_USERNAME/looking-glass.git
   cd looking-glass
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream git@github.com:AIW-AI/looking-glass.git
   ```

### Install Dependencies

```bash
pnpm install
```

### Build

```bash
pnpm build
```

### Run Development Server

```bash
pnpm dev
```

---

## Development Setup

### Recommended IDE

**VS Code** with these extensions:
- ESLint
- Prettier - Code formatter
- TypeScript Vue Plugin (Volar)

### VS Code Settings

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/my-bugfix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add tests for new functionality
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint code
pnpm lint

# Format code
pnpm format
```

### 4. Commit Your Changes

See [Commit Guidelines](#commit-guidelines) below.

### 5. Push and Create PR

```bash
git push origin feature/my-feature
```

Then open a Pull Request on GitHub.

---

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, semicolons) |
| `refactor` | Code change that neither fixes bug nor adds feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, etc. |

### Scopes

| Scope | Description |
|-------|-------------|
| `core` | @looking-glass/core |
| `shell` | @looking-glass/shell |
| `chat` | @looking-glass/chat |
| `demo` | Demo application |
| `docs` | Documentation |
| `deps` | Dependencies |

### Examples

```bash
# Feature
git commit -m "feat(chat): add message reactions"

# Bug fix
git commit -m "fix(core): prevent duplicate tool registration"

# Documentation
git commit -m "docs: add API reference for EventBus"

# Breaking change
git commit -m "feat(core)!: rename useLGStore to useLookingGlassStore

BREAKING CHANGE: Store hook renamed for clarity"
```

---

## Pull Request Process

### Before Submitting

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**:
   ```bash
   pnpm build
   pnpm test
   pnpm lint
   ```

3. **Update documentation** if needed

### PR Title

Use conventional commit format:
```
feat(core): add WebSocket reconnection logic
```

### PR Description Template

```markdown
## Summary
Brief description of changes.

## Changes
- Change 1
- Change 2

## Testing
How was this tested?

## Screenshots (if applicable)

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Follows code style
- [ ] No breaking changes (or documented)
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged

---

## Code Style

### TypeScript

- Use TypeScript strict mode
- Explicit return types on exports
- No `any` types (use `unknown` if needed)
- Prefer `interface` over `type` for objects

```typescript
// Good
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Avoid
export function calculateTotal(items: any): any {
  return items.reduce((sum: any, item: any) => sum + item.price, 0);
}
```

### React

- Functional components only
- Use hooks for state and effects
- Destructure props
- Name event handlers `handle*`

```tsx
// Good
export function Button({ label, onClick }: ButtonProps) {
  const handleClick = () => {
    onClick?.();
  };

  return <button onClick={handleClick}>{label}</button>;
}

// Avoid
export function Button(props: any) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

### CSS

- Use BEM naming with `lg-` prefix
- Use CSS custom properties for theming
- Mobile-first responsive design

```css
/* Good */
.lg-button {
  background: var(--color-accent);
  padding: var(--space-2) var(--space-4);
}

.lg-button--primary {
  font-weight: 700;
}

.lg-button__icon {
  margin-right: var(--space-2);
}
```

### File Organization

```
src/
├── components/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   └── Button.module.css (when CSS modules added)
├── hooks/
│   └── useTheme.ts
├── utils/
│   └── helpers.ts
└── index.ts
```

---

## Testing

### Running Tests

```bash
# All packages
pnpm test

# Specific package
pnpm --filter @looking-glass/core test

# Watch mode
pnpm --filter @looking-glass/core test:watch
```

### Writing Tests

We use Vitest for testing.

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('MyFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### Test Coverage

We aim for high test coverage on:
- Core utilities and helpers
- State management logic
- MCP protocol handlers
- Event bus functionality

---

## Documentation

### When to Update Docs

- Adding new features
- Changing APIs
- Fixing bugs that affect usage
- Improving existing explanations

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `CONTRIBUTING.md` | This file |
| `docs/architecture/` | System design |
| `docs/guides/` | How-to guides |
| `docs/api/` | API reference |

### Writing Style

- Use clear, concise language
- Provide code examples
- Use proper markdown formatting
- Keep examples up-to-date

---

## Issue Guidelines

### Reporting Bugs

Use the bug report template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable.

**Environment:**
- OS: [e.g., macOS 14]
- Node: [e.g., 20.10.0]
- Browser: [e.g., Chrome 120]
```

### Feature Requests

Use the feature request template:

```markdown
**Is this related to a problem?**
A description of the problem.

**Describe the solution**
What you'd like to happen.

**Alternatives considered**
Other solutions you've thought about.

**Additional context**
Any other context.
```

### Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `feature` | New feature request |
| `docs` | Documentation improvement |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |

---

## Questions?

- Open a [Discussion](https://github.com/AIW-AI/looking-glass/discussions)
- Check existing [Issues](https://github.com/AIW-AI/looking-glass/issues)

Thank you for contributing!

---

*"We're all mad here."* — Cheshire Cat

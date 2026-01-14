/**
 * Built-in Theme Definitions
 *
 * These themes are registered on startup and available immediately.
 * External services can register additional themes via ui.registerTheme.
 */

import type { ThemeDefinition } from '../types/index.js';

// ============================================================================
// Terminal Theme - Default Style
// ============================================================================

export const terminalTheme: ThemeDefinition = {
  id: 'terminal',
  name: 'Terminal',
  description: 'Classic terminal aesthetic with teal accents',
  variables: {
    '--color-black': '#0a0a0a',
    '--color-dark': '#1a1a1a',
    '--color-gray-dark': '#2a2a2a',
    '--color-gray': '#4a4a4a',
    '--color-gray-light': '#8a8a8a',
    '--color-white': '#ffffff',
    '--color-teal': '#14b8a6',
    '--color-teal-dim': '#0d9488',
    '--color-teal-bright': '#2dd4bf',
    '--color-emerald': '#10b981',
    '--color-amber': '#f59e0b',
    '--color-violet': '#8b5cf6',
    '--color-cyan': '#06b6d4',
    '--color-red': '#ef4444',
    '--color-bg': '#0a0a0a',
    '--color-bg-elevated': '#1a1a1a',
    '--color-bg-hover': '#2a2a2a',
    '--color-text': '#14b8a6',
    '--color-text-dim': '#0d9488',
    '--color-text-muted': '#4a4a4a',
    '--color-accent': '#14b8a6',
    '--color-accent-bright': '#2dd4bf',
    '--color-border': '#2a2a2a',
    '--color-error': '#ef4444',
    '--color-warning': '#f59e0b',
    '--color-success': '#10b981',
    '--color-info': '#06b6d4',
    '--font-mono': '"SF Mono", "Fira Code", "Consolas", monospace',
    '--font-size-xs': '0.75rem',
    '--font-size-sm': '0.875rem',
    '--font-size-base': '1rem',
    '--font-size-lg': '1.125rem',
    '--font-size-xl': '1.25rem',
    '--space-1': '0.25rem',
    '--space-2': '0.5rem',
    '--space-3': '0.75rem',
    '--space-4': '1rem',
    '--space-6': '1.5rem',
    '--space-8': '2rem',
    '--radius-sm': '2px',
    '--radius-md': '4px',
    '--radius-lg': '8px',
    '--border-width': '1px',
  },
  meta: {
    author: 'Looking Glass',
    version: '1.0.0',
    category: 'dark',
  },
};

// ============================================================================
// All Built-in Themes
// ============================================================================

export const builtInThemes: ThemeDefinition[] = [terminalTheme];

/**
 * Register all built-in themes with the store
 */
export function registerBuiltInThemes(registerFn: (theme: ThemeDefinition) => void): void {
  for (const theme of builtInThemes) {
    registerFn(theme);
  }
}

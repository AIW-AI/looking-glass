# Self-Controllable Chat UI Specification v2

## Abstract

This specification defines an architectural pattern for chat applications that expose their own user interface configuration and state as a Model Context Protocol (MCP) server surface. This enables external processes—including but not limited to the LLM the application communicates with—to programmatically mutate the UI through a standardized protocol.

This specification supports applications ranging from simple chat interfaces to rich dashboard-style UIs with navigation, tabs, and complex component hierarchies.

---

## 1. Introduction

### 1.1 Problem Statement

Traditional chat UIs are tightly coupled to their LLM interaction loop. The interface responds only to:
1. Direct user input (typing, clicking)
2. LLM responses (rendered as they arrive)

This creates limitations:
- Background processes cannot signal completion through the UI
- Long-running tasks have no mechanism to update the interface asynchronously
- The LLM cannot request interface changes (dark mode, split view, focus panels)
- External systems cannot coordinate with the user's active session
- **Rich visualizations** (3D, generative, data-driven) cannot be controlled externally
- **Design systems** with semantic token hierarchies cannot be manipulated at runtime
- **Application shells** (navigation, tabs, sidebars) cannot be dynamically configured

### 1.2 Key Insight

The chat application is not intelligent. It is a reactive shell that:
- Renders state
- Accepts user input
- Forwards messages to an external LLM
- Exposes its own state for external mutation
- **Provides a configurable shell** with navigation areas, tabs, and content slots
- **Hosts pluggable visualizations** that external processes can control
- **Resolves design tokens** that external processes can override

Intelligence lives elsewhere. The UI is infrastructure.

### 1.3 Capability Matrix

This specification supports multiple capability profiles. Implementations MAY support any subset:

| Capability | Description | Credo-like | Orb | Eliza-DS | Basic Chat |
|------------|-------------|------------|-----|----------|------------|
| **UI Sets** | Bundled UI configs with discovery/activation | ✓ | ✓ | ✓ | |
| **Shell Configuration** | Header, footer, sidebar, tab bar | ✓ | | | |
| **Navigation Items** | Register links in nav areas | ✓ | | | |
| **Tab Management** | Multi-tab interface behind main view | ✓ | | | |
| **Rich Components** | Cards, carousels, accordions, grids | ✓ | | ✓ | |
| **Core UI Control** | Theme, layout, panels, focus | ✓ | | ✓ | ✓ |
| **Notifications** | Toasts, modals, badges, progress | ✓ | | ✓ | ✓ |
| **Content Injection** | Markdown, HTML, messages | ✓ | | ✓ | ✓ |
| **Custom Visualizations** | WebGL, Canvas, SVG renderers | | ✓ | | |
| **State Machines** | Named presets with transitions | | ✓ | | |
| **Audio Reactivity** | Real-time audio analysis feed | | ✓ | | |
| **Design Tokens** | Semantic token hierarchy | ✓ | | ✓ | |
| **Token Modes** | Light/dark/custom theme modes | ✓ | | ✓ | ✓ |
| **Window Management** | Multi-window desktop apps | | | | ✓ |

---

## 2. Architecture

### 2.1 High-Level Topology

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     Self-Controllable Chat Application                           │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                              Shell Layer                                    │ │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │ │
│  │  │ Header           [nav items]                        [actions]        │  │ │
│  │  └──────────────────────────────────────────────────────────────────────┘  │ │
│  │  ┌─────────┐ ┌────────────────────────────────────────────────┐ ┌───────┐  │ │
│  │  │         │ │  Tab Bar    [Tab1] [Tab2] [Tab3]               │ │       │  │ │
│  │  │         │ ├────────────────────────────────────────────────┤ │       │  │ │
│  │  │ Sidebar │ │                                                │ │ Side  │  │ │
│  │  │  (L)    │ │              Content Area                      │ │ Panel │  │ │
│  │  │         │ │  ┌─────────────┐  ┌─────────────┐              │ │  (R)  │  │ │
│  │  │ [nav]   │ │  │ Chat Thread │  │ Viz Hosts   │              │ │       │  │ │
│  │  │ [items] │ │  │             │  │ (WebGL/     │              │ │       │  │ │
│  │  │         │ │  │             │  │  Canvas)    │              │ │       │  │ │
│  │  │         │ │  └─────────────┘  └─────────────┘              │ │       │  │ │
│  │  └─────────┘ └────────────────────────────────────────────────┘ └───────┘  │ │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │ │
│  │  │ Footer           [nav items]                        [status]         │  │ │
│  │  └──────────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ▲                                          │
│            ┌─────────────────────────┼─────────────────────────┐                │
│            │                         │                         │                │
│  ┌─────────┴────────┐  ┌─────────────┴─────────┐  ┌───────────┴────────┐       │
│  │   Shell Store    │  │     UI State Store    │  │   Component Store  │       │
│  │                  │  │                       │  │                    │       │
│  │ - nav items      │  │ - layout              │  │ - rich components  │       │
│  │ - tabs           │  │ - panels              │  │ - viz registry     │       │
│  │ - shell config   │  │ - notifications       │  │ - state machines   │       │
│  └──────────────────┘  └───────────────────────┘  └────────────────────┘       │
│            ▲                         ▲                         ▲                │
│            └─────────────────────────┼─────────────────────────┘                │
│                                      │                                          │
│                    ┌─────────────────┴─────────────────┐                       │
│                    │          Token Store              │                       │
│                    │  - primitives  - semantics        │                       │
│                    │  - modes       - resolution       │                       │
│                    └───────────────────────────────────┘                       │
│                                      ▲                                          │
│                                      │                                          │
│                    ┌─────────────────┴─────────────────┐                       │
│                    │           MCP Server              │◄── External Callers   │
│                    │  - Tools  - Resources             │    (System 2, cron,   │
│                    │  - Subscriptions                  │     webhooks, LLM)    │
│                    └───────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Architectural Components

#### 2.2.1 Shell Store

Manages the application's structural chrome:
- Header, footer, sidebar visibility and configuration
- Navigation items registered in each area
- Tab bar state and active tab
- Shell-level layout configuration

#### 2.2.2 UI State Store

Manages runtime UI state:
- Layout mode and panel configuration
- Active notifications, modals, progress indicators
- Focus state and scroll position
- Feature flags

#### 2.2.3 Component Store

Manages rich, structured components:
- Rendered component instances (cards, carousels, etc.)
- Visualization registry and instances
- State machine definitions and current states
- Audio subscriptions and bindings

#### 2.2.4 Token Store

Manages the design token hierarchy:
- Primitive tokens (raw values: colors, scales, typography)
- Semantic tokens (references to primitives, context-aware)
- Mode resolution (light, dark, high-contrast)
- CSS custom property generation

---

## 3. MCP Tool Interface

### 3.1 UI Sets

A UI Set is a named, version-controlled bundle of UI configuration that can be registered, discovered, activated, and switched. This enables shipping complete UI configurations (like a "Credo Dashboard" or "Orb Interface") as atomic units.

#### 3.1.1 Registration & Management

```typescript
interface UISetTools {
  // Register a complete UI configuration
  "uiset.register": {
    params: {
      id: string; // Unique identifier, e.g., "credo-dashboard-v2"
      name: string; // Human-readable name
      version: string; // Semver
      description?: string;

      // The complete UI definition
      definition: {
        // Shell structure
        shell?: {
          header?: ShellAreaConfig;
          footer?: ShellAreaConfig;
          sidebar?: ShellAreaConfig;
          tabBar?: TabBarConfig;
        };

        // Navigation items for each slot
        navItems?: {
          header?: NavItem[];
          footer?: NavItem[];
          sidebar?: NavItem[];
        };

        // Initial tabs to create
        tabs?: Array<{
          tabId: string;
          label: string;
          icon?: string;
          content: { type: string; target: string; params?: Record<string, unknown> };
          closable?: boolean;
        }>;

        // Components to render in tabs/slots
        components?: Array<{
          instanceId: string;
          target: string; // Tab ID or slot
          component: ComponentDefinition;
        }>;

        // Visualization registrations
        visualizations?: Array<{
          type: string;
          renderer: VisualizationRenderer;
          presets?: Record<string, Record<string, unknown>>;
        }>;

        // Visualization instances to create
        visualizationInstances?: Array<{
          type: string;
          instanceId: string;
          target: string;
          initialPreset?: string;
        }>;

        // Design tokens
        tokens?: {
          primitives?: Record<string, unknown>;
          semantics?: Record<string, string>;
          modes?: Record<string, Record<string, string>>;
          initialMode?: string;
        };

        // State machines
        stateMachines?: Array<{
          machineId: string;
          states: Record<string, { properties: Record<string, unknown>; transitions?: string[] }>;
          initialState: string;
          target: { type: string; id?: string };
        }>;

        // Theme overrides
        appearance?: {
          theme?: string;
          accentColor?: string;
          fontScale?: number;
        };
      };

      // Optional: capabilities this set requires
      requiredCapabilities?: string[];

      // Optional: callback when set is activated/deactivated
      onActivate?: string;
      onDeactivate?: string;
    };
    returns: { success: boolean; id: string; version: string };
  };

  // Update a registered UI set (creates new version)
  "uiset.update": {
    params: {
      id: string;
      version: string; // New version
      definition: Partial<UISetDefinition>;
      merge?: boolean; // Merge with existing or replace (default: replace)
    };
    returns: { success: boolean; version: string };
  };

  // Unregister a UI set
  "uiset.unregister": {
    params: { id: string };
    returns: { success: boolean };
  };
}
```

#### 3.1.2 Discovery

```typescript
interface UISetDiscovery {
  // List all registered UI sets
  "uiset.list": {
    params: {
      includeDefinitions?: boolean; // Include full definitions (default: false)
    };
    returns: {
      sets: Array<{
        id: string;
        name: string;
        version: string;
        description?: string;
        requiredCapabilities?: string[];
        isActive: boolean;
      }>;
    };
  };

  // Get a specific UI set's full definition
  "uiset.get": {
    params: { id: string };
    returns: {
      id: string;
      name: string;
      version: string;
      definition: UISetDefinition;
      isActive: boolean;
    };
  };

  // Check if a UI set is compatible with current capabilities
  "uiset.checkCompatibility": {
    params: { id: string };
    returns: {
      compatible: boolean;
      missingCapabilities?: string[];
      warnings?: string[];
    };
  };
}
```

#### 3.1.3 Activation

```typescript
interface UISetActivation {
  // Activate a registered UI set
  "uiset.activate": {
    params: {
      id: string;
      transition?: {
        duration: number;
        staggerDelay?: number; // Delay between component activations
      };
      preserveState?: boolean; // Keep current transient state (notifications, etc.)
    };
    returns: {
      success: boolean;
      previousSetId?: string;
      activatedComponents: string[];
    };
  };

  // Deactivate current UI set (return to default/minimal UI)
  "uiset.deactivate": {
    params: {
      transition?: { duration: number };
    };
    returns: { success: boolean; deactivatedSetId: string };
  };

  // Get currently active UI set
  "uiset.getActive": {
    params: {};
    returns: {
      id: string | null;
      name?: string;
      version?: string;
      activatedAt?: number;
    };
  };

  // Switch directly from one set to another
  "uiset.switch": {
    params: {
      toId: string;
      transition?: {
        duration: number;
        crossfade?: boolean; // Overlap old/new during transition
      };
    };
    returns: {
      success: boolean;
      fromId: string | null;
      toId: string;
    };
  };
}
```

#### 3.1.4 Runtime Interaction

Once a UI set is active, individual elements can still be manipulated:

```typescript
interface UISetInteraction {
  // Update a component within the active set
  "uiset.updateComponent": {
    params: {
      instanceId: string;
      data: Partial<ComponentData>;
    };
    returns: { success: boolean };
  };

  // Add a temporary element to the active set (not persisted)
  "uiset.addTransient": {
    params: {
      type: "tab" | "component" | "navItem";
      definition: TabDefinition | ComponentDefinition | NavItem;
    };
    returns: { success: boolean; transientId: string };
  };

  // Remove a transient element
  "uiset.removeTransient": {
    params: { transientId: string };
    returns: { success: boolean };
  };

  // Save current state as a new UI set
  "uiset.saveAs": {
    params: {
      id: string;
      name: string;
      version: string;
      includeTransient?: boolean;
    };
    returns: { success: boolean; id: string };
  };
}
```

---

### 3.2 Shell Configuration

Configure the application's structural layout.

#### 3.2.1 Shell Structure

```typescript
interface ShellTools {
  // Configure shell areas
  "shell.configure": {
    params: {
      header?: {
        visible: boolean;
        height?: string; // CSS value
        sticky?: boolean;
      };
      footer?: {
        visible: boolean;
        height?: string;
      };
      sidebar?: {
        visible: boolean;
        width?: string;
        position: "left" | "right";
        collapsible?: boolean;
        defaultCollapsed?: boolean;
      };
      tabBar?: {
        visible: boolean;
        position: "top" | "bottom";
        closableTabs?: boolean;
      };
    };
    returns: { success: boolean };
  };

  // Get current shell configuration
  "shell.getConfig": {
    params: {};
    returns: {
      header: ShellAreaConfig;
      footer: ShellAreaConfig;
      sidebar: ShellAreaConfig | null;
      tabBar: TabBarConfig | null;
    };
  };

  // Toggle sidebar collapsed state
  "shell.toggleSidebar": {
    params: { collapsed?: boolean };
    returns: { success: boolean; collapsed: boolean };
  };
}
```

#### 3.2.2 Navigation Items

Register interactive elements in shell areas.

```typescript
interface NavigationTools {
  // Register a navigation item in a shell area
  "shell.registerNavItem": {
    params: {
      slot: "header" | "footer" | "sidebar";
      item: {
        id: string;
        label: string;
        icon?: string; // Icon name or URL
        tooltip?: string;
        action: {
          type: "route" | "tab" | "modal" | "panel" | "external" | "callback";
          target: string; // Route path, tab ID, modal ID, panel type, URL, or callback name
          params?: Record<string, unknown>;
        };
        position?: number; // Sort order
        badge?: number | boolean; // Notification badge
        disabled?: boolean;
        children?: NavItem[]; // For dropdown menus
      };
    };
    returns: { success: boolean; itemId: string };
  };

  // Update an existing nav item
  "shell.updateNavItem": {
    params: {
      slot: "header" | "footer" | "sidebar";
      itemId: string;
      updates: Partial<NavItem>;
    };
    returns: { success: boolean };
  };

  // Remove a nav item
  "shell.unregisterNavItem": {
    params: {
      slot: "header" | "footer" | "sidebar";
      itemId: string;
    };
    returns: { success: boolean };
  };

  // Set badge on nav item
  "shell.setNavBadge": {
    params: {
      slot: "header" | "footer" | "sidebar";
      itemId: string;
      badge: number | boolean | null; // null to clear
    };
    returns: { success: boolean };
  };

  // Get all nav items for a slot
  "shell.getNavItems": {
    params: { slot: "header" | "footer" | "sidebar" };
    returns: { items: NavItem[] };
  };
}
```

### 3.2 Tab Management

Manage tabs behind the main chat interface.

```typescript
interface TabTools {
  // Open a new tab
  "tabs.open": {
    params: {
      tabId: string;
      label: string;
      icon?: string;
      content: {
        type: "route" | "component" | "iframe" | "panel";
        target: string; // Route path, component ID, URL, or panel type
        params?: Record<string, unknown>;
      };
      closable?: boolean; // Default: true
      position?: number; // Insert position
      activate?: boolean; // Switch to this tab immediately (default: true)
    };
    returns: { success: boolean; tabId: string };
  };

  // Close a tab
  "tabs.close": {
    params: { tabId: string };
    returns: { success: boolean };
  };

  // Activate (focus) a tab
  "tabs.activate": {
    params: { tabId: string };
    returns: { success: boolean };
  };

  // Update tab properties
  "tabs.update": {
    params: {
      tabId: string;
      updates: {
        label?: string;
        icon?: string;
        badge?: number | boolean | null;
        closable?: boolean;
      };
    };
    returns: { success: boolean };
  };

  // Reorder tabs
  "tabs.reorder": {
    params: {
      tabIds: string[]; // New order
    };
    returns: { success: boolean };
  };

  // Get all tabs
  "tabs.list": {
    params: {};
    returns: {
      tabs: Array<{
        tabId: string;
        label: string;
        icon?: string;
        badge?: number | boolean;
        active: boolean;
        closable: boolean;
      }>;
      activeTabId: string;
    };
  };
}
```

### 3.3 Rich Components

Structured, reusable UI components beyond raw HTML injection.

```typescript
interface ComponentTools {
  // Render a structured component
  "component.render": {
    params: {
      instanceId: string;
      target: string; // Slot ID, panel ID, or tab content area
      component: ComponentDefinition;
      replace?: boolean; // Replace existing content (default: true)
    };
    returns: { success: boolean; instanceId: string };
  };

  // Update component data
  "component.update": {
    params: {
      instanceId: string;
      data: Partial<ComponentDefinition["data"]>;
    };
    returns: { success: boolean };
  };

  // Remove a component
  "component.remove": {
    params: { instanceId: string };
    returns: { success: boolean };
  };
}

// Component type definitions
type ComponentDefinition =
  | CardGridComponent
  | CarouselComponent
  | AccordionComponent
  | DataTableComponent
  | StatsGridComponent
  | TimelineComponent
  | FormComponent;

interface CardGridComponent {
  type: "card-grid";
  data: {
    columns?: number; // 1-4, responsive default
    gap?: string;
    items: Array<{
      id: string;
      title: string;
      description?: string;
      image?: { src: string; alt?: string };
      icon?: string;
      badge?: string;
      action?: ActionDefinition;
      metadata?: Array<{ label: string; value: string }>;
    }>;
  };
}

interface CarouselComponent {
  type: "carousel";
  data: {
    items: Array<{
      id: string;
      content: { type: "image" | "card" | "html"; body: string };
      caption?: string;
    }>;
    autoplay?: boolean;
    interval?: number; // ms
    showArrows?: boolean;
    showDots?: boolean;
    loop?: boolean;
  };
}

interface AccordionComponent {
  type: "accordion";
  data: {
    allowMultiple?: boolean;
    items: Array<{
      id: string;
      title: string;
      content: string | { type: "markdown" | "html"; body: string };
      icon?: string;
      defaultOpen?: boolean;
    }>;
  };
}

interface DataTableComponent {
  type: "data-table";
  data: {
    columns: Array<{
      key: string;
      label: string;
      sortable?: boolean;
      width?: string;
      align?: "left" | "center" | "right";
      render?: "text" | "badge" | "link" | "progress";
    }>;
    rows: Array<Record<string, unknown>>;
    pagination?: { pageSize: number; currentPage?: number };
    sortable?: boolean;
    selectable?: boolean;
    onRowAction?: string; // Callback name
  };
}

interface StatsGridComponent {
  type: "stats-grid";
  data: {
    columns?: number;
    items: Array<{
      id: string;
      label: string;
      value: string | number;
      change?: { value: number; direction: "up" | "down" | "neutral" };
      icon?: string;
      color?: string;
    }>;
  };
}

interface TimelineComponent {
  type: "timeline";
  data: {
    orientation?: "vertical" | "horizontal";
    items: Array<{
      id: string;
      timestamp: string;
      title: string;
      description?: string;
      icon?: string;
      status?: "complete" | "current" | "pending" | "error";
    }>;
  };
}

interface FormComponent {
  type: "form";
  data: {
    fields: Array<{
      name: string;
      label: string;
      type: "text" | "textarea" | "select" | "checkbox" | "radio" | "date";
      options?: Array<{ value: string; label: string }>;
      placeholder?: string;
      required?: boolean;
      defaultValue?: unknown;
    }>;
    submitLabel?: string;
    onSubmit: string; // Callback name
  };
}

interface ActionDefinition {
  type: "route" | "tab" | "modal" | "callback" | "external";
  target: string;
  params?: Record<string, unknown>;
}
```

### 3.4 Core UI Control

Theme, layout, and panel management.

#### 3.4.1 Theme & Appearance

```typescript
interface AppearanceTools {
  "ui.setTheme": {
    params: {
      theme: "light" | "dark" | "system" | string;
    };
    returns: { success: boolean; appliedTheme: string };
  };

  "ui.setAccentColor": {
    params: { color: string };
    returns: { success: boolean };
  };

  "ui.setFontScale": {
    params: { scale: number }; // 0.8 to 1.5
    returns: { success: boolean };
  };
}
```

#### 3.4.2 Layout & Panels

```typescript
interface LayoutTools {
  "ui.setLayout": {
    params: {
      layout: "single" | "split-horizontal" | "split-vertical" | "triple";
    };
    returns: { success: boolean };
  };

  "ui.openPanel": {
    params: {
      position: "left" | "right" | "bottom" | "float";
      panelType: string;
      panelId?: string;
      config?: Record<string, unknown>;
    };
    returns: { success: boolean; panelId: string };
  };

  "ui.closePanel": {
    params: { panelId: string };
    returns: { success: boolean };
  };

  "ui.resizePanel": {
    params: {
      panelId: string;
      width?: number | string;
      height?: number | string;
    };
    returns: { success: boolean };
  };

  "ui.setFocus": {
    params: {
      target: "chat" | "panel" | "input" | "visualization" | "tab";
      targetId?: string;
    };
    returns: { success: boolean };
  };
}
```

### 3.5 Notifications & Feedback

```typescript
interface NotificationTools {
  "ui.showNotification": {
    params: {
      title: string;
      message?: string;
      type: "info" | "success" | "warning" | "error";
      duration?: number; // ms, 0 for persistent
      actions?: Array<{ label: string; action: string }>;
    };
    returns: { notificationId: string };
  };

  "ui.dismissNotification": {
    params: { notificationId: string };
    returns: { success: boolean };
  };

  "ui.showModal": {
    params: {
      modalId?: string;
      title: string;
      content: string | { type: "markdown" | "html" | "component"; body: string };
      size?: "small" | "medium" | "large" | "fullscreen";
      actions?: Array<{
        label: string;
        action: string;
        variant?: "primary" | "secondary" | "danger";
      }>;
      dismissible?: boolean;
    };
    returns: { modalId: string };
  };

  "ui.closeModal": {
    params: { modalId: string };
    returns: { success: boolean };
  };

  "ui.setBadge": {
    params: {
      target: string;
      count?: number;
      dot?: boolean;
      color?: string;
    };
    returns: { success: boolean };
  };

  "ui.setProgress": {
    params: {
      taskId: string;
      progress: number; // 0-100, -1 for indeterminate
      status?: string;
      details?: string;
    };
    returns: { success: boolean };
  };

  "ui.clearProgress": {
    params: { taskId: string };
    returns: { success: boolean };
  };
}
```

### 3.6 Content Injection

Raw content injection for cases where structured components aren't sufficient.

```typescript
interface ContentTools {
  "ui.setContent": {
    params: {
      target: string; // panel ID, slot name, or tab content area
      content: {
        type: "text" | "markdown" | "html" | "react" | "iframe";
        body: string;
      };
      replace?: boolean;
    };
    returns: { success: boolean };
  };

  "ui.injectMessage": {
    params: {
      role: "system" | "assistant" | "notification";
      content: string;
      metadata?: Record<string, unknown>;
    };
    returns: { messageId: string };
  };
}
```

### 3.7 Navigation & Routing

```typescript
interface RoutingTools {
  "ui.navigate": {
    params: {
      route: string;
      params?: Record<string, string>;
      replace?: boolean; // Replace history entry
    };
    returns: { success: boolean };
  };

  "ui.setConversation": {
    params: { conversationId: string };
    returns: { success: boolean };
  };

  "ui.scrollTo": {
    params: {
      target: "top" | "bottom" | "message" | "element";
      targetId?: string;
      smooth?: boolean;
    };
    returns: { success: boolean };
  };

  "ui.goBack": {
    params: {};
    returns: { success: boolean };
  };
}
```

### 3.8 Custom Visualizations

For rich visualizations like the Orb personification.

#### 3.8.1 Registration

```typescript
interface VisualizationRegistration {
  // Register a visualization renderer
  "viz.register": {
    params: {
      type: string; // e.g., "orb", "waveform", "graph"
      renderer: {
        kind: "webgl" | "canvas-2d" | "svg" | "iframe";
        source: string; // URL to ES module or iframe
        paramSchema: JSONSchema;
      };
      presets?: Record<string, Record<string, unknown>>;
      defaultTransition?: {
        duration: number;
        easing: "linear" | "ease-in" | "ease-out" | "ease-in-out" | string;
      };
    };
    returns: { success: boolean; type: string };
  };

  // Instantiate a registered visualization
  "viz.create": {
    params: {
      type: string;
      instanceId: string;
      target: string; // panel ID or slot
      initialParams?: Record<string, unknown>;
      initialPreset?: string;
    };
    returns: { success: boolean; instanceId: string };
  };

  // Remove a visualization instance
  "viz.destroy": {
    params: { instanceId: string };
    returns: { success: boolean };
  };
}
```

#### 3.8.2 Parameter Control

```typescript
interface VisualizationControl {
  // Set parameters directly
  "viz.setParams": {
    params: {
      instanceId: string;
      params: Record<string, unknown>;
      transition?: { duration: number; easing: string };
    };
    returns: { success: boolean };
  };

  // Apply a named preset
  "viz.applyPreset": {
    params: {
      instanceId: string;
      preset: string;
      transition?: { duration: number; easing: string };
    };
    returns: { success: boolean };
  };

  // Define or update a preset at runtime
  "viz.definePreset": {
    params: {
      type: string;
      presetName: string;
      params: Record<string, unknown>;
    };
    returns: { success: boolean };
  };
}
```

#### 3.8.3 Renderer Module Interface

Visualization renderers MUST export this interface:

```typescript
interface VisualizationRenderer {
  init(container: HTMLElement, initialParams: Record<string, unknown>): void;
  setParams(params: Record<string, unknown>, transition?: { duration: number; easing: string }): void;
  tick?(deltaTime: number): boolean;
  dispose(): void;
  onAudioData?(data: AudioAnalysisData): void;
}

interface AudioAnalysisData {
  timestamp: number;
  rms: number;
  peak: number;
  frequencies: Float32Array;
  isSpeech: boolean;
}
```

### 3.9 State Machines

For managing complex UI states with transitions.

```typescript
interface StateMachineTools {
  "state.define": {
    params: {
      machineId: string;
      states: Record<string, {
        properties: Record<string, unknown>;
        transitions?: string[]; // Allowed next states
      }>;
      initialState: string;
      target: {
        type: "visualization" | "tokens" | "ui" | "component";
        id?: string;
      };
      defaultTransition?: { duration: number; easing: string };
    };
    returns: { success: boolean; machineId: string };
  };

  "state.transition": {
    params: {
      machineId: string;
      toState: string;
      transition?: { duration: number; easing: string };
    };
    returns: { success: boolean; fromState: string; toState: string };
  };

  "state.query": {
    params: { machineId: string };
    returns: {
      currentState: string;
      availableTransitions: string[];
      properties: Record<string, unknown>;
    };
  };
}
```

### 3.10 Audio Subscription

For audio-reactive visualizations.

```typescript
interface AudioTools {
  "audio.subscribe": {
    params: {
      instanceId: string;
      config?: {
        fftSize?: number;
        smoothingTimeConstant?: number;
        minDecibels?: number;
        maxDecibels?: number;
      };
    };
    returns: { success: boolean; subscriptionId: string };
  };

  "audio.unsubscribe": {
    params: { subscriptionId: string };
    returns: { success: boolean };
  };

  "audio.bind": {
    params: {
      instanceId: string;
      bindings: Array<{
        audioFeature: "rms" | "peak" | "frequency" | "isSpeech";
        frequencyRange?: [number, number];
        targetParam: string;
        transform?: {
          scale?: number;
          offset?: number;
          min?: number;
          max?: number;
          smoothing?: number;
        };
      }>;
    };
    returns: { success: boolean };
  };
}
```

### 3.11 Design Tokens

For semantic design systems.

#### 3.11.1 Token Management

```typescript
interface TokenTools {
  "tokens.load": {
    params: {
      primitives: Record<string, unknown>;
      semantics: Record<string, string | { $value: string; $type?: string }>;
      modes?: Record<string, Record<string, string>>;
    };
    returns: { success: boolean; tokenCount: number };
  };

  "tokens.set": {
    params: {
      path: string;
      value: string;
      mode?: string;
    };
    returns: { success: boolean };
  };

  "tokens.setBatch": {
    params: {
      tokens: Record<string, string>;
      mode?: string;
    };
    returns: { success: boolean; updated: number };
  };

  "tokens.setPrimitive": {
    params: {
      path: string;
      value: string;
    };
    returns: { success: boolean; affectedSemantics: string[] };
  };
}
```

#### 3.11.2 Mode Control

```typescript
interface TokenModeTools {
  "tokens.setMode": {
    params: {
      mode: string;
      scope?: string;
      transition?: {
        duration: number;
        properties?: string[];
      };
    };
    returns: { success: boolean; appliedMode: string };
  };

  "tokens.defineMode": {
    params: {
      mode: string;
      tokens: Record<string, string>;
      basedOn?: string;
    };
    returns: { success: boolean };
  };

  "tokens.getMode": {
    params: {};
    returns: {
      currentMode: string;
      availableModes: string[];
      scope: string;
    };
  };
}
```

#### 3.11.3 Token Resolution

```typescript
interface TokenResolution {
  "tokens.resolve": {
    params: {
      path: string;
      mode?: string;
    };
    returns: {
      value: string;
      resolvedFrom: string[];
    };
  };

  "tokens.query": {
    params: {
      pattern: string;
      mode?: string;
      resolved?: boolean;
    };
    returns: {
      tokens: Record<string, string>;
    };
  };
}
```

### 3.12 Window Management

For desktop applications (Electron, Tauri).

```typescript
interface WindowTools {
  "window.open": {
    params: {
      windowType: string;
      title?: string;
      width?: number;
      height?: number;
      position?: { x: number; y: number };
      config?: Record<string, unknown>;
    };
    returns: { windowId: string };
  };

  "window.close": {
    params: { windowId: string };
    returns: { success: boolean };
  };

  "window.focus": {
    params: { windowId: string };
    returns: { success: boolean };
  };

  "window.setState": {
    params: {
      windowId: string;
      state: "normal" | "minimized" | "maximized" | "fullscreen";
    };
    returns: { success: boolean };
  };
}
```

---

## 4. MCP Resources

### 4.1 UI Set Resources

```typescript
interface UISetResources {
  // List of registered UI sets
  "ui://sets": {
    sets: Array<{
      id: string;
      name: string;
      version: string;
      description?: string;
      requiredCapabilities: string[];
    }>;
    activeSetId: string | null;
  };

  // Specific UI set definition
  "ui://set/{id}": {
    id: string;
    name: string;
    version: string;
    description?: string;
    definition: UISetDefinition;
    isActive: boolean;
    activatedAt?: number;
  };

  // Current active set summary
  "ui://set/active": {
    id: string | null;
    name?: string;
    version?: string;
    activatedAt?: number;
    transientElements: string[];
  };
}
```

### 4.3 Shell Resources

```typescript
interface ShellResources {
  "ui://shell": {
    config: ShellConfig;
    navItems: {
      header: NavItem[];
      footer: NavItem[];
      sidebar: NavItem[];
    };
  };

  "ui://shell/tabs": {
    tabs: TabInfo[];
    activeTabId: string;
  };
}
```

### 4.4 Component Resources

```typescript
interface ComponentResources {
  "ui://components": {
    instances: Array<{
      instanceId: string;
      type: string;
      target: string;
    }>;
  };

  "ui://component/{instanceId}": {
    instanceId: string;
    type: string;
    data: ComponentData;
  };
}
```

### 4.5 Core UI Resources

```typescript
interface CoreResources {
  "ui://state": UIState;
  "ui://theme": { theme: string; accentColor: string };
  "ui://layout": { mode: string; panels: Panel[] };
  "ui://notifications": Notification[];
  "ui://conversation": { id: string; messageCount: number };
}
```

### 4.6 Visualization Resources

```typescript
interface VisualizationResources {
  "ui://viz/types": {
    types: Array<{ type: string; renderer: string; presets: string[] }>;
  };

  "ui://viz/instances": {
    instances: Array<{
      instanceId: string;
      type: string;
      target: string;
      currentPreset: string | null;
    }>;
  };

  "ui://viz/{instanceId}": {
    instanceId: string;
    type: string;
    params: Record<string, unknown>;
    currentPreset: string | null;
    audioSubscription: string | null;
  };
}
```

### 4.7 State Machine Resources

```typescript
interface StateMachineResources {
  "ui://state-machines": {
    machines: Array<{
      machineId: string;
      currentState: string;
      targetType: string;
    }>;
  };

  "ui://state-machine/{machineId}": {
    machineId: string;
    currentState: string;
    states: string[];
    availableTransitions: string[];
  };
}
```

### 4.8 Token Resources

```typescript
interface TokenResources {
  "ui://tokens": {
    primitives: Record<string, unknown>;
    semantics: Record<string, string>;
    currentMode: string;
    availableModes: string[];
  };

  "ui://tokens/resolved": Record<string, string>;
  "ui://tokens/{category}": Record<string, unknown>;
}
```

### 4.9 Audio Resources

```typescript
interface AudioResources {
  "ui://audio": {
    active: boolean;
    subscriptions: Array<{ subscriptionId: string; instanceId: string }>;
  };

  "ui://audio/levels": {
    rms: number;
    peak: number;
    isSpeech: boolean;
  };
}
```

---

## 5. MCP Notifications

### 5.1 UI Set Notifications

```typescript
interface UISetNotifications {
  "uiset/registered": { id: string; name: string; version: string };
  "uiset/unregistered": { id: string };
  "uiset/activated": {
    id: string;
    previousId: string | null;
    activatedComponents: string[];
  };
  "uiset/deactivated": { id: string };
  "uiset/switched": { fromId: string | null; toId: string };
  "uiset/transientAdded": { setId: string; transientId: string; type: string };
  "uiset/transientRemoved": { setId: string; transientId: string };
}
```

### 5.2 Shell Notifications

```typescript
interface ShellNotifications {
  "shell/configChanged": { config: ShellConfig };
  "shell/navItemClicked": { slot: string; itemId: string; action: ActionDefinition };
  "shell/sidebarToggled": { collapsed: boolean };
}
```

### 5.3 Tab Notifications

```typescript
interface TabNotifications {
  "tabs/opened": { tabId: string; label: string };
  "tabs/closed": { tabId: string };
  "tabs/activated": { tabId: string; previousTabId: string };
  "tabs/reordered": { tabIds: string[] };
}
```

### 5.4 Component Notifications

```typescript
interface ComponentNotifications {
  "component/rendered": { instanceId: string; type: string };
  "component/removed": { instanceId: string };
  "component/action": { instanceId: string; action: string; data?: unknown };
}
```

### 5.5 UI Notifications

```typescript
interface UINotifications {
  "ui/themeChanged": { theme: string; source: string };
  "ui/layoutChanged": { layout: string; panels: Panel[] };
  "ui/notificationAction": { notificationId: string; action: string };
  "ui/modalAction": { modalId: string; action: string };
  "ui/userAction": { action: string; target?: string };
  "ui/conversationChanged": { conversationId: string };
}
```

### 5.6 Visualization Notifications

```typescript
interface VisualizationNotifications {
  "viz/created": { instanceId: string; type: string };
  "viz/destroyed": { instanceId: string };
  "viz/presetApplied": { instanceId: string; preset: string };
  "viz/transitionComplete": { instanceId: string };
}
```

### 5.7 State Machine Notifications

```typescript
interface StateMachineNotifications {
  "state/transitionStarted": {
    machineId: string;
    fromState: string;
    toState: string;
    duration: number;
  };
  "state/transitionComplete": {
    machineId: string;
    state: string;
  };
}
```

### 5.8 Token Notifications

```typescript
interface TokenNotifications {
  "tokens/modeChanged": { mode: string; previousMode: string };
  "tokens/updated": { paths: string[]; mode?: string };
  "tokens/primitiveChanged": { path: string; affectedSemantics: string[] };
}
```

### 5.9 Audio Notifications

```typescript
interface AudioNotifications {
  "audio/speechStarted": { timestamp: number };
  "audio/speechEnded": { timestamp: number; duration: number };
  "audio/levelThreshold": { feature: string; direction: "above" | "below"; value: number };
}
```

---

## 6. State Schemas

### 6.1 Shell State

```typescript
interface ShellState {
  config: {
    header: { visible: boolean; height: string; sticky: boolean };
    footer: { visible: boolean; height: string };
    sidebar: { visible: boolean; width: string; position: "left" | "right"; collapsed: boolean } | null;
    tabBar: { visible: boolean; position: "top" | "bottom" } | null;
  };

  navItems: {
    header: NavItem[];
    footer: NavItem[];
    sidebar: NavItem[];
  };

  tabs: {
    items: TabInfo[];
    activeId: string;
  };
}

interface NavItem {
  id: string;
  label: string;
  icon?: string;
  tooltip?: string;
  action: ActionDefinition;
  position: number;
  badge?: number | boolean;
  disabled: boolean;
  children?: NavItem[];
}

interface TabInfo {
  tabId: string;
  label: string;
  icon?: string;
  content: { type: string; target: string; params?: Record<string, unknown> };
  closable: boolean;
  badge?: number | boolean;
}
```

### 6.2 UI State

```typescript
interface UIState {
  version: number;

  appearance: {
    theme: string;
    accentColor: string;
    fontScale: number;
    reduceMotion: boolean;
  };

  layout: {
    mode: string;
    panels: Panel[];
    focus: string | null;
  };

  transient: {
    notifications: Notification[];
    modals: Modal[];
    progress: ProgressTask[];
    badges: Badge[];
  };

  navigation: {
    currentRoute: string;
    routeParams: Record<string, string>;
    conversationId: string | null;
  };

  features: Record<string, boolean>;
}
```

### 6.3 Component State

```typescript
interface ComponentInstance {
  instanceId: string;
  type: string;
  target: string;
  data: ComponentData;
  renderedAt: number;
}
```

### 6.4 Visualization State

```typescript
interface VisualizationState {
  type: string;
  instanceId: string;
  target: string;
  params: Record<string, unknown>;
  targetParams: Record<string, unknown>;
  currentPreset: string | null;
  transition: {
    active: boolean;
    startTime: number;
    duration: number;
    easing: string;
    fromParams: Record<string, unknown>;
  } | null;
  audioSubscription: {
    subscriptionId: string;
    config: AudioConfig;
    bindings: AudioBinding[];
  } | null;
}
```

### 6.5 Token State

```typescript
interface TokenState {
  version: number;
  primitives: Record<string, Record<string, unknown>>;
  semantics: Record<string, { $value: string; $type?: string }>;
  modes: Record<string, Record<string, string>>;
  currentMode: string;
  scope: string;
}
```

---

## 7. Implementation Patterns

### 7.1 Using UI Sets (Recommended)

The preferred approach for complex UIs is to register and activate complete UI Sets:

```typescript
// 1. Register a complete Credo-like dashboard as a UI Set
await mcpClient.callTool("uiset.register", {
  id: "credo-dashboard",
  name: "Credo AI Governance Dashboard",
  version: "1.0.0",
  description: "Full-featured AI governance dashboard with model tracking",
  requiredCapabilities: ["shell", "tabs", "rich-components", "tokens"],

  definition: {
    // Shell structure
    shell: {
      header: { visible: true, height: "64px", sticky: true },
      footer: { visible: true, height: "48px" },
      sidebar: { visible: true, width: "240px", position: "left", collapsible: true },
      tabBar: { visible: true, position: "top" }
    },

    // Navigation items
    navItems: {
      header: [
        {
          id: "product",
          label: "Product",
          children: [
            { id: "platform", label: "Platform", action: { type: "route", target: "/platform" } },
            { id: "features", label: "Features", action: { type: "route", target: "/features" } }
          ]
        },
        { id: "get-demo", label: "Get a Demo", action: { type: "modal", target: "demo-form" } }
      ],
      sidebar: [
        { id: "dashboard", label: "Dashboard", icon: "dashboard", action: { type: "tab", target: "dashboard-tab" } },
        { id: "ai-systems", label: "AI Systems", icon: "cpu", badge: 3, action: { type: "tab", target: "ai-systems-tab" } },
        { id: "policies", label: "Policies", icon: "shield", action: { type: "tab", target: "policies-tab" } }
      ]
    },

    // Initial tabs
    tabs: [
      { tabId: "dashboard-tab", label: "Dashboard", content: { type: "component", target: "dashboard-content" } },
      { tabId: "ai-systems-tab", label: "AI Systems", content: { type: "component", target: "ai-systems-content" }, closable: true }
    ],

    // Components to render
    components: [
      {
        instanceId: "dashboard-stats",
        target: "dashboard-content",
        component: {
          type: "stats-grid",
          data: {
            columns: 4,
            items: [
              { id: "models", label: "AI Models", value: 24, change: { value: 3, direction: "up" } },
              { id: "compliance", label: "Compliance Score", value: "94%", icon: "shield-check" },
              { id: "risks", label: "Open Risks", value: 7, change: { value: 2, direction: "down" } },
              { id: "policies", label: "Active Policies", value: 156 }
            ]
          }
        }
      },
      {
        instanceId: "models-table",
        target: "dashboard-content",
        component: {
          type: "data-table",
          data: {
            columns: [
              { key: "name", label: "Model Name", sortable: true },
              { key: "status", label: "Status", render: "badge" },
              { key: "risk", label: "Risk Level", render: "badge" },
              { key: "lastAudit", label: "Last Audit", sortable: true }
            ],
            rows: [],  // Will be populated dynamically
            pagination: { pageSize: 10 }
          }
        }
      }
    ],

    // Design tokens
    tokens: {
      primitives: {
        colors: {
          brand: { 500: "#6366f1", 600: "#4f46e5" },
          success: { 500: "#22c55e" },
          warning: { 500: "#f59e0b" },
          danger: { 500: "#ef4444" }
        }
      },
      semantics: {
        "background.brand.rest": "{colors.brand.500}",
        "status.success": "{colors.success.500}",
        "status.warning": "{colors.warning.500}",
        "status.danger": "{colors.danger.500}"
      },
      modes: {
        light: {},
        dark: { "background.brand.rest": "{colors.brand.600}" }
      },
      initialMode: "light"
    },

    appearance: {
      theme: "light",
      accentColor: "#6366f1"
    }
  }
});

// 2. Discover available UI sets
const { sets } = await mcpClient.callTool("uiset.list", {});
console.log("Available UI sets:", sets);

// 3. Check compatibility before activation
const compat = await mcpClient.callTool("uiset.checkCompatibility", { id: "credo-dashboard" });
if (!compat.compatible) {
  console.error("Missing capabilities:", compat.missingCapabilities);
}

// 4. Activate the UI set
await mcpClient.callTool("uiset.activate", {
  id: "credo-dashboard",
  transition: { duration: 300 }
});

// 5. Update data dynamically while set is active
await mcpClient.callTool("uiset.updateComponent", {
  instanceId: "models-table",
  data: {
    rows: [
      { name: "GPT-4 Classifier", status: "Active", risk: "Low", lastAudit: "2026-01-05" },
      { name: "Fraud Detection v2", status: "Review", risk: "Medium", lastAudit: "2026-01-03" }
    ]
  }
});

// 6. Add transient elements as needed
await mcpClient.callTool("uiset.addTransient", {
  type: "tab",
  definition: {
    tabId: "temp-report",
    label: "Generated Report",
    content: { type: "component", target: "report-viewer" },
    closable: true
  }
});

// 7. Switch to a different UI set
await mcpClient.callTool("uiset.switch", {
  toId: "orb-interface",
  transition: { duration: 500, crossfade: true }
});
```

### 7.2 Individual Tool Calls (Alternative)

For simpler UIs or dynamic modifications, you can use individual tool calls:

```typescript
// 1. Configure the shell
await mcpClient.callTool("shell.configure", {
  header: { visible: true, height: "64px", sticky: true },
  footer: { visible: true, height: "48px" },
  sidebar: { visible: true, width: "240px", position: "left", collapsible: true },
  tabBar: { visible: true, position: "top" }
});

// 2. Register header navigation
await mcpClient.callTool("shell.registerNavItem", {
  slot: "header",
  item: {
    id: "product",
    label: "Product",
    children: [
      { id: "platform", label: "Platform", action: { type: "route", target: "/platform" } },
      { id: "features", label: "Features", action: { type: "route", target: "/features" } }
    ]
  }
});

await mcpClient.callTool("shell.registerNavItem", {
  slot: "header",
  item: {
    id: "get-demo",
    label: "Get a Demo",
    action: { type: "modal", target: "demo-request-form" }
  }
});

// 3. Register sidebar navigation
await mcpClient.callTool("shell.registerNavItem", {
  slot: "sidebar",
  item: {
    id: "dashboard",
    label: "Dashboard",
    icon: "dashboard",
    action: { type: "tab", target: "dashboard-tab" }
  }
});

await mcpClient.callTool("shell.registerNavItem", {
  slot: "sidebar",
  item: {
    id: "ai-systems",
    label: "AI Systems",
    icon: "cpu",
    badge: 3,
    action: { type: "tab", target: "ai-systems-tab" }
  }
});

// 4. Create dashboard tab with stats
await mcpClient.callTool("tabs.open", {
  tabId: "dashboard-tab",
  label: "Dashboard",
  content: { type: "component", target: "dashboard-content" }
});

await mcpClient.callTool("component.render", {
  instanceId: "dashboard-stats",
  target: "dashboard-content",
  component: {
    type: "stats-grid",
    data: {
      columns: 4,
      items: [
        { id: "models", label: "AI Models", value: 24, change: { value: 3, direction: "up" } },
        { id: "compliance", label: "Compliance Score", value: "94%", icon: "shield-check" },
        { id: "risks", label: "Open Risks", value: 7, change: { value: 2, direction: "down" } },
        { id: "policies", label: "Active Policies", value: 156 }
      ]
    }
  }
});

// 5. Add a data table below
await mcpClient.callTool("component.render", {
  instanceId: "models-table",
  target: "dashboard-content",
  component: {
    type: "data-table",
    data: {
      columns: [
        { key: "name", label: "Model Name", sortable: true },
        { key: "status", label: "Status", render: "badge" },
        { key: "risk", label: "Risk Level", render: "badge" },
        { key: "lastAudit", label: "Last Audit", sortable: true }
      ],
      rows: [
        { name: "GPT-4 Classifier", status: "Active", risk: "Low", lastAudit: "2026-01-05" },
        { name: "Fraud Detection v2", status: "Review", risk: "Medium", lastAudit: "2026-01-03" }
      ],
      pagination: { pageSize: 10 }
    }
  },
  replace: false
});
```

### 7.3 Orb Visualization Integration

```typescript
// 1. Register the orb visualization type
await mcpClient.callTool("viz.register", {
  type: "orb",
  renderer: {
    kind: "webgl",
    source: "/visualizations/orb/renderer.js",
    paramSchema: orbParamSchema
  },
  presets: {
    idle: { envelopeRadius: 1.15, pulseAmplitude: 0.03, coherence: 0.95 },
    listening: { envelopeRadius: 1.12, pulseAmplitude: 0.02, coherence: 0.97 },
    processing: { envelopeRadius: 1.18, pulseAmplitude: 0.05, coherence: 0.85 },
    speaking: { envelopeRadius: 1.25, pulseAmplitude: 0.08, luminance: 1.35 }
  },
  defaultTransition: { duration: 500, easing: "ease-in-out" }
});

// 2. Create instance and bind to audio
await mcpClient.callTool("viz.create", {
  type: "orb",
  instanceId: "main-orb",
  target: "center-panel",
  initialPreset: "idle"
});

await mcpClient.callTool("audio.subscribe", { instanceId: "main-orb" });

await mcpClient.callTool("audio.bind", {
  instanceId: "main-orb",
  bindings: [
    { audioFeature: "rms", targetParam: "pulseAmplitude", transform: { scale: 0.1, offset: 0.02 } },
    { audioFeature: "isSpeech", targetParam: "luminance", transform: { scale: 0.3, offset: 1.0 } }
  ]
});
```

### 7.4 Eliza-DS Token Integration

```typescript
// 1. Load design tokens
await mcpClient.callTool("tokens.load", {
  primitives: {
    colors: {
      brand: { 500: "#0066cc", 600: "#0052a3" },
      neutral: { "000": "#ffffff", "1200": "#1a1a1a" }
    }
  },
  semantics: {
    "page.default": "{colors.neutral.000}",
    "background.brand.rest": "{colors.brand.500}",
    "foreground.neutral.rest": "{colors.neutral.1200}"
  },
  modes: {
    light: { "page.default": "{colors.neutral.000}" },
    dark: { "page.default": "{colors.neutral.1200}" }
  }
});

// 2. Switch modes with transition
await mcpClient.callTool("tokens.setMode", {
  mode: "dark",
  transition: { duration: 200, properties: ["background-color", "color"] }
});
```

---

## 8. Security Model

### 8.1 Capability-Based Authorization

```typescript
interface CallerCapabilities {
  callerId: string;
  allowedTools: string[];
  allowedResources: string[];
  restrictions?: {
    noShellModification?: boolean;
    noVisualizationRegistration?: boolean;
    noTokenModification?: boolean;
    noAudioAccess?: boolean;
    readOnly?: boolean;
  };
  rateLimit?: { maxCallsPerMinute: number };
}

const profiles = {
  "llm-primary": {
    allowedTools: ["ui.*", "shell.*", "tabs.*", "component.*"],
    restrictions: { noVisualizationRegistration: true }
  },
  "theme-service": {
    allowedTools: ["tokens.*", "ui.setTheme"],
    allowedResources: ["ui://tokens*"]
  },
  "viz-controller": {
    allowedTools: ["viz.setParams", "viz.applyPreset", "state.*"],
    allowedResources: ["ui://viz/*"]
  }
};
```

### 8.2 Component & Visualization Sandboxing

1. **Rich Components**: Rendered by the host; data validated against schema
2. **Custom HTML/React**: Sanitized; no script execution
3. **Visualizations**: Isolated containers; no DOM access outside container
4. **iframes**: `sandbox` attribute, restricted `allow` list

---

## 9. Transport & Performance

### 9.1 Recommended Transports

| Use Case | Transport | Notes |
|----------|-----------|-------|
| Web app | HTTP+SSE | Standard, firewall-friendly |
| Real-time viz | WebSocket | Lower latency for params |
| Desktop app | WebSocket localhost | Full duplex |
| CLI | stdio | Single client |

### 9.2 Performance Guidelines

- Batch related operations (open tab + render component)
- Use presets for coordinated visualization changes
- Let renderers handle interpolation
- Use `component.update` for data changes, not re-render

---

## 10. Capability Discovery

```typescript
"ui://capabilities": {
  version: "2.2.0",
  supportedCapabilities: [
    "ui-sets",
    "shell",
    "tabs",
    "rich-components",
    "core-ui",
    "notifications",
    "visualizations",
    "state-machines",
    "audio",
    "tokens",
    "windows"
  ],
  supportedTools: string[],
  supportedResources: string[],
  componentTypes: ["card-grid", "carousel", "accordion", "data-table", "stats-grid", "timeline", "form"],
  visualizationRenderers: ["webgl", "canvas-2d", "svg", "iframe"],
  maxRegisteredSets: number
}
```

---

## Appendix A: Orb Parameter Schema

```json
{
  "$id": "orb-params",
  "type": "object",
  "properties": {
    "envelopeRadius": { "type": "number", "default": 1.2 },
    "pulseAmplitude": { "type": "number", "default": 0.06 },
    "pulseFrequency": { "type": "number", "default": 0.3 },
    "rotationVelocity": {
      "type": "object",
      "properties": { "x": { "type": "number" }, "y": { "type": "number" }, "z": { "type": "number" } }
    },
    "coherence": { "type": "number", "minimum": 0, "maximum": 1 },
    "colorTemperature": { "type": "number" },
    "luminance": { "type": "number" }
  }
}
```

---

## Appendix B: Token Resolution Algorithm

```typescript
function resolveToken(path: string, semantics: Semantics, primitives: Primitives, mode: string, modes: Modes): string {
  const modeOverride = modes[mode]?.[path];
  const value = modeOverride ?? semantics[path]?.$value ?? semantics[path];

  const refMatch = value?.match(/^\{(.+)\}$/);
  if (!refMatch) return value;

  return getNestedValue(primitives, refMatch[1]);
}
```

---

## Appendix C: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-07 | Initial specification |
| 2.0.0 | 2026-01-07 | Added visualizations, state machines, audio, tokens |
| 2.1.0 | 2026-01-07 | Added shell configuration, tabs, navigation items, rich components |
| 2.2.0 | 2026-01-07 | Added UI Sets for bundled config registration, discovery, and activation |

---

*End of Specification*

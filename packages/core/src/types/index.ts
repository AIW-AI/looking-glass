/**
 * Core type definitions for Looking Glass
 */

// ============================================================================
// MCP Protocol Types
// ============================================================================

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  handler?: ToolHandler;
}

export type ToolHandler = (params: unknown) => Promise<ToolResult>;

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

export interface Notification {
  type: string;
  data: unknown;
  timestamp?: number;
}

export interface JsonSchema {
  type: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: string[];
  description?: string;
  default?: unknown;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface UISetDefinition {
  id: string;
  name: string;
  description: string;
  shell?: ShellConfig;
  layout?: LayoutConfig;
  components?: ComponentDefinition[];
  tokens?: Record<string, unknown>;
}

export interface TransientElement {
  id: string;
  type: string;
  config: unknown;
  expiresAt?: number;
}

export interface ShellConfig {
  header?: HeaderConfig;
  footer?: FooterConfig;
  sidebar?: SidebarConfig;
  tabBar?: TabBarConfig;
}

export interface HeaderConfig {
  title?: string;
  logo?: string;
  showNav?: boolean;
}

export interface FooterConfig {
  items?: FooterItem[];
  showStatus?: boolean;
}

export interface FooterItem {
  id: string;
  label: string;
  value?: string;
}

export interface SidebarConfig {
  collapsed?: boolean;
  width?: number;
  items?: NavItem[];
}

export interface TabBarConfig {
  position?: 'top' | 'bottom';
  showAddButton?: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  action?: string;
  children?: NavItem[];
}

export interface TabInfo {
  id: string;
  label: string;
  icon?: string;
  closable?: boolean;
  content?: string;
}

// ============================================================================
// Layout Types
// ============================================================================

export type LayoutMode = 'chat' | 'dashboard' | 'split' | 'focus';

export interface LayoutConfig {
  mode: LayoutMode;
  panels?: Panel[];
}

export interface Panel {
  id: string;
  position: 'main' | 'sidebar' | 'header' | 'footer';
  size?: number | string;
  content?: string;
}

// ============================================================================
// Component Types
// ============================================================================

export interface ComponentDefinition {
  type: string;
  config: unknown;
}

export interface ComponentInstance {
  id: string;
  type: string;
  target: string;
  config: unknown;
  data?: unknown;
}

// ============================================================================
// Visualization Types
// ============================================================================

export interface VisualizationType {
  name: string;
  description: string;
  parameterSchema: JsonSchema;
  presets?: Record<string, unknown>;
}

export interface VisualizationInstance {
  id: string;
  type: string;
  target: string;
  params: unknown;
  state?: string;
}

// ============================================================================
// Chat Types
// ============================================================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  model?: string;
  tokens?: number;
  duration?: number;
  toolCalls?: ToolCallInfo[];
}

export interface ToolCallInfo {
  name: string;
  params: unknown;
  result?: unknown;
}

// ============================================================================
// Token Types
// ============================================================================

export interface TokenSet {
  primitives: Record<string, unknown>;
  semantics: Record<string, string>;
  modes: Record<string, Record<string, string>>;
}

// ============================================================================
// Transport Types
// ============================================================================

export interface Transport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  onToolCall(handler: (tool: string, params: unknown) => Promise<unknown>): void;
  onResourceRead(handler: (uri: string) => Promise<unknown>): void;
  sendNotification(notification: Notification): void;
}

export interface TransportConfig {
  type: 'http-sse' | 'websocket' | 'stdio' | 'embedded';
  url?: string;
  port?: number;
}

// ============================================================================
// Core State Types
// ============================================================================

export interface LookingGlassState {
  // UI Sets
  uiSets: {
    registered: Map<string, UISetDefinition>;
    activeId: string | null;
    transients: Map<string, TransientElement>;
  };

  // Shell
  shell: {
    config: ShellConfig;
    navItems: {
      header: NavItem[];
      footer: NavItem[];
      sidebar: NavItem[];
    };
    tabs: {
      items: TabInfo[];
      activeId: string | null;
    };
    sidebarCollapsed: boolean;
  };

  // UI
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

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  duration?: number;
}

export interface Modal {
  id: string;
  title: string;
  content: unknown;
  actions?: ModalAction[];
}

export interface ModalAction {
  label: string;
  action: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface ProgressTask {
  id: string;
  label: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'error';
}

// ============================================================================
// Core Configuration
// ============================================================================

export interface CoreConfig {
  transport: TransportConfig;
  theme?: string;
  defaultUISet?: string;
  enableAudio?: boolean;
  enableVisualization?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

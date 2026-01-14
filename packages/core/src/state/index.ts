/**
 * State Management - Zustand-based state stores for Looking Glass
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  LookingGlassState,
  UISetDefinition,
  TransientElement,
  ShellConfig,
  NavItem,
  TabInfo,
  LayoutMode,
  Panel,
  NotificationItem,
  Modal,
  ProgressTask,
  ComponentInstance,
  VisualizationType,
  VisualizationInstance,
  Message,
  ThemeDefinition,
} from '../types/index.js';
import { getEventBus, Events } from '../events/index.js';

// ============================================================================
// Initial State
// ============================================================================

const initialState: LookingGlassState = {
  assistantName: 'Assistant',
  uiSets: {
    registered: new Map(),
    activeId: null,
    transients: new Map(),
  },
  shell: {
    config: {},
    navItems: {
      header: [],
      footer: [],
      sidebar: [],
    },
    tabs: {
      items: [],
      activeId: null,
    },
    sidebarCollapsed: false,
  },
  ui: {
    theme: 'terminal',
    accentColor: '#14b8a6',
    layout: 'chat',
    panels: [],
    focus: null,
    notifications: [],
    modals: [],
    progress: [],
  },
  themes: new Map(),
  components: new Map(),
  visualizations: {
    types: new Map(),
    instances: new Map(),
  },
  tokens: {
    primitives: {},
    semantics: {},
    modes: {},
    currentMode: 'dark',
  },
  chat: {
    messages: [],
    conversationId: null,
    isStreaming: false,
  },
};

// ============================================================================
// Store Actions
// ============================================================================

export interface LookingGlassActions {
  // Identity Actions
  setAssistantName: (name: string) => void;

  // UI Set Actions
  registerUISet: (uiSet: UISetDefinition) => void;
  unregisterUISet: (id: string) => void;
  activateUISet: (id: string, transition?: { duration: number }) => void;
  deactivateUISet: () => void;
  addTransient: (element: TransientElement) => void;
  removeTransient: (id: string) => void;

  // Shell Actions
  configureShell: (config: Partial<ShellConfig>) => void;
  addNavItem: (position: 'header' | 'footer' | 'sidebar', item: NavItem) => void;
  removeNavItem: (position: 'header' | 'footer' | 'sidebar', id: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Tab Actions
  openTab: (tab: TabInfo) => void;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;

  // Theme Actions
  registerTheme: (theme: ThemeDefinition) => void;
  unregisterTheme: (id: string) => void;
  listThemes: () => ThemeDefinition[];
  getTheme: (id: string) => ThemeDefinition | undefined;
  setTheme: (themeId: string) => void;
  applyTheme: (theme: ThemeDefinition) => void;

  // UI Actions
  setAccentColor: (color: string) => void;
  setLayout: (mode: LayoutMode) => void;
  setPanels: (panels: Panel[]) => void;
  setFocus: (id: string | null) => void;
  showNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  openModal: (modal: Omit<Modal, 'id'>) => void;
  closeModal: (id: string) => void;
  addProgress: (task: Omit<ProgressTask, 'id'>) => string;
  updateProgress: (id: string, updates: Partial<ProgressTask>) => void;
  removeProgress: (id: string) => void;

  // Component Actions
  renderComponent: (instance: ComponentInstance) => void;
  updateComponent: (id: string, updates: Partial<ComponentInstance>) => void;
  removeComponent: (id: string) => void;

  // Visualization Actions
  registerVisualizationType: (type: VisualizationType) => void;
  createVisualization: (instance: VisualizationInstance) => void;
  updateVisualization: (id: string, updates: Partial<VisualizationInstance>) => void;
  destroyVisualization: (id: string) => void;

  // Token Actions
  loadTokens: (tokens: { primitives?: Record<string, unknown>; semantics?: Record<string, string> }) => void;
  setToken: (key: string, value: unknown, isPrimitive?: boolean) => void;
  setTokenMode: (mode: string) => void;
  defineTokenMode: (name: string, overrides: Record<string, string>) => void;

  // Chat Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setStreaming: (isStreaming: boolean) => void;
  setConversationId: (id: string | null) => void;

  // Reset
  reset: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

let idCounter = 0;
const generateId = (prefix: string) => `${prefix}_${++idCounter}`;

export const useLookingGlassStore = create<LookingGlassState & LookingGlassActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Identity Actions
    setAssistantName: (name) => {
      set({ assistantName: name });
    },

    // UI Set Actions
    registerUISet: (uiSet) => {
      set((state) => {
        const registered = new Map(state.uiSets.registered);
        registered.set(uiSet.id, uiSet);
        return { uiSets: { ...state.uiSets, registered } };
      });
      getEventBus().emit(Events.UISET_REGISTERED, { id: uiSet.id });
    },

    unregisterUISet: (id) => {
      set((state) => {
        const registered = new Map(state.uiSets.registered);
        registered.delete(id);
        return { uiSets: { ...state.uiSets, registered } };
      });
    },

    activateUISet: (id, transition) => {
      const uiSet = get().uiSets.registered.get(id);
      if (!uiSet) {
        console.warn(`[State] UI Set not found: ${id}`);
        return;
      }

      set((state) => ({
        uiSets: { ...state.uiSets, activeId: id },
        shell: uiSet.shell ? { ...state.shell, config: uiSet.shell } : state.shell,
        ui: uiSet.layout ? { ...state.ui, layout: uiSet.layout.mode } : state.ui,
      }));

      getEventBus().emit(Events.UISET_ACTIVATED, { id, transition });
    },

    deactivateUISet: () => {
      const currentId = get().uiSets.activeId;
      set((state) => ({
        uiSets: { ...state.uiSets, activeId: null },
      }));
      if (currentId) {
        getEventBus().emit(Events.UISET_DEACTIVATED, { id: currentId });
      }
    },

    addTransient: (element) => {
      set((state) => {
        const transients = new Map(state.uiSets.transients);
        transients.set(element.id, element);
        return { uiSets: { ...state.uiSets, transients } };
      });
    },

    removeTransient: (id) => {
      set((state) => {
        const transients = new Map(state.uiSets.transients);
        transients.delete(id);
        return { uiSets: { ...state.uiSets, transients } };
      });
    },

    // Shell Actions
    configureShell: (config) => {
      set((state) => ({
        shell: { ...state.shell, config: { ...state.shell.config, ...config } },
      }));
      getEventBus().emit(Events.SHELL_CONFIGURED, config);
    },

    addNavItem: (position, item) => {
      set((state) => ({
        shell: {
          ...state.shell,
          navItems: {
            ...state.shell.navItems,
            [position]: [...state.shell.navItems[position], item],
          },
        },
      }));
      getEventBus().emit(Events.SHELL_NAV_ITEM_ADDED, { position, item });
    },

    removeNavItem: (position, id) => {
      set((state) => ({
        shell: {
          ...state.shell,
          navItems: {
            ...state.shell.navItems,
            [position]: state.shell.navItems[position].filter((i) => i.id !== id),
          },
        },
      }));
    },

    toggleSidebar: () => {
      const collapsed = !get().shell.sidebarCollapsed;
      set((state) => ({
        shell: { ...state.shell, sidebarCollapsed: collapsed },
      }));
      getEventBus().emit(Events.SHELL_SIDEBAR_TOGGLED, { collapsed });
    },

    setSidebarCollapsed: (collapsed) => {
      set((state) => ({
        shell: { ...state.shell, sidebarCollapsed: collapsed },
      }));
      getEventBus().emit(Events.SHELL_SIDEBAR_TOGGLED, { collapsed });
    },

    // Tab Actions
    openTab: (tab) => {
      set((state) => ({
        shell: {
          ...state.shell,
          tabs: {
            items: [...state.shell.tabs.items.filter((t) => t.id !== tab.id), tab],
            activeId: tab.id,
          },
        },
      }));
      getEventBus().emit(Events.SHELL_TAB_OPENED, tab);
    },

    closeTab: (id) => {
      const { tabs } = get().shell;
      const remaining = tabs.items.filter((t) => t.id !== id);
      const newActiveId = tabs.activeId === id ? (remaining[0]?.id ?? null) : tabs.activeId;

      set((state) => ({
        shell: {
          ...state.shell,
          tabs: { items: remaining, activeId: newActiveId },
        },
      }));
      getEventBus().emit(Events.SHELL_TAB_CLOSED, { id });
    },

    activateTab: (id) => {
      set((state) => ({
        shell: {
          ...state.shell,
          tabs: { ...state.shell.tabs, activeId: id },
        },
      }));
      getEventBus().emit(Events.SHELL_TAB_ACTIVATED, { id });
    },

    // Theme Actions
    registerTheme: (theme) => {
      set((state) => {
        const themes = new Map(state.themes);
        themes.set(theme.id, theme);
        return { themes };
      });
      getEventBus().emit(Events.UI_THEME_CHANGED, { action: 'registered', theme });
    },

    unregisterTheme: (id) => {
      set((state) => {
        const themes = new Map(state.themes);
        themes.delete(id);
        return { themes };
      });
    },

    listThemes: () => {
      return Array.from(get().themes.values());
    },

    getTheme: (id) => {
      return get().themes.get(id);
    },

    setTheme: (themeId) => {
      const theme = get().themes.get(themeId);
      if (!theme) {
        console.warn(`[State] Theme not found: ${themeId}`);
        return;
      }
      get().applyTheme(theme);
      set((state) => ({ ui: { ...state.ui, theme: themeId } }));
      getEventBus().emit(Events.UI_THEME_CHANGED, { action: 'activated', themeId });
    },

    applyTheme: (theme) => {
      // Apply CSS variables to document root
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme.id);
        for (const [key, value] of Object.entries(theme.variables)) {
          root.style.setProperty(key, value);
        }
      }
    },

    // UI Actions
    setAccentColor: (color) => {
      set((state) => ({ ui: { ...state.ui, accentColor: color } }));
    },

    setLayout: (mode) => {
      set((state) => ({ ui: { ...state.ui, layout: mode } }));
      getEventBus().emit(Events.UI_LAYOUT_CHANGED, { mode });
    },

    setPanels: (panels) => {
      set((state) => ({ ui: { ...state.ui, panels } }));
    },

    setFocus: (id) => {
      set((state) => ({ ui: { ...state.ui, focus: id } }));
    },

    showNotification: (notification) => {
      const item: NotificationItem = {
        ...notification,
        id: generateId('notif'),
        timestamp: Date.now(),
      };
      set((state) => ({
        ui: { ...state.ui, notifications: [...state.ui.notifications, item] },
      }));
      getEventBus().emit(Events.UI_NOTIFICATION, item);
    },

    dismissNotification: (id) => {
      set((state) => ({
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter((n) => n.id !== id),
        },
      }));
    },

    openModal: (modal) => {
      const item: Modal = { ...modal, id: generateId('modal') };
      set((state) => ({
        ui: { ...state.ui, modals: [...state.ui.modals, item] },
      }));
      getEventBus().emit(Events.UI_MODAL_OPEN, item);
    },

    closeModal: (id) => {
      set((state) => ({
        ui: { ...state.ui, modals: state.ui.modals.filter((m) => m.id !== id) },
      }));
      getEventBus().emit(Events.UI_MODAL_CLOSE, { id });
    },

    addProgress: (task) => {
      const id = generateId('progress');
      const item: ProgressTask = { ...task, id };
      set((state) => ({
        ui: { ...state.ui, progress: [...state.ui.progress, item] },
      }));
      return id;
    },

    updateProgress: (id, updates) => {
      set((state) => ({
        ui: {
          ...state.ui,
          progress: state.ui.progress.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        },
      }));
    },

    removeProgress: (id) => {
      set((state) => ({
        ui: { ...state.ui, progress: state.ui.progress.filter((p) => p.id !== id) },
      }));
    },

    // Component Actions
    renderComponent: (instance) => {
      set((state) => {
        const components = new Map(state.components);
        components.set(instance.id, instance);
        return { components };
      });
      getEventBus().emit(Events.COMPONENT_RENDERED, instance);
    },

    updateComponent: (id, updates) => {
      set((state) => {
        const components = new Map(state.components);
        const existing = components.get(id);
        if (existing) {
          components.set(id, { ...existing, ...updates });
        }
        return { components };
      });
      getEventBus().emit(Events.COMPONENT_UPDATED, { id, updates });
    },

    removeComponent: (id) => {
      set((state) => {
        const components = new Map(state.components);
        components.delete(id);
        return { components };
      });
      getEventBus().emit(Events.COMPONENT_REMOVED, { id });
    },

    // Visualization Actions
    registerVisualizationType: (type) => {
      set((state) => {
        const types = new Map(state.visualizations.types);
        types.set(type.name, type);
        return { visualizations: { ...state.visualizations, types } };
      });
      getEventBus().emit(Events.VIZ_REGISTERED, type);
    },

    createVisualization: (instance) => {
      set((state) => {
        const instances = new Map(state.visualizations.instances);
        instances.set(instance.id, instance);
        return { visualizations: { ...state.visualizations, instances } };
      });
      getEventBus().emit(Events.VIZ_CREATED, instance);
    },

    updateVisualization: (id, updates) => {
      set((state) => {
        const instances = new Map(state.visualizations.instances);
        const existing = instances.get(id);
        if (existing) {
          instances.set(id, { ...existing, ...updates });
        }
        return { visualizations: { ...state.visualizations, instances } };
      });
      if (updates.params) {
        getEventBus().emit(Events.VIZ_PARAMS_CHANGED, { id, params: updates.params });
      }
      if (updates.state) {
        getEventBus().emit(Events.VIZ_STATE_CHANGED, { id, state: updates.state });
      }
    },

    destroyVisualization: (id) => {
      set((state) => {
        const instances = new Map(state.visualizations.instances);
        instances.delete(id);
        return { visualizations: { ...state.visualizations, instances } };
      });
      getEventBus().emit(Events.VIZ_DESTROYED, { id });
    },

    // Token Actions
    loadTokens: (tokens) => {
      set((state) => ({
        tokens: {
          ...state.tokens,
          ...(tokens.primitives && { primitives: { ...state.tokens.primitives, ...tokens.primitives } }),
          ...(tokens.semantics && { semantics: { ...state.tokens.semantics, ...tokens.semantics } }),
        },
      }));
      getEventBus().emit(Events.TOKENS_LOADED, tokens);
    },

    setToken: (key, value, isPrimitive = false) => {
      set((state) => ({
        tokens: {
          ...state.tokens,
          [isPrimitive ? 'primitives' : 'semantics']: {
            ...state.tokens[isPrimitive ? 'primitives' : 'semantics'],
            [key]: value,
          },
        },
      }));
      getEventBus().emit(Events.TOKENS_CHANGED, { key, value, isPrimitive });
    },

    setTokenMode: (mode) => {
      set((state) => ({ tokens: { ...state.tokens, currentMode: mode } }));
      getEventBus().emit(Events.TOKENS_MODE_CHANGED, { mode });
    },

    defineTokenMode: (name, overrides) => {
      set((state) => ({
        tokens: {
          ...state.tokens,
          modes: { ...state.tokens.modes, [name]: overrides },
        },
      }));
    },

    // Chat Actions
    addMessage: (message) => {
      const fullMessage: Message = {
        ...message,
        id: generateId('msg'),
        timestamp: Date.now(),
      };
      set((state) => ({
        chat: { ...state.chat, messages: [...state.chat.messages, fullMessage] },
      }));
      getEventBus().emit(Events.CHAT_MESSAGE_ADDED, fullMessage);
    },

    clearMessages: () => {
      set((state) => ({ chat: { ...state.chat, messages: [] } }));
    },

    setStreaming: (isStreaming) => {
      set((state) => ({ chat: { ...state.chat, isStreaming } }));
      if (isStreaming) {
        getEventBus().emit(Events.CHAT_STREAMING_START, {});
      } else {
        getEventBus().emit(Events.CHAT_STREAMING_END, {});
      }
    },

    setConversationId: (id) => {
      set((state) => ({ chat: { ...state.chat, conversationId: id } }));
      if (id) {
        getEventBus().emit(Events.CHAT_CONVERSATION_STARTED, { id });
      } else {
        getEventBus().emit(Events.CHAT_CONVERSATION_ENDED, {});
      }
    },

    // Reset
    reset: () => {
      set(initialState);
    },
  }))
);

// ============================================================================
// Selectors
// ============================================================================

export const selectAssistantName = (state: LookingGlassState) => state.assistantName;

export const selectUISet = (state: LookingGlassState) => ({
  active: state.uiSets.activeId,
  registered: state.uiSets.registered,
});

export const selectShell = (state: LookingGlassState) => state.shell;
export const selectUI = (state: LookingGlassState) => state.ui;
export const selectThemes = (state: LookingGlassState) => state.themes;
export const selectChat = (state: LookingGlassState) => state.chat;
export const selectTokens = (state: LookingGlassState) => state.tokens;
export const selectComponents = (state: LookingGlassState) => state.components;
export const selectVisualizations = (state: LookingGlassState) => state.visualizations;

// ============================================================================
// Subscriptions with cleanup
// ============================================================================

export type UnsubscribeFn = () => void;

export function subscribeToState<T>(
  selector: (state: LookingGlassState) => T,
  callback: (value: T, prevValue: T) => void
): UnsubscribeFn {
  return useLookingGlassStore.subscribe(selector, callback);
}

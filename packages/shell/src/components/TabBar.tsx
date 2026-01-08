import { useLookingGlassStore } from '@looking-glass/core';

export interface TabBarProps {
  className?: string;
}

export function TabBar({ className = '' }: TabBarProps) {
  const { tabs, activeId, openTab, closeTab, activateTab } = useLookingGlassStore((state) => ({
    tabs: state.shell.tabs.items,
    activeId: state.shell.tabs.activeId,
    openTab: state.openTab,
    closeTab: state.closeTab,
    activateTab: state.activateTab,
  }));

  const config = useLookingGlassStore((state) => state.shell.config.tabBar);

  return (
    <div className={`lg-tabbar ${className}`}>
      <div className="lg-tabbar__tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`lg-tabbar__tab ${activeId === tab.id ? 'lg-tabbar__tab--active' : ''}`}
            onClick={() => activateTab(tab.id)}
          >
            {tab.icon && <span className="lg-tabbar__tab-icon">{tab.icon}</span>}
            <span className="lg-tabbar__tab-label">{tab.label}</span>
            {tab.closable !== false && (
              <button
                className="lg-tabbar__tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                aria-label={`Close ${tab.label}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {config?.showAddButton !== false && (
        <button
          className="lg-tabbar__add"
          onClick={() => {
            const id = `tab_${Date.now()}`;
            openTab({ id, label: 'New Tab', closable: true });
          }}
          aria-label="Add new tab"
        >
          +
        </button>
      )}
    </div>
  );
}

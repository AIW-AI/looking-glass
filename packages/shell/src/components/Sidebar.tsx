import { useState } from 'react';
import { useLookingGlassStore } from '@looking-glass/core';

export interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = '' }: SidebarProps) {
  const { config, navItems, collapsed, toggleSidebar } = useLookingGlassStore((state) => ({
    config: state.shell.config.sidebar,
    navItems: state.shell.navItems.sidebar,
    collapsed: state.shell.sidebarCollapsed,
    toggleSidebar: state.toggleSidebar,
  }));

  if (collapsed) {
    return (
      <aside className={`lg-sidebar lg-sidebar--collapsed ${className}`}>
        <button
          className="lg-sidebar__toggle"
          onClick={toggleSidebar}
          aria-label="Expand sidebar"
        >
          ▸
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={`lg-sidebar ${className}`}
      style={{ width: config?.width ?? 200 }}
    >
      <button
        className="lg-sidebar__toggle"
        onClick={toggleSidebar}
        aria-label="Collapse sidebar"
      >
        ◂
      </button>

      <nav className="lg-sidebar__nav">
        {navItems.map((item) => (
          <SidebarItem key={item.id} item={item} />
        ))}
      </nav>
    </aside>
  );
}

interface SidebarItemProps {
  item: {
    id: string;
    label: string;
    icon?: string;
    href?: string;
    action?: string;
    children?: SidebarItemProps['item'][];
  };
  depth?: number;
}

function SidebarItem({ item, depth = 0 }: SidebarItemProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="lg-sidebar__item-wrapper">
      <a
        href={item.href ?? '#'}
        className={`lg-sidebar__item lg-sidebar__item--depth-${depth}`}
        onClick={(e) => {
          if (hasChildren) {
            e.preventDefault();
            setExpanded(!expanded);
          } else if (item.action) {
            e.preventDefault();
            // Dispatch action
          }
        }}
      >
        <span className="lg-sidebar__item-icon">
          {hasChildren ? (expanded ? '▾' : '▸') : '▪'}
        </span>
        <span className="lg-sidebar__item-label">{item.label}</span>
      </a>

      {hasChildren && expanded && (
        <div className="lg-sidebar__children">
          {item.children!.map((child) => (
            <SidebarItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

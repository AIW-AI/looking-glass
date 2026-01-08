import { type ReactNode } from 'react';
import { useLookingGlassStore } from '@looking-glass/core';
import { Header } from './Header.js';
import { Footer } from './Footer.js';
import { Sidebar } from './Sidebar.js';
import { TabBar } from './TabBar.js';

export interface ShellProps {
  children?: ReactNode;
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showSidebar?: boolean;
  showTabBar?: boolean;
}

export function Shell({
  children,
  className = '',
  showHeader = true,
  showFooter = true,
  showSidebar = true,
  showTabBar = true,
}: ShellProps) {
  const sidebarCollapsed = useLookingGlassStore((state) => state.shell.sidebarCollapsed);
  const hasTabs = useLookingGlassStore((state) => state.shell.tabs.items.length > 0);

  return (
    <div className={`lg-shell ${className}`}>
      {showHeader && <Header />}

      {showTabBar && hasTabs && <TabBar />}

      <div className="lg-shell__body">
        {showSidebar && <Sidebar />}

        <main
          className={`lg-shell__main ${
            showSidebar && !sidebarCollapsed ? 'lg-shell__main--with-sidebar' : ''
          }`}
        >
          {children}
        </main>
      </div>

      {showFooter && <Footer />}
    </div>
  );
}

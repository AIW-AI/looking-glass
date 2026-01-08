import { useLookingGlassStore } from '@looking-glass/core';

export interface HeaderProps {
  className?: string;
}

export function Header({ className = '' }: HeaderProps) {
  const { config, navItems } = useLookingGlassStore((state) => ({
    config: state.shell.config.header,
    navItems: state.shell.navItems.header,
  }));

  return (
    <header className={`lg-header ${className}`}>
      <div className="lg-header__brand">
        {config?.logo && <img src={config.logo} alt="" className="lg-header__logo" />}
        <span className="lg-header__title">{config?.title ?? 'LOOKING GLASS'}</span>
      </div>

      {config?.showNav !== false && navItems.length > 0 && (
        <nav className="lg-header__nav">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href ?? '#'}
              className="lg-header__nav-item"
              onClick={(e) => {
                if (item.action) {
                  e.preventDefault();
                  // Dispatch action via event bus
                }
              }}
            >
              {item.icon && <span className="lg-header__nav-icon">{item.icon}</span>}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      )}

      <div className="lg-header__status">
        <span className="lg-header__status-dot lg-header__status-dot--connected" />
        <span className="lg-header__status-text">connected</span>
      </div>
    </header>
  );
}

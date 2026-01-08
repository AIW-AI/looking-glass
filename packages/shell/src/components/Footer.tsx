import { Fragment } from 'react';
import { useLookingGlassStore } from '@looking-glass/core';

export interface FooterProps {
  className?: string;
}

export function Footer({ className = '' }: FooterProps) {
  const { config, theme } = useLookingGlassStore((state) => ({
    config: state.shell.config.footer,
    theme: state.ui.theme,
  }));

  const items = config?.items ?? [
    { id: 'version', label: 'v0.1.0', value: undefined },
    { id: 'theme', label: 'theme', value: theme },
  ];

  return (
    <footer className={`lg-footer ${className}`}>
      <div className="lg-footer__items">
        {items.map((item, index) => (
          <Fragment key={item.id}>
            {index > 0 && <span className="lg-footer__separator">│</span>}
            <span className="lg-footer__item">
              {item.label}
              {item.value && (
                <>
                  <span className="lg-footer__colon">:</span>
                  <span className="lg-footer__value">{item.value}</span>
                </>
              )}
            </span>
          </Fragment>
        ))}
      </div>
    </footer>
  );
}

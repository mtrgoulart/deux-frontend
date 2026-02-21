import { useState, useMemo } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import TopHeader from './TopHeader';

// ─── Section Icons ───────────────────────────────────────────────────────────

const IconShield = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const IconCog = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconCopyPaste = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const IconChart = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 3v18h18" />
    <path d="M7 16l4-8 4 5 5-9" />
  </svg>
);

const IconUser = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 10-16 0" />
  </svg>
);

const IconCode = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
    <line x1="14" y1="4" x2="10" y2="20" />
  </svg>
);

// ─── Link Icons ──────────────────────────────────────────────────────────────

const IconUsers = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 21a8 8 0 00-16 0" />
    <circle cx="10" cy="8" r="5" />
    <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 00-.45-8.3" />
  </svg>
);

const IconSliders = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const IconTarget = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);

const IconPaperPlane = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 3l3 9-3 9 19-9L3 3z" />
    <path d="M6 12h16" />
  </svg>
);

const IconPlusCircle = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const IconCompass = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const IconBell = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

const IconZap = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconArrowsUpDown = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 3v18" /><path d="M3 7l4-4 4 4" />
    <path d="M17 21V3" /><path d="M21 17l-4 4-4-4" />
  </svg>
);

const IconBriefcase = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    <path d="M12 12h.01" />
  </svg>
);

const IconCandlestick = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 2v4" /><path d="M9 12v4" /><rect x="7" y="6" width="4" height="6" rx="1" />
    <path d="M17 6v4" /><path d="M17 16v2" /><rect x="15" y="10" width="4" height="6" rx="1" />
  </svg>
);

const IconKey = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const IconWallet = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="1" y="6" width="22" height="14" rx="2" ry="2" />
    <path d="M1 10h22" /><circle cx="18" cy="15" r="1" />
  </svg>
);

const IconSend = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const ChevronRightIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
  </svg>
);

const IconChevronsLeft = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M11 17l-5-5 5-5" />
    <path d="M18 17l-5-5 5-5" />
  </svg>
);

const IconChevronsRight = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 17l5-5-5-5" />
    <path d="M13 17l5-5-5-5" />
  </svg>
);

// ─── Navigation Config ───────────────────────────────────────────────────────

const navSectionsConfig = {
  administration: {
    titleKey: 'nav.administration',
    icon: IconShield,
    allowedGroups: ['Admin'],
    links: [
      { path: '/users', labelKey: 'nav.users', icon: IconUsers },
      { path: '/admin/traces', labelKey: 'nav.signalTraces', icon: IconZap },
    ]
  },
  automation: {
    titleKey: 'nav.automation',
    icon: IconCog,
    allowedGroups: ['Admin', 'Developer'],
    links: [
      { path: '/automation/configuration', labelKey: 'nav.configuration', icon: IconSliders },
      { path: '/automation/strategy', labelKey: 'nav.strategy', icon: IconTarget },
      { path: '/automation/indicators', labelKey: 'nav.indicators', icon: IconPaperPlane },
    ]
  },
  copy: {
    titleKey: 'nav.copy',
    icon: IconCopyPaste,
    links: [
      { path: '/copy', labelKey: 'nav.create', icon: IconPlusCircle, allowedGroups: ['Admin', 'Developer'] },
      { path: '/copy/explore', labelKey: 'nav.explore', icon: IconCompass },
      { path: '/copy/subscriptions', labelKey: 'nav.subscriptions', icon: IconBell },
    ],
  },
  mercado: {
    titleKey: 'nav.visualization',
    icon: IconChart,
    links: [
      { path: '/signals', labelKey: 'nav.signals', icon: IconZap },
      { path: '/operations', labelKey: 'nav.operations', icon: IconArrowsUpDown },
      { path: '/positions', labelKey: 'nav.positions', icon: IconBriefcase },
      { path: '/market/data', labelKey: 'nav.marketData', icon: IconCandlestick },
    ],
  },
  user: {
    titleKey: 'nav.user',
    icon: IconUser,
    links: [
      { path: '/user/apikeys', labelKey: 'nav.apiKeys', icon: IconKey },
      { path: '/user/wallet', labelKey: 'nav.wallet', icon: IconWallet },
    ]
  },
  development: {
    titleKey: 'nav.development',
    icon: IconCode,
    allowedGroups: ['Admin', 'Developer'],
    links: [
      { path: '/send-signal', labelKey: 'nav.sendSignal', icon: IconSend },
    ],
  }
};

// ─── Sidebar Component ───────────────────────────────────────────────────────

function SidebarLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const accessibleNavSections = useMemo(() => {
    const userGroup = user?.group;
    if (!userGroup) return {};

    return Object.entries(navSectionsConfig).reduce((acc, [key, section]) => {
      if (section.allowedGroups && !section.allowedGroups.includes(userGroup)) {
        return acc;
      }

      const accessibleLinks = section.links.filter(link =>
        !link.allowedGroups || link.allowedGroups.includes(userGroup)
      );

      if (accessibleLinks.length > 0) {
        acc[key] = { ...section, links: accessibleLinks };
      }

      return acc;
    }, {});
  }, [user]);

  const findInitialOpenSection = () => {
    for (const sectionKey in accessibleNavSections) {
      if (accessibleNavSections[sectionKey].links.some(link => location.pathname.startsWith(link.path) && link.path !== '/')) {
        return [sectionKey];
      }
    }
    return [];
  };

  const [openSections, setOpenSections] = useState(findInitialOpenSection);

  const toggleSection = (sectionKey) => {
    setOpenSections(prevOpenSections =>
      prevOpenSections.includes(sectionKey)
        ? prevOpenSections.filter(key => key !== sectionKey)
        : [...prevOpenSections, sectionKey]
    );
  };

  const isActive = (path) => location.pathname === path;

  const sectionHasActiveLink = (section) =>
    section.links.some(link => location.pathname === link.path);

  const handleCollapsedClick = (sectionKey) => {
    setIsCollapsed(false);
    if (!openSections.includes(sectionKey)) {
      setOpenSections(prev => [...prev, sectionKey]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-primary font-sans">
      <TopHeader isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`bg-surface backdrop-blur-sm flex flex-col border-r border-border
            overflow-y-auto overflow-x-hidden transition-[width] duration-300 ease-in-out flex-shrink-0
            ${isCollapsed ? 'w-16' : 'w-64'}`}
        >
          {isCollapsed ? (
            /* ─── Collapsed View: Section Icons Only ───────────────── */
            <nav className="flex flex-col items-center py-4 gap-1">
              {Object.entries(accessibleNavSections).map(([key, section]) => {
                const hasActive = sectionHasActiveLink(section);
                const SectionIcon = section.icon;

                return (
                  <button
                    key={key}
                    onClick={() => handleCollapsedClick(key)}
                    title={t(section.titleKey)}
                    className={`p-2.5 rounded-lg transition-all duration-200
                      ${hasActive
                        ? 'bg-accent-muted text-content-accent'
                        : 'text-content-muted hover:bg-surface-raised hover:text-content-primary'
                      }`}
                  >
                    <SectionIcon className="w-5 h-5" />
                  </button>
                );
              })}
            </nav>
          ) : (
            /* ─── Expanded View: Full Navigation ───────────────────── */
            <nav className="flex flex-col py-4 px-3 gap-1">
              {Object.entries(accessibleNavSections).map(([key, section]) => {
                const isOpen = openSections.includes(key);
                const hasActive = sectionHasActiveLink(section);
                const SectionIcon = section.icon;

                return (
                  <div key={key}>
                    {/* Section header */}
                    <button
                      onClick={() => toggleSection(key)}
                      className={`w-full flex items-center gap-3 text-left py-2.5 px-3 rounded-lg transition-all duration-200 group
                        ${hasActive
                          ? 'text-content-accent'
                          : 'text-content-secondary hover:bg-surface-raised hover:text-content-primary'
                        }`}
                    >
                      <SectionIcon
                        className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200
                          ${hasActive
                            ? 'text-content-accent'
                            : 'text-content-muted group-hover:text-content-primary'
                          }`}
                      />
                      <span className="text-sm font-semibold uppercase tracking-wider flex-1">
                        {t(section.titleKey)}
                      </span>
                      <ChevronRightIcon
                        className={`w-4 h-4 text-content-muted transition-transform duration-300 ease-out
                          ${isOpen ? 'rotate-90' : ''}`}
                      />
                    </button>

                    {/* Section links */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out
                        ${isOpen ? 'max-h-96 mt-1' : 'max-h-0'}`}
                    >
                      <ul className="ml-3 pl-3 border-l border-border-subtle space-y-0.5">
                        {section.links.map((link, index) => {
                          const active = isActive(link.path);
                          const LinkIcon = link.icon;

                          return (
                            <li
                              key={link.path}
                              className={isOpen ? 'animate-nav-item-in opacity-0' : ''}
                              style={isOpen ? { animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' } : {}}
                            >
                              <Link
                                to={link.path}
                                className={`relative flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm transition-all duration-200
                                  ${active
                                    ? 'bg-accent-muted text-content-accent font-medium'
                                    : 'text-content-secondary hover:bg-surface-raised hover:text-content-primary hover:translate-x-0.5'
                                  }`}
                              >
                                {/* Active indicator bar */}
                                {active && (
                                  <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[13px] w-[3px] h-4 bg-accent rounded-full" />
                                )}
                                <LinkIcon
                                  className={`w-4 h-4 flex-shrink-0 transition-colors duration-200
                                    ${active ? 'text-content-accent' : ''}`}
                                />
                                <span>{t(link.labelKey)}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </nav>
          )}

        </aside>

        <main className="flex-1 p-8 bg-surface-primary overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default SidebarLayout;

import { useState, useMemo } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import TopHeader from './TopHeader';

const ChevronRightIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
  </svg>
);

const navSectionsConfig = {
  administration: {
    titleKey: 'nav.administration',
    allowedGroups: ['Admin'],
    links: [
        { path: '/users', labelKey: 'nav.users' },
    ]
  },
  automation: {
    titleKey: 'nav.automation',
    allowedGroups: ['Admin', 'Developer'],
    links: [
      { path: '/automation/configuration', labelKey: 'nav.configuration' },
      { path: '/automation/strategy', labelKey: 'nav.strategy' },
      { path: '/automation/indicators', labelKey: 'nav.indicators' },
    ]
  },
  copy: {
    titleKey: 'nav.copy',
    links: [
      { path: '/copy', labelKey: 'nav.create', allowedGroups: ['Admin', 'Developer'] },
      { path: '/copy/explore', labelKey: 'nav.explore' },
      { path: '/copy/subscriptions', labelKey: 'nav.subscriptions' },
    ],
  },
  mercado: {
    titleKey: 'nav.visualization',
    links: [
      { path: '/signals', labelKey: 'nav.signals' },
      { path: '/operations', labelKey: 'nav.operations' },
      { path: '/pnl', labelKey: 'nav.pnl' },
      { path: '/market/data', labelKey: 'nav.marketData' }
    ],
  },
  user: {
    titleKey: 'nav.user',
    links: [
        { path: '/user/apikeys', labelKey: 'nav.apiKeys' },
        { path: '/user/wallet', labelKey: 'nav.wallet' },
    ]
  },
  development: {
    titleKey: 'nav.development',
    allowedGroups: ['Admin', 'Developer'],
    links: [
      { path: '/send-signal', labelKey: 'nav.sendSignal' },
    ],
  }
};

function SidebarLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

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

  const getLinkClass = (path) => {
    return location.pathname === path
      ? 'bg-accent-muted text-content-accent'
      : 'text-content-secondary hover:bg-surface-raised hover:text-content-primary';
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-primary font-sans">
      <TopHeader />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-surface backdrop-blur-sm p-6 flex flex-col border-r border-border overflow-y-auto">
          <nav className="flex flex-col space-y-2">
            {Object.entries(accessibleNavSections).map(([key, section]) => {
              const isOpen = openSections.includes(key);
              return (
                <div key={key}>
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between text-left py-2 px-4 rounded-md hover:bg-surface-raised focus:outline-none"
                  >
                    <span className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
                      {t(section.titleKey)}
                    </span>
                    <ChevronRightIcon
                      className={`w-5 h-5 text-content-muted transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
                    />
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 mt-2' : 'max-h-0'}`}
                  >
                    <ul className="space-y-1 border-l border-border-subtle ml-4">
                      {section.links.map((link) => (
                        <li key={link.path} className="pl-2">
                          <Link
                            to={link.path}
                            className={`block w-full py-2 px-3 rounded-r-md text-sm transition-colors duration-200 ${getLinkClass(link.path)}`}
                          >
                            {t(link.labelKey)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-8 bg-surface-primary overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default SidebarLayout;

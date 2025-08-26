import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import logoImage from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

// Ícone de chevron
const ChevronRightIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
  </svg>
);

// Estrutura de dados para os links com a nova ordem
const navSections = {
  administration: {
    title: 'Administration',
    links: [
        { path: '/users', label: 'Users' },
    ]
  },
  operacao: {
    title: 'Operation',
    links: [
      { path: '/apikeys', label: '1 - API Keys' },
      { path: '/strategies', label: '2 - Configuration' },
      { path: '/', label: '3 - Strategy' },
      { path: '/indicators', label: '4 - Indicators' },
    ],
  },
  mercado: {
    title: 'Visualization',
    links: [
      { path: '/signals', label: 'Signals' },
      { path: '/operations', label: 'Operations' },
      { path: '/sharing', label: 'Sharing' },
      { path: '/subscriptions', label: 'Subscriptions' },
    ],
  },
  development: {
    title: 'Development',
    links: [
      { path: '/send-signal', label: 'Send Signal' },
    ],
  }
};

function SidebarLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const findInitialOpenSection = () => {
    for (const sectionKey in navSections) {
      if (navSections[sectionKey].links.some(link => link.path === location.pathname)) {
        return [sectionKey];
      }
    }
    return [];
  };

  const [openSections, setOpenSections] = useState(findInitialOpenSection);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };
  
  const toggleSection = (sectionKey) => {
    setOpenSections(prevOpenSections => 
      prevOpenSections.includes(sectionKey)
        ? prevOpenSections.filter(key => key !== sectionKey)
        : [...prevOpenSections, sectionKey]
    );
  };

  const getLinkClass = (path) => {
    return location.pathname === path
      ? 'bg-slate-700 text-white'
      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white';
  };

  return (
    <div className="flex min-h-screen bg-gray-950 font-sans">
      <aside className="w-64 bg-black/80 backdrop-blur-sm p-6 flex flex-col justify-between border-r border-red-500/30">
        <div>
          <Link to="/">
            <img 
              src={logoImage} 
              alt="TradeX Logo" 
              className="w-40 h-auto mx-auto mb-10"
              style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))' }}
            />
          </Link>
          
          <nav className="flex flex-col space-y-2">
            {Object.entries(navSections).map(([key, section]) => {
              if (key === 'administration' && user?.group !== 'Admin') {
                return null;
              }

              const isOpen = openSections.includes(key);

              return (
                <div key={key}>
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between text-left py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none"
                  >
                    <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                      {section.title}
                    </span>
                    <ChevronRightIcon
                      className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
                    />
                  </button>
                  
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 mt-2' : 'max-h-0'}`}
                  >
                    <ul className="space-y-1 border-l border-gray-800 ml-4">
                      {section.links.map((link) => (
                        <li key={link.path} className="pl-2">
                          <Link
                            to={link.path}
                            className={`block w-full py-2 px-3 rounded-r-md text-sm transition-colors duration-200 ${getLinkClass(link.path)}`}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 w-full py-2 font-semibold text-gray-400 bg-transparent border-2 border-gray-700 rounded-md
                     hover:bg-red-500 hover:border-red-500 hover:text-white transition-all duration-300"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 p-8 bg-gray-950/70 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default SidebarLayout;

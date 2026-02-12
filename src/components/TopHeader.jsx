import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/logo.png';

const SunIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const ChevronDownIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
  </svg>
);

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'pt-BR', label: 'BR' },
  { code: 'es', label: 'ES' },
];

const IconSidebarToggle = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
  </svg>
);

function TopHeader({ isCollapsed, onToggleCollapse }) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const langRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    setLangOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];
  const userInitial = user?.username?.charAt(0)?.toUpperCase() || '?';

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0">
      {/* Left: Sidebar toggle + Logo */}
      <div className="flex items-center gap-3">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-md transition-colors
              ${isCollapsed
                ? 'text-content-accent bg-accent-muted'
                : 'text-content-muted hover:bg-surface-raised hover:text-content-primary'
              }`}
          >
            <IconSidebarToggle className="w-5 h-5" />
          </button>
        )}
        <Link to="/" className="flex items-center">
          <img src={logoImage} alt="Logo" className="h-8 w-auto" />
        </Link>
      </div>

      {/* Right: Language, Theme, User */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-content-secondary
                       hover:bg-surface-raised hover:text-content-primary transition-colors"
          >
            {currentLang.label}
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-md shadow-lg z-50 min-w-[80px]">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors
                    ${lang.code === i18n.language
                      ? 'text-content-accent bg-accent-muted'
                      : 'text-content-secondary hover:bg-surface-raised hover:text-content-primary'
                    }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md text-content-secondary hover:bg-surface-raised hover:text-content-primary transition-colors"
          title={theme === 'dark' ? t('header.lightMode') : t('header.darkMode')}
        >
          {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>

        {/* User Profile */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-content-secondary
                       hover:bg-surface-raised hover:text-content-primary transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-accent-muted border border-border-accent flex items-center justify-center text-xs font-bold text-content-accent">
              {userInitial}
            </div>
            <span className="hidden sm:inline">{user?.username || 'User'}</span>
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          {userOpen && (
            <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-md shadow-lg z-50 min-w-[140px]">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger-muted transition-colors"
              >
                {t('header.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopHeader;

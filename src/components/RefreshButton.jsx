import { useTranslation } from 'react-i18next';

function RefreshButton({ onClick, isRefreshing, label }) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      disabled={isRefreshing}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium uppercase tracking-wider
               text-content-secondary hover:text-content-accent
               bg-surface-primary/50 hover:bg-surface-primary border border-border-subtle rounded
               transition-all duration-200
               disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <svg
        className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {label || t('common.refresh')}
    </button>
  );
}

export default RefreshButton;

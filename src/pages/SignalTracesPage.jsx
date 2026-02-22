import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api';
import Pagination from '../components/Pagination';
import TradingBarsLoader from '../components/TradingBarsLoader';
import RefreshButton from '../components/RefreshButton';

// ─── Status Badge ────────────────────────────────────────────────────────────

const statusColors = {
  completed: 'bg-success/15 text-success',
  failed: 'bg-danger/15 text-danger',
  skipped: 'bg-warning/15 text-warning',
  in_progress: 'bg-accent/15 text-content-accent',
};

function StatusBadge({ status }) {
  const cls = statusColors[status] || 'bg-surface-raised text-content-muted';
  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${cls}`}>
      {status?.replace('_', ' ').toUpperCase()}
    </span>
  );
}

// ─── Side Badge (matches OperationsPage / SignalsPage pattern) ───────────────

function SideBadge({ side }) {
  if (!side) return <span className="text-content-muted">-</span>;
  const isBuy = side === 'buy';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
      isBuy
        ? 'bg-success-muted text-success border border-success/30'
        : 'bg-danger-muted text-danger border border-danger/30'
    }`}>
      {side.toUpperCase()}
    </span>
  );
}

// ─── Stats Bar ───────────────────────────────────────────────────────────────

function StatsBar({ stats, isLoading }) {
  const { t } = useTranslation();
  if (isLoading || !stats) return null;

  const cards = [
    { label: t('traces.totalSignals'), value: stats.total, color: 'text-content-primary' },
    { label: t('traces.successRate'), value: `${stats.success_rate}%`, color: 'text-success' },
    { label: t('traces.failed'), value: stats.failed, color: 'text-danger' },
    { label: t('traces.avgDuration'), value: stats.avg_duration_seconds ? `${stats.avg_duration_seconds}s` : '-', color: 'text-content-muted' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-content-muted mb-1">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Stage Grouping Utility ─────────────────────────────────────────────────

function groupStages(stages) {
  if (!stages || stages.length === 0) return [];

  const groups = [];
  const groupMap = new Map();

  for (const entry of stages) {
    const name = entry.stage;
    if (groupMap.has(name)) {
      groupMap.get(name).entries.push(entry);
    } else {
      const group = { stageName: name, entries: [entry] };
      groupMap.set(name, group);
      groups.push(group);
    }
  }

  // Set final status to the last entry's status
  for (const group of groups) {
    group.finalStatus = group.entries[group.entries.length - 1].status;
  }

  return groups;
}

// ─── Stage Icons ─────────────────────────────────────────────────────────────

const stageIcons = {
  webhook_received: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  webhook_auth: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  webhook_process: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  trade_execute: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  trade_save: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  price_enrichment: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function getStageIcon(stageName) {
  return stageIcons[stageName] || (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ─── Stage Group Component ──────────────────────────────────────────────────

function StageGroup({ group, index }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const { stageName, finalStatus, entries } = group;
  const isMulti = entries.length > 1;
  const firstEntry = entries[0];
  const lastEntry = entries[entries.length - 1];

  const dotColor =
    finalStatus === 'completed' ? 'bg-success' :
    finalStatus === 'failed' ? 'bg-danger' :
    finalStatus === 'skipped' ? 'bg-warning' :
    'bg-accent';

  const glowColor =
    finalStatus === 'completed' ? 'shadow-success/30' :
    finalStatus === 'failed' ? 'shadow-danger/30' :
    finalStatus === 'skipped' ? 'shadow-warning/30' :
    'shadow-accent/30';

  // Extract raw_message from webhook_received metadata
  const rawMessage = stageName === 'webhook_received'
    ? entries.find(e => e.metadata?.raw_message)?.metadata?.raw_message
    : null;

  return (
    <div
      className="relative animate-fadeIn"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Timeline dot — centered on the card's top area */}
      <div className={`absolute -left-[25px] top-4 w-3.5 h-3.5 rounded-full ${dotColor} ring-[3px] ring-surface shadow-md ${glowColor}`} />

      {/* Stage card */}
      <div className={`rounded-lg border transition-all duration-200 ${
        expanded
          ? 'bg-surface-raised border-border shadow-sm'
          : 'bg-surface-raised border-border-subtle hover:border-border hover:shadow-sm'
      }`}>
        {/* Clickable header */}
        <button
          onClick={() => isMulti && setExpanded(!expanded)}
          className={`w-full text-left px-3.5 py-3 flex items-center justify-between gap-3 ${
            isMulti ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Stage icon */}
            <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
              finalStatus === 'completed' ? 'bg-success/10 text-success' :
              finalStatus === 'failed' ? 'bg-danger/10 text-danger' :
              finalStatus === 'skipped' ? 'bg-warning/10 text-warning' :
              'bg-accent/10 text-content-accent'
            }`}>
              {getStageIcon(stageName)}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-content-primary">{stageName}</span>
                {isMulti && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface text-content-muted border border-border-subtle">
                    {entries.length} steps
                  </span>
                )}
              </div>
              <p className="text-[11px] text-content-muted mt-0.5">
                {new Date(firstEntry.timestamp).toLocaleString()}
                {isMulti && ` → ${new Date(lastEntry.timestamp).toLocaleString()}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={finalStatus} />
            {isMulti && (
              <svg
                className={`w-4 h-4 text-content-muted transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </button>

        {/* Inline content for single entries / raw message */}
        <div className="px-3.5 pb-3">
          {/* Raw message display for webhook_received */}
          {rawMessage && (
            <div className="mt-1">
              <p className="text-xs font-semibold text-content-secondary mb-1">{t('traces.rawMessage')}</p>
              <pre className="text-xs text-content-primary bg-surface rounded p-2 font-mono whitespace-pre-wrap break-all border border-border-subtle">
                {rawMessage}
              </pre>
            </div>
          )}

          {/* Single-entry: show metadata/errors inline */}
          {!isMulti && (
            <>
              {firstEntry.celery_task_id && (
                <p className="text-xs text-content-muted mt-1 font-mono">
                  Task: {firstEntry.celery_task_id.substring(0, 8)}...
                </p>
              )}
              {firstEntry.error && (
                <p className="text-xs text-danger mt-1">{firstEntry.error}</p>
              )}
              {firstEntry.metadata && Object.keys(firstEntry.metadata).filter(k => k !== 'raw_message').length > 0 && (
                <div className="mt-2 text-xs text-content-muted bg-surface rounded p-2 font-mono">
                  {Object.entries(firstEntry.metadata)
                    .filter(([k]) => k !== 'raw_message')
                    .map(([k, v]) => (
                      <div key={k}>{k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
                    ))}
                </div>
              )}
            </>
          )}

          {/* Multi-entry: expandable sub-steps with animation */}
          {isMulti && (
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              expanded ? 'max-h-[2000px] opacity-100 mt-2' : 'max-h-0 opacity-0'
            }`}>
              <div className="space-y-2 pl-3 border-l-2 border-border-subtle">
                {entries.map((entry, idx) => {
                  const subDotColor =
                    entry.status === 'completed' ? 'bg-success' :
                    entry.status === 'failed' ? 'bg-danger' :
                    entry.status === 'skipped' ? 'bg-warning' :
                    'bg-accent';

                  return (
                    <div
                      key={idx}
                      className="relative bg-surface rounded-lg p-2.5 border border-border-subtle animate-fadeIn"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {/* Sub-step dot on the left border */}
                      <div className={`absolute -left-[7px] top-3 w-2.5 h-2.5 rounded-full ${subDotColor} ring-2 ring-surface-raised`} />

                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-content-secondary">
                          Step {idx + 1}
                        </span>
                        <StatusBadge status={entry.status} />
                      </div>
                      <p className="text-[11px] text-content-muted">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                      {entry.celery_task_id && (
                        <p className="text-[11px] text-content-muted mt-0.5 font-mono">
                          Task: {entry.celery_task_id.substring(0, 8)}...
                        </p>
                      )}
                      {entry.error && (
                        <p className="text-xs text-danger mt-1">{entry.error}</p>
                      )}
                      {entry.metadata && Object.keys(entry.metadata).filter(k => k !== 'raw_message').length > 0 && (
                        <div className="mt-1.5 text-xs text-content-muted bg-surface-raised rounded p-1.5 font-mono">
                          {Object.entries(entry.metadata)
                            .filter(([k]) => k !== 'raw_message')
                            .map(([k, v]) => (
                              <div key={k}>{k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal Loading Skeleton ──────────────────────────────────────────────────

function TraceDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="px-6 py-4 border-b border-border">
        <div className="h-5 w-40 bg-surface-raised rounded mb-2" />
        <div className="h-3 w-64 bg-surface-raised rounded" />
      </div>

      {/* Meta skeleton */}
      <div className="px-6 py-3 border-b border-border grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i}>
            <div className="h-3 w-16 bg-surface-raised rounded mb-1.5" />
            <div className="h-4 w-24 bg-surface-raised rounded" />
          </div>
        ))}
      </div>

      {/* Timeline skeleton */}
      <div className="px-6 py-4 space-y-4">
        <div className="h-4 w-32 bg-surface-raised rounded mb-3" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-surface-raised flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="h-16 bg-surface-raised rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Detail Modal ────────────────────────────────────────────────────────────

function TraceDetailModal({ trace, isLoading, onClose, isAdmin = true }) {
  const { t } = useTranslation();

  const stageGroups = trace ? groupStages(trace.stages) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-modalSlideIn"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading || !trace ? (
          <TraceDetailSkeleton />
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-content-primary">{t('traces.traceDetail')}</h3>
                  {isAdmin && trace.user_id && (
                    <span className="text-sm text-content-muted">
                      {t('traces.userId')}: <span className="font-medium text-content-secondary">{trace.user_id}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-content-muted font-mono mt-0.5">{trace.trace_id}</p>
              </div>
              <StatusBadge status={trace.final_status} />
            </div>

            {/* Meta */}
            <div className="px-6 py-3 border-b border-border grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-content-muted text-xs">{t('traces.pattern')}</span>
                <p className="text-content-primary font-medium">{trace.pattern}</p>
              </div>
              <div>
                <span className="text-content-muted text-xs">{t('traces.symbol')}</span>
                <p className="text-content-primary font-medium">{trace.symbol || '-'}</p>
              </div>
              <div>
                <span className="text-content-muted text-xs">{t('traces.side')}</span>
                <div className="mt-0.5"><SideBadge side={trace.side} /></div>
              </div>
              <div>
                <span className="text-content-muted text-xs">{t('traces.duration')}</span>
                <p className="text-content-primary font-medium">
                  {trace.duration_seconds != null ? `${trace.duration_seconds}s` : '-'}
                </p>
              </div>
              <div>
                <span className="text-content-muted text-xs">{t('traces.exchange')}</span>
                <p className="text-content-primary font-medium">{trace.exchange_name || '-'}</p>
              </div>
              <div>
                <span className="text-content-muted text-xs">{t('traces.qty')}</span>
                <p className="text-content-primary font-medium">{trace.operation?.size || '-'}</p>
              </div>
              <div>
                <span className="text-content-muted text-xs">{t('traces.execPrice')}</span>
                <p className="text-content-primary font-medium">{trace.operation?.execution_price || '-'}</p>
              </div>
              <div>
                <span className="text-content-muted text-xs">{t('traces.opStatus')}</span>
                <p className="text-content-primary font-medium">{trace.operation?.status || '-'}</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <h4 className="text-sm font-semibold text-content-secondary mb-4">{t('traces.pipeline')}</h4>
              <div className="relative pl-6 border-l-2 border-border space-y-3">
                {stageGroups.map((group, idx) => (
                  <StageGroup key={`${group.stageName}-${idx}`} group={group} index={idx} />
                ))}
              </div>

              {trace.error_message && (
                <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-lg animate-fadeIn">
                  <p className="text-xs font-semibold text-danger mb-1">{t('traces.errorMessage')}</p>
                  <p className="text-xs text-danger/80">{trace.error_message}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-border flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-surface-raised text-content-secondary hover:text-content-primary hover:bg-surface-raised/80 transition-colors"
              >
                {t('traces.close')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function SignalTracesPage({ mode = 'admin' }) {
  const { t } = useTranslation();
  const isAdmin = mode === 'admin';
  const apiBase = isAdmin ? '/admin/traces' : '/traces';

  // Filters
  const [searchTraceId, setSearchTraceId] = useState('');
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statsHours, setStatsHours] = useState(24);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 25;

  // Detail modal
  const [selectedTraceId, setSelectedTraceId] = useState(null);

  // Build query params
  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', currentPage);
    params.set('limit', limit);
    if (searchTraceId) params.set('trace_id', searchTraceId);
    if (filterSymbol) params.set('symbol', filterSymbol);
    if (filterStatus !== 'all') params.set('status', filterStatus);
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    return params.toString();
  }, [currentPage, searchTraceId, filterSymbol, filterStatus, startDate, endDate]);

  // Fetch traces
  const { data: tracesData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['traces', mode, currentPage, searchTraceId, filterSymbol, filterStatus, startDate, endDate],
    queryFn: async () => {
      const res = await apiFetch(`${apiBase}?${buildParams()}`);
      if (!res || !res.ok) throw new Error('Failed to fetch traces');
      return res.json();
    },
    keepPreviousData: true,
    staleTime: 30 * 1000,
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['traces-stats', mode, statsHours],
    queryFn: async () => {
      const res = await apiFetch(`${apiBase}/stats?hours=${statsHours}`);
      if (!res || !res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  // Fetch single trace detail
  const { data: traceDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['trace-detail', mode, selectedTraceId],
    queryFn: async () => {
      if (!selectedTraceId) return null;
      const res = await apiFetch(`${apiBase}/${selectedTraceId}`);
      if (!res || !res.ok) throw new Error('Failed to fetch trace');
      return res.json();
    },
    enabled: !!selectedTraceId,
  });

  const traces = tracesData?.traces || [];
  const total = tracesData?.total || 0;
  const totalPages = tracesData?.pages || 0;

  const clearFilters = () => {
    setSearchTraceId('');
    setFilterSymbol('');
    setFilterStatus('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasFilters = searchTraceId || filterSymbol || filterStatus !== 'all' || startDate || endDate;

  if (isLoading && !tracesData) {
    return <TradingBarsLoader title={t('traces.loadingTitle')} subtitle={t('traces.loadingDescription')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">{t('traces.title')}</h1>
          <p className="text-sm text-content-muted mt-1">{t(isAdmin ? 'traces.subtitle' : 'traces.subtitleUser')}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statsHours}
            onChange={(e) => setStatsHours(Number(e.target.value))}
            className="text-sm bg-surface border border-border rounded-lg px-3 py-2 text-content-secondary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value={1}>1h</option>
            <option value={6}>6h</option>
            <option value={24}>24h</option>
            <option value={72}>3d</option>
            <option value={168}>7d</option>
          </select>
          <RefreshButton onClick={refetch} />
        </div>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} isLoading={statsLoading} />

      {/* Filters */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-content-secondary">{t('traces.filters')}</h3>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-content-muted hover:text-content-primary transition-colors"
            >
              {t('traces.clearAll')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder={t('traces.searchByTraceId')}
            value={searchTraceId}
            onChange={(e) => { setSearchTraceId(e.target.value); setCurrentPage(1); }}
            className="text-sm bg-surface-raised border border-border-subtle rounded-lg px-3 py-2 text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <input
            type="text"
            placeholder={t('traces.filterBySymbol')}
            value={filterSymbol}
            onChange={(e) => { setFilterSymbol(e.target.value); setCurrentPage(1); }}
            className="text-sm bg-surface-raised border border-border-subtle rounded-lg px-3 py-2 text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="text-sm bg-surface-raised border border-border-subtle rounded-lg px-3 py-2 text-content-secondary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">{t('traces.allStatuses')}</option>
            <option value="completed">{t('traces.statusCompleted')}</option>
            <option value="failed">{t('traces.statusFailed')}</option>
            <option value="skipped">{t('traces.statusSkipped')}</option>
            <option value="in_progress">{t('traces.statusInProgress')}</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
            className="text-sm bg-surface-raised border border-border-subtle rounded-lg px-3 py-2 text-content-secondary focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
            className="text-sm bg-surface-raised border border-border-subtle rounded-lg px-3 py-2 text-content-secondary focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-content-secondary">{t('traces.traceLog')}</h3>
            <span className="text-xs text-content-muted">
              {total} {t('traces.tracesLabel')}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs font-medium text-content-muted uppercase tracking-wider">
                <th className="px-4 py-3 text-left">{t('traces.traceId')}</th>
                {isAdmin && <th className="px-4 py-3 text-left">{t('traces.userId')}</th>}
                <th className="px-4 py-3 text-left">{t('traces.pattern')}</th>
                <th className="px-4 py-3 text-left">{t('traces.symbol')}</th>
                <th className="px-4 py-3 text-left">{t('traces.side')}</th>
                <th className="px-4 py-3 text-left">{t('traces.currentStage')}</th>
                <th className="px-4 py-3 text-left">{t('traces.status')}</th>
                <th className="px-4 py-3 text-left">{t('traces.duration')}</th>
                <th className="px-4 py-3 text-left">{t('traces.date')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-border-subtle transition-opacity duration-300 ${isFetching && !isLoading ? 'opacity-40' : ''}`}>
              {traces.length > 0 ? (
                traces.map((trace) => (
                  <tr
                    key={trace.trace_id}
                    onClick={() => setSelectedTraceId(trace.trace_id)}
                    className="hover:bg-surface-raised/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-content-accent">
                      {trace.trace_id.substring(0, 8)}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-sm text-content-secondary">
                        {trace.user_id || '-'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-content-secondary">{trace.pattern}</td>
                    <td className="px-4 py-3 text-sm text-content-primary font-medium">
                      {trace.symbol || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <SideBadge side={trace.side} />
                    </td>
                    <td className="px-4 py-3 text-xs text-content-muted">{trace.current_stage}</td>
                    <td className="px-4 py-3"><StatusBadge status={trace.final_status} /></td>
                    <td className="px-4 py-3 text-sm text-content-muted">
                      {trace.duration_seconds != null ? `${trace.duration_seconds}s` : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-content-muted">
                      {new Date(trace.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="px-4 py-12 text-center text-content-muted text-sm">
                    {hasFilters ? t('traces.noMatchingTraces') : t('traces.noTraces')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={limit}
              totalItems={total}
              itemLabel={t('traces.tracesLabel')}
            />
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedTraceId && (
        <TraceDetailModal
          trace={traceDetail}
          isLoading={detailLoading}
          onClose={() => setSelectedTraceId(null)}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

export default SignalTracesPage;

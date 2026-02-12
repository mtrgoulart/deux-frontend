import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import TradingBarsLoader from '../components/TradingBarsLoader';
import Pagination from '../components/Pagination';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [strategiesPage, setStrategiesPage] = useState(1);
  const strategiesPerPage = 10;

  const isAdmin = user?.group === 'Admin' || user?.group === 'Developer';

  // Fetch positions
  const { data: positionsData, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const res = await apiFetch('/positions');
      const data = await res.json();
      return data.positions || [];
    },
  });

  // Fetch recent operations
  const { data: operationsData, isLoading: isLoadingOperations } = useQuery({
    queryKey: ['dashboard-operations'],
    queryFn: async () => {
      const res = await apiFetch('/dashboard/operations');
      return res.json();
    },
  });

  // Fetch instances
  const { data: instancesData, isLoading: isLoadingInstances } = useQuery({
    queryKey: ['instances', 'all'],
    queryFn: async () => {
      const res = await apiFetch('/get_instances?api_key_id=all');
      const data = await res.json();
      return data.instances || [];
    },
  });

  const positions = positionsData || [];
  const operations = operationsData || [];
  const instances = instancesData || [];

  // 7-day threshold
  const sevenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Closed positions in last 7 days
  const closedPositions7d = useMemo(() => {
    return positions.filter(p =>
      p.status === 'closed' && p.closed_at && new Date(p.closed_at) >= sevenDaysAgo
    );
  }, [positions, sevenDaysAgo]);

  // Stats
  const sevenDayPnl = useMemo(() => {
    return closedPositions7d.reduce((sum, p) => sum + (p.pnl || 0), 0);
  }, [closedPositions7d]);

  const openPositionsCount = useMemo(() => {
    return positions.filter(p => p.status === 'open').length;
  }, [positions]);

  const activeStrategiesList = useMemo(() => {
    return instances.filter(i => i.status === 2);
  }, [instances]);

  // Chart data: cumulative P&L over 7 days
  const chartDataset = useMemo(() => {
    // Build all 7 day labels
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    // Group daily P&L
    const dailyPnl = {};
    days.forEach(day => { dailyPnl[day] = 0; });
    closedPositions7d.forEach(p => {
      if (p.closed_at) {
        const day = new Date(p.closed_at).toISOString().split('T')[0];
        if (dailyPnl[day] !== undefined) {
          dailyPnl[day] += (p.pnl || 0);
        }
      }
    });

    // Cumulative
    let cumulative = 0;
    const cumulativeData = days.map(day => {
      cumulative += dailyPnl[day];
      return cumulative;
    });

    const labels = days.map(day => {
      const d = new Date(day + 'T12:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return { labels, data: cumulativeData, hasData: closedPositions7d.length > 0 };
  }, [closedPositions7d]);

  const chartColor = sevenDayPnl >= 0 ? '#4ade80' : '#f87171';

  const lineChartData = chartDataset.hasData ? {
    labels: chartDataset.labels,
    datasets: [{
      label: t('home.cumulativePnl'),
      data: chartDataset.data,
      borderColor: chartColor,
      backgroundColor: `${chartColor}20`,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { color: '#9ca3af', font: { size: 11 } }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#e5e7eb',
        bodyColor: '#fff',
        borderColor: 'rgba(128, 128, 128, 0.3)',
        borderWidth: 1,
        callbacks: {
          label: (context) => `P&L: $${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af', font: { size: 10 } },
        grid: { color: 'rgba(128, 128, 128, 0.12)' }
      },
      y: {
        ticks: {
          color: '#9ca3af',
          font: { size: 10 },
          callback: (value) => `$${value}`
        },
        grid: { color: 'rgba(128, 128, 128, 0.12)' }
      }
    }
  };

  // Recent operations (last 5)
  const recentOperations = useMemo(() => {
    const sorted = [...operations].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted.slice(0, 5);
  }, [operations]);

  // Paginated active strategies
  const paginatedStrategies = useMemo(() => {
    const start = (strategiesPage - 1) * strategiesPerPage;
    return activeStrategiesList.slice(start, start + strategiesPerPage);
  }, [activeStrategiesList, strategiesPage]);

  const strategiesTotalPages = Math.ceil(activeStrategiesList.length / strategiesPerPage);

  const isLoading = isLoadingPositions || isLoadingOperations || isLoadingInstances;

  if (isLoading) {
    return (
      <div className="bg-surface-primary">
        <TradingBarsLoader title={t('home.loadingTitle')} subtitle={t('home.loadingSubtitle')} />
      </div>
    );
  }

  const statsCards = [
    {
      label: t('home.sevenDayPnl'),
      value: `${sevenDayPnl >= 0 ? '+' : ''}$${sevenDayPnl.toFixed(2)}`,
      colorClass: sevenDayPnl >= 0 ? 'text-success' : 'text-danger',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: t('home.openPositions'),
      value: openPositionsCount,
      colorClass: 'text-content-accent',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: t('home.closedPositions7d'),
      value: closedPositions7d.length,
      colorClass: 'text-content-accent',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: t('home.activeStrategies'),
      value: activeStrategiesList.length,
      colorClass: 'text-content-accent',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const quickActions = [
    {
      label: t('home.copyTrading'),
      desc: t('home.copyTradingDesc'),
      to: '/copy/explore',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    isAdmin
      ? {
          label: t('home.createStrategy'),
          desc: t('home.createStrategyDesc'),
          to: '/automation/strategy',
          icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        }
      : {
          label: t('home.mySubscriptions'),
          desc: t('home.mySubscriptionsDesc'),
          to: '/copy/subscriptions',
          icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ),
        },
    {
      label: t('home.signals'),
      desc: t('home.signalsDesc'),
      to: '/signals',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79" />
        </svg>
      ),
    },
    {
      label: t('home.operations'),
      desc: t('home.operationsDesc'),
      to: '/operations',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="container mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600 tracking-wider uppercase">
            {t('home.title')}
          </h1>
          <p className="text-content-secondary text-sm mt-1">
            {t('home.welcome', { name: user?.username || user?.name || '' })}
          </p>
        </div>

        <div className="space-y-6">
          {/* ROW 1: Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((card, i) => (
              <div
                key={card.label}
                className="bg-surface border border-border rounded-lg p-5 animate-slide-up"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-content-muted uppercase tracking-wider">
                    {card.label}
                  </span>
                  <span className="text-content-muted">{card.icon}</span>
                </div>
                <div className={`text-2xl font-black font-mono ${card.colorClass}`}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* ROW 2: Chart + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* P&L Chart */}
            <div className="lg:col-span-2 animate-fade-in">
              <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
                {t('home.pnlChart')}
              </h2>
              <div className="bg-surface border border-border rounded-lg p-6">
                {lineChartData ? (
                  <div className="h-64 md:h-80">
                    <Line data={lineChartData} options={chartOptions} />
                  </div>
                ) : (
                  <div className="h-64 md:h-80 flex items-center justify-center">
                    <p className="text-content-muted text-sm">{t('home.noChartData')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
                {t('home.quickActions')}
              </h2>
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex items-center gap-4 bg-surface border border-border rounded-lg p-4
                             hover:-translate-y-1 hover:shadow-lg hover:border-border-accent
                             transition-all duration-300 group"
                  >
                    <span className="text-content-muted group-hover:text-content-accent transition-colors">
                      {action.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-content-primary group-hover:text-content-accent transition-colors">
                        {action.label}
                      </div>
                      <div className="text-xs text-content-muted truncate">
                        {action.desc}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 3: Recent Operations + Active Strategies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Operations */}
            <div>
              <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
                {t('home.recentOperations')}
              </h2>
              <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-3">
                  <span className="text-sm text-content-accent uppercase tracking-wider">
                    {t('home.recentOperationsLog')}
                  </span>
                </div>

                {recentOperations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border-subtle bg-surface-raised/30">
                          <th className="px-4 py-3 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('home.symbol')}</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('home.date')}</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('home.side')}</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-content-muted uppercase tracking-wider">{t('home.size')}</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-content-muted uppercase tracking-wider">{t('home.price')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {recentOperations.map((op) => (
                          <tr key={op.id} className="hover:bg-surface-raised/30 transition-colors">
                            <td className="px-4 py-3 text-sm font-mono font-bold text-content-accent">{op.symbol}</td>
                            <td className="px-4 py-3 text-sm font-mono text-content-secondary">
                              {new Date(op.date).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                op.side === 'buy' ? 'bg-success-muted text-success' : 'bg-danger-muted text-danger'
                              }`}>
                                {op.side === 'buy' ? t('home.buy') : t('home.sell')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-content-secondary text-right">
                              {Number(op.size).toFixed(4)}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-content-secondary text-right">
                              ${Number(op.execution_price).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <p className="text-content-muted text-sm">{t('home.noRecentOperations')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Strategies */}
            <div>
              <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
                {t('home.activeStrategiesTable')}
              </h2>
              <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-3">
                  <span className="text-sm text-content-accent uppercase tracking-wider">
                    {t('home.activeStrategiesLog')}
                  </span>
                </div>

                {activeStrategiesList.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border-subtle bg-surface-raised/30">
                            <th className="px-4 py-3 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('home.id')}</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('home.name')}</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('home.symbol')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {paginatedStrategies.map((inst) => (
                            <tr key={inst.id} className="hover:bg-surface-raised/30 transition-colors">
                              <td className="px-4 py-3 text-sm font-mono text-content-secondary">{inst.id}</td>
                              <td className="px-4 py-3 text-sm font-bold text-content-primary">{inst.name}</td>
                              <td className="px-4 py-3 text-sm font-mono text-content-accent">{inst.symbol}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-surface-raised/30 border-t border-border-subtle px-6 py-4">
                      <Pagination
                        currentPage={strategiesPage}
                        totalPages={strategiesTotalPages}
                        onPageChange={setStrategiesPage}
                        itemsPerPage={strategiesPerPage}
                        totalItems={activeStrategiesList.length}
                        itemLabel={t('home.strategiesLabel')}
                      />
                    </div>
                  </>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <p className="text-content-muted text-sm">{t('home.noActiveStrategies')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;

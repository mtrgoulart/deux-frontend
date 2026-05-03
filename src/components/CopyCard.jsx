import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import userIcon from '/icons/user.svg';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

function CopyCard({
  id,
  name,
  creator,
  chartData,
  isSubscribed,
  onPrimaryAction,
  onExitAction,
  virtualReturnPct,
  cyclesTotal,
  cyclesScoreable,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const totalCycles = Number(cyclesTotal ?? 0);
  const scoredCycles = Number(cyclesScoreable ?? 0);
  const numericVirtual = virtualReturnPct != null ? Number(virtualReturnPct) : null;
  const hasReturn = numericVirtual !== null && scoredCycles > 0;
  const displayVirtual = hasReturn ? numericVirtual.toFixed(2) : null;

  const hasChartData = chartData && chartData.length > 0;
  const chartColor = hasReturn
    ? (numericVirtual >= 0 ? '#4ade80' : '#f87171')
    : '#9ca3af';

  const sparklineData = hasChartData ? {
    labels: chartData.map(d => d.date),
    datasets: [{
      data: chartData.map(d => Number(d.return_pct ?? 0)),
      borderColor: chartColor,
      backgroundColor: `${chartColor}20`,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 1.5,
    }]
  } : null;

  const sparklineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: {
      line: { borderJoinStyle: 'round' }
    }
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    navigate(`/copy/details/${id}`);
  };

  return (
    <div className="relative bg-surface border border-border rounded-lg overflow-hidden hover:border-border-accent transition-all duration-300 transform hover:-translate-y-1 min-h-[200px] flex flex-col">
      {/* Subscribed indicator */}
      {isSubscribed && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-accent-muted border border-accent/30 rounded px-2 py-1">
          <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
          <span className="text-xs text-accent uppercase tracking-wider">{t('copyExplore.subscribed')}</span>
        </div>
      )}

      {/* Card content */}
      <div className="flex-grow p-5 relative">
        {/* Creator info */}
        <div className="flex items-center gap-2 mb-3">
          <img src={userIcon} alt="Creator" className="w-4 h-4 opacity-60" />
          <span className="text-xs text-content-muted uppercase tracking-wider">
            {t('copyExplore.by')} <span className="text-content-accent font-bold">{creator}</span>
          </span>
        </div>

        {/* Strategy name */}
        <h3
          className="text-lg font-bold text-content-primary leading-tight break-words mb-4"
          title={name}
        >
          {name}
        </h3>

        {/* Headline metric with sparkline */}
        <div className="bg-surface-primary border border-border rounded-lg p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-content-muted uppercase tracking-wider">
              {t('copyExplore.strategyReturn')}
            </div>
            <button
              onClick={handleViewDetails}
              className="text-xs text-content-accent hover:text-accent-hover uppercase tracking-wider transition-colors"
            >
              {t('copyExplore.details')} &rarr;
            </button>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className={`text-xl font-black font-mono leading-none flex-shrink-0 ${
              !hasReturn
                ? 'text-content-muted'
                : numericVirtual >= 0 ? 'text-success' : 'text-danger'
            }`}>
              {hasReturn
                ? `${numericVirtual >= 0 ? '+' : ''}${displayVirtual}%`
                : '—'}
            </div>
            {hasChartData && (
              <div className="w-24 h-10 overflow-hidden flex-shrink-0">
                <Line data={sparklineData} options={sparklineOptions} />
              </div>
            )}
          </div>
          <div className="text-[10px] text-content-muted mt-2">
            {totalCycles === 0
              ? t('copyExplore.noCyclesYet')
              : t('copyExplore.cyclesCoverage', { scoreable: scoredCycles, total: totalCycles })}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 bg-surface-raised/30 border-t border-border-subtle">
        {isSubscribed ? (
          <div className="flex gap-2">
            <button
              onClick={onPrimaryAction}
              className="flex-1 py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg
                       bg-surface border border-border text-content-primary
                       hover:bg-surface-raised transition-colors
                       focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {t('copyExplore.review')}
            </button>
            <button
              onClick={onExitAction}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg
                       bg-danger/80 text-white
                       hover:bg-danger transition-colors
                       focus:outline-none focus:ring-2 focus:ring-danger/20"
            >
              {t('copyExplore.exit')}
            </button>
          </div>
        ) : (
          <button
            onClick={onPrimaryAction}
            className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg
                     bg-accent hover:bg-accent-hover text-white transition-colors
                     focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {t('copyExplore.copyStrategy')}
          </button>
        )}
      </div>
    </div>
  );
}

export default CopyCard;

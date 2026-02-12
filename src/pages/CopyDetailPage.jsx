// pages/CopyDetailPage.jsx

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
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
import Pagination from '../components/Pagination';
import TradingBarsLoader from '../components/TradingBarsLoader';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function CopyDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 50;

    // Fetch copytrading details
    const { data: detailsData, isLoading: isLoadingDetails } = useQuery({
        queryKey: ['copytrading_details', id],
        queryFn: async () => {
            const res = await apiFetch(`/copytrading/${id}`);
            return res.json();
        },
    });

    // Fetch chart data
    const { data: chartResponse, isLoading: isLoadingChart } = useQuery({
        queryKey: ['copytrading_chart', id],
        queryFn: async () => {
            const res = await apiFetch(`/copytrading/${id}/chart`);
            return res.json();
        },
    });

    // Fetch trades with pagination
    const { data: tradesData, isLoading: isLoadingTrades } = useQuery({
        queryKey: ['copytrading_trades', id, currentPage],
        queryFn: async () => {
            const res = await apiFetch(`/copytrading/${id}/trades?page=${currentPage}&limit=${limit}`);
            return res.json();
        },
        keepPreviousData: true,
    });

    const chartData = chartResponse?.chart_data || [];
    const trades = tradesData?.trades || [];
    const totalPages = tradesData?.total_pages || 1;
    const totalCount = tradesData?.total_count || 0;

    // Chart configuration
    const hasChartData = chartData.length > 0;
    const lastPnl = hasChartData ? chartData[chartData.length - 1].pnl : 0;
    const chartColor = lastPnl >= 0 ? '#4ade80' : '#f87171';

    const lineChartData = hasChartData ? {
        labels: chartData.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
            label: t('copyDetail.pnlChartLabel'),
            data: chartData.map(d => d.pnl),
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
                labels: {
                    color: '#9ca3af',
                    font: { size: 11 }
                }
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

    const isLoading = isLoadingDetails || isLoadingChart || isLoadingTrades;

    if (isLoading && !tradesData) {
        return (
            <div className="bg-surface-primary">
                <TradingBarsLoader title={t('copyDetail.loadingTitle')} subtitle={t('copyDetail.loadingSubtitle')} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-primary">
            {/* Header */}
            <div className="container mx-auto px-4 md:px-6 py-6">
                <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/copy/explore')}
                                className="px-4 py-2 bg-surface-raised border border-border text-content-secondary rounded-lg text-sm
                                         hover:bg-surface-raised/80 hover:text-content-primary transition-colors
                                         focus:outline-none focus:ring-2 focus:ring-accent/20"
                            >
                                &larr; {t('copyDetail.back')}
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600 tracking-wider uppercase">
                                    {detailsData?.name || t('copyDetail.defaultTitle')}
                                </h1>
                                <p className="text-content-muted text-sm mt-1">
                                    {t('copyDetail.subtitle', { count: totalCount })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* P&L Chart Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
                            {t('copyDetail.pnlTrend')}
                        </h2>

                        <div className="bg-surface border border-border rounded-lg p-6">
                            {hasChartData ? (
                                <div className="h-64 md:h-80">
                                    <Line data={lineChartData} options={chartOptions} />
                                </div>
                            ) : (
                                <div className="h-64 md:h-80 flex items-center justify-center">
                                    <p className="text-content-muted text-sm">{t('copyDetail.noChartData')}</p>
                                </div>
                            )}

                            {/* Summary Stats */}
                            {hasChartData && (
                                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-surface-raised/50 border border-border-subtle rounded-lg p-4 text-center">
                                        <div className="text-xs text-content-muted uppercase tracking-wider mb-1">{t('copyDetail.currentPnl')}</div>
                                        <div className={`text-xl font-black font-mono ${lastPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {lastPnl >= 0 ? '+' : ''}${lastPnl.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="bg-surface-raised/50 border border-border-subtle rounded-lg p-4 text-center">
                                        <div className="text-xs text-content-muted uppercase tracking-wider mb-1">{t('copyDetail.daysTracked')}</div>
                                        <div className="text-xl font-black font-mono text-content-primary">{chartData.length}</div>
                                    </div>
                                    <div className="bg-surface-raised/50 border border-border-subtle rounded-lg p-4 text-center">
                                        <div className="text-xs text-content-muted uppercase tracking-wider mb-1">{t('copyDetail.totalTrades')}</div>
                                        <div className="text-xl font-black font-mono text-content-primary">{totalCount}</div>
                                    </div>
                                    <div className="bg-surface-raised/50 border border-border-subtle rounded-lg p-4 text-center">
                                        <div className="text-xs text-content-muted uppercase tracking-wider mb-1">{t('copyDetail.status')}</div>
                                        <div className="text-xl font-black font-mono text-success">{t('copyDetail.active')}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Trade History Table */}
                    <div>
                        <h2 className="text-lg font-semibold text-content-accent uppercase tracking-wider mb-4">
                            {t('copyDetail.tradeHistory')}
                        </h2>

                        <div className="bg-surface border border-border rounded-lg overflow-hidden">
                            {/* Table header bar */}
                            <div className="bg-surface-raised/50 border-b border-border-subtle px-6 py-3">
                                <span className="text-sm text-content-accent uppercase tracking-wider">
                                    {t('copyDetail.tradeLog')}
                                </span>
                            </div>

                            {trades.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-border-subtle bg-surface-raised/30">
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyDetail.date')}</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyDetail.symbol')}</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyDetail.side')}</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyDetail.size')}</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyDetail.price')}</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyDetail.usdtValue')}</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-content-muted uppercase tracking-wider">{t('copyDetail.instance')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-subtle">
                                                {trades.map((trade) => (
                                                    <tr key={trade.id} className="hover:bg-surface-raised/30 transition-colors group">
                                                        <td className="px-6 py-4 text-sm font-mono text-content-secondary">
                                                            {new Date(trade.date).toLocaleString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-mono font-bold text-content-accent">{trade.symbol}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                                                                trade.side === 'buy'
                                                                    ? 'bg-success-muted text-success'
                                                                    : 'bg-danger-muted text-danger'
                                                            }`}>
                                                                {trade.side === 'buy' ? t('copyDetail.buy') : t('copyDetail.sell')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-mono text-content-secondary text-right">
                                                            {trade.size.toFixed(6)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-mono text-content-secondary text-right">
                                                            ${trade.execution_price.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-mono font-bold text-content-primary text-right">
                                                            ${trade.usdt_value.toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-content-secondary">
                                                            {trade.instance_name}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="bg-surface-raised/30 border-t border-border-subtle px-6 py-4">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={setCurrentPage}
                                            itemsPerPage={limit}
                                            totalItems={totalCount}
                                            itemLabel={t('copyDetail.tradesLabel')}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="px-6 py-12 text-center">
                                    <p className="text-content-muted text-sm">{t('copyDetail.noTrades')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CopyDetailPage;

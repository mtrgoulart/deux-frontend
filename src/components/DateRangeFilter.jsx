import React from 'react';
import { useTranslation } from 'react-i18next';

function DateRangeFilter({ startDate, endDate, onStartDateChange, onEndDateChange, onPresetChange, datePresets }) {
    const { t } = useTranslation();

    return (
        <div className="mt-6 pt-6 border-t border-border-subtle">
            <label className="block text-xs font-semibold text-content-accent mb-3 uppercase tracking-wider">
                {t('common.filterByDateRange')}
            </label>

            {/* Relative Time Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
                {datePresets.map((preset) => (
                    <button
                        key={preset.value}
                        onClick={() => onPresetChange(preset.value)}
                        className={`px-4 py-2 rounded text-xs uppercase tracking-wider transition-colors
                                 focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                            preset.value === 'all' && !startDate && !endDate
                                ? 'bg-accent text-white font-bold'
                                : 'bg-surface-primary border border-border text-content-secondary hover:bg-surface-raised hover:text-content-primary'
                        }`}
                    >
                        {t(preset.labelKey)}
                    </button>
                ))}
            </div>

            {/* Custom Date Range */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label
                        htmlFor="start-date"
                        className="block text-xs text-content-muted mb-2 uppercase tracking-wider"
                    >
                        {t('common.fromDate')}
                    </label>
                    <input
                        type="date"
                        id="start-date"
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-primary border border-border text-content-primary rounded text-sm
                                 focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-accent/20
                                 hover:border-content-muted transition-colors"
                    />
                </div>

                <div className="flex-1">
                    <label
                        htmlFor="end-date"
                        className="block text-xs text-content-muted mb-2 uppercase tracking-wider"
                    >
                        {t('common.toDate')}
                    </label>
                    <input
                        type="date"
                        id="end-date"
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-primary border border-border text-content-primary rounded text-sm
                                 focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-accent/20
                                 hover:border-content-muted transition-colors"
                    />
                </div>
            </div>

            {/* Active date range indicator */}
            {(startDate || endDate) && (
                <div className="mt-3 flex items-center gap-2 text-xs text-content-accent">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                    <span>
                        {t('common.active')}: {startDate || '...'} {t('common.to')} {endDate || '...'}
                    </span>
                </div>
            )}
        </div>
    );
}

export default DateRangeFilter;

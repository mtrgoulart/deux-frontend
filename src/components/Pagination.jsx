import React from 'react';
import { useTranslation } from 'react-i18next';

function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems, itemLabel, className }) {
    const { t } = useTranslation();

    const rangeStart = totalItems === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1;
    const rangeEnd = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className={className || "flex justify-between items-center"}>
            <div className="text-sm text-content-muted">
                {t('common.showing')} <span className="text-content-accent font-bold font-mono">{rangeStart}</span> {t('common.to')}{' '}
                <span className="text-content-accent font-bold font-mono">{rangeEnd}</span>{' '}
                {t('common.of')} <span className="text-content-accent font-bold font-mono">{totalItems}</span>
                {itemLabel ? ` ${itemLabel}` : ''}
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-4 py-2 bg-surface border border-border text-content-secondary rounded-lg text-sm
                             hover:bg-surface-raised hover:text-content-primary transition-colors
                             disabled:opacity-30 disabled:cursor-not-allowed
                             focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                    {t('common.prev')}
                </button>
                <span className="text-content-secondary text-sm font-mono">
                    <span className="text-content-accent font-bold">{currentPage}</span> / {totalPages}
                </span>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 bg-surface border border-border text-content-secondary rounded-lg text-sm
                             hover:bg-surface-raised hover:text-content-primary transition-colors
                             disabled:opacity-30 disabled:cursor-not-allowed
                             focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                    {t('common.next')}
                </button>
            </div>
        </div>
    );
}

export default Pagination;

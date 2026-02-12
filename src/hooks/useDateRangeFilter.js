import { useState } from 'react';

const DATE_PRESETS = [
    { labelKey: 'common.today', value: 'today' },
    { labelKey: 'common.thisWeek', value: 'week' },
    { labelKey: 'common.thisMonth', value: 'month' },
    { labelKey: 'common.thisYear', value: 'year' },
    { labelKey: 'common.allTime', value: 'all' },
];

export function useDateRangeFilter() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const setRelativeDateRange = (period) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (period) {
            case 'today':
                setStartDate(today.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay()); // Sunday
                setStartDate(weekStart.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                setStartDate(monthStart.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'year':
                const yearStart = new Date(today.getFullYear(), 0, 1);
                setStartDate(yearStart.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                break;
            case 'all':
                setStartDate('');
                setEndDate('');
                break;
            default:
                break;
        }
    };

    return { startDate, setStartDate, endDate, setEndDate, setRelativeDateRange, datePresets: DATE_PRESETS };
}

import React from 'react';

const SkeletonRow = () => (
  <tr className="border-t border-gray-800/50">
    {[...Array(6)].map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 bg-gray-800 rounded-md animate-pulse"></div>
      </td>
    ))}
  </tr>
);

const TableSkeleton = ({ columns, rows = 5 }) => (
  <div className="overflow-x-auto bg-black/50 rounded-lg border border-red-500/30">
    <table className="min-w-full table-auto">
      <thead className='border-b border-red-500/30'>
        <tr className="text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">
          {columns.map(col => <th key={col.key} className="px-4 py-3">{col.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {[...Array(rows)].map((_, index) => <SkeletonRow key={index} />)}
      </tbody>
    </table>
  </div>
);

export function StrategiesTable({ strategies, isLoading, onSort, sortField, sortDirection, onConfigure, onDelete }) {
  // ✅ Labels da tabela traduzidos
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'side', label: 'Side' },
    { key: 'created_at', label: 'Created At' },
    { key: 'updated_at', label: 'Updated At' },
    { key: 'actions', label: 'Actions' },
  ];

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (isLoading) {
    return <TableSkeleton columns={columns} />;
  }

  return (
    <div className="overflow-x-auto bg-black/50 rounded-lg border border-red-500/30">
      <table className="min-w-full table-auto">
        <thead className='border-b border-red-500/30'>
          <tr className="text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 cursor-pointer" onClick={() => col.key !== 'actions' && onSort(col.key)}>
                {col.label} {renderSortIcon(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-300">
          {strategies.map(strategy => (
            <tr key={strategy.id} className="border-t border-gray-800/50 hover:bg-gray-800/40 transition-colors">
              <td className="px-4 py-3">{strategy.id}</td>
              <td className="px-4 py-3">{strategy.name}</td>
              <td className="px-4 py-3">{strategy.side}</td>
              <td className="px-4 py-3">{new Date(strategy.created_at).toLocaleString()}</td>
              <td className="px-4 py-3">{new Date(strategy.updated_at).toLocaleString()}</td>
              <td className="px-4 py-3">
                <div className="flex gap-4">
                  {/* ✅ Dicas e alt text traduzidos */}
                  <button onClick={() => onConfigure(strategy.id)} title="Configure">
                    <img src="/icons/config.svg" alt="Configure" className="w-6 h-6 hover:opacity-75 transition-opacity" />
                  </button>
                  <button onClick={() => onDelete(strategy)} title="Remove">
                    <img src="/icons/trash.svg" alt="Remove" className="w-6 h-6 hover:opacity-75 transition-opacity" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
import React from 'react';

const SkeletonRow = ({ columnCount }) => (
  <tr className="border-t border-gray-800/50">
    {[...Array(columnCount)].map((_, index) => (
      <td key={index} className="px-6 py-4">
        <div className="h-4 bg-gray-800 rounded-md animate-pulse"></div>
      </td>
    ))}
  </tr>
);

export function TableSkeleton({ rows = 5, headers = [] }) {
  // Garante que o skeleton tenha o mesmo número de colunas que o cabeçalho
  const columnCount = headers.length > 0 ? headers.length : 4; // Usa 4 como padrão

  return (
    <div className="overflow-x-auto bg-black/50 rounded-lg border border-gray-800 animate-fade-in">
      <table className="min-w-full table-auto">
        <thead className='border-b border-red-500/30'>
          <tr className="text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {headers.length > 0 ? (
              headers.map((header, index) => (
                <th key={index} className="px-6 py-4">{header}</th>
              ))
            ) : (
              // Mantém o comportamento antigo se nenhum cabeçalho for passado
              <>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Exchange</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="text-slate-300">
          {[...Array(rows)].map((_, index) => (
            <SkeletonRow key={index} columnCount={columnCount} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
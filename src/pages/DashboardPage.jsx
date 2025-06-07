import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';


ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

function DashboardPage() {
  const [selectedApiKey, setSelectedApiKey] = useState(localStorage.getItem('selectedApiKey') || '');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [sortField, setSortField] = useState('totalValue');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['user_apikeys'],
    queryFn: async () => {
      const res = await apiFetch('/get_user_apikeys');
      const data = await res.json();
      const keys = data.user_apikeys || [];
      if (!selectedApiKey && keys.length > 0) {
        const defaultKey = keys[0].api_key_id;
        setSelectedApiKey(defaultKey);
        localStorage.setItem('selectedApiKey', defaultKey);
      }
      return keys;
    },
  });

  const { data: balances = [] } = useQuery({
    queryKey: ['balances', selectedApiKey],
    queryFn: async () => {
      if (!selectedApiKey) return [];
      const res = await apiFetch(`/get_user_balances_with_price?api_key_id=${selectedApiKey}`);
      const data = await res.json();
      return data.balances || [];
    },
    enabled: !!selectedApiKey,
  });

  const { data: totalBalance = { total_balance: "0" } } = useQuery({
    queryKey: ['total_balance', selectedApiKey],
    queryFn: async () => {
      if (!selectedApiKey) return { total_balance: "0" };
      const res = await apiFetch(`/get_total_balance?api_key_id=${selectedApiKey}`);
      const data = await res.json();
      return data;
    },
    enabled: !!selectedApiKey,
  });

  const { data: balanceHistory = [] } = useQuery({
    queryKey: ['balance_history', selectedApiKey],
    queryFn: async () => {
      if (!selectedApiKey) return [];
      const res = await apiFetch(`/get_balance_history?api_key_id=${selectedApiKey}`);
      const data = await res.json();
      return data.history || [];
    },
    enabled: !!selectedApiKey,
  });

  const processedBalances = useMemo(() => {
    const balancesWithTotal = balances.map(b => {
      const quantity = parseFloat(b.value);
      const price = parseFloat(b.price_usdt || 0);
      return {
        symbol: b.symbol,
        quantity,
        price,
        totalValue: quantity * price,
        update_at: b.update_at
      };
    });

    let sorted = [...balancesWithTotal];

    if (sortField) {
      sorted.sort((a, b) => {
        if (sortDirection === 'asc') {
          return a[sortField] > b[sortField] ? 1 : -1;
        } else {
          return a[sortField] < b[sortField] ? 1 : -1;
        }
      });
    }

    if (searchTerm) {
      sorted = sorted.filter(b => b.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return sorted;
  }, [balances, sortField, sortDirection, searchTerm]);

  const lineChartData = {
    labels: balanceHistory.map(h => h.created_at),
    datasets: [
      {
        label: 'Balanço (USDT)',
        data: balanceHistory.map(h => parseFloat(h.total_balance_usdt)),
        fill: false,
        borderColor: '#22c55e',
        tension: 0,
      }
    ]
  };
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: 'white'
        }
      },
      title: {
        display: true,
        text: 'Balance',
        color: 'white',
        font: {
          size: 20
        }
      },
      tooltip: {
        enabled: true // Deixa apenas tooltip ao passar o mouse
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'white',
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 10
        },
        grid: {
          display: false // Remove grid X
        }
      },
      y: {
        ticks: {
          color: 'white'
        },
        grid: {
          display: false // Remove grid Y
        }
      }
    }
  };
  

  
  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-semibold mb-6">Dashboard de Saldos</h2>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={selectedApiKey}
          onChange={(e) => {
            setSelectedApiKey(e.target.value);
            localStorage.setItem('selectedApiKey', e.target.value);
            setSelectedSymbol('');
          }}
          className="bg-gray-800 text-white p-2 rounded"
        >
          <option value="">Selecione a API Key</option>
          {apiKeys.map(key => (
            <option key={key.api_key_id} value={key.api_key_id}>
              ({key.api_key_id}) {key.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Filtrar Símbolo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 text-white p-2 rounded"
        />
      </div>

      {/* Card de saldo total em USDT */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6 flex justify-between items-center shadow-lg">
        <h3 className="text-lg font-semibold text-cyan-400">Saldo Total (USDT)</h3>
        <p className="text-2xl font-bold text-green-400">
          ${parseFloat(totalBalance.total_balance).toFixed(2)}
        </p>
      </div>

      {/* Tabela de saldos */}
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('symbol')}>Símbolo</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('quantity')}>Quantidade</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('price')}>Último Preço (USDT)</th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('totalValue')}>Valor Total (USDT)</th>
              <th className="px-4 py-2 text-left">Última Atualização</th>
            </tr>
          </thead>
          <tbody>
            {processedBalances.length > 0 ? (
              processedBalances.map((b, index) => (
                <tr key={index} className="hover:bg-gray-700">
                  <td className="px-4 py-2">{b.symbol}</td>
                  <td className="px-4 py-2">{b.quantity.toFixed(6)}</td>
                  <td className="px-4 py-2">{b.price.toFixed(8)}</td>
                  <td className="px-4 py-2">{b.totalValue.toFixed(2)}</td>
                  <td className="px-4 py-2">{b.update_at ? new Date(b.update_at).toLocaleString() : '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-2 text-center text-gray-400" colSpan="5">
                  Nenhum saldo encontrado para essa seleção.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Gráfico de histórico de saldo */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        {balanceHistory.length > 0 ? (
          <Line data={lineChartData} options={lineChartOptions} />
        ) : (
          <p className="text-gray-400 text-center">Nenhum histórico encontrado.</p>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;

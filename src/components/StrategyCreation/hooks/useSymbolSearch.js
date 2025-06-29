import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../../../utils/api';

const DEFAULT_SYMBOLS = [
  { 
    symbol: 'BTC-USDT', 
    name: 'Bitcoin/Tether',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    type: 'crypto',
    isDefault: true,
    icon: '₿'
  },
  { 
    symbol: 'ETH-USDT', 
    name: 'Ethereum/Tether',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    type: 'crypto',
    isDefault: true,
    icon: 'Ξ'
  },
  { 
    symbol: 'BTC-ETH', 
    name: 'Bitcoin/Ethereum',
    baseAsset: 'BTC',
    quoteAsset: 'ETH',
    type: 'crypto',
    isDefault: true,
    icon: '₿'
  }
];

function useSymbolSearch(apiKeyId = null, initialSymbol = null, initialApiKey = null, debounceMs = 300) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [showDefaults, setShowDefaults] = useState(true);

  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Initialize with existing symbol if in edit mode
  useEffect(() => {
    if (initialSymbol) {
      setQuery(initialSymbol);
      setSelectedSymbol({
        symbol: initialSymbol,
        api_key: initialApiKey,
        // You might need to fetch more details for the symbol here if not available in initialSymbol
      });
      setShowDefaults(false);
    }
  }, [initialSymbol, initialApiKey]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Search function
  const searchSymbols = useCallback(async (searchQuery, signal) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setShowDefaults(true);
      return;
    }

    if (!apiKeyId) {
      setError('API key is required for symbol search');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setShowDefaults(false);

      const response = await apiFetch(`/get_symbols_by_api?id=${apiKeyId}&query=${encodeURIComponent(searchQuery)}`, {
        signal
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      const symbols = data.symbols || [];

      // Enhance symbols with additional metadata
      const enhancedSymbols = symbols.map(symbol => ({
        ...symbol,
        isDefault: false,
        icon: getSymbolIcon(symbol.baseAsset || symbol.symbol)
      }));

      setResults(enhancedSymbols);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Symbol search error:', err);
        setError(err.message || 'Failed to search symbols');
        setResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiKeyId]);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Set up new search
    debounceRef.current = setTimeout(() => {
      if (query.trim()) {
        abortControllerRef.current = new AbortController();
        searchSymbols(query.trim(), abortControllerRef.current.signal);
      } else {
        setResults([]);
        setShowDefaults(true);
        setIsLoading(false);
        setError(null);
      }
    }, debounceMs);

    // Cleanup function
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchSymbols, debounceMs]);

  // Get symbol icon based on symbol name
  const getSymbolIcon = (symbolName) => {
    const iconMap = {
      'BTC': '₿',
      'ETH': 'Ξ',
      'LTC': 'Ł',
      'ADA': '₳',
      'DOT': '●',
      'USDT': '₮',
      'USDC': '$',
      'BNB': '🔶',
      'SOL': '◎',
      'MATIC': '🔷'
    };
    return iconMap[symbolName?.toUpperCase()] || '🪙';
  };

  // Get display symbols (defaults or search results)
  const getDisplaySymbols = useCallback(() => {
    if (showDefaults && query.trim().length < 2) {
      return DEFAULT_SYMBOLS;
    }
    return results;
  }, [showDefaults, query, results]);

  // Symbol selection
  const selectSymbol = useCallback((symbol) => {
    setSelectedSymbol(symbol);
    setQuery(symbol.symbol);
    setResults([]);
    setShowDefaults(false);
    setError(null);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedSymbol(null);
    setQuery('');
    setResults([]);
    setShowDefaults(true);
    setError(null);
  }, []);

  // Update query
  const updateQuery = useCallback((newQuery) => {
    setQuery(newQuery);
    if (!newQuery.trim()) {
      setSelectedSymbol(null);
      setShowDefaults(true);
    }
  }, []);

  // Get popular symbols
  const getPopularSymbols = useCallback(() => {
    return DEFAULT_SYMBOLS;
  }, []);

  // Filter symbols by type
  const filterSymbolsByType = useCallback((type) => {
    const allSymbols = getDisplaySymbols();
    return allSymbols.filter(symbol => symbol.type === type);
  }, [getDisplaySymbols]);

  // Search statistics
  const getSearchStats = useCallback(() => {
    return {
      totalResults: results.length,
      hasMore: results.length >= 50, // Assuming pagination limit
      query: query.trim(),
      isSearching: isLoading,
      hasError: !!error
    };
  }, [results.length, query, isLoading, error]);

  return {
    // State
    query,
    results,
    isLoading,
    error,
    selectedSymbol,
    showDefaults,

    // Data
    displaySymbols: getDisplaySymbols(),
    popularSymbols: getPopularSymbols(),
    defaultSymbols: DEFAULT_SYMBOLS,

    // Actions
    updateQuery,
    selectSymbol,
    clearSelection,
    searchSymbols: (q) => searchSymbols(q, new AbortController().signal),

    // Utilities
    filterSymbolsByType,
    getSearchStats,
    getSymbolIcon,

    // Status
    isEmpty: results.length === 0 && !showDefaults,
    hasResults: results.length > 0,
    isSearchActive: query.trim().length >= 2
  };
}

export default useSymbolSearch;

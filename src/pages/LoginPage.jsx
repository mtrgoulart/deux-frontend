import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { ethers } from 'ethers';
import logoImage from '../assets/logo.png';

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
    <div className="flex items-end gap-2">
      {/* Criamos 5 barras que vão animar em alturas diferentes */}
      <div className="w-2 h-4 bg-red-500 animate-pulse" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-8 bg-red-500 animate-pulse" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-12 bg-red-500 animate-pulse" style={{ animationDelay: '300ms' }}></div>
      <div className="w-2 h-8 bg-red-500 animate-pulse" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-4 bg-red-500 animate-pulse" style={{ animationDelay: '0ms' }}></div>
    </div>
    <p className="text-red-400 text-sm mt-4 tracking-widest">AUTHENTICATING...</p>
  </div>
);

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // Ativa a animação

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await apiFetch(`/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      const data = await response.json();
      if (response.ok) {
        navigate('/', { replace: true });
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Error trying to connect to server');
    } finally {
      setIsLoading(false); // Desativa a animação no final (sucesso ou erro)
    }
  };


  const handleWalletLogin = async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask não está instalada');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      // 1. Busca o nonce no backend
      const nonceResponse = await apiFetch(`/get_wallet_nonce/${walletAddress}`);
      const { nonce } = await nonceResponse.json();

      // 2. Solicita assinatura
      const signature = await signer.signMessage(nonce);

      // 3. Envia para validação
      const verifyResponse = await apiFetch(`/wallet_login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress, signature, nonce }),
      });

      const result = await verifyResponse.json();

      if (verifyResponse.ok && result.token) {
        // Redireciona após login
        navigate('/', { replace: true });
      } else {
        setError(result.error || 'Erro na autenticação com carteira');
      }
    } catch (err) {
      console.error('Erro ao conectar com a carteira:', err);
      setError('Erro ao conectar com a carteira');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-300 font-sans p-4">
      
      {/* Adicionado 'relative' para o posicionamento do overlay */}
      <div className="relative bg-black/50 border border-red-500/30 rounded-md shadow-lg p-8 w-full max-w-sm
                      shadow-[0_0_15px_rgba(239,68,68,0.2),_inset_0_0_10px_rgba(239,68,68,0.1)]">
        
        {/* 2. Renderização condicional do overlay */}
        {isLoading && <LoadingOverlay />}
        
        <div className="flex justify-center mb-8">
          <img
            src={logoImage}
            alt="TradeX Logo"
            className="h-12 w-auto" // Ajustei a altura para h-12
            style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.7))' }}
          />
        </div>

        {error && <p className="text-red-400 text-sm mb-6 text-center bg-red-900/50 p-3 rounded-md border border-red-500/30">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 tracking-widest">LOGIN</label>
            <input
              type="text"
              className="w-full bg-gray-900/50 border-b-2 border-gray-700 text-gray-200 p-2 
                         focus:outline-none focus:ring-0 focus:border-red-500 transition-colors disabled:opacity-50"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading} // 3. Desabilitar campo durante o loading
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 tracking-widest">PASSWORD</label>
            <input
              type="password"
              className="w-full bg-gray-900/50 border-b-2 border-gray-700 text-gray-200 p-2 
                         focus:outline-none focus:ring-0 focus:border-red-500 transition-colors disabled:opacity-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading} // 3. Desabilitar campo durante o loading
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-3 font-bold text-red-400 bg-transparent border-2 border-red-500 rounded-md
                       hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading} // 3. Desabilitar botão durante o loading
          >
            {isLoading ? 'ENTERING...' : 'ENTER'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-800"></div>
          <span className="flex-shrink mx-4 text-gray-600 text-xs tracking-widest">OR</span>
          <div className="flex-grow border-t border-gray-800"></div>
        </div>
                
        <p className="mt-8 text-center text-gray-500 text-sm">
          Don't have an account?{' '}
          <button
            className="font-semibold text-gray-300 hover:text-red-400 disabled:opacity-50"
            onClick={() => navigate('/register')}
            disabled={isLoading} // 3. Desabilitar botão durante o loading
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
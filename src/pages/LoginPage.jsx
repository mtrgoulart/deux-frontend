import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { ethers } from 'ethers';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await apiFetch(`/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/', { replace: true });
      } else {
        setError(data.error || 'Login falhou');
      }
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao conectar com o servidor');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="bg-gray-800 shadow-lg rounded-xl p-10 w-full max-w-md">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-cyan-400 mb-8">
          TradeX
        </h1>

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Usuário</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition duration-300"
          >
            Entrar
          </button>

          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm mb-2">ou</p>
            <button
              type="button"
              onClick={handleWalletLogin}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition duration-300"
            >
              Conectar com carteira
            </button>
          </div>

          <p className="mt-4 text-center text-gray-400 text-sm">
            Não tem conta?{' '}
            <button
              className="text-cyan-400 hover:underline"
              onClick={() => navigate('/register')}
            >
              Cadastre-se
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;

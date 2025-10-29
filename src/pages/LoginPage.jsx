import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { ethers } from 'ethers';
import logoImage from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
        <div className="flex items-end gap-2">
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
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const response = await apiFetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
          if (data.token) {
            login(data.token);
            navigate('/');
          } else {
            throw new Error('Login failed: No token received.');
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Invalid credentials' }));
          throw new Error(errorData.error);
        }
        } catch (err) {
            setError(err.message || 'Failed to login. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleWalletLogin = async () => {
      setIsLoading(true);
      setError('');

      if (typeof window.ethereum === 'undefined') {
        setError('MetaMask is not installed. Please install it to use this feature.');
        setIsLoading(false);
        return;
      }
      
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        
        const signer = await provider.getSigner();
        const walletAddress = await signer.getAddress();
        
        const message = `Please sign this message to log in. Nonce: ${Date.now()}`;
        const signature = await signer.signMessage(message);

        // <<< CORREÇÃO AQUI >>>
        // Adicionamos "const response =" para declarar a variável
        const response = await apiFetch('/auth/wallet-login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              wallet_address: walletAddress,
              signature: signature,
              message: message
          })
        });

        if (response.ok) {
          const data = await response.json(); 

          if (data.access_token) {
            login(data.access_token);
            navigate('/'); 
          } else {
            throw new Error('Login failed: No token received from server.');
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
          throw new Error(errorData.error || 'Wallet login failed.');
        }

      } catch (err) {
        if (err.code === 4001) {
          setError('You rejected the connection request. Please approve it to log in.');
        } else {
          setError(err.message || 'An error occurred during wallet login.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4 font-sans">
         <div className="w-full max-w-md mx-auto relative">
          {isLoading && <LoadingOverlay />}
          
          <div className="bg-black/30 backdrop-blur-lg p-8 rounded-xl shadow-2xl shadow-red-500/10 border border-red-500/20">
              <img 
                src={logoImage} 
                alt="Logo" 
                className="w-48 h-auto mx-auto mb-8"
                style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.6))' }}
              />
  
            {error && <p className="bg-red-900/50 border border-red-500/30 text-red-300 p-3 rounded-md mb-6 text-sm text-center">{error}</p>}
  
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-md py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-md py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 font-bold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-300 disabled:opacity-50"
                disabled={isLoading}
              >
                Login
              </button>
            </form>
  
            <div className="flex items-center my-6">
              <hr className="flex-grow border-gray-700" />
              <span className="mx-4 text-gray-500 text-sm">OR</span>
              <hr className="flex-grow border-gray-700" />
            </div>
  
            <button
              type="button"
              onClick={handleWalletLogin}
              className="w-full flex items-center justify-center gap-3 py-3 font-bold text-gray-300 bg-gray-800/50 border-2 border-gray-700 rounded-md
                         hover:border-blue-500 hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.9 6 10 6.9 10 8V16C10 17.1 10.9 18 12 18H21ZM12 16H22V8H12V16ZM15 15C15.6 15 16 14.6 16 14C16 13.4 15.6 13 15 13C14.4 13 14 13.4 14 14C14 14.6 14.4 15 15 15Z"/>
              </svg>
              Login with Wallet
            </button>
          </div>
        </div>
      </div>
    );
}

export default LoginPage;
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import logoImage from '../assets/logo.png';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await apiFetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(data.error || 'Failed to register user.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error connecting to the server.');
    }
  };

  return (
    // Fundo principal escuro, igual ao do Login
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-300 font-sans p-4">
      
      {/* Painel do formulário com o mesmo efeito de brilho neon */}
      <div className="bg-black/50 border border-red-500/30 rounded-md shadow-lg p-8 w-full max-w-sm
                      shadow-[0_0_15px_rgba(239,68,68,0.2),_inset_0_0_10px_rgba(239,68,68,0.1)]">
        
        
        <h1 className="text-xl font-light text-center text-transparent mb-8 tracking-wider [-webkit-text-stroke:1px_theme(colors.red.500)] [text-shadow:0_0_10px_theme(colors.red.500)]">
          Create Your Account
        </h1>

        {/* Mensagens de erro e sucesso com o novo estilo */}
        {error && <p className="text-red-400 text-sm mb-6 text-center bg-red-900/50 p-3 rounded-md border border-red-500/30">{error}</p>}
        {success && <p className="text-green-400 text-sm mb-6 text-center bg-green-900/50 p-3 rounded-md border border-green-500/30">{success}</p>}

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 tracking-widest">USERNAME</label>
            <input
              type="text"
              className="w-full bg-gray-900/50 border-b-2 border-gray-700 text-gray-200 p-2 
                         focus:outline-none focus:ring-0 focus:border-red-500 transition-colors"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 tracking-widest">PASSWORD</label>
            <input
              type="password"
              className="w-full bg-gray-900/50 border-b-2 border-gray-700 text-gray-200 p-2 
                         focus:outline-none focus:ring-0 focus:border-red-500 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 tracking-widest">CONFIRM PASSWORD</label>
            <input
              type="password"
              className="w-full bg-gray-900/50 border-b-2 border-gray-700 text-gray-200 p-2 
                         focus:outline-none focus:ring-0 focus:border-red-500 transition-colors"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          
          {/* Botão de registro com o mesmo estilo do botão de login */}
          <button
            type="submit"
            className="w-full py-3 font-bold text-red-400 bg-transparent border-2 border-red-500 rounded-md
                       hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-300"
          >
            REGISTER
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <button
            className="font-semibold text-gray-300 hover:text-red-400"
            onClick={() => navigate('/login')}
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
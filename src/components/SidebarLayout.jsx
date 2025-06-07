import { Link, Outlet, useNavigate } from 'react-router-dom';

function SidebarLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // remove o token salvo
    navigate('/login', { replace: true }); // redireciona o usuário
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-950 via-purple-900 to-black text-white font-sans">
      <aside className="w-64 bg-gradient-to-b from-blue-900 to-purple-900 p-6 shadow-lg flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold text-center text-cyan-300 mb-6">TradeX</h1>
          <nav>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="block py-2 px-4 rounded hover:bg-cyan-600 hover:text-white transition-all duration-200 text-cyan-300">
                  Instâncias
                </Link>
              </li>
              <li>
                <Link to="/strategies" className="block py-2 px-4 rounded hover:bg-purple-600 hover:text-white transition-all duration-200 text-purple-300">
                  Estratégias
                </Link>
              </li>
              <li>
                <Link to="/indicators" className="block py-2 px-4 rounded hover:bg-green-600 hover:text-white transition-all duration-200 text-green-300">
                  Indicadores
                </Link>
              </li>
              <li>
                <Link to="/apikeys" className="block py-2 px-4 rounded hover:bg-pink-600 hover:text-white transition-all duration-200 text-pink-300">
                  API Keys
                </Link>
              </li>
              <li>
                <Link to="/signals" className="block py-2 px-4 rounded hover:bg-green-600 hover:text-white transition-all duration-200 text-green-300">
                  Sinais
                </Link>
              </li>
              <li>
                <Link to="/sharing" className="block py-2 px-4 rounded hover:bg-green-600 hover:text-white transition-all duration-200 text-green-300">
                  Sharing
                </Link>
              </li>
              <li>
                <Link to="/subscriptions" className="block py-2 px-4 rounded hover:bg-green-600 hover:text-white transition-all duration-200 text-green-300">
                  Subscriptions
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 p-8 bg-gradient-to-br from-gray-900 to-black shadow-inner overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default SidebarLayout;

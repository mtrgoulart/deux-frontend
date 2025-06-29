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
                <Link to="/" className="flex items-center py-2 px-4 rounded hover:bg-cyan-600 hover:text-white transition-all duration-200 text-cyan-300">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Strategies
                </Link>
              </li>
              <li>
                <Link to="/indicators" className="flex items-center py-2 px-4 rounded hover:bg-green-600 hover:text-white transition-all duration-200 text-green-300">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Indicator Management
                </Link>
              </li>
              <li>
                <Link to="/apikeys" className="flex items-center py-2 px-4 rounded hover:bg-pink-600 hover:text-white transition-all duration-200 text-pink-300">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  API Keys
                </Link>
              </li>
              <li>
                <Link to="/signals" className="flex items-center py-2 px-4 rounded hover:bg-blue-600 hover:text-white transition-all duration-200 text-blue-300">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Signals
                </Link>
              </li>
              <li>
                <Link to="/sharing" className="flex items-center py-2 px-4 rounded hover:bg-purple-600 hover:text-white transition-all duration-200 text-purple-300">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Sharing
                </Link>
              </li>
              <li>
                <Link to="/subscriptions" className="flex items-center py-2 px-4 rounded hover:bg-orange-600 hover:text-white transition-all duration-200 text-orange-300">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
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

import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SidebarLayout from './components/SidebarLayout';
import HomePage from './pages/HomePage'; // Importa a nova Home Page
import InstancesPage from './pages/InstancesPage';
import StrategiesPage from './pages/StrategiesPage';
import ApiKeysPage from './pages/APIKeysPage';
import SignalsPage from './pages/SignalsPage';
import IndicatorsPage from './pages/IndicatorsPage';
import SharingPage from './pages/SharingPage';
import OperationsPage from './pages/OperationsPage';
import PnLPage from './pages/PnLPage';
import SendSignalPage from './pages/SendSignalPage';
import UsersPage from './pages/UsersPage';
import CopyCreatePage from './pages/CopyCreatePage';
import ExplorePage from './pages/CopyExplorePage';
import CopySubscriptionPage from './pages/CopySubscriptionPage';
import MarketChartPage from './pages/MarketChartPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rotas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<SidebarLayout />}>
            {/* Rota Raiz agora aponta para a HomePage */}
            <Route index element={<HomePage />} />
            
            {/* Rotas Públicas para usuários logados */}
            <Route path="/market/data" element={<MarketChartPage />} />
            <Route path="sharing" element={<SharingPage />} />
            <Route path="signals" element={<SignalsPage />} />
            <Route path="operations" element={<OperationsPage />} />
            <Route path="pnl" element={<PnLPage />} />
            <Route path="copy/explore" element={<ExplorePage />} />
            <Route path="copy/subscriptions" element={<CopySubscriptionPage />} />
            
            {/* Nova rota de usuário */}
            <Route path="/user/apikeys" element={<ApiKeysPage />} />

            {/* Rotas apenas para Admin e Developer */}
            <Route element={<ProtectedRoute allowedGroups={['Admin', 'Developer']} />}>
              <Route path="/automation/configuration" element={<StrategiesPage />} />
              <Route path="/automation/strategy" element={<InstancesPage />} />
              <Route path="/automation/indicators" element={<IndicatorsPage />} />
              <Route path="copy" element={<CopyCreatePage />} />
              <Route path="send-signal" element={<SendSignalPage />} />
            </Route>

            {/* Rota apenas para Admin */}
            <Route element={<ProtectedRoute allowedGroups={['Admin']} />}>
              <Route path="users" element={<UsersPage />} />
            </Route>
            
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
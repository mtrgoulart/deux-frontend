import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Importe o Provider
import ProtectedRoute from './components/ProtectedRoute'; // Importe a Rota Protegida

// Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SidebarLayout from './components/SidebarLayout';
import InstancesPage from './pages/InstancesPage';
import StrategiesPage from './pages/StrategiesPage';
import ApiKeysPage from './pages/APIKeysPage';
import SignalsPage from './pages/SignalsPage';
import IndicatorsPage from './pages/IndicatorsPage';
import SharingPage from './pages/SharingPage';
import SubscriptionsPage from './pages/SubscriptionPage';
import OperationsPage from './pages/OperationsPage';
import SendSignalPage from './pages/SendSignalPage';
import UsersPage from './pages/UsersPage';

function App() {
  return (
    <AuthProvider> {/* Envolve toda a aplicação com o contexto */}
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rotas Protegidas que exigem apenas login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<SidebarLayout />}>
            <Route index element={<InstancesPage />} />
            <Route path="strategies" element={<StrategiesPage />} />
            <Route path="indicators" element={<IndicatorsPage />} />
            <Route path="sharing" element={<SharingPage />} />
            <Route path="signals" element={<SignalsPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="apikeys" element={<ApiKeysPage />} />
            <Route path="operations" element={<OperationsPage />} />
            <Route path="send-signal" element={<SendSignalPage />} />
            
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

import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import InstancesPage from './pages/InstancesPage';
import StrategiesPage from './pages/StrategiesPage';
import SidebarLayout from './components/SidebarLayout';
import ApiKeysPage from './pages/APIKeysPage';
import RegisterPage from './pages/RegisterPage';
import SignalsPage from './pages/SignalsPage';
import IndicatorsPage from './pages/IndicatorsPage';
import SharingPage from './pages/SharingPage';
import SubscriptionsPage from './pages/SubscriptionPage';




function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<SidebarLayout />}>
        <Route index element={<InstancesPage />} />
        <Route path="strategies" element={<StrategiesPage />} />
        <Route path="indicators" element={<IndicatorsPage />} />
        <Route path="sharing" element={<SharingPage />} />
        <Route path="signals" element={<SignalsPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="apikeys" element={<ApiKeysPage />} />
      </Route>
    </Routes>
  );
}

export default App;

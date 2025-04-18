import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import InstancesPage from './pages/InstancesPage';
import StrategiesPage from './pages/StrategiesPage';
import SidebarLayout from './components/SidebarLayout';
import ApiKeysPage from './pages/APIKeysPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<SidebarLayout />}>
        <Route index element={<InstancesPage />} />
        <Route path="strategies" element={<StrategiesPage />} />
        <Route path="apikeys" element={<ApiKeysPage />} />
      </Route>
    </Routes>
  );
}

export default App;

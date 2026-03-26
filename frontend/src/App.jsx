import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Category from './pages/Category';
import NewThread from './pages/NewThread';
import Thread from './pages/Thread';
import UserProfile from './pages/UserProfile';
import Identity from './pages/Identity';
import Admin from './pages/Admin';
import ThemeAdmin from './pages/ThemeAdmin';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Setup from './pages/Setup';
import Wallet from './pages/Wallet';
import Marketplace from './pages/Marketplace';
import EscrowDashboard from './pages/EscrowDashboard';
import Subscription from './pages/Subscription';
import Users from './pages/Users';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/c/:id" element={<Category />} />
        <Route path="/c/:id/new" element={<NewThread />} />
        <Route path="/t/:id" element={<Thread />} />
        <Route path="/u/:id" element={<UserProfile />} />
        <Route path="/users" element={<Users />} />
        <Route path="/identity" element={<Identity />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/theme" element={<ThemeAdmin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/escrow" element={<EscrowDashboard />} />
        <Route path="/subscription" element={<Subscription />} />
      </Route>
    </Routes>
  );
}

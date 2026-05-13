import { useEffect, Component, ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Algo salió mal. Por favor recarga la página.</p>
            <button onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import NewCampaign from './pages/NewCampaign';
import CampaignDetail from './pages/CampaignDetail';
import Contacts from './pages/Contacts';
import ContactLists from './pages/ContactLists';
import ContactListDetail from './pages/ContactListDetail';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import Sequences from './pages/Sequences';
import NewSequence from './pages/NewSequence';
import SequenceDetail from './pages/SequenceDetail';

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/new" element={<NewCampaign />} />
        <Route path="campaigns/:id/edit" element={<NewCampaign />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
        <Route path="sequences" element={<Sequences />} />
        <Route path="sequences/new" element={<NewSequence />} />
        <Route path="sequences/:id/edit" element={<NewSequence />} />
        <Route path="sequences/:id" element={<SequenceDetail />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="contact-lists" element={<ContactLists />} />
        <Route path="contact-lists/:id" element={<ContactListDetail />} />
        <Route path="templates" element={<Templates />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </ErrorBoundary>
  );
}

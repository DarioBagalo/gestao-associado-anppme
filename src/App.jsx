import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import MemberRegistration from '@/pages/MemberRegistration';
import MemberCard from '@/pages/MemberCard';
import Certificate from '@/pages/Certificate';
import AdminPanel from '@/pages/AdminPanel';
import ManagementDashboard from '@/pages/ManagementDashboard';
import VerifyCard from '@/pages/VerifyCard';
import MemberFinancial from '@/pages/MemberFinancial';
import Notifications from '@/pages/Notifications';
import Convenios from '@/pages/Convenios';
import ConvenioDetail from '@/pages/ConvenioDetail';
import ConveniosAdmin from '@/pages/ConveniosAdmin';
import Events from '@/pages/Events';
import EventsAdmin from '@/pages/EventsAdmin';
import Library from '@/pages/Library';
import LibraryAdmin from '@/pages/LibraryAdmin';
import VerifyCertificate from '@/pages/VerifyCertificate';
import MyCertificates from '@/pages/MyCertificates';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/meu-cadastro" element={<MemberRegistration />} />
        <Route path="/minha-carteira" element={<MemberCard />} />
        <Route path="/certidao" element={<Certificate />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/gestao" element={<ManagementDashboard />} />
        <Route path="/financeiro" element={<MemberFinancial />} />
        <Route path="/notificacoes" element={<Notifications />} />
        <Route path="/convenios" element={<Convenios />} />
        <Route path="/convenios/:id" element={<ConvenioDetail />} />
        <Route path="/admin/convenios" element={<ConveniosAdmin />} />
        <Route path="/eventos" element={<Events />} />
        <Route path="/admin/eventos" element={<EventsAdmin />} />
        <Route path="/biblioteca" element={<Library />} />
        <Route path="/admin/biblioteca" element={<LibraryAdmin />} />
        <Route path="/meus-certificados" element={<MyCertificates />} />
      </Route>
      <Route path="/verificar" element={<VerifyCard />} />
      <Route path="/verificar-certidao" element={<VerifyCertificate />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
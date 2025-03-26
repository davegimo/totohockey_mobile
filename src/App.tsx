import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useSession } from './context/SessionContext'

// Pagine
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ClassificaPage from './pages/ClassificaPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import RegolePage from './pages/RegolePage'
import GiocatorePage from './pages/GiocatorePage'
import LeghePage from './pages/LeghePage'
import CreaLegaPage from './pages/CreaLegaPage'
import LegaPage from './pages/LegaPage'
import AuthProtectedRoute from './router/AuthProtectedRoute'
import Providers from './Providers'
import PartecipaPagina from './pages/PartecipaPagina'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Providers />}>
          {/* Rotte pubbliche */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/partecipa/:codiceInvito" element={<PartecipaPagina />} />
          
          {/* Rotte protette */}
          <Route element={<AuthProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/classifica" element={<ClassificaPage />} />
            <Route path="/leghe" element={<LeghePage />} />
            <Route path="/leghe/crea" element={<CreaLegaPage />} />
            <Route path="/leghe/:id" element={<LegaPage />} />
            <Route path="/partecipa" element={<PartecipaPagina />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/regole" element={<RegolePage />} />
            <Route path="/giocatore/:id" element={<GiocatorePage />} />
          </Route>
          
          {/* Rotta di fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  )
}

// Componente per le rotte pubbliche
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useSession();
  
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export default App;

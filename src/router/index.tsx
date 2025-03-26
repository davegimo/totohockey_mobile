import AuthProtectedRoute from './AuthProtectedRoute';
import { Outlet } from 'react-router-dom';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Importazioni delle pagine
import DashboardPage from '../pages/DashboardPage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import ClassificaPage from '../pages/ClassificaPage';
import ProfilePage from '../pages/ProfilePage';
import LeghePage from '../pages/LeghePage';
import CreaLegaPage from '../pages/CreaLegaPage';
import LegaPage from '../pages/LegaPage';
import AdminPage from '../pages/AdminPage';
import LandingPage from '../pages/LandingPage';
import RegolePage from '../pages/RegolePage';
import GiocatorePage from '../pages/GiocatorePage';
import PartecipaPagina from '../pages/PartecipaPagina';

// AdminRoute come componente semplificato
const AdminRoute = () => {
  // Logica per verificare se l'utente è admin
  // Per ora, usiamo semplicemente un componente semplificato
  return <Outlet />;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/signup',
    element: <SignupPage />
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />
  },
  {
    path: '/classifica',
    element: <ClassificaPage />
  },
  {
    path: '/partecipa/:codiceInvito',
    element: <PartecipaPagina />
  },
  {
    path: '/partecipa',
    element: <AuthProtectedRoute />,
    children: [
      {
        index: true,
        element: <PartecipaPagina />
      }
    ]
  },
  {
    path: '/dashboard',
    element: <AuthProtectedRoute />,
    children: [
      {
        index: true,
        element: <DashboardPage />
      }
    ]
  },
  {
    path: '/profile',
    element: <AuthProtectedRoute />,
    children: [
      {
        index: true,
        element: <ProfilePage />
      }
    ]
  },
  {
    path: '/leghe',
    element: <AuthProtectedRoute />,
    children: [
      {
        index: true,
        element: <LeghePage />
      },
      {
        path: 'crea',
        element: <CreaLegaPage />
      },
      {
        path: ':id',
        element: <LegaPage />
      }
    ]
  },
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      {
        index: true,
        element: <AdminPage />
      }
    ]
  },
  {
    path: '/giocatore/:id',
    element: <GiocatorePage />
  },
  {
    path: '/regole',
    element: <RegolePage />
  },
  {
    path: '*',
    element: <div>404 - Pagina non trovata</div>
  }
]);

export default function Router() {
  return <RouterProvider router={router} />;
} 
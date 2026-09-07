import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { MatchPage } from '@/pages/MatchPage';
import { LoginPage } from '@/pages/LoginPage';
import { TeamPage } from '@/pages/TeamPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TournamentPage } from '@/pages/TournamentPage';
import { register } from './registerServiceWorker';
const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/",
    element: <ProtectedRoute><HomePage /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/match/:matchId",
    element: <ProtectedRoute><MatchPage /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/tournament",
    element: <ProtectedRoute><TournamentPage /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/team",
    element: <ProtectedRoute><TeamPage /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/settings",
    element: <ProtectedRoute><SettingsPage /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
  }
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
register();
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PortalAuthProvider } from './context/PortalAuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PortalRoute from './components/PortalRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Meters from './pages/Meters'
import Tariffs from './pages/Tariffs'
import Invoices from './pages/Invoices'
import InvoiceDetail from './pages/InvoiceDetail'
import PortalLogin from './pages/portal/PortalLogin'
import PortalRegister from './pages/portal/PortalRegister'
import PortalDashboard from './pages/portal/PortalDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Admin panel ── */}
        <Route element={<AuthProvider><ProtectedRoute><Layout /></ProtectedRoute></AuthProvider>} path="/">
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="meters" element={<Meters />} />
          <Route path="tariffs" element={<Tariffs />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
        </Route>
        <Route path="/login" element={<AuthProvider><Login /></AuthProvider>} />

        {/* ── Mijoz portali ── */}
        <Route path="/portal" element={<Navigate to="/portal/login" replace />} />
        <Route path="/portal/login"    element={<PortalAuthProvider><PortalLogin /></PortalAuthProvider>} />
        <Route path="/portal/register" element={<PortalAuthProvider><PortalRegister /></PortalAuthProvider>} />
        <Route
          path="/portal/dashboard"
          element={
            <PortalAuthProvider>
              <PortalRoute>
                <PortalDashboard />
              </PortalRoute>
            </PortalAuthProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

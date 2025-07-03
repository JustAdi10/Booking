import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from './components/ui/Toaster'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import FacilitiesPage from './pages/FacilitiesPage'
import RoomSelectionPage from './pages/RoomSelectionPage'
import BookingPage from './pages/BookingPage'
import BookingsPage from './pages/BookingsPage'
import HousekeepingPage from './pages/HousekeepingPage'
import MealsPage from './pages/MealsPage'
import ReportsPage from './pages/ReportsPage'
import ProfilePage from './pages/ProfilePage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { UserRole } from './types'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/facilities" element={
            <ProtectedRoute>
              <Layout>
                <FacilitiesPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/facilities/:facilityId/rooms" element={
            <ProtectedRoute>
              <Layout>
                <RoomSelectionPage />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Booking routes */}
          <Route path="/facilities/:facilityId/book" element={
            <ProtectedRoute>
              <Layout>
                <BookingPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/facilities/:facilityId/rooms/:roomId/book" element={
            <ProtectedRoute>
              <Layout>
                <BookingPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/bookings" element={
            <ProtectedRoute>
              <Layout>
                <BookingsPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/housekeeping" element={
            <ProtectedRoute roles={[UserRole.ADMIN, UserRole.HOUSEKEEPING]}>
              <Layout>
                <HousekeepingPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/meals" element={
            <ProtectedRoute>
              <Layout>
                <MealsPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute roles={[UserRole.ADMIN]}>
              <Layout>
                <ReportsPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>

        <Toaster />
      </div>
    </AuthProvider>
  )
}

export default App

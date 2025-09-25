import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import LoginForm from './components/LoginForm'
import AnimatedLoginForm from './components/AnimatedLoginForm'
import RegisterForm from './components/RegisterForm'
import ForgotPasswordForm from './components/ForgotPasswordForm'
import EmployeeDashboard from './pages/employee/page'
import AdminDashboard from './pages/admin/page'
import EmployeeCustomersPage from './pages/employee/customers/page'
import EmployeeAddCustomerPage from './pages/employee/add-customer/page'
import EmployeeCampsPage from './pages/employee/camps/page'
import EmployeeProfilePage from './pages/employee/profile/page'
import AdminCustomersPage from './pages/admin/customers/page'
import AdminEmployeesPage from './pages/admin/employees/page'
import AdminCampsPage from './pages/admin/camps/page'
import AdminAddEmployeePage from './pages/admin/add-employee/page'
import AdminAddCampPage from './pages/admin/add-camp/page'
import AdminEmployeeDetailsPage from './pages/admin/employees/[id]/page'
import API_BASE_URL from './config/api.js'

function App() {
  const [isLogin, setIsLogin] = useState(true)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token with backend
      fetch('${API_BASE_URL}/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        } else {
          localStorage.removeItem('token')
        }
      })
      .catch(() => {
        localStorage.removeItem('token')
      })
      .finally(() => {
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const handleBackToLogin = () => {
    setShowForgotPassword(false)
    setIsLogin(true)
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Protected Routes */}
        <Route 
          path="/admin" 
          element={
            user && user.role === 'admin' ? 
              <AdminDashboard /> : 
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/employee" 
          element={
            user && user.role === 'employee' ? 
              <EmployeeDashboard /> : 
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/employee/customers" 
          element={
            user && user.role === 'employee' ? 
              <EmployeeCustomersPage /> : 
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/employee/add-customer" 
          element={
            user && user.role === 'employee' ? 
              <EmployeeAddCustomerPage /> : 
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/employee/camps" 
          element={
            user && user.role === 'employee' ? 
              <EmployeeCampsPage /> : 
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/employee/profile" 
          element={
            user && user.role === 'employee' ? 
              <EmployeeProfilePage /> : 
              <Navigate to="/" replace />
          } 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin/customers" 
          element={
            user && user.role === 'admin' ? 
              <AdminCustomersPage /> : 
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/admin/employees" 
          element={
            user && user.role === 'admin' ? 
              <AdminEmployeesPage /> : 
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/admin/camps" 
          element={
            user && user.role === 'admin' ? 
              <AdminCampsPage /> : 
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/admin/add-employee" 
          element={
            user && user.role === 'admin' ? 
              <AdminAddEmployeePage /> : 
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/admin/add-camp" 
          element={
            user && user.role === 'admin' ? 
              <AdminAddCampPage /> : 
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/admin/employees/:id" 
          element={
            user && user.role === 'admin' ? 
              <AdminEmployeeDetailsPage /> : 
              <Navigate to="/" replace />
          } 
        />
        
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            user ? (
              user.role === 'admin' ? 
                <Navigate to="/admin" replace /> : 
                <Navigate to="/employee" replace />
            ) : (
              showForgotPassword ? (
                <div className="min-h-screen bg-gray-50">
                  <Navbar user={null} onLogout={handleLogout} />
                  <main className="container mx-auto px-4 py-8">
                    <div className="max-w-md mx-auto">
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <ForgotPasswordForm onBackToLogin={handleBackToLogin} />
                      </div>
                    </div>
                  </main>
                </div>
              ) : isLogin ? (
                <AnimatedLoginForm onLogin={handleLogin} onForgotPassword={() => setShowForgotPassword(true)} />
              ) : (
                <div className="min-h-screen bg-gray-50">
                  <Navbar user={null} onLogout={handleLogout} />
                  <main className="container mx-auto px-4 py-8">
                    <div className="max-w-md mx-auto">
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex mb-6">
                          <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2 px-4 text-center font-medium rounded-l-lg ${
                              isLogin 
                                ? 'bg-primary-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Login
                          </button>
                          <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2 px-4 text-center font-medium rounded-r-lg ${
                              !isLogin 
                                ? 'bg-primary-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Register
                          </button>
                        </div>
                        <RegisterForm onLogin={handleLogin} />
                      </div>
                    </div>
                  </main>
                </div>
              )
            )
          } 
        />
      </Routes>
    </Router>
  )
}

export default App

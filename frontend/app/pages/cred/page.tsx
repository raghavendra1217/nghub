'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import LoginForm from './LoginForm'
import AnimatedLoginForm from '../../components/AnimatedLoginForm'
import RegisterForm from './RegisterForm'
import ForgotPasswordForm from './ForgotPasswordForm'

export default function Cred() {
  const [isLogin, setIsLogin] = useState(true)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [user, setUser] = useState(null)
  const router = useRouter()
  

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token with backend
      fetch('http://localhost:5000/api/profile', {
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
    }
  }, [])

  const handleLogin = (userData: any) => {
    setUser(userData)
    // Redirect based on user role
    if (userData.role === 'admin') {
      router.push('/pages/admin')
    } else if (userData.role === 'employee') {
      router.push('/pages/employee')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const handleBackToLogin = () => {
    setShowForgotPassword(false)
    setIsLogin(true)
  }

  // If user is logged in, redirect to appropriate dashboard
  if (user) {
    if (user.role === 'admin') {
      router.push('/pages/admin')
    } else if (user.role === 'employee') {
      router.push('/pages/employee')
    }
    return (
      <div className="min-h-screen bg-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {showForgotPassword ? (
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
      )}
    </div>
  )
}

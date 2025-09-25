import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API_BASE_URL from '../../../config/api.js'

export default function EmployeeProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const authenticateUser = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/')
        return
      }

      try {
        const response = await fetch('${API_BASE_URL}/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const data = await response.json()
        
        if (data.user && data.user.role === 'employee') {
          setUser(data.user)
        } else {
          navigate('/admin')
        }
      } catch (error) {
        console.error('Authentication error:', error)
        localStorage.removeItem('token')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    authenticateUser()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const goBack = () => {
    navigate(-1)
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-white' : 'text-gray-600'}`}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={goBack}
                className={`p-2 rounded-md ${isDarkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className={`ml-3 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Employee Profile
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleLogout}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-8`}>
          {/* Profile Header */}
          <div className="flex items-center space-x-6 mb-8">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
              <span className={`text-3xl font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {user.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {user.name}
              </h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Employee
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                ID: {user.id}
              </p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Personal Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Full Name
                  </label>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Email
                  </label>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Role
                  </label>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.role || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Employee ID
                  </label>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.id || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Work Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Department
                  </label>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Customer Service
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Position
                  </label>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Field Employee
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Status
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
                    Active
                  </span>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Join Date
                  </label>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8">
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Quick Stats
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 text-center`}>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  0
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Customers
                </div>
              </div>
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 text-center`}>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  0
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Completed Tasks
                </div>
              </div>
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 text-center`}>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  0
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pending Tasks
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

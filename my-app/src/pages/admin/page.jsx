import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API_BASE_URL from '../../config/api.js'

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [customers, setCustomers] = useState([])
  const [camps, setCamps] = useState([])
  const [error, setError] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('${API_BASE_URL}/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setEmployees(data.employees || [])
      } else {
        setError(data.error || 'Failed to fetch employees')
      }
    } catch (error) {
      setError('Failed to fetch employees')
    }
  }

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('${API_BASE_URL}/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setCustomers(data.customers || [])
      } else {
        setError(data.error || 'Failed to fetch customers')
      }
    } catch (error) {
      setError('Failed to fetch customers')
    }
  }

  const fetchCamps = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('${API_BASE_URL}/api/camps', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setCamps(data.camps || [])
      } else {
        setError(data.error || 'Failed to fetch camps')
      }
    } catch (error) {
      setError('Failed to fetch camps')
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/')
      return
    }

    const fetchUser = async () => {
      try {
        const response = await fetch('${API_BASE_URL}/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        
        if (response.ok && data.user && data.user.role === 'admin') {
          setUser(data.user)
          fetchEmployees()
          fetchCustomers()
          fetchCamps()
        } else {
          navigate('/employee')
        }
      } catch (error) {
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

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

  const activeEmployees = employees.filter(emp => emp.role === 'employee')
  const totalCustomers = customers.length
  const completedCamps = camps.filter(camp => camp.status === 'completed')
  const ongoingCamps = camps.filter(camp => camp.status === 'ongoing')
  const plannedCamps = camps.filter(camp => camp.status === 'planned')
  const totalRevenue = customers.reduce((sum, cust) => sum + (parseFloat(cust.discussed_amount) || 0), 0)

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:sticky lg:top-0 lg:h-screen ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex items-center justify-between h-16 px-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h1 className={`ml-3 text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Admin</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            <div className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg border-r-2 border-red-700 ${isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-700'}`}>
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Dashboard
            </div>
            <button
              onClick={() => navigate('/admin/employees')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700'}`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Employees
            </button>
            <button
              onClick={() => navigate('/admin/customers')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700'}`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              All Customers
            </button>
            <button
              onClick={() => navigate('/admin/camps')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700'}`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              All Camps
            </button>
          </div>
        </nav>

        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div 
            className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} mb-3`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
              <span className={`font-medium text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{user?.name?.charAt(0) || 'A'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.name || 'Admin'}</p>
              <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email || 'admin@example.com'}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
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
              onClick={() => {
                localStorage.removeItem('token')
                navigate('/')
              }}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        <header className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <div className="mb-8">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 mb-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Admin Dashboard</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Welcome back, {user?.name}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="lg:hidden p-2 rounded-lg bg-gray-100 text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
                  {error}
                  <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">×</button>
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 border-l-4 border-blue-500`}>
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Employees</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activeEmployees.length}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Out of {employees.length} total</p>
                  </div>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 border-l-4 border-green-500`}>
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-100">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Customers</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalCustomers}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>All customers</p>
                  </div>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 border-l-4 border-yellow-500`}>
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-yellow-100">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Revenue</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₹{totalRevenue.toLocaleString()}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>From all customers</p>
                  </div>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 border-l-4 border-purple-500`}>
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-100">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Camps</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{camps.length}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{completedCamps.length} completed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => navigate('/admin/add-employee')}
                  className="p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-gray-900">Add Employee</h3>
                      <p className="text-sm text-gray-500">Register new employee</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/admin/add-camp')}
                  className="p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-gray-900">Add Camp</h3>
                      <p className="text-sm text-gray-500">Schedule new camp</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/admin/employees')}
                  className="p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
                >
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-gray-900">Manage Employees</h3>
                      <p className="text-sm text-gray-500">View all employees</p>
                    </div>
                  </div>
                </button>

              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Recent Customers</h3>
                <div className="space-y-3">
                  {customers.slice(0, 4).map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{customer.customer_name}</p>
                        <p className="text-sm text-gray-500">{customer.type_of_work}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₹{parseFloat(customer.discussed_amount || 0).toLocaleString()}</p>
                        <p className="text-sm text-gray-500">{customer.created_by_name || 'Unknown'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Upcoming Camps</h3>
                <div className="space-y-3">
                  {plannedCamps.slice(0, 4).map((camp) => (
                    <div key={camp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{camp.location}</p>
                        <p className="text-sm text-gray-500">{camp.conducted_by}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{new Date(camp.camp_date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-500">{camp.assigned_employee_names?.length || 0} assigned</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>
    </div>
  )
}

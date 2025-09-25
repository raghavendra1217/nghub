import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import API_BASE_URL from '../../../../config/api.js'
import AdminNavbar from '../../../../components/AdminNavbar'

export default function EmployeeDetailsPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [employee, setEmployee] = useState(null)
  const [employeeCustomers, setEmployeeCustomers] = useState([])
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    const authenticateUser = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/')
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const data = await response.json()
        
        if (data.user && data.user.role === 'admin') {
          setUser(data.user)
          await Promise.all([fetchEmployee(), fetchEmployeeCustomers()])
        } else {
          navigate('/employee')
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
  }, [navigate, id])

  const fetchEmployee = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.employee) {
        setEmployee(data.employee)
      } else {
        setError('Employee not found')
        setTimeout(() => navigate('/admin/employees'), 2000)
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
      setError('Failed to fetch employee details')
      setTimeout(() => navigate('/admin/employees'), 2000)
    }
  }

  const fetchEmployeeCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/employees/${id}/customers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.customers) {
        setEmployeeCustomers(data.customers)
      }
    } catch (error) {
      console.error('Error fetching employee customers:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !employee) {
    return null
  }

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
            <button
              onClick={() => navigate('/admin')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700'}`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Dashboard
            </button>
            <div className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg border-r-2 border-red-700 ${isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-700'}`}>
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Employees
            </div>
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
            
            {/* Header */}
            <div className="mb-8">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => navigate('/admin/employees')}
                      className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      ← Back to Employees
                    </button>
                    <div>
                      <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        Employee Details - {employee.name}
                      </h1>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                        Employee ID: {employee.employee_id}
                      </p>
                    </div>
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
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Employee Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Employee Details */}
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
                  Employee Information
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <span className={`text-xl font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {employee.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {employee.name}
                      </h3>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Employee ID:</span> {employee.employee_id}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {employee.email}
                    </div>
                    <div>
                      <span className="font-medium">Contact:</span> {employee.contact}
                    </div>
                    <div>
                      <span className="font-medium">Role:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(employee.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
                  Performance Statistics
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg p-4 text-center`}>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-600'}`}>
                      {employeeCustomers.length}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-blue-600'}`}>
                      Total Customers
                    </div>
                  </div>
                  <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-green-50'} rounded-lg p-4 text-center`}>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-green-600'}`}>
                      ₹{employeeCustomers.reduce((sum, customer) => sum + (parseFloat(customer.discussed_amount) || 0), 0).toLocaleString()}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-green-600'}`}>
                      Total Discussed Amount
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer List */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Assigned Customers ({employeeCustomers.length})
                </h2>
              </div>
              
              {employeeCustomers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Customer
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Contact
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Work Type
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Amounts
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {employeeCustomers.map((customer) => (
                        <tr key={customer.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {customer.customer_name?.charAt(0).toUpperCase() || 'C'}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {customer.customer_name || 'N/A'}
                                </div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  ID: {customer.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {customer.phone_number || 'N/A'}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {customer.email || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              customer.type_of_work === 'Interior' 
                                ? 'bg-purple-100 text-purple-800' 
                                : customer.type_of_work === 'Exterior'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {customer.type_of_work || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm space-y-1">
                              <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <span className="font-medium">Discussed:</span> ₹{parseFloat(customer.discussed_amount || 0).toLocaleString()}
                              </div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <span className="font-medium">Pending:</span> ₹{parseFloat(customer.pending_amount || 0).toLocaleString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => navigate(`/admin/customers?highlight=${customer.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">👤</div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
                    No customers assigned
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    This employee doesn't have any customers assigned yet.
                  </p>
                </div>
              )}
            </div>

          </div>
        </header>
      </div>
    </div>
  )
}

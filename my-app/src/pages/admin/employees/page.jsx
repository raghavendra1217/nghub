import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API_BASE_URL from '../../../config/api.js'

export default function EmployeeManagement() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [employeeCustomers, setEmployeeCustomers] = useState([])
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  // Add Employee Form Statenp
  const [newEmployee, setNewEmployee] = useState({
    employee_id: '',
    name: '',
    email: '',
    contact: '',
    password: '',
    role: 'employee'
  })

  // Edit Employee Form State
  const [editEmployee, setEditEmployee] = useState({
    employee_id: '',
    name: '',
    email: '',
    contact: '',
    role: 'employee'
  })

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
          fetchEmployees()
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
  }, [navigate])

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.employees) {
        setEmployees(data.employees)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      setError('Failed to fetch employees')
      setTimeout(() => setError(''), 3000)
    }
  }

  const fetchEmployeeCustomers = async (employeeId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/customers`, {
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
      setError('Failed to fetch employee customers')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleViewEmployee = (employee) => {
    navigate(`/admin/employees/${employee.id}`)
  }

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee)
    setEditEmployee({
      employee_id: employee.employee_id,
      name: employee.name,
      email: employee.email,
      contact: employee.contact,
      role: employee.role
    })
    setShowEditModal(true)
  }

  const handleDeleteEmployee = async (employeeId) => {
    if (!confirm('Are you sure you want to delete this employee?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess('Employee deleted successfully')
        fetchEmployees()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to delete employee')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      setError('Failed to delete employee')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleAddEmployee = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/admin/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEmployee)
      })

      if (response.ok) {
        setSuccess('Employee added successfully')
        setShowAddModal(false)
        setNewEmployee({ employee_id: '', name: '', email: '', contact: '', password: '', role: 'employee' })
        fetchEmployees()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to add employee')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      console.error('Error adding employee:', error)
      setError('Failed to add employee')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleUpdateEmployee = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editEmployee)
      })

      if (response.ok) {
        setSuccess('Employee updated successfully')
        setShowEditModal(false)
        setEditingEmployee(null)
        fetchEmployees()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to update employee')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      setError('Failed to update employee')
      setTimeout(() => setError(''), 3000)
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

  if (!user) {
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
                  <div>
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Employee Management</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Manage all employees in the system</p>
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
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Add Employee
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
                <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">×</button>
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {success}
                <button onClick={() => setSuccess('')} className="ml-2 text-green-500 hover:text-green-700">×</button>
              </div>
            )}

            {/* Employees Table */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Employee
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Contact
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Role
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Customers
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {employees.map((employee) => (
                      <tr key={employee.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {employee.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {employee.name}
                              </div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                ID: {employee.employee_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {employee.email}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {employee.contact}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            employee.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {employee.customer_count || 0} customers
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewEmployee(employee)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditEmployee(employee)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {employees.length === 0 && (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-12 text-center`}>
                <div className="text-6xl mb-4">👨‍💼</div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
                  No employees found
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No employees have been added yet.
                </p>
              </div>
            )}

            {/* Add Employee Modal */}
            {showAddModal && (
              <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={() => setShowAddModal(false)}>
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md mx-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ml-32`} onClick={(e) => e.stopPropagation()}>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Add New Employee
                  </h3>
                  <form onSubmit={handleAddEmployee} className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Employee ID
                      </label>
                      <input
                        type="text"
                        value={newEmployee.employee_id}
                        onChange={(e) => setNewEmployee({...newEmployee, employee_id: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Name
                      </label>
                      <input
                        type="text"
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={newEmployee.email}
                        onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Contact
                      </label>
                      <input
                        type="text"
                        value={newEmployee.contact}
                        onChange={(e) => setNewEmployee({...newEmployee, contact: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Password
                      </label>
                      <input
                        type="password"
                        value={newEmployee.password}
                        onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Role
                      </label>
                      <select
                        value={newEmployee.role}
                        onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Add Employee
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Employee Modal */}
            {showEditModal && editingEmployee && (
              <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={() => setShowAddModal(false)}>
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md mx-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ml-32`} onClick={(e) => e.stopPropagation()}>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Edit Employee
                  </h3>
                  <form onSubmit={handleUpdateEmployee} className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Employee ID
                      </label>
                      <input
                        type="text"
                        value={editEmployee.employee_id}
                        onChange={(e) => setEditEmployee({...editEmployee, employee_id: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Name
                      </label>
                      <input
                        type="text"
                        value={editEmployee.name}
                        onChange={(e) => setEditEmployee({...editEmployee, name: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={editEmployee.email}
                        onChange={(e) => setEditEmployee({...editEmployee, email: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Contact
                      </label>
                      <input
                        type="text"
                        value={editEmployee.contact}
                        onChange={(e) => setEditEmployee({...editEmployee, contact: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Role
                      </label>
                      <select
                        value={editEmployee.role}
                        onChange={(e) => setEditEmployee({...editEmployee, role: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Update Employee
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Employee Details Modal */}
            {showEmployeeDetails && selectedEmployee && (
              <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={() => setShowAddModal(false)}>
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Employee Details - {selectedEmployee.name}
                    </h3>
                    <button
                      onClick={() => setShowEmployeeDetails(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Employee Information</h4>
                      <div className="space-y-2">
                        <p><span className="font-medium">Name:</span> {selectedEmployee.name}</p>
                        <p><span className="font-medium">Employee ID:</span> {selectedEmployee.employee_id}</p>
                        <p><span className="font-medium">Email:</span> {selectedEmployee.email}</p>
                        <p><span className="font-medium">Contact:</span> {selectedEmployee.contact}</p>
                        <p><span className="font-medium">Role:</span> {selectedEmployee.role}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Performance</h4>
                      <div className="space-y-2">
                        <p><span className="font-medium">Total Customers:</span> {employeeCustomers.length}</p>
                        <p><span className="font-medium">Created:</span> {new Date(selectedEmployee.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Customer List</h4>
                    {employeeCustomers.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Type</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {employeeCustomers.map((customer) => (
                              <tr key={customer.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {customer.customer_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {customer.phone_number}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {customer.type_of_work}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  ₹{customer.discussed_amount || 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No customers assigned to this employee yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </header>
      </div>
    </div>
  )
}

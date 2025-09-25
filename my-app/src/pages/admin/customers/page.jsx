import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import UserCard from '../../../components/employee/UserCard'
import ClaimsTable from '../../../components/employee/ClaimsTable'
import WhiteCardPopup from '../../../components/WhiteCardPopup'
import API_BASE_URL from '../../../config/api.js'

export default function CustomerManagement() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerDetails, setShowCustomerDetails] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('all')
  const [filterWorkType, setFilterWorkType] = useState('all')
  const [showClaimsModal, setShowClaimsModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [claims, setClaims] = useState([])
  const [customerCards, setCustomerCards] = useState([])
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Add Customer Form State
  const [newCustomer, setNewCustomer] = useState({
    customer_name: '',
    phone_number: '',
    email: '',
    type_of_work: '',
    discussed_amount: '',
    pending_amount: '',
    paid_amount: '',
    credit_amount: '',
    assigned_to: ''
  })

  // Edit Customer Form State
  const [editCustomer, setEditCustomer] = useState({
    customer_name: '',
    phone_number: '',
    email: '',
    type_of_work: '',
    discussed_amount: '',
    pending_amount: '',
    paid_amount: '',
    credit_amount: '',
    assigned_to: ''
  })

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
        
        if (data.user && data.user.role === 'admin') {
          setUser(data.user)
          await Promise.all([fetchCustomers(), fetchEmployees()])
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

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('${API_BASE_URL}/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.customers) {
        setCustomers(data.customers)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      setError('Failed to fetch customers')
    }
  }

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('${API_BASE_URL}/api/employees', {
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
    }
  }

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer)
    setShowCustomerDetails(true)
  }

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer)
    setEditCustomer({
      customer_name: customer.customer_name || '',
      phone_number: customer.phone_number || '',
      email: customer.email || '',
      type_of_work: customer.type_of_work || '',
      discussed_amount: customer.discussed_amount || '',
      pending_amount: customer.pending_amount || '',
      paid_amount: customer.paid_amount || '',
      credit_amount: customer.credit_amount || '',
      assigned_to: customer.assigned_to || ''
    })
    setShowEditModal(true)
  }

  const handleDeleteCustomer = async (customerId) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess('Customer deleted successfully')
        fetchCustomers()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to delete customer')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      setError('Failed to delete customer')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleAddCustomer = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('${API_BASE_URL}/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCustomer)
      })

      if (response.ok) {
        setSuccess('Customer added successfully')
        setShowAddModal(false)
        setNewCustomer({
          customer_name: '',
          phone_number: '',
          email: '',
          type_of_work: '',
          discussed_amount: '',
          pending_amount: '',
          paid_amount: '',
          credit_amount: '',
          assigned_to: ''
        })
        fetchCustomers()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to add customer')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      console.error('Error adding customer:', error)
      setError('Failed to add customer')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleUpdateCustomer = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editCustomer)
      })

      if (response.ok) {
        setSuccess('Customer updated successfully')
        setShowEditModal(false)
        setEditingCustomer(null)
        fetchCustomers()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to update customer')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      setError('Failed to update customer')
      setTimeout(() => setError(''), 3000)
    }
  }

  const getFilteredCustomers = () => {
    let filtered = customers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone_number?.includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Employee filter
    if (filterEmployee !== 'all') {
      filtered = filtered.filter(customer => customer.assigned_to === filterEmployee)
    }

    // Work type filter
    if (filterWorkType !== 'all') {
      filtered = filtered.filter(customer => customer.type_of_work === filterWorkType)
    }

    return filtered
  }

  // Card and Claims handlers
  const fetchCustomerCards = async (customerId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}/card`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        const cards = data.cards || []
        setCustomerCards(cards)
        return cards
      }
      return []
    } catch (error) {
      console.error('Error fetching customer cards:', error)
      return []
    }
  }

  const fetchClaims = async (cardId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/cards/${cardId}/claims`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        const claims = data.claims || []
        setClaims(claims)
        return claims
      }
      return []
    } catch (error) {
      console.error('Error fetching claims:', error)
      return []
    }
  }

  const handleViewClaims = async (customer) => {
    const cards = await fetchCustomerCards(customer.id)
    if (cards.length > 0) {
      await fetchClaims(cards[0].id)
      setSelectedCard(cards[0])
      setShowClaimsModal(true)
    } else {
      setError('No card found for this customer')
      setTimeout(() => setError(''), 3000)
    }
  }

  const closeClaimsModal = () => {
    setShowClaimsModal(false)
    setSelectedCard(null)
    setClaims([])
  }

  const getWorkTypeOptions = () => {
    const workTypes = [...new Set(customers.map(customer => customer.type_of_work).filter(Boolean))]
    return workTypes
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
            <button
              onClick={() => navigate('/admin/employees')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700'}`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Employees
            </button>
            <div className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg border-r-2 border-red-700 ${isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-700'}`}>
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              All Customers
            </div>
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
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Customer Management</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Manage all customers in the system</p>
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
                      Add Customer
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

            {/* Filters */}
            <div className="mb-6">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-4`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Search
                    </label>
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>

                  {/* Employee Filter */}
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Employee
                    </label>
                    <select
                      value={filterEmployee}
                      onChange={(e) => setFilterEmployee(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="all">All Employees</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Work Type Filter */}
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Work Type
                    </label>
                    <select
                      value={filterWorkType}
                      onChange={(e) => setFilterWorkType(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="all">All Work Types</option>
                      {getWorkTypeOptions().map((workType) => (
                        <option key={workType} value={workType}>
                          {workType}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Results Count */}
                  <div className="flex items-end">
                    <div className={`px-3 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {getFilteredCustomers().length} customers found
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customers Table */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
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
                        Assigned To
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {getFilteredCustomers().map((customer) => (
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
                              <span className="font-medium">Discussed:</span> ₹{customer.discussed_amount || 0}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              <span className="font-medium">Pending:</span> ₹{customer.pending_amount || 0}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {employees.find(emp => emp.id === parseInt(customer.assigned_to))?.name || 'Unassigned'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-1">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewCustomer(customer)}
                                className="text-blue-600 hover:text-blue-900 text-xs"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleEditCustomer(customer)}
                                className="text-green-600 hover:text-green-900 text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(customer.id)}
                                className="text-red-600 hover:text-red-900 text-xs"
                              >
                                Delete
                              </button>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewClaims(customer)}
                                className="text-orange-600 hover:text-orange-900 text-xs"
                              >
                                View Claims
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {getFilteredCustomers().length === 0 && (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-12 text-center`}>
                <div className="text-6xl mb-4">👤</div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
                  No customers found
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {searchTerm || filterEmployee !== 'all' || filterWorkType !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'No customers have been added yet.'
                  }
                </p>
              </div>
            )}

            {/* Add Customer Modal */}
            {showAddModal && (
              <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={() => setShowAddModal(false)}>
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ml-32`} onClick={(e) => e.stopPropagation()}>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Add New Customer
                  </h3>
                  <form onSubmit={handleAddCustomer} className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={newCustomer.customer_name}
                        onChange={(e) => setNewCustomer({...newCustomer, customer_name: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newCustomer.phone_number}
                        onChange={(e) => setNewCustomer({...newCustomer, phone_number: e.target.value})}
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
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Type of Work
                      </label>
                      <select
                        value={newCustomer.type_of_work}
                        onChange={(e) => setNewCustomer({...newCustomer, type_of_work: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Select Work Type</option>
                        <option value="Interior">Interior</option>
                        <option value="Exterior">Exterior</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Discussed Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newCustomer.discussed_amount}
                        onChange={(e) => setNewCustomer({...newCustomer, discussed_amount: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Pending Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newCustomer.pending_amount}
                        onChange={(e) => setNewCustomer({...newCustomer, pending_amount: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Paid Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newCustomer.paid_amount}
                        onChange={(e) => setNewCustomer({...newCustomer, paid_amount: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Credit Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newCustomer.credit_amount}
                        onChange={(e) => setNewCustomer({...newCustomer, credit_amount: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Assign to Employee
                      </label>
                      <select
                        value={newCustomer.assigned_to}
                        onChange={(e) => setNewCustomer({...newCustomer, assigned_to: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="">Select Employee</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name}
                          </option>
                        ))}
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
                        Add Customer
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Customer Modal */}
            {showEditModal && editingCustomer && (
              <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={() => setShowAddModal(false)}>
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ml-32`} onClick={(e) => e.stopPropagation()}>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Edit Customer
                  </h3>
                  <form onSubmit={handleUpdateCustomer} className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={editCustomer.customer_name}
                        onChange={(e) => setEditCustomer({...editCustomer, customer_name: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editCustomer.phone_number}
                        onChange={(e) => setEditCustomer({...editCustomer, phone_number: e.target.value})}
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
                        value={editCustomer.email}
                        onChange={(e) => setEditCustomer({...editCustomer, email: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Type of Work
                      </label>
                      <select
                        value={editCustomer.type_of_work}
                        onChange={(e) => setEditCustomer({...editCustomer, type_of_work: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Select Work Type</option>
                        <option value="Interior">Interior</option>
                        <option value="Exterior">Exterior</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Discussed Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editCustomer.discussed_amount}
                        onChange={(e) => setEditCustomer({...editCustomer, discussed_amount: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Pending Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editCustomer.pending_amount}
                        onChange={(e) => setEditCustomer({...editCustomer, pending_amount: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Paid Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editCustomer.paid_amount}
                        onChange={(e) => setEditCustomer({...editCustomer, paid_amount: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Credit Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editCustomer.credit_amount}
                        onChange={(e) => setEditCustomer({...editCustomer, credit_amount: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Assign to Employee
                      </label>
                      <select
                        value={editCustomer.assigned_to}
                        onChange={(e) => setEditCustomer({...editCustomer, assigned_to: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="">Select Employee</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name}
                          </option>
                        ))}
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
                        Update Customer
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Customer Details Modal */}
            {showCustomerDetails && selectedCustomer && (
              <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={() => setShowAddModal(false)}>
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Customer Details - {selectedCustomer.customer_name}
                    </h3>
                    <button
                      onClick={() => setShowCustomerDetails(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Customer Information</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium">Name:</span> {selectedCustomer.customer_name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {selectedCustomer.phone_number || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {selectedCustomer.email || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Work Type:</span> {selectedCustomer.type_of_work || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Assigned to:</span> {employees.find(emp => emp.id === parseInt(selectedCustomer.assigned_to))?.name || 'Unassigned'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Financial Information</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium">Discussed Amount:</span> ₹{selectedCustomer.discussed_amount || 0}
                        </div>
                        <div>
                          <span className="font-medium">Pending Amount:</span> ₹{selectedCustomer.pending_amount || 0}
                        </div>
                        <div>
                          <span className="font-medium">Paid Amount:</span> ₹{selectedCustomer.paid_amount || 0}
                        </div>
                        <div>
                          <span className="font-medium">Credit Amount:</span> ₹{selectedCustomer.credit_amount || 0}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {new Date(selectedCustomer.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Claims Modal */}
            {showClaimsModal && selectedCard && (
              <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={closeClaimsModal}>
                <div className="bg-white rounded-lg p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ml-32" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-6">
                    {/* User Card */}
                    <div className="flex items-center justify-center">
                      <UserCard 
                        card={selectedCard}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                    
                    {/* Claims Table */}
                    <div className="bg-white rounded-lg border border-gray-200">
                      <ClaimsTable 
                        claims={claims}
                        isDarkMode={isDarkMode}
                      />
                    </div>
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

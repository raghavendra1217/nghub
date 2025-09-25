import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API_BASE_URL from '../../../config/api.js'
import EditCustomerForm from '../../../components/employee/EditCustomerForm'
import CardForm from '../../../components/employee/CardForm'
import UserCard from '../../../components/employee/UserCard'
import ClaimsTable from '../../../components/employee/ClaimsTable'
import WhiteCardPopup from '../../../components/WhiteCardPopup'

export default function CustomersPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCardForm, setShowCardForm] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [showClaimsModal, setShowClaimsModal] = useState(false)
  const [isAddingClaim, setIsAddingClaim] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [selectedCustomerName, setSelectedCustomerName] = useState('')
  const [selectedCard, setSelectedCard] = useState(null)
  const [claims, setClaims] = useState([])
  const [customerCards, setCustomerCards] = useState({})
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  // Core functions
  const fetchCustomerCards = async () => {
    try {
      const token = localStorage.getItem('token')
      const cardsMap = {}
      
      for (const customer of customers) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/customers/${customer.id}/card`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (response.ok) {
            const cardData = await response.json()
            if (cardData.card) {
              const claimsResponse = await fetch(`${API_BASE_URL}/api/cards/${cardData.card.id}/claims`, {
                headers: { 'Authorization': `Bearer ${token}` }
              })
              
              if (claimsResponse.ok) {
                const claimsData = await claimsResponse.json()
                cardsMap[customer.id] = {
                  ...cardData.card,
                  customer_name: customer.customer_name,
                  claims: claimsData.claims || []
                }
              } else {
                cardsMap[customer.id] = {
                  ...cardData.card,
                  customer_name: customer.customer_name,
                  claims: []
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching card for customer ${customer.id}:`, error)
        }
      }
      
      setCustomerCards(cardsMap)
    } catch (error) {
      console.error('Error fetching customer cards:', error)
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

  const calculatePendingAmount = (discussedAmount, paidAmount) => {
    return Math.max(0, discussedAmount - paidAmount)
  }

  const getFilteredCustomers = () => {
    if (!searchTerm) return customers
    
    return customers.filter(customer => 
      customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone_number.includes(searchTerm) ||
      customer.type_of_work.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Customer management functions
  const handleAddCustomer = () => {
    navigate('/employee/add-customer')
  }

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer)
    setShowEditCustomerModal(true)
  }

  const handleRowClick = (customer) => {
    setEditingCustomer(customer)
    setShowEditCustomerModal(true)
  }

  // Card management functions
  const handleAddCard = (customerId) => {
    const customer = customers.find(c => c.id === customerId)
    setSelectedCustomerId(customerId)
    setSelectedCustomerName(customer?.customer_name || '')
    setShowCardForm(true)
  }

  const handleViewCard = (customerId) => {
    const card = customerCards[customerId]
    if (card) {
      setSelectedCard(card)
      setShowCardModal(true)
    }
  }

  // Claims management functions
  const handleAddClaim = (customerId) => {
    console.log('handleAddClaim called with customerId:', customerId)
    const customer = customers.find(c => c.id === customerId)
    const card = customerCards[customerId]
    console.log('Customer found:', customer)
    console.log('Card found:', card)
    
    if (customer && card) {
      setSelectedCustomerId(customerId)
      setSelectedCustomerName(customer.customer_name)
      setSelectedCard(card)
      setIsAddingClaim(true)
      setShowClaimsModal(true)
      console.log('Modal should be opening...')
    } else if (customer && !card) {
      setError('No card found for this customer. Please add a card first.')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleViewClaims = async (customerId) => {
    const card = customerCards[customerId]
    if (card) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_BASE_URL}/api/cards/${card.id}/claims`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setClaims(data.claims || [])
          setSelectedCard(card)
          setIsAddingClaim(false)
          setShowClaimsModal(true)
        }
      } catch (error) {
        console.error('Error fetching claims:', error)
      }
    }
  }

  // Modal close functions
  const closeCardForm = () => {
    setShowCardForm(false)
    setSelectedCustomerId(null)
    setSelectedCustomerName('')
  }

  const closeCardModal = () => {
    setShowCardModal(false)
    setSelectedCard(null)
  }

  const closeClaimsModal = () => {
    setShowClaimsModal(false)
    setSelectedCustomerId(null)
    setSelectedCustomerName('')
    setClaims([])
  }

  // Authentication and initialization
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
        
        if (response.ok && data.user && data.user.role === 'employee') {
          setUser(data.user)
          fetchCustomers()
        } else {
          navigate('/admin')
        }
      } catch (error) {
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  useEffect(() => {
    if (customers.length > 0) {
      fetchCustomerCards()
    }
  }, [customers])

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
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:sticky lg:top-0 lg:h-screen ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex items-center justify-between h-16 px-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <h1 className={`ml-3 text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Employee</h1>
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
              onClick={() => navigate('/employee')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700'}`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Dashboard
            </button>
            <div className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg border-r-2 border-blue-700 ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              All Customers
            </div>
            <button
              onClick={() => navigate('/employee/camps')}
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
          {/* Profile Section */}
          <div 
            className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} mb-3`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
              <span className={`font-medium text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.name || 'Employee'}</p>
              <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email || 'employee@example.com'}</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          {/* Theme Toggle and Logout */}
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
        {/* Header */}
        <header className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <div className="mb-8">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 mb-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>All Customers</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Manage all your customers</p>
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

              {/* Error and Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
                  {error}
                  <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">×</button>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-4">
                  {success}
                  <button onClick={() => setSuccess('')} className="ml-2 text-green-500 hover:text-green-700">×</button>
                </div>
              )}
            </div>

            {/* Customer Management */}
            <div className="mb-8">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Customer List</h2>
                  <button
                    onClick={handleAddCustomer}
                    className="px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#fcb72d' }}
                  >
                    Add Customer
                  </button>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search customers by name, phone, or work type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {getFilteredCustomers().length === 0 ? (
                  <div className="text-center py-8">
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {searchTerm ? 'No customers found matching your search.' : 'You haven\'t added any customers yet. Click "Add Customer" to get started.'}
                    </p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Customer Name
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Phone Number
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Type of Work
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Discussed Amount
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Paid Amount
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Pending Amount
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Payment Mode
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Created Date
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Card Actions
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Claims Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
                        {getFilteredCustomers().map((customer) => (
                          <tr key={customer.id}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} cursor-pointer`} onClick={() => handleRowClick(customer)}>
                              {customer.customer_name}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'} cursor-pointer`} onClick={() => handleRowClick(customer)}>
                              {customer.phone_number}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'} cursor-pointer`} onClick={() => handleRowClick(customer)}>
                              {customer.type_of_work}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'} cursor-pointer`} onClick={() => handleRowClick(customer)}>
                              ₹{customer.discussed_amount}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'} cursor-pointer`} onClick={() => handleRowClick(customer)}>
                              ₹{customer.paid_amount}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'} cursor-pointer`} onClick={() => handleRowClick(customer)}>
                              ₹{calculatePendingAmount(parseFloat(customer.discussed_amount), parseFloat(customer.paid_amount))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleRowClick(customer)}>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                customer.mode_of_payment === 'cash' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {customer.mode_of_payment}
                              </span>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                              {new Date(customer.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-wrap gap-1">
                                {customerCards[customer.id] ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleViewCard(customer.id); }}
                                    className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                                  >
                                    View Card
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleAddCard(customer.id); }}
                                    className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                                  >
                                    Add Card
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-wrap gap-1">
                                {customerCards[customer.id] ? (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleAddClaim(customer.id); }}
                                      className="text-green-600 hover:text-green-900 text-xs font-medium"
                                    >
                                      Add Claim
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleViewClaims(customer.id); }}
                                      className="text-purple-600 hover:text-purple-900 text-xs font-medium"
                                    >
                                      View Claims
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-gray-400 text-xs">
                                    Card Required
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Modals */}
      {showEditCustomerModal && editingCustomer && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={() => setShowEditCustomerModal(false)}>
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ml-32`} onClick={(e) => e.stopPropagation()}>
            <EditCustomerForm
              customer={editingCustomer}
              onSubmit={async (data) => {
                try {
                  const token = localStorage.getItem('token')
                  const response = await fetch(`${API_BASE_URL}/api/customers/${editingCustomer.id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                  })
                  
                  if (response.ok) {
                    setSuccess('Customer updated successfully')
                    fetchCustomers()
                    setShowEditCustomerModal(false)
                    setEditingCustomer(null)
                  } else {
                    const errorData = await response.json()
                    setError(errorData.error || 'Failed to update customer')
                  }
                } catch (error) {
                  setError('Failed to update customer')
                }
              }}
              onCancel={() => {
                setShowEditCustomerModal(false)
                setEditingCustomer(null)
              }}
              onDelete={() => {
                // Delete functionality removed for employees
                setShowEditCustomerModal(false)
              }}
            />
          </div>
        </div>
      )}

      {showCardForm && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={() => setShowCardForm(false)}>
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ml-32`} onClick={(e) => e.stopPropagation()}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Add Card for {selectedCustomerName}
            </h2>
            <CardForm
              customerId={selectedCustomerId}
              customerName={selectedCustomerName}
              onSuccess={() => {
                setSuccess('Card added successfully')
                fetchCustomerCards()
                closeCardForm()
              }}
              onError={(error) => {
                setError(error)
              }}
            />
          </div>
        </div>
      )}

      {/* White Card Popup */}
      <WhiteCardPopup 
        isOpen={showCardModal} 
        onClose={closeCardModal} 
        card={selectedCard} 
      />

      {showClaimsModal && selectedCard && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={closeClaimsModal}>
          <div className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto ml-32" onClick={(e) => e.stopPropagation()}>
            {/* White Box Container */}
            <div className="bg-white rounded-lg p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
              {/* Claims Section */}
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {isAddingClaim ? `Add Claim for ${selectedCustomerName}` : `Claims for ${selectedCard.customer_name}`}
              </h3>
              
              {isAddingClaim ? (
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target)
                  const claimData = {
                    card_id: selectedCard.id,
                    type_of_claim: formData.get('type_of_claim'),
                    process_state: formData.get('process_state'),
                    discussed_amount: parseFloat(formData.get('discussed_amount')),
                    paid_amount: parseFloat(formData.get('paid_amount')) || 0,
                    pending_amount: parseFloat(formData.get('pending_amount')) || 0
                  }

                  try {
                    const token = localStorage.getItem('token')
                    const response = await fetch(`${API_BASE_URL}/api/cards/${selectedCard.id}/claims`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify(claimData)
                    })

                    if (response.ok) {
                      setSuccess('Claim added successfully!')
                      closeClaimsModal()
                      fetchCustomerCards()
                      setTimeout(() => setSuccess(''), 3000)
                    } else {
                      const errorData = await response.json()
                      setError(errorData.error || 'Failed to add claim')
                      setTimeout(() => setError(''), 3000)
                    }
                  } catch (error) {
                    setError('Network error. Please try again.')
                    setTimeout(() => setError(''), 3000)
                  }
                }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type of Claim *
                      </label>
                      <select
                        name="type_of_claim"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Type of Claim</option>
                        <option value="Marriage gift">Marriage gift</option>
                        <option value="Maternity benefit">Maternity benefit</option>
                        <option value="Natural Death">Natural Death</option>
                        <option value="Accidental death">Accidental death</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Process State *
                      </label>
                      <select
                        name="process_state"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Process State</option>
                        <option value="ALO">ALO</option>
                        <option value="Nodal Officer">Nodal Officer</option>
                        <option value="Board">Board</option>
                        <option value="Insurance">Insurance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discussed Amount
                      </label>
                      <input
                        type="number"
                        name="discussed_amount"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Paid Amount
                      </label>
                      <input
                        type="number"
                        name="paid_amount"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pending Amount
                      </label>
                      <input
                        type="number"
                        name="pending_amount"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeClaimsModal}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Add Claim
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* UserCard for View Claims */}
                  <div className="mb-6 flex justify-center">
                    <UserCard
                      cardNumber={selectedCard.card_number || 'N/A'}
                      registerNumber={selectedCard.register_number || 'N/A'}
                      cardHolderName={selectedCard.card_holder_name || 'N/A'}
                      agentName={selectedCard.agent_name || 'N/A'}
                      agentMobile={selectedCard.agent_mobile || 'N/A'}
                      createdDate={selectedCard.created_at ? new Date(selectedCard.created_at).toLocaleDateString() : 'N/A'}
                    />
                  </div>
                  <ClaimsTable
                    claims={claims}
                    cardId={selectedCard.id}
                    onRefresh={() => {
                      setSuccess(isAddingClaim ? 'Claim added successfully' : 'Claim updated successfully')
                      fetchCustomerCards()
                      closeClaimsModal()
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

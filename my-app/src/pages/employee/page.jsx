import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API_BASE_URL from '../../config/api.js'
import EditCustomerForm from '../../components/employee/EditCustomerForm'
import CardForm from '../../components/employee/CardForm'
import ClaimsTable from '../../components/employee/ClaimsTable'
import PendingPaymentsTable from '../../components/employee/PendingPaymentsTable'
import PendingClaimsTable from '../../components/employee/PendingClaimsTable'
import UserCard from '../../components/employee/UserCard'
import WhiteCardPopup from '../../components/WhiteCardPopup'

export default function EmployeeDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState([])
  const [customerCount, setCustomerCount] = useState(0)
  const [camps, setCamps] = useState([])
  const [upcomingCamps, setUpcomingCamps] = useState([])
  const [completedCamps, setCompletedCamps] = useState([])
  const [cancelledCamps, setCancelledCamps] = useState([])
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
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [showPendingPaymentsModal, setShowPendingPaymentsModal] = useState(false)
  const [showPendingClaimsModal, setShowPendingClaimsModal] = useState(false)
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0)
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [summaryStats, setSummaryStats] = useState({
    discussedAmountCount: 0,
    pendingAmountCount: 0,
    paidAmountCount: 0,
    totalDiscussedAmount: 0,
    totalPendingAmount: 0,
    totalPaidAmount: 0
  })
  const [claimTypeStats, setClaimTypeStats] = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const navigate = useNavigate()

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
      const response = await fetch('${API_BASE_URL}/api/employee/camps', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setCamps(data.camps || [])
        setUpcomingCamps(data.camps?.filter(camp => camp.status === 'planned') || [])
        setCompletedCamps(data.camps?.filter(camp => camp.status === 'completed') || [])
        setCancelledCamps(data.camps?.filter(camp => camp.status === 'cancelled') || [])
      } else {
        setError(data.error || 'Failed to fetch camps')
      }
    } catch (error) {
      setError('Failed to fetch camps')
    }
  }

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

  const calculatePendingAmount = (discussedAmount, paidAmount) => {
    return Math.max(0, discussedAmount - paidAmount)
  }

  const calculateSummaryStats = () => {
    // Customer statistics
    let customerDiscussedCount = 0
    let customerPendingCount = 0
    let customerPaidCount = 0
    let totalCustomerDiscussed = 0
    let totalCustomerPending = 0
    let totalCustomerPaid = 0

    customers.forEach(customer => {
      const discussed = parseFloat(customer.discussed_amount) || 0
      const paid = parseFloat(customer.paid_amount) || 0
      const pending = calculatePendingAmount(discussed, paid)

      if (discussed > 0) {
        customerDiscussedCount++
        totalCustomerDiscussed += discussed
      }
      if (pending > 0) {
        customerPendingCount++
        totalCustomerPending += pending
      }
      if (paid > 0) {
        customerPaidCount++
        totalCustomerPaid += paid
      }
    })

    // Claims statistics
    let claimsDiscussedCount = 0
    let claimsPendingCount = 0
    let claimsPaidCount = 0
    let totalClaimsDiscussed = 0
    let totalClaimsPending = 0
    let totalClaimsPaid = 0

    Object.values(customerCards).forEach(card => {
      if (card.claims) {
        card.claims.forEach(claim => {
          const discussed = parseFloat(claim.discussed_amount) || 0
          const paid = parseFloat(claim.paid_amount) || 0
          const pending = parseFloat(claim.pending_amount) || 0

          if (discussed > 0) {
            claimsDiscussedCount++
            totalClaimsDiscussed += discussed
          }
          if (pending > 0) {
            claimsPendingCount++
            totalClaimsPending += pending
          }
          if (paid > 0) {
            claimsPaidCount++
            totalClaimsPaid += paid
          }
        })
      }
    })

    // Combine customer and claims statistics
    setSummaryStats({
      discussedAmountCount: customerDiscussedCount + claimsDiscussedCount,
      pendingAmountCount: customerPendingCount + claimsPendingCount,
      paidAmountCount: customerPaidCount + claimsPaidCount,
      totalDiscussedAmount: totalCustomerDiscussed + totalClaimsDiscussed,
      totalPendingAmount: totalCustomerPending + totalClaimsPending,
      totalPaidAmount: totalCustomerPaid + totalClaimsPaid
    })
  }

  const calculateClaimTypeStats = () => {
    // Define all possible claim types from the form
    const allClaimTypes = [
      'Marriage gift',
      'Maternity benefit', 
      'Natural Death',
      'Accidental death'
    ]
    
    // Initialize all claim types with zero
    const claimTypes = {}
    allClaimTypes.forEach(type => {
      claimTypes[type] = 0
    })
    
    // Count actual claims
    Object.values(customerCards).forEach(card => {
      if (card.claims) {
        card.claims.forEach(claim => {
          const claimType = claim.type_of_claim
          if (claimType && claimTypes.hasOwnProperty(claimType)) {
            claimTypes[claimType] += 1
          }
        })
      }
    })
    
    setClaimTypeStats(claimTypes)
  }

  const calculatePendingCounts = () => {
    // Calculate pending payments count (customers with auto-calculated pending_amount > 0)
    const pendingPayments = customers.filter(customer => 
      calculatePendingAmount(parseFloat(customer.discussed_amount), parseFloat(customer.paid_amount)) > 0
    )
    setPendingPaymentsCount(pendingPayments.length)

    // Calculate pending claims count (claims with pending_amount > 0)
    let totalPendingClaims = 0
    Object.values(customerCards).forEach(card => {
      if (card.claims) {
        const pendingClaims = card.claims.filter(claim => 
          claim.pending_amount && parseFloat(claim.pending_amount) > 0
        )
        totalPendingClaims += pendingClaims.length
      }
    })
    setPendingClaimsCount(totalPendingClaims)
  }

  // Customer management functions
  const handleAddCustomer = () => {
    navigate('/employee/add-customer')
  }

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer)
    setShowEditCustomerModal(true)
  }

  const handleDeleteCustomer = (customer) => {
    setEditingCustomer(customer)
    setShowDeleteConfirmModal(true)
  }

  const closeEditCustomerModal = () => {
    setShowEditCustomerModal(false)
    setEditingCustomer(null)
  }

  const closeDeleteConfirmModal = () => {
    setShowDeleteConfirmModal(false)
    setEditingCustomer(null)
  }

  const updateCustomer = async (customerData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(customerData)
      })

      if (response.ok) {
        setSuccess('Customer updated successfully!')
        closeEditCustomerModal()
        fetchCustomers()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update customer')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      setError('Failed to update customer')
      setTimeout(() => setError(''), 3000)
    }
  }

  const deleteCustomer = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/customers/${editingCustomer.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess('Customer deleted successfully!')
        closeDeleteConfirmModal()
        fetchCustomers()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete customer')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      setError('Failed to delete customer')
      setTimeout(() => setError(''), 3000)
    }
  }

  // Card and Claims functions
  const handleAddCard = (customerId) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setSelectedCustomerId(customerId)
      setSelectedCustomerName(customer.customer_name)
      setShowCardForm(true)
    }
  }

  const handleViewCard = async (customerId) => {
    try {
      const customer = customers.find(c => c.id === customerId)
      if (!customer) return

      setSelectedCustomerId(customerId)
      setSelectedCustomerName(customer.customer_name)
      
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}/card`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.card) {
          setSelectedCard(data.card)
          setShowCardModal(true)
        } else {
          setError('No card found for this customer')
          setTimeout(() => setError(''), 3000)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch card')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      console.error('Error fetching card:', error)
      setError('Failed to fetch card')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleAddClaim = (customerId) => {
    console.log('handleAddClaim called with customerId:', customerId)
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      const card = customerCards[customerId]
      console.log('Customer found:', customer)
      console.log('Card found:', card)
      
      if (card) {
        setSelectedCustomerId(customerId)
        setSelectedCustomerName(customer.customer_name)
        setSelectedCard(card)
        setIsAddingClaim(true)
        setShowClaimsModal(true)
        console.log('Modal should be opening...')
      } else {
        setError('No card found for this customer. Please add a card first.')
        setTimeout(() => setError(''), 3000)
      }
    }
  }

  const handleViewClaims = async (customerId) => {
    try {
      const customer = customers.find(c => c.id === customerId)
      if (!customer) return

      setSelectedCustomerId(customerId)
      setSelectedCustomerName(customer.customer_name)
      
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}/card`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.card) {
          const claimsResponse = await fetch(`${API_BASE_URL}/api/cards/${data.card.id}/claims`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (claimsResponse.ok) {
            const claimsData = await claimsResponse.json()
            setClaims(claimsData.claims || [])
            setSelectedCard(data.card)
            setIsAddingClaim(false)
            setShowClaimsModal(true)
          } else {
            setError('Failed to fetch claims')
            setTimeout(() => setError(''), 3000)
          }
        } else {
          setError('No card found for this customer')
          setTimeout(() => setError(''), 3000)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch card')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      console.error('Error fetching claims:', error)
      setError('Failed to fetch claims')
      setTimeout(() => setError(''), 3000)
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

  const handleCardSuccess = () => {
    closeCardForm()
    fetchCustomerCards()
    setSuccess('Card added successfully!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleCardError = (error) => {
    setError(error)
    setTimeout(() => setError(''), 3000)
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
        
        if (response.ok && data.user && data.user.role === 'employee') {
          setUser(data.user)
          fetchCustomers()
          fetchCamps()
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
      setCustomerCount(customers.length)
      fetchCustomerCards()
    }
  }, [customers])

  useEffect(() => {
    if (Object.keys(customerCards).length > 0) {
      calculateSummaryStats()
      calculateClaimTypeStats()
      calculatePendingCounts()
    }
  }, [customerCards, customers])

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
            <div className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg border-r-2 border-blue-700 ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Dashboard
            </div>
            <button
              onClick={() => navigate('/employee/customers')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700'}`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              All Customers
            </button>
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
          <div 
            onClick={() => navigate('/employee/profile')}
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
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {/* Dashboard Overview */}
            <div className="mb-8">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 mb-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Welcome back, {user?.name}!</h1>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Here's what's happening with your work today.</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{customerCount}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Customers</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{upcomingCamps.length}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Active Camps</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>{pendingPaymentsCount}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pending Payments</div>
                    </div>
                  </div>
                </div>
              </div>
                      
            {/* Error and Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-4">
                {success}
              </div>
            )}

            {/* Financial Overview */}
            <div className="mb-8">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Financial Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Discussed Amount Box */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 border-l-4 border-blue-500`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Discussed</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₹{summaryStats.totalDiscussedAmount.toLocaleString()}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{summaryStats.discussedAmountCount} items</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-100">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Paid Amount Box */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 border-l-4 border-green-500`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Paid</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₹{summaryStats.totalPaidAmount.toLocaleString()}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{summaryStats.paidAmountCount} items</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-100">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Pending Amount Box */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 border-l-4 border-orange-500`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Pending</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₹{summaryStats.totalPendingAmount.toLocaleString()}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{summaryStats.pendingAmountCount} items</p>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-100">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Claim Type Statistics */}
            <div className="mb-8">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Claim Type Statistics</h2>
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Object.entries(claimTypeStats).map(([claimType, count]) => {
                    const totalClaims = Object.values(claimTypeStats).reduce((sum, val) => sum + val, 0)
                    const percentage = totalClaims > 0 ? Math.round((count / totalClaims) * 100) : 0
                    const isZero = count === 0
                    
                    // Color mapping for different claim types
                    let color = 'bg-gray-500'
                    if (claimType === 'Marriage gift') color = 'bg-pink-500'
                    else if (claimType === 'Maternity benefit') color = 'bg-blue-500'
                    else if (claimType === 'Natural Death') color = 'bg-gray-600'
                    else if (claimType === 'Accidental death') color = 'bg-red-500'
                    
                    return (
                      <div key={claimType} className={`text-center ${isZero ? 'opacity-60' : ''}`}>
                        <div className={`w-16 h-16 ${color} rounded-full flex items-center justify-center mx-auto mb-3 ${isZero ? 'bg-gray-300' : ''}`}>
                          <span className={`font-bold text-xl ${isZero ? 'text-gray-500' : 'text-white'}`}>
                            {count}
                          </span>
                        </div>
                        <h3 className={`text-sm font-semibold mb-1 ${isZero ? 'text-gray-500' : isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          {claimType}
                        </h3>
                        <p className={`text-xs ${isZero ? 'text-gray-400' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {percentage}% of total
                        </p>
                        <div className="mt-2">
                          <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <div 
                              className={`h-2 rounded-full ${isZero ? 'bg-gray-300' : color}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        {isZero && (
                          <p className="text-xs text-gray-400 mt-1">No claims yet</p>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {/* Summary Stats */}
                <div className={`mt-6 pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-t`}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {Object.values(claimTypeStats).reduce((sum, val) => sum + val, 0)}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Claims</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {Object.keys(customerCards).length}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Cards</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {customerCount}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Customers</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {pendingClaimsCount}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending Claims</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={handleAddCustomer}
                  className={`p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left ${isDarkMode ? 'border-gray-600 hover:border-blue-400 hover:bg-gray-700' : ''}`}
                >
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <div>
                      <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add Customer</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Register a new customer</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/employee/customers')}
                  className={`p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors text-left ${isDarkMode ? 'border-gray-600 hover:border-green-400 hover:bg-gray-700' : ''}`}
                >
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Manage Customers</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>View and edit customers</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setShowPendingPaymentsModal(true)}
                  className={`p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-colors text-left ${isDarkMode ? 'border-gray-600 hover:border-orange-400 hover:bg-gray-700' : ''}`}
                >
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-orange-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <div>
                      <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pending Payments</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{pendingPaymentsCount} pending</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setShowPendingClaimsModal(true)}
                  className={`p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-colors text-left ${isDarkMode ? 'border-gray-600 hover:border-purple-400 hover:bg-gray-700' : ''}`}
                >
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <div>
                      <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pending Claims</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{pendingClaimsCount} pending</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {/* Edit Customer Modal */}
      {showEditCustomerModal && editingCustomer && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={closeEditCustomerModal}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ml-32" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Edit Customer</h2>
            <EditCustomerForm
              customer={editingCustomer}
              onSubmit={updateCustomer}
              onCancel={closeEditCustomerModal}
              onDelete={handleDeleteCustomer}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && editingCustomer && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={closeDeleteConfirmModal}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ml-32" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-red-600">Delete Customer</h2>
            <p className="mb-6">Are you sure you want to delete <strong>{editingCustomer.customer_name}</strong>? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteConfirmModal}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteCustomer}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Form Modal */}
      {showCardForm && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={() => setShowCardForm(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ml-32" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Add Card for {selectedCustomerName}</h2>
            <CardForm
              customerId={selectedCustomerId}
              customerName={selectedCustomerName}
              onSuccess={handleCardSuccess}
              onError={handleCardError}
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

      {/* Claims Modal */}
      {showClaimsModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={closeClaimsModal}>
          <div className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto ml-32" onClick={(e) => e.stopPropagation()}>
            {/* White Box Container */}
            <div className="bg-white rounded-lg p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
              {/* Claims Section */}
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {isAddingClaim ? `Add Claim for ${selectedCustomerName}` : `Claims for ${selectedCustomerName}`}
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
                      cardNumber={selectedCard?.card_number || 'N/A'}
                      registerNumber={selectedCard?.register_number || 'N/A'}
                      cardHolderName={selectedCard?.card_holder_name || 'N/A'}
                      agentName={selectedCard?.agent_name || 'N/A'}
                      agentMobile={selectedCard?.agent_mobile || 'N/A'}
                      createdDate={selectedCard?.created_at ? new Date(selectedCard.created_at).toLocaleDateString() : 'N/A'}
                    />
                  </div>
                  <ClaimsTable
                    claims={claims}
                    cardId={selectedCard?.id}
                    onRefresh={() => {
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

      {/* Pending Payments Modal */}
      {showPendingPaymentsModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={() => setShowPendingPaymentsModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-7xl mx-4 max-h-[90vh] overflow-y-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ml-32" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Pending Payments</h2>
              <button
                onClick={() => setShowPendingPaymentsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <PendingPaymentsTable
              customers={customers}
              customerCards={customerCards}
              onEditCustomer={handleEditCustomer}
              onAddCard={handleAddCard}
              onViewCard={handleViewCard}
              onAddClaim={handleAddClaim}
              onViewClaims={handleViewClaims}
            />
          </div>
        </div>
      )}

      {/* Pending Claims Modal */}
      {showPendingClaimsModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={() => setShowPendingClaimsModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-7xl mx-4 max-h-[90vh] overflow-y-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ml-32" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Pending Claims</h2>
              <button
                onClick={() => setShowPendingClaimsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <PendingClaimsTable
              customers={customers}
              customerCards={customerCards}
              onEditCustomer={handleEditCustomer}
              onAddCard={handleAddCard}
              onViewCard={handleViewCard}
              onAddClaim={handleAddClaim}
              onViewClaims={handleViewClaims}
            />
          </div>
        </div>
      )}

    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MapPreview from '../../components/MapPreview'
import EditCustomerForm from '../../components/employee/EditCustomerForm'
import CardForm from '../../components/employee/CardForm'
import CardDetails from '../../components/employee/CardDetails'
import ClaimForm from '../../components/employee/ClaimForm'
import ClaimsTable from '../../components/employee/ClaimsTable'
import PendingPaymentsTable from '../../components/employee/PendingPaymentsTable'
import PendingClaimsTable from '../../components/employee/PendingClaimsTable'
import UserCard from '../../components/employee/UserCard'

export default function EmployeePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<any[]>([])
  const [customerCount, setCustomerCount] = useState(0)
  const [camps, setCamps] = useState<any[]>([])
  const [upcomingCamps, setUpcomingCamps] = useState<any[]>([])
  const [completedCamps, setCompletedCamps] = useState<any[]>([])
  const [cancelledCamps, setCancelledCamps] = useState<any[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCardForm, setShowCardForm] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [showClaimsModal, setShowClaimsModal] = useState(false)
  const [isAddingClaim, setIsAddingClaim] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [selectedCustomerName, setSelectedCustomerName] = useState('')
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [claims, setClaims] = useState<any[]>([])
  const [customerCards, setCustomerCards] = useState<{[key: number]: any}>({})
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
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
  const [claimTypeStats, setClaimTypeStats] = useState<{[key: string]: number}>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter()

  // Core functions
  const fetchCustomerCards = async () => {
    try {
      const token = localStorage.getItem('token')
      const cardsMap: {[key: number]: any} = {}
      
      for (const customer of customers) {
        try {
          const response = await fetch(`http://localhost:5000/api/customers/${customer.id}/card`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (response.ok) {
            const cardData = await response.json()
            if (cardData.card) {
              const claimsResponse = await fetch(`http://localhost:5000/api/cards/${cardData.card.id}/claims`, {
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
      const response = await fetch('http://localhost:5000/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setCustomers(data.customers || [])
        setCustomerCount(data.customers?.length || 0)
      } else {
        setError(data.error || 'Failed to fetch customers')
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      setError('Network error. Please try again.')
    }
  }

  const fetchCamps = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/employee/camps', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        const allCamps = data.camps || []
        setCamps(allCamps)
        
        const upcoming = allCamps.filter((camp: any) => camp.status === 'planned' || camp.status === 'ongoing')
        const completed = allCamps.filter((camp: any) => camp.status === 'completed')
        const cancelled = allCamps.filter((camp: any) => camp.status === 'cancelled')
        
        setUpcomingCamps(upcoming)
        setCompletedCamps(completed)
        setCancelledCamps(cancelled)
      } else {
        setError(data.error || 'Failed to fetch camps')
      }
    } catch (error) {
      console.error('Error fetching camps:', error)
      setError('Network error. Please try again.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleProfileClick = () => {
    router.push('/pages/employee/profile')
  }

  // Additional functions for customer management
  const calculatePendingAmount = (discussedAmount: number, paidAmount: number) => {
    return Math.max(0, discussedAmount - paidAmount)
  }

  const calculateSummaryStats = () => {
    // Calculate customer statistics
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

    // Calculate claims statistics
    let claimsDiscussedCount = 0
    let claimsPendingCount = 0
    let claimsPaidCount = 0
    let totalClaimsDiscussed = 0
    let totalClaimsPending = 0
    let totalClaimsPaid = 0

    Object.values(customerCards).forEach((card: any) => {
      if (card.claims) {
        card.claims.forEach((claim: any) => {
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
    const claimTypes: {[key: string]: number} = {}
    allClaimTypes.forEach(type => {
      claimTypes[type] = 0
    })
    
    // Count actual claims
    Object.values(customerCards).forEach((card: any) => {
      if (card.claims) {
        card.claims.forEach((claim: any) => {
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
    Object.values(customerCards).forEach((card: any) => {
      if (card.claims) {
        const pendingClaims = card.claims.filter((claim: any) => 
          claim.pending_amount && parseFloat(claim.pending_amount) > 0
        )
        totalPendingClaims += pendingClaims.length
      }
    })
    setPendingClaimsCount(totalPendingClaims)
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
    router.push('/pages/employee/add-customer')
  }

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer)
    setShowEditCustomerModal(true)
  }

  const handleDeleteCustomer = (customer: any) => {
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

  const updateCustomer = async (customerData: any) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
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
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
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
  const handleAddCard = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setSelectedCustomerId(customerId)
      setSelectedCustomerName(customer.customer_name)
      setShowCardForm(true)
    }
  }

  const handleViewCard = async (customerId: number) => {
    try {
      const customer = customers.find(c => c.id === customerId)
      if (!customer) return

      setSelectedCustomerId(customerId)
      setSelectedCustomerName(customer.customer_name)
      
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/customers/${customerId}/card`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (response.ok) {
        setSelectedCard(data.card)
        setShowCardModal(true)
      } else {
        setError(data.error || 'Failed to fetch card')
      }
    } catch (error) {
      console.error('Error fetching card:', error)
      setError('Network error. Please try again.')
    }
  }

  const handleAddClaim = async (customerId: number) => {
    try {
      const customer = customers.find(c => c.id === customerId)
      if (!customer) return

      setSelectedCustomerId(customerId)
      setSelectedCustomerName(customer.customer_name)
      
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/customers/${customerId}/card`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (response.ok && data.card) {
        setSelectedCard(data.card)
        setIsAddingClaim(true)
        setShowClaimsModal(true)
      } else {
        setError('Customer must have a card before adding claims')
      }
    } catch (error) {
      console.error('Error fetching card:', error)
      setError('Network error. Please try again.')
    }
  }

  const handleViewClaims = async (customerId: number) => {
    try {
      const customer = customers.find(c => c.id === customerId)
      if (!customer) return

      setSelectedCustomerId(customerId)
      setSelectedCustomerName(customer.customer_name)
      
      const token = localStorage.getItem('token')
      
      // First get the card
      const cardResponse = await fetch(`http://localhost:5000/api/customers/${customerId}/card`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const cardData = await cardResponse.json()
      if (cardResponse.ok && cardData.card) {
        setSelectedCard(cardData.card)
        
        // Then get the claims
        const claimsResponse = await fetch(`http://localhost:5000/api/cards/${cardData.card.id}/claims`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const claimsData = await claimsResponse.json()
        if (claimsResponse.ok) {
          setClaims(claimsData.claims || [])
          setIsAddingClaim(false)
          setShowClaimsModal(true)
        } else {
          setError(claimsData.error || 'Failed to fetch claims')
        }
      } else {
        setError('Customer must have a card before viewing claims')
      }
    } catch (error) {
      console.error('Error fetching claims:', error)
      setError('Network error. Please try again.')
    }
  }

  const closeCardForm = () => {
    setShowCardForm(false)
    setSelectedCustomerId(null)
    setSelectedCustomerName('')
  }

  const closeCardModal = () => {
    setShowCardModal(false)
    setSelectedCustomerId(null)
    setSelectedCustomerName('')
    setSelectedCard(null)
  }

  const closeClaimsModal = () => {
    setShowClaimsModal(false)
    setIsAddingClaim(false)
    setSelectedCustomerId(null)
    setSelectedCustomerName('')
    setSelectedCard(null)
    setClaims([])
  }

  // Pending items functions
  const handlePendingPaymentsClick = () => {
    setShowPendingPaymentsModal(true)
  }

  const handlePendingClaimsClick = () => {
    setShowPendingClaimsModal(true)
  }

  const closePendingPaymentsModal = () => {
    setShowPendingPaymentsModal(false)
  }

  const closePendingClaimsModal = () => {
    setShowPendingClaimsModal(false)
  }


  const handleRowClick = (customer: any) => {
    handleEditCustomer(customer)
  }

  // useEffect hooks
  useEffect(() => {
    const authenticateUser = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      try {
        const response = await fetch('http://localhost:5000/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
        
        if (data.user && data.user.role === 'employee') {
          setUser(data.user)
        fetchCustomers()
          fetchCamps()
      } else {
          router.push('/pages/admin')
      }
    } catch (error) {
        console.error('Authentication error:', error)
        localStorage.removeItem('token')
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    authenticateUser()
  }, [router])

  useEffect(() => {
    if (customers.length > 0) {
      fetchCustomerCards()
    }
  }, [customers])

  useEffect(() => {
    calculatePendingCounts()
    calculateSummaryStats()
    calculateClaimTypeStats()
  }, [customers, customerCards])

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

  if (!user) {
    return null
  }

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:sticky lg:top-0 lg:h-screen ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Sidebar Header */}
        <div className={`flex items-center justify-between h-16 px-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
              </div>
            <h1 className={`ml-3 text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Employee</h1>
                </div>
              <button
            onClick={() => setSidebarOpen(false)}
            className={`lg:hidden p-2 rounded-md ${isDarkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
              </button>
            </div>

        {/* Sidebar Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            <div className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg border-r-2 border-blue-700 ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Dashboard
            </div>
            <button
              onClick={() => router.push('/pages/employee/customers')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700'}`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              All Customers
            </button>
            <button
              onClick={() => router.push('/pages/employee/camps')}
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

        {/* Sidebar Footer */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Profile Section */}
          <div 
            onClick={handleProfileClick}
            className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} mb-3`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
              <span className={`font-medium text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{user.name?.charAt(0) || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
              <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
                      </div>
                      
          {/* Theme Toggle and Logout */}
          <div className="flex items-center justify-between">
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

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {/* Dashboard Overview */}
            <div className="mb-8">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 mb-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Welcome back, {user.name}!</h1>
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
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                          </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Discussed Amount</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Total discussed amounts</p>
                        </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">{summaryStats.discussedAmountCount}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Count</div>
                      <div className="text-lg font-semibold text-blue-700">₹{summaryStats.totalDiscussedAmount.toLocaleString()}</div>
                </div>
              </div>
                </div>

                {/* Pending Amount Box */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 border-l-4 border-orange-500`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Pending Amount</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Outstanding payments</p>
                                </div>
                            </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-orange-600">{summaryStats.pendingAmountCount}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Count</div>
                      <div className="text-lg font-semibold text-orange-700">₹{summaryStats.totalPendingAmount.toLocaleString()}</div>
                          </div>
                        </div>
                    </div>

                {/* Paid Amount Box */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 border-l-4 border-green-500`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Paid Amount</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Completed payments</p>
              </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">{summaryStats.paidAmountCount}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Count</div>
                      <div className="text-lg font-semibold text-green-700">₹{summaryStats.totalPaidAmount.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Claim Type Statistics */}
            <div className="mb-8">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Claim Type Distribution</h2>
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(claimTypeStats)
                    .sort(([,a], [,b]) => b - a)
                    .map(([claimType, count], index) => {
                      const totalClaims = Object.values(claimTypeStats).reduce((sum, val) => sum + val, 0)
                      const percentage = totalClaims > 0 ? ((count / totalClaims) * 100).toFixed(1) : '0.0'
                      const colors = [
                        'bg-blue-500',
                        'bg-green-500', 
                        'bg-purple-500',
                        'bg-orange-500',
                        'bg-red-500',
                        'bg-indigo-500'
                      ]
                      const color = colors[index % colors.length]
                      const isZero = count === 0
                      
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
                        {Object.keys(claimTypeStats).length}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Claim Types</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>



            {/* Camp Assignments */}
            <div className="mb-8">
              {camps.length > 0 ? (
              <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>My Camp Assignments</h2>
                    <button
                      onClick={() => router.push('/pages/employee/camps')}
                      className="px-4 py-2 rounded-lg text-blue-600 border border-blue-600 font-medium transition-colors hover:bg-blue-50"
                    >
                      View All Camps
                    </button>
                  </div>
                  
                  {/* Recent Camps - Show up to 3 camps */}
                  <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                        <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                        Recent Camps ({Math.min(camps.length, 3)})
                      </h3>
                      <button
                        onClick={() => router.push('/pages/employee/camps')}
                        className="px-4 py-2 rounded-lg text-blue-600 border border-blue-600 font-medium transition-colors hover:bg-blue-50 text-sm"
                      >
                        View More
                      </button>
                    </div>
                    
                    {camps.slice(0, 3).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {camps.slice(0, 3).map((camp) => (
                          <div key={camp.id} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl shadow-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} hover:shadow-xl transition-all duration-300 overflow-hidden max-w-sm mx-auto`}>
                            {/* Map Section - Top */}
                            <div className="relative">
                              <a
                                href={camp.location_link || `https://www.google.com/maps/search/${encodeURIComponent(camp.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block cursor-pointer"
                              >
                                <div className="w-full h-48 bg-slate-100 relative overflow-hidden">
                                  <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={`https://maps.google.com/maps?q=${12.888964},${77.610307}&z=15&output=embed`}
                                    title="Camp Location Map"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                                </div>
                              </a>
                            </div>
                            
                            {/* Details Section - Bottom */}
                            <div className="p-4">
                              {/* Header */}
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-1`}>
                                    {camp.location}
                                  </h4>
                                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {new Date(camp.camp_date).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  camp.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                                  camp.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                                  camp.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                                </span>
                              </div>

                              {/* Details */}
                              <div className="space-y-2">
                                <div>
                                  <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide`}>
                                    Conducted by
                                  </p>
                                  <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {camp.conducted_by}
                                  </p>
                                </div>
                                
                                {camp.phone_number && (
                                  <div>
                                    <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide`}>
                                      Contact
                                    </p>
                                    <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                      {camp.phone_number}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-4xl mb-2">🏕️</div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No recent camps</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>My Camp Assignments</h2>
                    <button
                      onClick={() => router.push('/pages/employee/camps')}
                      className="px-4 py-2 rounded-lg text-blue-600 border border-blue-600 font-medium transition-colors hover:bg-blue-50"
                    >
                      View All Camps
                    </button>
                  </div>
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">🏕️</div>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No camp assignments yet. You'll be notified when camps are assigned to you.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Management */}
            <div className="mb-8">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                  <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Recent Customers</h2>
                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push('/pages/employee/customers')}
                        className="px-4 py-2 rounded-lg text-blue-600 border border-blue-600 font-medium transition-colors hover:bg-blue-50"
                      >
                        View All Customers
                      </button>
                      <button
                        onClick={handleAddCustomer}
                        className="px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
                        style={{ backgroundColor: '#fcb72d' }}
                      >
                        Add Customer
                      </button>
                    </div>
                  </div>

          {customers.slice(0, 5).length === 0 ? (
            <div className="text-center py-8">
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                You haven't added any customers yet. Click "Add Customer" to get started.
              </p>
            </div>
          ) : (
            <div className="w-full">
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
                  {customers.slice(0, 5).map((customer) => (
                          <tr key={customer.id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer`} onClick={() => handleRowClick(customer)}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {customer.customer_name}
                      </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {customer.phone_number}
                      </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        {customer.type_of_work}
                      </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        ₹{customer.discussed_amount}
                      </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        ₹{customer.paid_amount}
                      </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        ₹{calculatePendingAmount(parseFloat(customer.discussed_amount), parseFloat(customer.paid_amount))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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

            {/* Pending Items */}
            <div className="mb-8">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Pending Items</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pending Payments Box */}
                <div 
                  onClick={handlePendingPaymentsClick}
                  className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 border-l-4 border-orange-500 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Pending Payments</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Outstanding customer payments</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-orange-600">{pendingPaymentsCount}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Items</div>
                    </div>
                  </div>
                </div>

                {/* Pending Claims Box */}
                <div 
                  onClick={handlePendingClaimsClick}
                  className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 border-l-4 border-red-500 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Pending Claims</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Unprocessed claims</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-red-600">{pendingClaimsCount}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Items</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Card Form Modal */}
      {showCardForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md mx-4`}>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
              Add Card for {selectedCustomerName}
              </h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const cardData = {
                customer_id: selectedCustomerId,
                card_number: formData.get('card_number'),
                card_type: formData.get('card_type'),
                issue_date: formData.get('issue_date'),
                expiry_date: formData.get('expiry_date'),
                status: 'active'
              }

    try {
      const token = localStorage.getItem('token')
                const response = await fetch('http://localhost:5000/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
                  body: JSON.stringify(cardData)
      })

      if (response.ok) {
                  setSuccess('Card added successfully!')
                  closeCardForm()
                  fetchCustomerCards()
                  setTimeout(() => setSuccess(''), 3000)
      } else {
                  const errorData = await response.json()
                  setError(errorData.error || 'Failed to add card')
                  setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
                console.error('Error adding card:', error)
                setError('Failed to add card')
                setTimeout(() => setError(''), 3000)
              }
            }}>
              <div className="space-y-4">
        <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Card Number
          </label>
          <input
            type="text"
            name="card_number"
            required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    placeholder="Enter card number"
          />
        </div>

        <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Card Type
          </label>
                  <select
                    name="card_type"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">Select card type</option>
                    <option value="health">Health Card</option>
                    <option value="life">Life Insurance</option>
                    <option value="accident">Accident Insurance</option>
                  </select>
        </div>

        <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Issue Date
          </label>
          <input
                    type="date"
                    name="issue_date"
            required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          />
        </div>

        <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Expiry Date
          </label>
          <input
                    type="date"
                    name="expiry_date"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          />
        </div>
      </div>

              <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
                  onClick={closeCardForm}
                  className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}
        >
          Cancel
        </button>
        <button
          type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
                  Add Card
        </button>
      </div>
    </form>
          </div>
        </div>
      )}

      {/* Card Details Modal */}
      {showCardModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-2xl mx-4`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Card Details
              </h3>
              <button
                onClick={closeCardModal}
                className={`p-2 rounded-full ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Beautiful Animated UserCard Component */}
            <div className="flex justify-center mb-6">
              <div 
                className="relative w-full max-w-sm rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 p-6 text-white shadow-2xl transition-transform duration-100 ease-out hover:scale-105"
                style={{
      transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg)',
                  '--mouse-x': '50%',
                  '--mouse-y': '50%',
                  '--opacity': '0'
                } as React.CSSProperties}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = (e.clientX - rect.left) / rect.width
                  const y = (e.clientY - rect.top) / rect.height
                  
                  const rotateX = (y - 0.5) * 15
                  const rotateY = (x - 0.5) * 15
                  
                  e.currentTarget.style.transform = `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`
                  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
                  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
                  e.currentTarget.style.setProperty('--opacity', '1')
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
                  e.currentTarget.style.setProperty('--opacity', '0')
                }}
    >
      {/* Shiny glare effect overlay */}
      <div 
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[var(--opacity)] transition-opacity duration-300"
        style={{
            background: `radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.2), transparent)`
        }}
      />
                
                {/* Card content */}
      <div className="relative">
        {/* Card Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <p className="text-xs font-light text-slate-400">Card Holder</p>
                        <h2 className="text-lg font-bold">{selectedCard.card_holder_name || selectedCustomerName}</h2>
            </div>
          </div>
        </div>

        {/* Card Details Section */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <p className="text-sm text-slate-400">Card Number</p>
                      <p className="font-mono text-sm font-semibold">{selectedCard.card_number}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-slate-400">Register Number</p>
                      <p className="font-mono text-sm font-semibold">{selectedCard.register_number || 'N/A'}</p>
          </div>
          
          {/* Divider */}
          <div className="pt-2">
              <hr className="border-slate-600" />
          </div>

          <div className="flex justify-between">
            <p className="text-sm text-slate-400">Agent Name</p>
                      <p className="text-sm font-medium">{selectedCard.agent_name || 'N/A'}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-slate-400">Agent Mobile</p>
                      <p className="text-sm font-medium">{selectedCard.agent_mobile || 'N/A'}</p>
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-6 text-right">
                    <p className="text-xs text-slate-500">
                      Created: {selectedCard.created_at ? new Date(selectedCard.created_at).toLocaleDateString() : 'N/A'}
                    </p>
        </div>
      </div>
    </div>
      </div>

            {/* Action Buttons */}
            <div className="flex justify-end">
                  <button
                onClick={closeCardModal}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                  >
                Close
                  </button>
    </div>
                </div>
    </div>
      )}

      {/* Claims Modal */}
      {showClaimsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto`}>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
              {isAddingClaim ? `Add Claim for ${selectedCustomerName}` : `Claims for ${selectedCustomerName}`}
            </h3>
            
            {isAddingClaim ? (
              <form onSubmit={async (e) => {
    e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                const claimData = {
                  card_id: selectedCard.id,
                  type_of_claim: formData.get('type_of_claim'),
                  discussed_amount: parseFloat(formData.get('discussed_amount') as string),
                  paid_amount: parseFloat(formData.get('paid_amount') as string) || 0,
                  pending_amount: parseFloat(formData.get('pending_amount') as string) || 0,
                  claim_date: formData.get('claim_date'),
                  status: 'pending'
                }

    try {
      const token = localStorage.getItem('token')
                  const response = await fetch('http://localhost:5000/api/claims', {
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
                  console.error('Error adding claim:', error)
                  setError('Failed to add claim')
                  setTimeout(() => setError(''), 3000)
                }
              }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Type of Claim
          </label>
          <select
            name="type_of_claim"
            required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          >
                      <option value="">Select claim type</option>
            <option value="Marriage gift">Marriage gift</option>
            <option value="Maternity benefit">Maternity benefit</option>
            <option value="Natural Death">Natural Death</option>
            <option value="Accidental death">Accidental death</option>
          </select>
        </div>

        <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Claim Date
          </label>
          <input
                      type="date"
                      name="claim_date"
            required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          />
        </div>

        <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
            Discussed Amount
          </label>
          <input
            type="number"
            name="discussed_amount"
            required
            step="0.01"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      placeholder="0.00"
          />
        </div>

        <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
            Paid Amount
          </label>
          <input
            type="number"
            name="paid_amount"
            step="0.01"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      placeholder="0.00"
          />
        </div>

        <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
            Pending Amount
          </label>
          <input
            type="number"
            name="pending_amount"
            step="0.01"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      placeholder="0.00"
          />
        </div>
      </div>

                <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
                    onClick={closeClaimsModal}
                    className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}
        >
          Cancel
        </button>
        <button
          type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
                    Add Claim
        </button>
      </div>
    </form>
            ) : (
              <div>
                {/* Card Details Section */}
                {selectedCard && (
                  <div className="mb-6">
                    <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
                      Card Information
                    </h4>
                    <div className="flex justify-center">
                      <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 p-6 text-white shadow-2xl">
        {/* Card Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <p className="text-xs font-light text-slate-400">Card Holder</p>
                              <h2 className="text-lg font-bold">{selectedCard.card_holder_name || selectedCustomerName}</h2>
            </div>
          </div>
        </div>

        {/* Card Details Section */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <p className="text-sm text-slate-400">Card Number</p>
                            <p className="font-mono text-sm font-semibold">{selectedCard.card_number}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-slate-400">Register Number</p>
                            <p className="font-mono text-sm font-semibold">{selectedCard.register_number || 'N/A'}</p>
          </div>
          
          {/* Divider */}
          <div className="pt-2">
              <hr className="border-slate-600" />
          </div>

          <div className="flex justify-between">
            <p className="text-sm text-slate-400">Agent Name</p>
                            <p className="text-sm font-medium">{selectedCard.agent_name || 'N/A'}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-slate-400">Agent Mobile</p>
                            <p className="text-sm font-medium">{selectedCard.agent_mobile || 'N/A'}</p>
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-6 text-right">
                          <p className="text-xs text-slate-500">
                            Created: {selectedCard.created_at ? new Date(selectedCard.created_at).toLocaleDateString() : 'N/A'}
                          </p>
        </div>
      </div>
    </div>
                  </div>
                )}

                {/* Claims Section */}
                <div className="mb-6">
                  <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
                    Claims ({claims.length})
                  </h4>
                  {claims.length === 0 ? (
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-4`}>
                      No claims found for this customer.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <tr>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              Type
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              Process State
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              Discussed
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              Paid
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              Pending
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              Created Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
                          {claims.map((claim: any) => (
                            <tr key={claim.id}>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {claim.type_of_claim}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  claim.process_state === 'ALO' ? 'bg-blue-100 text-blue-800' :
                                  claim.process_state === 'Nodal Officer' ? 'bg-yellow-100 text-yellow-800' :
                                  claim.process_state === 'Board' ? 'bg-purple-100 text-purple-800' :
                                  claim.process_state === 'Insurance' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {claim.process_state}
                                </span>
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                ₹{claim.discussed_amount || 0}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                ₹{claim.paid_amount || 0}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${parseFloat(claim.pending_amount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₹{claim.pending_amount || 0}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                {claim.created_at ? new Date(claim.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
      </div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={closeClaimsModal}
                    className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}
                  >
                    Close
                  </button>
    </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showEditCustomerModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md mx-4`}>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Edit Customer</h3>
            <form onSubmit={async (e) => {
    e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const customerData = {
                customer_name: formData.get('customer_name'),
                phone_number: formData.get('phone_number'),
                type_of_work: formData.get('type_of_work'),
                discussed_amount: parseFloat(formData.get('discussed_amount') as string),
                paid_amount: parseFloat(formData.get('paid_amount') as string),
                mode_of_payment: formData.get('mode_of_payment')
              }

    try {
      const token = localStorage.getItem('token')
                const response = await fetch(`http://localhost:5000/api/customers/${editingCustomer.id}`, {
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
            }}>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Customer Name
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    defaultValue={editingCustomer.customer_name}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
                
        <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Phone Number
          </label>
                  <input
                    type="tel"
                    name="phone_number"
                    defaultValue={editingCustomer.phone_number}
            required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
      </div>

        <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Type of Work
          </label>
                  <input
                    type="text"
                    name="type_of_work"
                    defaultValue={editingCustomer.type_of_work}
            required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
        </div>

        <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
            Discussed Amount
          </label>
          <input
            type="number"
            name="discussed_amount"
                    defaultValue={editingCustomer.discussed_amount}
                    required
            step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          />
        </div>

        <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
            Paid Amount
          </label>
          <input
            type="number"
            name="paid_amount"
                    defaultValue={editingCustomer.paid_amount}
            step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          />
        </div>

        <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Payment Mode
          </label>
                  <select
                    name="mode_of_payment"
                    defaultValue={editingCustomer.mode_of_payment}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  >
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                  </select>
        </div>
      </div>

              <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
                  onClick={closeEditCustomerModal}
                  className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}
        >
          Cancel
        </button>
        <button
          type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
                  Update
        </button>
      </div>
    </form>
        </div>
        </div>
      )}

      {showDeleteConfirmModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md mx-4`}>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Delete Customer</h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              Are you sure you want to delete {editingCustomer.customer_name}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
        <button
                onClick={closeDeleteConfirmModal}
                className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}
        >
          Cancel
        </button>
        <button
                onClick={deleteCustomer}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
                Delete
        </button>
      </div>
      </div>
        </div>
      )}

      {showPendingPaymentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto`}>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Pending Payments</h3>
            
            {(() => {
              const pendingCustomers = customers.filter(customer => 
                calculatePendingAmount(parseFloat(customer.discussed_amount), parseFloat(customer.paid_amount)) > 0
              )
              
              return pendingCustomers.length === 0 ? (
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>
                  No pending payments found.
                </p>
              ) : (
                <div className="overflow-x-auto">
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
                      </tr>
                    </thead>
                    <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
                      {pendingCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {customer.customer_name}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {customer.phone_number}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            ₹{customer.discussed_amount}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            ₹{customer.paid_amount}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600`}>
                            ₹{calculatePendingAmount(parseFloat(customer.discussed_amount), parseFloat(customer.paid_amount))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              customer.mode_of_payment === 'cash' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {customer.mode_of_payment}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })()}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={closePendingPaymentsModal}
                className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showPendingClaimsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto`}>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Pending Claims</h3>
            
            {(() => {
              const pendingClaims: any[] = []
              Object.values(customerCards).forEach((card: any) => {
                if (card.claims) {
                  card.claims.forEach((claim: any) => {
                    if (claim.pending_amount && parseFloat(claim.pending_amount) > 0) {
                      pendingClaims.push({
                        ...claim,
                        customer_name: card.customer_name,
                        card_number: card.card_number
                      })
                    }
                  })
                }
              })
              
              return pendingClaims.length === 0 ? (
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>
                  No pending claims found.
                </p>
              ) : (
    <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200">
                        <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <tr>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              Customer Name
            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              Card Number
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              Claim Type
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
              Process State
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
              Created Date
            </th>
          </tr>
        </thead>
                        <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
                          {pendingClaims.map((claim: any, index) => (
                            <tr key={index}>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {claim.customer_name}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                {claim.card_number}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                {claim.type_of_claim}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  claim.process_state === 'ALO' ? 'bg-blue-100 text-blue-800' :
                  claim.process_state === 'Nodal Officer' ? 'bg-yellow-100 text-yellow-800' :
                  claim.process_state === 'Board' ? 'bg-purple-100 text-purple-800' :
                                  claim.process_state === 'Insurance' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                }`}>
                  {claim.process_state}
                </span>
              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                ₹{claim.discussed_amount || 0}
              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                ₹{claim.paid_amount || 0}
              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600`}>
                                ₹{claim.pending_amount || 0}
              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                {claim.created_at ? new Date(claim.created_at).toLocaleDateString() : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
                </div>
              )
            })()}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={closePendingClaimsModal}
                className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



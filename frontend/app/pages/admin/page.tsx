'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function Admin() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [employeeCount, setEmployeeCount] = useState(0)
  const [customerCount, setCustomerCount] = useState(0)
  const [campCount, setCampCount] = useState(0)
  const [customers, setCustomers] = useState<any[]>([])
  const [customerCards, setCustomerCards] = useState<{[key: number]: any}>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0)
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0)
  const [showPendingPaymentsModal, setShowPendingPaymentsModal] = useState(false)
  const [showPendingClaimsModal, setShowPendingClaimsModal] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [showClaimsModal, setShowClaimsModal] = useState(false)
  const [showAddClaimModal, setShowAddClaimModal] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [selectedCustomerName, setSelectedCustomerName] = useState('')
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [claims, setClaims] = useState<any[]>([])
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const authenticateUser = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      try {
        // Verify token with backend
        const response = await fetch('http://localhost:5000/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const data = await response.json()
        
        if (data.user && data.user.role === 'admin') {
          setUser(data.user)
          // Fetch counts and data
          fetchEmployeeCount()
          fetchCustomerCount()
          fetchCampCount()
          fetchCustomers()
        } else {
          // Not admin, redirect to employee dashboard
          router.push('/pages/employee')
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
  }, [customers, customerCards])

  const fetchEmployeeCount = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setEmployeeCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching employee count:', error)
    }
  }

  const fetchCustomerCount = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setCustomerCount(data.customers?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching customer count:', error)
    }
  }

  const fetchCampCount = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/camps', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setCampCount(data.camps?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching camp count:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setCustomers(data.customers || [])
      } else {
        setError(data.error || 'Failed to fetch customers')
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      setError('Network error. Please try again.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const handleManageEmployees = () => {
    router.push('/pages/admin/employees')
  }

  const handleManageCamps = () => {
    router.push('/pages/admin/camps')
  }

  const calculatePendingAmount = (discussedAmount: number, paidAmount: number) => {
    return Math.max(0, discussedAmount - paidAmount)
  }

  const getFilteredCustomers = () => {
    if (!searchTerm) return customers
    
    return customers.filter(customer => 
      customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone_number.includes(searchTerm) ||
      customer.type_of_work.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.created_by_name && customer.created_by_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
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

  const fetchCustomerCards = async () => {
    try {
      const token = localStorage.getItem('token')
      const cardsMap: {[key: number]: any} = {}

      for (const customer of customers) {
        try {
          const response = await fetch(`http://localhost:5000/api/customers/${customer.id}/card`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const cardData = await response.json()
            if (cardData.card) {
              // Fetch claims for this card
              const claimsResponse = await fetch(`http://localhost:5000/api/cards/${cardData.card.id}/claims`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
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

  const handleAddCard = (customerId: number, customerName: string) => {
    setSelectedCustomerId(customerId)
    setSelectedCustomerName(customerName)
    setShowCardForm(true)
  }

  const handleViewCard = async (customerId: number, customerName: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/customers/${customerId}/card`, {
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
          alert('No card found for this customer')
        }
      } else {
        alert('Failed to fetch card details')
      }
    } catch (error) {
      console.error('Error fetching card:', error)
      alert('Error fetching card details')
    }
  }

  const handleAddClaim = async (customerId: number, customerName: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/customers/${customerId}/card`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.card) {
          setSelectedCard(data.card)
          setSelectedCustomerId(customerId)
          setSelectedCustomerName(customerName)
          setShowAddClaimModal(true)
        } else {
          alert('No card found for this customer. Please add a card first.')
        }
      } else {
        alert('Failed to fetch card details')
      }
    } catch (error) {
      console.error('Error fetching card:', error)
      alert('Error fetching card details')
    }
  }

  const handleViewClaims = async (customerId: number, customerName: string) => {
    try {
      const token = localStorage.getItem('token')
      
      // First get the card
      const cardResponse = await fetch(`http://localhost:5000/api/customers/${customerId}/card`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (cardResponse.ok) {
        const cardData = await cardResponse.json()
        if (cardData.card) {
          setSelectedCard(cardData.card)
          
          // Then get the claims
          const claimsResponse = await fetch(`http://localhost:5000/api/cards/${cardData.card.id}/claims`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (claimsResponse.ok) {
            const claimsData = await claimsResponse.json()
            setClaims(claimsData.claims || [])
            setShowClaimsModal(true)
          } else {
            alert('Failed to fetch claims')
          }
        } else {
          alert('No card found for this customer')
        }
      } else {
        alert('Failed to fetch card details')
      }
    } catch (error) {
      console.error('Error fetching claims:', error)
      alert('Error fetching claims')
    }
  }

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
    setSelectedCard(null)
    setClaims([])
    setSelectedCustomerId(null)
    setSelectedCustomerName('')
  }

  const closeAddClaimModal = () => {
    setShowAddClaimModal(false)
    setSelectedCard(null)
    setSelectedCustomerId(null)
    setSelectedCustomerName('')
  }

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
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold" style={{ color: '#fcb72d' }}>
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: '#fcb72d' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Employee Management Box */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2" style={{ color: '#fcb72d' }}>
                        {employeeCount}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Employees</h3>
                      <button
                        onClick={handleManageEmployees}
                        className="w-full px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
                        style={{ backgroundColor: '#fcb72d' }}
                      >
                        Manage Employees
                      </button>
                    </div>
                  </div>

                  {/* Customer Management Box */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2" style={{ color: '#fcb72d' }}>
                        {customerCount}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Total Customers</h3>
                    </div>
                  </div>

                  {/* Camp Management Box */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2" style={{ color: '#fcb72d' }}>
                        {campCount}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Camps</h3>
                      <button
                        onClick={handleManageCamps}
                        className="w-full px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
                        style={{ backgroundColor: '#fcb72d' }}
                      >
                        Manage Camps
                      </button>
                    </div>
                  </div>

                  {/* Other Admin Features */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Reports & Analytics</h3>
                    <p className="text-gray-600 mb-4">View detailed reports and analytics.</p>
                    <button
                      className="w-full px-4 py-2 rounded-lg text-gray-700 font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      View Reports
                    </button>
                  </div>
                </div>

        {/* Customer Table */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">All Customers</h2>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search customers by name, phone, work type, or created by..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          {getFilteredCustomers().length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type of Work
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discussed Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pending Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredCustomers().map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {customer.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.phone_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={customer.type_of_work}>
                          {customer.type_of_work}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{customer.discussed_amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{customer.paid_amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-medium" style={{ color: '#fcb72d' }}>
                          {customer.created_by_name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customerCards[customer.id] ? (
                          <button
                            onClick={() => handleViewClaims(customer.id, customer.customer_name)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Claims
                          </button>
                        ) : (
                          <span className="text-gray-400">No card</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending Payments and Claims Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pending Payments Box */}
          <div 
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
            onClick={handlePendingPaymentsClick}
          >
            <div className="text-center">
              <div className="text-3xl font-bold mb-2" style={{ color: '#fcb72d' }}>
                {pendingPaymentsCount}
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Pending Payments</h3>
              <p className="text-sm text-gray-600 mt-2">Customers with pending amounts</p>
            </div>
          </div>

          {/* Pending Claims Box */}
          <div 
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
            onClick={handlePendingClaimsClick}
          >
            <div className="text-center">
              <div className="text-3xl font-bold mb-2" style={{ color: '#fcb72d' }}>
                {pendingClaimsCount}
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Pending Claims</h3>
              <p className="text-sm text-gray-600 mt-2">Claims with pending amounts</p>
            </div>
          </div>
        </div>
      </main>

      {/* Pending Payments Modal */}
      {showPendingPaymentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Pending Payments ({pendingPaymentsCount})
              </h3>
              <button
                onClick={closePendingPaymentsModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <PendingPaymentsTable 
              customers={customers} 
              customerCards={customerCards}
              onEditCustomer={() => {}}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Pending Claims ({pendingClaimsCount})
              </h3>
              <button
                onClick={closePendingClaimsModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <PendingClaimsTable 
              customers={customers} 
              customerCards={customerCards}
              onEditCustomer={() => {}}
              onAddCard={handleAddCard}
              onViewCard={handleViewCard}
              onAddClaim={handleAddClaim}
              onViewClaims={handleViewClaims}
            />
          </div>
        </div>
      )}

      {/* Add Card Form Modal */}
      {showCardForm && selectedCustomerId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Card for {selectedCustomerName}
              </h3>
              <button
                onClick={closeCardForm}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <CardForm 
              customerId={selectedCustomerId}
              customerName={selectedCustomerName}
              onSuccess={() => {
                fetchCustomerCards()
                closeCardForm()
              }}
              onError={(error) => {
                alert(error)
              }}
            />
          </div>
        </div>
      )}

      {/* View Card Modal */}
      {showCardModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Card Details</h3>
              <button
                onClick={closeCardModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <CardDetails card={selectedCard} onRefresh={fetchCustomerCards} />
          </div>
        </div>
      )}

      {/* View Claims Modal */}
      {showClaimsModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Claims for {selectedCustomerName}
              </h3>
              <button
                onClick={closeClaimsModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <CardDetails card={selectedCard} onRefresh={fetchCustomerCards} />
            </div>
            
            <ClaimsTable 
              claims={claims}
              cardId={selectedCard.id}
              onRefresh={() => {
                fetchCustomerCards()
              }}
            />
          </div>
        </div>
      )}

      {/* Add Claim Modal */}
      {showAddClaimModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Claim for {selectedCustomerName}
              </h3>
              <button
                onClick={closeAddClaimModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <ClaimForm 
              cardId={selectedCard.id}
              customerName={selectedCustomerName}
              onSuccess={() => {
                fetchCustomerCards()
                closeAddClaimModal()
              }}
              onError={(error) => {
                alert(error)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Card Form Component
function CardForm({ customerId, customerName, onSuccess, onError }: {
  customerId: number
  customerName: string
  onSuccess: () => void
  onError: (error: string) => void
}) {
  const [formData, setFormData] = useState({
    card_number: '',
    register_number: '',
    card_holder_name: '',
    agent_name: '',
    agent_mobile: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/customers/${customerId}/card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (response.ok) {
        onSuccess()
      } else {
        onError(data.error || 'Failed to add card')
      }
    } catch (error) {
      onError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Number *
          </label>
          <input
            type="text"
            name="card_number"
            value={formData.card_number}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Register Number
          </label>
          <input
            type="text"
            name="register_number"
            value={formData.register_number}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Holder Name *
          </label>
          <input
            type="text"
            name="card_holder_name"
            value={formData.card_holder_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Agent Name
          </label>
          <input
            type="text"
            name="agent_name"
            value={formData.agent_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Agent Mobile
          </label>
          <input
            type="text"
            name="agent_mobile"
            value={formData.agent_mobile}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={() => onSuccess()}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Card'}
        </button>
      </div>
    </form>
  )
}

// UserCard Component with 3D effects
function UserCard({ 
  cardNumber, 
  registerNumber, 
  cardHolderName, 
  agentName, 
  agentMobile, 
  createdDate 
}: {
  cardNumber: string
  registerNumber: string
  cardHolderName: string
  agentName: string
  agentMobile: string
  createdDate: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState({})

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const { clientX, clientY } = e
    const { left, top, width, height } = cardRef.current.getBoundingClientRect()
    
    // Calculate mouse position relative to the card's center
    const x = (clientX - left - width / 2) / (width / 2)
    const y = (clientY - top - height / 2) / (height / 2)

    // Define the intensity of the rotation
    const rotateIntensity = 15

    setStyle({
      transform: `perspective(1000px) rotateY(${x * rotateIntensity}deg) rotateX(${-y * rotateIntensity}deg)`,
      '--mouse-x': `${clientX - left}px`,
      '--mouse-y': `${clientY - top}px`,
      '--opacity': '1',
    })
  }

  const handleMouseLeave = () => {
    // Reset the styles on mouse leave for a smooth transition back to normal
    setStyle({
      transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg)',
      '--opacity': '0',
    })
  }

  return (
    // Main container for the card with gradient background and shadow
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style as React.CSSProperties}
      className="relative w-full max-w-sm rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 p-6 text-white shadow-2xl transition-transform duration-100 ease-out"
    >
      {/* Shiny glare effect overlay */}
      <div 
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[var(--opacity)] transition-opacity duration-300"
        style={{
            background: `radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.2), transparent)`
        }}
      />
      {/* Card content is wrapped to ensure it appears above the glare */}
      <div className="relative">
        {/* Card Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <p className="text-xs font-light text-slate-400">Card Holder</p>
              <h2 className="text-lg font-bold">{cardHolderName}</h2>
            </div>
          </div>
        </div>

        {/* Card Details Section */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <p className="text-sm text-slate-400">Card Number</p>
            <p className="font-mono text-sm font-semibold">{cardNumber}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-slate-400">Register Number</p>
            <p className="font-mono text-sm font-semibold">{registerNumber || 'N/A'}</p>
          </div>
          
          {/* Divider */}
          <div className="pt-2">
              <hr className="border-slate-600" />
          </div>

          <div className="flex justify-between">
            <p className="text-sm text-slate-400">Agent Name</p>
            <p className="text-sm font-medium">{agentName || 'N/A'}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-slate-400">Agent Mobile</p>
            <p className="text-sm font-medium">{agentMobile || 'N/A'}</p>
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-6 text-right">
          <p className="text-xs text-slate-500">Created Date: {createdDate}</p>
        </div>
      </div>
    </div>
  )
}

// Card Details Component
function CardDetails({ card, onRefresh }: {
  card: any
  onRefresh?: () => void
}) {
  if (!card) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No card found.</p>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <UserCard
        cardNumber={card.card_number}
        registerNumber={card.register_number}
        cardHolderName={card.card_holder_name}
        agentName={card.agent_name}
        agentMobile={card.agent_mobile}
        createdDate={new Date(card.created_at).toLocaleDateString()}
      />
    </div>
  )
}

// Claim Form Component (Multiple per card)
function ClaimForm({ cardId, customerName, onSuccess, onError }: {
  cardId: number
  customerName: string
  onSuccess: () => void
  onError: (error: string) => void
}) {
  const [formData, setFormData] = useState({
    type_of_claim: '',
    process_state: '',
    discussed_amount: '',
    paid_amount: '',
    pending_amount: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/cards/${cardId}/claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          discussed_amount: parseFloat(formData.discussed_amount) || 0,
          paid_amount: parseFloat(formData.paid_amount) || 0,
          pending_amount: parseFloat(formData.pending_amount) || 0
        })
      })

      const data = await response.json()
      if (response.ok) {
        onSuccess()
      } else {
        onError(data.error || 'Failed to add claim')
      }
    } catch (error) {
      onError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type of Claim *
          </label>
          <select
            name="type_of_claim"
            value={formData.type_of_claim}
            onChange={handleChange}
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
            value={formData.process_state}
            onChange={handleChange}
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
            value={formData.discussed_amount}
            onChange={handleChange}
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
            value={formData.paid_amount}
            onChange={handleChange}
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
            value={formData.pending_amount}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={() => onSuccess()}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Claim'}
        </button>
      </div>
    </form>
  )
}

// Claims Table Component
function ClaimsTable({ claims, cardId, onRefresh }: {
  claims: any[]
  cardId: number
  onRefresh: () => void
}) {
  const [editingClaim, setEditingClaim] = useState<any>(null)
  const [showEditForm, setShowEditForm] = useState(false)

  const handleEdit = (claim: any) => {
    setEditingClaim(claim)
    setShowEditForm(true)
  }

  const handleDelete = async (claimId: number) => {
    if (!confirm('Are you sure you want to delete this claim?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/claims/${claimId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        onRefresh()
        alert('Claim deleted successfully!')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete claim')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    }
  }

  if (claims.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No claims found for this card.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type of Claim
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Process State
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Discussed Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Paid Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pending Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {claims.map((claim) => (
            <tr key={claim.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {claim.type_of_claim}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  claim.process_state === 'ALO' ? 'bg-blue-100 text-blue-800' :
                  claim.process_state === 'Nodal Officer' ? 'bg-yellow-100 text-yellow-800' :
                  claim.process_state === 'Board' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {claim.process_state}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{claim.discussed_amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{claim.paid_amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{claim.pending_amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(claim.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(claim)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(claim.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
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
  )
}

// PendingPaymentsTable Component
function PendingPaymentsTable({ customers, customerCards, onEditCustomer, onAddCard, onViewCard, onAddClaim, onViewClaims }: {
  customers: any[]
  customerCards: {[key: number]: any}
  onEditCustomer: (customer: any) => void
  onAddCard: (customerId: number, customerName: string) => void
  onViewCard: (customerId: number, customerName: string) => void
  onAddClaim: (customerId: number, customerName: string) => void
  onViewClaims: (customerId: number, customerName: string) => void
}) {
  const calculatePendingAmount = (discussedAmount: number, paidAmount: number) => {
    return Math.max(0, discussedAmount - paidAmount)
  }

  const pendingPayments = customers.filter(customer => 
    calculatePendingAmount(parseFloat(customer.discussed_amount), parseFloat(customer.paid_amount)) > 0
  )

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discussed</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pendingPayments.map((customer) => {
            const card = customerCards[customer.id]
            return (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {customer.customer_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.phone_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="max-w-xs truncate" title={customer.type_of_work}>
                    {customer.type_of_work}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{customer.discussed_amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{customer.paid_amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{calculatePendingAmount(parseFloat(customer.discussed_amount), parseFloat(customer.paid_amount))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="font-medium" style={{ color: '#fcb72d' }}>
                    {customer.created_by_name || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {card ? (
                    <button
                      onClick={() => onViewClaims(customer.id, customer.customer_name)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Claims
                    </button>
                  ) : (
                    <span className="text-gray-400">No card</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// PendingClaimsTable Component
function PendingClaimsTable({ customers, customerCards, onEditCustomer, onAddCard, onViewCard, onAddClaim, onViewClaims }: {
  customers: any[]
  customerCards: {[key: number]: any}
  onEditCustomer: (customer: any) => void
  onAddCard: (customerId: number, customerName: string) => void
  onViewCard: (customerId: number, customerName: string) => void
  onAddClaim: (customerId: number, customerName: string) => void
  onViewClaims: (customerId: number, customerName: string) => void
}) {
  const pendingClaimsData: any[] = []

  Object.values(customerCards).forEach((card: any) => {
    if (card.claims) {
      const pendingClaims = card.claims.filter((claim: any) => 
        claim.pending_amount && parseFloat(claim.pending_amount) > 0
      )
      pendingClaims.forEach((claim: any) => {
        const customer = customers.find(c => c.id === card.customer_id)
        if (customer) {
          pendingClaimsData.push({
            ...claim,
            customer_name: customer.customer_name,
            customer_phone: customer.phone_number,
            card_number: card.card_number,
            created_by_name: customer.created_by_name
          })
        }
      })
    }
  })

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card Number</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claim Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process State</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discussed</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pendingClaimsData.map((claim) => (
            <tr key={claim.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {claim.customer_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {claim.card_number}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {claim.type_of_claim}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {claim.process_state}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{claim.discussed_amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{claim.paid_amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{claim.pending_amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className="font-medium" style={{ color: '#fcb72d' }}>
                  {claim.created_by_name || 'Unknown'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <button
                  onClick={() => {
                    const customer = customers.find(c => c.customer_name === claim.customer_name)
                    if (customer) {
                      onViewClaims(customer.id, claim.customer_name)
                    }
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Claims
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

// Edit Customer Form Component
function EditCustomerForm({ customer, onSubmit, onCancel, onDelete }: {
  customer: any
  onSubmit: (data: any) => void
  onCancel: () => void
  onDelete: () => void
}) {
  const [formData, setFormData] = useState({
    name: customer.name || '',
    phone_number: customer.phone_number || '',
    type_of_work: customer.type_of_work || '',
    discussed_amount: customer.discussed_amount || '',
    paid_amount: customer.paid_amount || '',
    pending_amount: customer.pending_amount || '',
    mode_of_payment: customer.mode_of_payment || 'cash'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Customer Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type of Work
        </label>
        <input
          type="text"
          name="type_of_work"
          value={formData.type_of_work}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
          required
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
          required
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
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mode of Payment
        </label>
        <select
          name="mode_of_payment"
          value={formData.mode_of_payment}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="cash">Cash</option>
          <option value="online">Online</option>
        </select>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onDelete}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Delete Customer
        </button>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Update Customer
          </button>
        </div>
      </div>
    </form>
  )
}

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
  const router = useRouter()

  const fetchCustomerCards = async () => {
    try {
      const token = localStorage.getItem('token')
      const cardsMap: {[key: number]: any} = {}
      
      // Fetch card for each customer
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
        
        if (data.user && data.user.role === 'employee') {
          setUser(data.user)
          fetchCustomers()
          fetchCamps()
        } else {
          // Not employee, redirect to admin dashboard
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
  }, [customers, customerCards])

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
        setCustomerCount(data.customers?.length || 0)
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

  const fetchCamps = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/employee/camps', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        const allCamps = data.camps || []
        setCamps(allCamps)
        
        // Categorize camps by status
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

  const handleAddCustomer = () => {
    router.push('/pages/employee/add-customer')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800'
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned':
        return 'Planned'
      case 'ongoing':
        return 'Ongoing'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  const openMapLocation = (locationLink: string) => {
    if (locationLink) {
      window.open(locationLink, '_blank', 'noopener,noreferrer')
    }
  }

  const extractCoordinatesFromUrl = (url: string) => {
    // Extract coordinates from Google Maps URL
    const coordMatch = url.match(/(\d+\.\d+),(\d+\.\d+)/)
    if (coordMatch) {
      return {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2])
      }
    }
    return null
  }

  const getEmbedUrl = (locationLink: string, locationName: string) => {
    const coords = extractCoordinatesFromUrl(locationLink)
    console.log('🔍 Extracting coordinates from:', locationLink)
    console.log('🔍 Found coordinates:', coords)
    
    if (coords) {
      const embedUrl = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`
      console.log('🔍 Generated embed URL:', embedUrl)
      return embedUrl
    }
    // Fallback to location name search
    const fallbackUrl = `https://maps.google.com/maps?q=${encodeURIComponent(locationName)}&output=embed`
    console.log('🔍 Using fallback URL:', fallbackUrl)
    return fallbackUrl
  }

  const updateCampStatus = async (campId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/employee/camps/${campId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()
      if (response.ok) {
        console.log('✅ Camp status updated successfully:', data)
        
        // Update the camp in the local state
        setCamps(prevCamps => 
          prevCamps.map(camp => 
            camp.id === campId ? { ...camp, status: newStatus } : camp
          )
        )
        
        // Update categorized camps
        const updatedCamps = camps.map(camp => 
          camp.id === campId ? { ...camp, status: newStatus } : camp
        )
        
        const upcoming = updatedCamps.filter((camp: any) => camp.status === 'planned' || camp.status === 'ongoing')
        const completed = updatedCamps.filter((camp: any) => camp.status === 'completed')
        const cancelled = updatedCamps.filter((camp: any) => camp.status === 'cancelled')
        
        setUpcomingCamps(upcoming)
        setCompletedCamps(completed)
        setCancelledCamps(cancelled)
        
        setSuccess('Camp status updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to update camp status')
      }
    } catch (error) {
      console.error('Error updating camp status:', error)
      setError('Network error. Please try again.')
    }
  }

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

  const calculatePendingAmount = (discussedAmount: number, paidAmount: number) => {
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

  const handleRowClick = (customer: any) => {
    handleEditCustomer(customer)
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
                Employee Dashboard
              </h1>
              <div className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {customerCount} Customer{customerCount !== 1 ? 's' : ''}
              </div>
              {upcomingCamps.length > 0 && (
                <div className="ml-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium animate-pulse">
                  🔔 {upcomingCamps.length} Camp{upcomingCamps.length !== 1 ? 's' : ''} Assigned
                </div>
              )}
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
        {/* Camp Assignments */}
        {camps.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">My Camp Assignments</h2>
            
            {/* Upcoming Camps */}
            {upcomingCamps.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  Upcoming Camps ({upcomingCamps.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingCamps.map((camp) => (
                    <div key={camp.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-800">{camp.location}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(camp.status)}`}>
                          {getStatusText(camp.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Date:</strong> {new Date(camp.camp_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Conducted by:</strong> {camp.conducted_by}
                      </p>
                      {camp.phone_number && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Contact:</strong> {camp.phone_number}
                        </p>
                      )}
                      
                      {/* Status Update Dropdown */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Update Status:
                        </label>
                        <select
                          value={camp.status}
                          onChange={(e) => updateCampStatus(camp.id, e.target.value)}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="planned">Planned</option>
                          <option value="ongoing">Ongoing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      
                      {camp.location_link && (
                        <div className="mt-3">
                          {/* Map Preview */}
                          <div className="mb-2">
                            <div className="w-full h-24 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                              {camp.location_link ? (
                                <iframe
                                  src={getEmbedUrl(camp.location_link, camp.location)}
                                  width="100%"
                                  height="100%"
                                  style={{ border: 0 }}
                                  allowFullScreen
                                  loading="lazy"
                                  referrerPolicy="no-referrer-when-downgrade"
                                  title={`Map of ${camp.location}`}
                                ></iframe>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                  🗺️ Map Preview
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => openMapLocation(camp.location_link)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                          >
                            🗺️ View Full Map
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Camps */}
            {completedCamps.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Completed Camps ({completedCamps.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedCamps.map((camp) => (
                    <div key={camp.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-800">{camp.location}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(camp.status)}`}>
                          {getStatusText(camp.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Date:</strong> {new Date(camp.camp_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Conducted by:</strong> {camp.conducted_by}
                      </p>
                      {camp.location_link && (
                        <div className="mt-3">
                          {/* Map Preview */}
                          <div className="mb-2">
                            <div className="w-full h-24 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                              {camp.location_link ? (
                                <iframe
                                  src={getEmbedUrl(camp.location_link, camp.location)}
                                  width="100%"
                                  height="100%"
                                  style={{ border: 0 }}
                                  allowFullScreen
                                  loading="lazy"
                                  referrerPolicy="no-referrer-when-downgrade"
                                  title={`Map of ${camp.location}`}
                                ></iframe>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                  🗺️ Map Preview
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => openMapLocation(camp.location_link)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                          >
                            🗺️ View Full Map
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancelled Camps */}
            {cancelledCamps.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  Cancelled Camps ({cancelledCamps.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cancelledCamps.map((camp) => (
                    <div key={camp.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 opacity-75">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-800">{camp.location}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(camp.status)}`}>
                          {getStatusText(camp.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Date:</strong> {new Date(camp.camp_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Conducted by:</strong> {camp.conducted_by}
                      </p>
                      {camp.location_link && (
                        <div className="mt-3">
                          {/* Map Preview */}
                          <div className="mb-2">
                            <div className="w-full h-24 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                              {camp.location_link ? (
                                <iframe
                                  src={getEmbedUrl(camp.location_link, camp.location)}
                                  width="100%"
                                  height="100%"
                                  style={{ border: 0 }}
                                  allowFullScreen
                                  loading="lazy"
                                  referrerPolicy="no-referrer-when-downgrade"
                                  title={`Map of ${camp.location}`}
                                ></iframe>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                  🗺️ Map Preview
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => openMapLocation(camp.location_link)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                          >
                            🗺️ View Full Map
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">My Camp Assignments</h2>
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">🏕️</div>
              <p className="text-gray-500">No camp assignments yet. You'll be notified when camps are assigned to you.</p>
            </div>
          </div>
        )}

        {/* Customer Management */}
        <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">My Customers</h2>
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

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-4">
              {success}
            </div>
          )}

          {getFilteredCustomers().length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'No customers found matching your search.' : 'You haven\'t added any customers yet. Click "Add Customer" to get started.'}
              </p>
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full divide-y divide-gray-200">
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
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Card Actions
                    </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claims Actions
                </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredCustomers().map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(customer)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {customer.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.phone_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.type_of_work}
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

        {/* Pending Payments and Claims Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pending Payments Box */}
          <div 
            onClick={handlePendingPaymentsClick}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-orange-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Pending Payments</h3>
                <p className="text-sm text-gray-600 mt-1">Customers with outstanding payments</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-600">{pendingPaymentsCount}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
            </div>
          </div>

          {/* Pending Claims Box */}
          <div 
            onClick={handlePendingClaimsClick}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-red-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Pending Claims</h3>
                <p className="text-sm text-gray-600 mt-1">Claims with outstanding payments</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-600">{pendingClaimsCount}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Card Form Modal */}
      {showCardForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
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
              customerId={selectedCustomerId!}
              customerName={selectedCustomerName}
              onSuccess={() => {
                closeCardForm()
                setSuccess('Card added successfully!')
                setTimeout(() => setSuccess(''), 3000)
                fetchCustomerCards() // Refresh cards
              }}
              onError={(error) => setError(error)}
            />
          </div>
        </div>
      )}

      {/* View Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Card Details for {selectedCustomerName}
              </h3>
              <button
                onClick={closeCardModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <CardDetails 
              card={selectedCard}
              onRefresh={() => handleViewCard(selectedCustomerId!)}
            />
          </div>
        </div>
      )}

      {/* Claims Modal */}
      {showClaimsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {isAddingClaim ? `Add Claim for ${selectedCustomerName}` : `Claims for ${selectedCustomerName}`}
              </h3>
              <button
                onClick={closeClaimsModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {isAddingClaim ? (
              /* Add Claim Content */
              <ClaimForm 
                cardId={selectedCard?.id}
                customerName={selectedCustomerName}
                onSuccess={() => {
                  closeClaimsModal()
                  setSuccess('Claim added successfully!')
                  setTimeout(() => setSuccess(''), 3000)
                }}
                onError={(error) => setError(error)}
              />
            ) : (
              /* View Claims Content */
              <div className="space-y-8">
                {/* Card Details Section */}
                {selectedCard && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Card Details</h4>
                    <div className="flex justify-center">
                      <UserCard
                        cardNumber={selectedCard.card_number}
                        registerNumber={selectedCard.register_number}
                        cardHolderName={selectedCard.card_holder_name}
                        agentName={selectedCard.agent_name}
                        agentMobile={selectedCard.agent_mobile}
                        createdDate={new Date(selectedCard.created_at).toLocaleDateString()}
                      />
                    </div>
                  </div>
                )}
                
                {/* Claims Table Section */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Claims</h4>
                  <ClaimsTable 
                    claims={claims}
                    cardId={selectedCard?.id}
                    onRefresh={() => handleViewClaims(selectedCustomerId!)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditCustomerModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Customer
              </h3>
              <button
                onClick={closeEditCustomerModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <EditCustomerForm 
              customer={editingCustomer}
              onSubmit={updateCustomer}
              onCancel={closeEditCustomerModal}
              onDelete={() => {
                closeEditCustomerModal()
                handleDeleteCustomer(editingCustomer)
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Customer
              </h3>
              <button
                onClick={closeDeleteConfirmModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <strong>{editingCustomer.name}</strong>?
              </p>
              <p className="text-sm text-red-600">
                This action cannot be undone. All associated cards and claims will also be deleted.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteConfirmModal}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={deleteCustomer}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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

// Pending Payments Table Component
function PendingPaymentsTable({ 
  customers, 
  customerCards, 
  onEditCustomer, 
  onAddCard, 
  onViewCard, 
  onAddClaim, 
  onViewClaims 
}: { 
  customers: any[]
  customerCards: {[key: number]: any}
  onEditCustomer: (customer: any) => void
  onAddCard: (customerId: number) => void
  onViewCard: (customerId: number) => void
  onAddClaim: (customerId: number) => void
  onViewClaims: (customerId: number) => void
}) {
  const calculatePendingAmount = (discussedAmount: number, paidAmount: number) => {
    return Math.max(0, discussedAmount - paidAmount)
  }

  const pendingPayments = customers.filter(customer => 
    calculatePendingAmount(parseFloat(customer.discussed_amount), parseFloat(customer.paid_amount)) > 0
  )

  if (pendingPayments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No pending payments found.</p>
      </div>
    )
  }

  return (
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
              Mode of Payment
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Card Actions
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Claims Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pendingPayments.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onEditCustomer(customer)}>
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
                ₹{customer.discussed_amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ₹{customer.paid_amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">
                ₹{calculatePendingAmount(parseFloat(customer.discussed_amount), parseFloat(customer.paid_amount))}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {customer.mode_of_payment}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(customer.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex flex-wrap gap-1">
                  {customerCards[customer.id] ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewCard(customer.id); }}
                      className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                    >
                      View Card
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddCard(customer.id); }}
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
                        onClick={(e) => { e.stopPropagation(); onAddClaim(customer.id); }}
                        className="text-green-600 hover:text-green-900 text-xs font-medium"
                      >
                        Add Claim
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onViewClaims(customer.id); }}
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
  )
}

// Pending Claims Table Component
function PendingClaimsTable({ 
  customers,
  customerCards, 
  onEditCustomer, 
  onAddCard, 
  onViewCard, 
  onAddClaim, 
  onViewClaims 
}: { 
  customers: any[]
  customerCards: {[key: number]: any}
  onEditCustomer: (customer: any) => void
  onAddCard: (customerId: number) => void
  onViewCard: (customerId: number) => void
  onAddClaim: (customerId: number) => void
  onViewClaims: (customerId: number) => void
}) {
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

  if (pendingClaims.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No pending claims found.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Card Number
            </th>
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
              Card Actions
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Claims Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pendingClaims.map((claim) => (
            <tr key={claim.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {claim.customer_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {claim.card_number}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {claim.type_of_claim}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {claim.process_state}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ₹{claim.discussed_amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ₹{claim.paid_amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                ₹{claim.pending_amount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(claim.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onViewCard(claim.customer_id); }}
                    className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                  >
                    View Card
                  </button>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onAddClaim(claim.customer_id); }}
                    className="text-green-600 hover:text-green-900 text-xs font-medium"
                  >
                    Add Claim
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onViewClaims(claim.customer_id); }}
                    className="text-purple-600 hover:text-purple-900 text-xs font-medium"
                  >
                    View Claims
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

// Card Form Component (One per customer)
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
            type="tel"
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
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
  onRefresh: () => void
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
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(claim)}
                    className="text-blue-600 hover:text-blue-900 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(claim.id)}
                    className="text-red-600 hover:text-red-900 text-xs"
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
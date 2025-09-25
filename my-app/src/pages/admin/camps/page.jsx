import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API_BASE_URL from '../../../config/api.js'

export default function CampManagement() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [camps, setCamps] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedCamp, setSelectedCamp] = useState(null)
  const [showCampDetails, setShowCampDetails] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCamp, setEditingCamp] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const navigate = useNavigate()

  // Add Camp Form State
  const [newCamp, setNewCamp] = useState({
    camp_date: '',
    location: '',
    location_link: '',
    phone_number: '',
    status: 'planned',
    conducted_by: '',
    assigned_to: ''
  })

  // Edit Camp Form State
  const [editCamp, setEditCamp] = useState({
    camp_date: '',
    location: '',
    location_link: '',
    phone_number: '',
    status: 'planned',
    conducted_by: '',
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
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const data = await response.json()
        
        if (data.user && data.user.role === 'admin') {
          setUser(data.user)
          await Promise.all([fetchCamps(), fetchEmployees()])
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

  const fetchCamps = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/camps`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.camps) {
        setCamps(data.camps)
      }
    } catch (error) {
      console.error('Error fetching camps:', error)
      setError('Failed to fetch camps')
      setTimeout(() => setError(''), 3000)
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

  const handleViewCamp = (camp) => {
    setSelectedCamp(camp)
    setShowCampDetails(true)
  }

  const handleEditCamp = (camp) => {
    setEditingCamp(camp)
    setEditCamp({
      camp_date: camp.camp_date,
      location: camp.location,
      location_link: camp.location_link || '',
      phone_number: camp.phone_number || '',
      status: camp.status,
      conducted_by: camp.conducted_by || '',
      assigned_to: camp.assigned_to || ''
    })
    setShowEditModal(true)
  }

  const handleDeleteCamp = async (campId) => {
    if (!confirm('Are you sure you want to delete this camp?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/camps/${campId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess('Camp deleted successfully')
        fetchCamps()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to delete camp')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      console.error('Error deleting camp:', error)
      setError('Failed to delete camp')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleAddCamp = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('${API_BASE_URL}/api/camps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCamp)
      })

      if (response.ok) {
        setSuccess('Camp added successfully')
        setShowAddModal(false)
        setNewCamp({
          camp_date: '',
          location: '',
          location_link: '',
          phone_number: '',
          status: 'planned',
          conducted_by: '',
          assigned_to: ''
        })
        fetchCamps()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to add camp')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      console.error('Error adding camp:', error)
      setError('Failed to add camp')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleUpdateCamp = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/camps/${editingCamp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editCamp)
      })

      if (response.ok) {
        setSuccess('Camp updated successfully')
        setShowEditModal(false)
        setEditingCamp(null)
        fetchCamps()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to update camp')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      console.error('Error updating camp:', error)
      setError('Failed to update camp')
      setTimeout(() => setError(''), 3000)
    }
  }

  const getFilteredCamps = () => {
    if (filterStatus === 'all') return camps
    return camps.filter(camp => camp.status === filterStatus)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800'
      case 'ongoing': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
            <div className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg border-r-2 border-red-700 ${isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-700'}`}>
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              All Camps
            </div>
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
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Camp Management</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Manage all camps in the system</p>
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
                      Add Camp
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

            {/* Filter Tabs */}
            <div className="mb-6">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-4`}>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterStatus === 'all'
                        ? 'bg-blue-600 text-white'
                        : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    All ({camps.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('planned')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterStatus === 'planned'
                        ? 'bg-blue-600 text-white'
                        : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Planned ({camps.filter(c => c.status === 'planned').length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('ongoing')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterStatus === 'ongoing'
                        ? 'bg-blue-600 text-white'
                        : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Ongoing ({camps.filter(c => c.status === 'ongoing').length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('completed')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterStatus === 'completed'
                        ? 'bg-blue-600 text-white'
                        : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Completed ({camps.filter(c => c.status === 'completed').length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('cancelled')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterStatus === 'cancelled'
                        ? 'bg-blue-600 text-white'
                        : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Cancelled ({camps.filter(c => c.status === 'cancelled').length})
                  </button>
                </div>
              </div>
            </div>

            {/* Camps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredCamps().map((camp) => (
                <div key={camp.id} className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} hover:shadow-xl transition-all duration-300 overflow-hidden`}>
                  {/* Map Section */}
                  <div className="relative">
                    <div className="w-full h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(camp.location)}&z=15&output=embed`}
                        title="Google Map Preview"
                      />
                    </div>
                  </div>
                  
                  {/* Details Section */}
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
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(camp.status)}`}>
                        {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      {camp.conducted_by && (
                        <div>
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide`}>
                            Conducted by
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {camp.conducted_by}
                          </p>
                        </div>
                      )}
                      
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

                      {camp.assigned_to && (
                        <div>
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide`}>
                            Assigned to
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {employees.find(emp => emp.id === parseInt(camp.assigned_to))?.name || 'Unknown'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={() => handleViewCamp(camp)}
                        className="flex-1 px-3 py-2 text-xs font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditCamp(camp)}
                        className="flex-1 px-3 py-2 text-xs font-medium bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCamp(camp.id)}
                        className="flex-1 px-3 py-2 text-xs font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {getFilteredCamps().length === 0 && (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-12 text-center`}>
                <div className="text-6xl mb-4">🏕️</div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
                  No camps found
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {filterStatus === 'all' 
                    ? 'No camps have been created yet.' 
                    : `No camps with status "${filterStatus}" found.`
                  }
                </p>
              </div>
            )}

            {/* Add Camp Modal */}
            {showAddModal && (
              <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={() => setShowAddModal(false)}>
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ml-32`} onClick={(e) => e.stopPropagation()}>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Add New Camp
                  </h3>
                  <form onSubmit={handleAddCamp} className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Camp Date
                      </label>
                      <input
                        type="date"
                        value={newCamp.camp_date}
                        onChange={(e) => setNewCamp({...newCamp, camp_date: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Location
                      </label>
                      <input
                        type="text"
                        value={newCamp.location}
                        onChange={(e) => setNewCamp({...newCamp, location: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Location Link (Optional)
                      </label>
                      <input
                        type="url"
                        value={newCamp.location_link}
                        onChange={(e) => setNewCamp({...newCamp, location_link: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newCamp.phone_number}
                        onChange={(e) => setNewCamp({...newCamp, phone_number: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Status
                      </label>
                      <select
                        value={newCamp.status}
                        onChange={(e) => setNewCamp({...newCamp, status: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="planned">Planned</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Conducted By
                      </label>
                      <input
                        type="text"
                        value={newCamp.conducted_by}
                        onChange={(e) => setNewCamp({...newCamp, conducted_by: e.target.value})}
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
                        value={newCamp.assigned_to}
                        onChange={(e) => setNewCamp({...newCamp, assigned_to: e.target.value})}
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
                        Add Camp
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Camp Modal */}
            {showEditModal && editingCamp && (
              <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={() => setShowAddModal(false)}>
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ml-32`} onClick={(e) => e.stopPropagation()}>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Edit Camp
                  </h3>
                  <form onSubmit={handleUpdateCamp} className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Camp Date
                      </label>
                      <input
                        type="date"
                        value={editCamp.camp_date}
                        onChange={(e) => setEditCamp({...editCamp, camp_date: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Location
                      </label>
                      <input
                        type="text"
                        value={editCamp.location}
                        onChange={(e) => setEditCamp({...editCamp, location: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Location Link
                      </label>
                      <input
                        type="url"
                        value={editCamp.location_link}
                        onChange={(e) => setEditCamp({...editCamp, location_link: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editCamp.phone_number}
                        onChange={(e) => setEditCamp({...editCamp, phone_number: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Status
                      </label>
                      <select
                        value={editCamp.status}
                        onChange={(e) => setEditCamp({...editCamp, status: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="planned">Planned</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Conducted By
                      </label>
                      <input
                        type="text"
                        value={editCamp.conducted_by}
                        onChange={(e) => setEditCamp({...editCamp, conducted_by: e.target.value})}
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
                        value={editCamp.assigned_to}
                        onChange={(e) => setEditCamp({...editCamp, assigned_to: e.target.value})}
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
                        Update Camp
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Camp Details Modal */}
            {showCampDetails && selectedCamp && (
              <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" style={{backgroundColor: 'rgba(0, 0, 0, 0.1)'}} onClick={() => setShowAddModal(false)}>
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Camp Details - {selectedCamp.location}
                    </h3>
                    <button
                      onClick={() => setShowCampDetails(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Camp Information</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium">Location:</span> {selectedCamp.location}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(selectedCamp.camp_date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Status:</span> 
                          <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCamp.status)}`}>
                            {selectedCamp.status.charAt(0).toUpperCase() + selectedCamp.status.slice(1)}
                          </span>
                        </div>
                        {selectedCamp.conducted_by && (
                          <div>
                            <span className="font-medium">Conducted by:</span> {selectedCamp.conducted_by}
                          </div>
                        )}
                        {selectedCamp.phone_number && (
                          <div>
                            <span className="font-medium">Contact:</span> {selectedCamp.phone_number}
                          </div>
                        )}
                        {selectedCamp.assigned_to && (
                          <div>
                            <span className="font-medium">Assigned to:</span> {employees.find(emp => emp.id === parseInt(selectedCamp.assigned_to))?.name || 'Unknown'}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Location Map</h4>
                      <div className="w-full h-64 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        <iframe
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedCamp.location)}&z=15&output=embed`}
                          title="Google Map Preview"
                        />
                      </div>
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

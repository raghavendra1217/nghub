'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CampsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [camps, setCamps] = useState<any[]>([])
  const [upcomingCamps, setUpcomingCamps] = useState<any[]>([])
  const [ongoingCamps, setOngoingCamps] = useState<any[]>([])
  const [completedCamps, setCompletedCamps] = useState<any[]>([])
  const [cancelledCamps, setCancelledCamps] = useState<any[]>([])
  const [error, setError] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

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
        
        const upcoming = allCamps.filter((camp: any) => camp.status === 'planned')
        const ongoing = allCamps.filter((camp: any) => camp.status === 'ongoing')
        const completed = allCamps.filter((camp: any) => camp.status === 'completed')
        const cancelled = allCamps.filter((camp: any) => camp.status === 'cancelled')
        
        setUpcomingCamps(upcoming)
        setOngoingCamps(ongoing)
        setCompletedCamps(completed)
        setCancelledCamps(cancelled)
        console.log('Camps data loaded:', { upcoming: upcoming.length, ongoing: ongoing.length, completed: completed.length, cancelled: cancelled.length })
      } else {
        setError(data.error || 'Failed to fetch camps')
      }
    } catch (error) {
      setError('Failed to fetch camps')
    }
  }

  // Authentication and initialization
  useEffect(() => {
    console.log('Camps page loaded - 4 sections version');
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/pages/cred')
      return
    }

    const fetchUser = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        
        if (response.ok && data.user && data.user.role === 'employee') {
          setUser(data.user)
          fetchCamps()
        } else {
          router.push('/pages/admin')
        }
      } catch (error) {
        router.push('/pages/cred')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

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
              onClick={() => router.push('/pages/employee')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700'}`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => router.push('/pages/employee/customers')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700'}`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              All Customers
            </button>
            <div className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg border-r-2 border-blue-700 ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              All Camps
            </div>
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
                router.push('/pages/cred')
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
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>All Camps</h1>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>View all your camp assignments</p>
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

              {/* Camp Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Upcoming Camps */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 border-l-4 border-blue-500`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Upcoming</p>
                      <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{upcomingCamps.length}</p>
                    </div>
                  </div>
                </div>

                {/* Ongoing Camps */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 border-l-4 border-green-500`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ongoing</p>
                      <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{ongoingCamps.length}</p>
                    </div>
                  </div>
                </div>

                {/* Completed Camps */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 border-l-4 border-gray-500`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Completed</p>
                      <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{completedCamps.length}</p>
                    </div>
                  </div>
                </div>

                {/* Cancelled Camps */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 border-l-4 border-red-500`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cancelled</p>
                      <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{cancelledCamps.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Camp Sections */}
              <div className="space-y-8">
                {/* Upcoming Camps */}
                {upcomingCamps.length > 0 && (
                  <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6 flex items-center`}>
                      <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                      Upcoming Camps ({upcomingCamps.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {upcomingCamps.map((camp) => (
                        <div key={camp.id} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl shadow-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden max-w-sm mx-auto`}>
                          {/* Map Section - Top */}
                          <div className="relative">
                            <div className="w-full h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                              <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://maps.google.com/maps?q=${12.888964},${77.610307}&z=15&output=embed`}
                                title="Google Map Preview"
                              />
                            </div>
                          </div>

                          {/* Content Section - Bottom */}
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
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Upcoming
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
                  </div>
                )}

                {/* Ongoing Camps */}
                {ongoingCamps.length > 0 && (
                  <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6 flex items-center`}>
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                      Ongoing Camps ({ongoingCamps.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {ongoingCamps.map((camp) => (
                        <div key={camp.id} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl shadow-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden max-w-sm mx-auto`}>
                          {/* Map Section - Top */}
                          <div className="relative">
                            <div className="w-full h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                              <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://maps.google.com/maps?q=${12.888964},${77.610307}&z=15&output=embed`}
                                title="Google Map Preview"
                              />
                            </div>
                          </div>

                          {/* Content Section - Bottom */}
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
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Ongoing
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
                  </div>
                )}

                {/* Completed Camps */}
                {completedCamps.length > 0 && (
                  <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6 flex items-center`}>
                      <span className="w-3 h-3 bg-gray-500 rounded-full mr-3"></span>
                      Completed Camps ({completedCamps.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {completedCamps.map((camp) => (
                        <div key={camp.id} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl shadow-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} hover:shadow-xl transition-all duration-300 overflow-hidden max-w-sm mx-auto`}>
                          {/* Map Section - Top */}
                          <div className="relative">
                            <div className="w-full h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                              <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://maps.google.com/maps?q=${12.888964},${77.610307}&z=15&output=embed`}
                                title="Google Map Preview"
                              />
                            </div>
                          </div>

                          {/* Content Section - Bottom */}
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
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Completed
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
                  </div>
                )}

                {/* Cancelled Camps */}
                {cancelledCamps.length > 0 && (
                  <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6 flex items-center`}>
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-3"></span>
                      Cancelled Camps ({cancelledCamps.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {cancelledCamps.map((camp) => (
                        <div key={camp.id} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl shadow-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} opacity-75 hover:opacity-90 transition-all duration-300 overflow-hidden max-w-sm mx-auto`}>
                          {/* Map Section - Top */}
                          <div className="relative">
                            <div className="w-full h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                              <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://maps.google.com/maps?q=${12.888964},${77.610307}&z=15&output=embed`}
                                title="Google Map Preview"
                              />
                            </div>
                          </div>

                          {/* Content Section - Bottom */}
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
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Cancelled
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
                  </div>
                )}

                {/* No Camps Message */}
                {camps.length === 0 && (
                  <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6`}>
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">🏕️</div>
                      <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No Camp Assignments</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        You don't have any camp assignments yet. Check back later for updates.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      </div>
    </div>
  )
}
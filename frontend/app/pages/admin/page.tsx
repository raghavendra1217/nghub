'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminNavbar from '../../components/AdminNavbar'

export default function Admin() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter()

  // Dashboard Data States
  const [systemStats, setSystemStats] = useState({
    totalEmployees: 0,
    totalCustomers: 0,
    totalCamps: 0,
    totalCards: 0,
    totalClaims: 0
  })

  const [financialStats, setFinancialStats] = useState({
    totalDiscussedAmount: 0,
    totalPendingAmount: 0,
    totalPaidAmount: 0,
    discussedCount: 0,
    pendingCount: 0,
    paidCount: 0
  })

  const [campStats, setCampStats] = useState({
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0
  })

  const [claimTypeStats, setClaimTypeStats] = useState<{[key: string]: number}>({})
  const [topEmployees, setTopEmployees] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const authenticateUser = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      try {
        const response = await fetch('http://localhost:5000/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const data = await response.json()
        
        if (data.user && data.user.role === 'admin') {
          setUser(data.user)
          await fetchDashboardData()
        } else {
          router.push('/')
        }
      } catch (error) {
        console.error('Authentication error:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    authenticateUser()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }

      console.log('🔄 Fetching dashboard data...')

      // First check if backend is running
      try {
        const healthResponse = await fetch('http://localhost:5000/api/health')
        if (!healthResponse.ok) {
          throw new Error('Backend server is not responding')
        }
        console.log('✅ Backend server is running')
      } catch (error) {
        console.error('❌ Backend connection failed:', error)
        throw new Error('Cannot connect to backend server. Please make sure the backend is running on port 5000.')
      }

      // Fetch all data in parallel
      const [
        employeesRes,
        customersRes,
        campsRes,
        cardsRes,
        claimsRes
      ] = await Promise.all([
        fetch('http://localhost:5000/api/employees', { headers }),
        fetch('http://localhost:5000/api/customers', { headers }),
        fetch('http://localhost:5000/api/camps', { headers }),
        fetch('http://localhost:5000/api/cards', { headers }).catch(() => ({ json: () => ({ cards: [] }) })),
        fetch('http://localhost:5000/api/claims', { headers }).catch(() => ({ json: () => ({ claims: [] }) }))
      ])

      // Check if any requests failed
      if (!employeesRes.ok) {
        console.error('❌ Failed to fetch employees:', employeesRes.status, employeesRes.statusText)
        throw new Error(`Failed to fetch employees: ${employeesRes.statusText}`)
      }
      if (!customersRes.ok) {
        console.error('❌ Failed to fetch customers:', customersRes.status, customersRes.statusText)
        throw new Error(`Failed to fetch customers: ${customersRes.statusText}`)
      }
      if (!campsRes.ok) {
        console.error('❌ Failed to fetch camps:', campsRes.status, campsRes.statusText)
        throw new Error(`Failed to fetch camps: ${campsRes.statusText}`)
      }

      const [employeesData, customersData, campsData, cardsData, claimsData] = await Promise.all([
        employeesRes.json(),
        customersRes.json(),
        campsRes.json(),
        cardsRes.json(),
        claimsRes.json()
      ])

      console.log('📊 Dashboard data received:', {
        employees: employeesData.employees?.length || 0,
        customers: customersData.customers?.length || 0,
        camps: campsData.camps?.length || 0,
        cards: cardsData.cards?.length || 0,
        claims: claimsData.claims?.length || 0
      })

      // Process employees data
      const employees = employeesData.employees || []
      const customers = customersData.customers || []
      const camps = campsData.camps || []
      const cards = cardsData.cards || []
      const claims = claimsData.claims || []

      // Calculate system stats
      setSystemStats({
        totalEmployees: employees.length,
        totalCustomers: customers.length,
        totalCamps: camps.length,
        totalCards: cards.length,
        totalClaims: claims.length
      })

      // Calculate financial stats
      const financialData = customers.reduce((acc: any, customer: any) => {
        if (customer.discussed_amount) {
          acc.totalDiscussedAmount += parseFloat(customer.discussed_amount) || 0
          acc.discussedCount++
        }
        if (customer.pending_amount) {
          acc.totalPendingAmount += parseFloat(customer.pending_amount) || 0
          acc.pendingCount++
        }
        if (customer.paid_amount) {
          acc.totalPaidAmount += parseFloat(customer.paid_amount) || 0
          acc.paidCount++
        }
        return acc
      }, { totalDiscussedAmount: 0, totalPendingAmount: 0, totalPaidAmount: 0, discussedCount: 0, pendingCount: 0, paidCount: 0 })

      setFinancialStats(financialData)

      // Calculate camp stats
      const campData = camps.reduce((acc: any, camp: any) => {
        acc[camp.status] = (acc[camp.status] || 0) + 1
        return acc
      }, { upcoming: 0, ongoing: 0, completed: 0, cancelled: 0 })

      setCampStats(campData)

      // Calculate claim type stats
      const claimData = claims.reduce((acc: any, claim: any) => {
        acc[claim.type_of_claim] = (acc[claim.type_of_claim] || 0) + 1
        return acc
      }, {})

      setClaimTypeStats(claimData)

      // Calculate top employees by customer count
      const employeeStats = employees.map((emp: any) => ({
        ...emp,
        customerCount: customers.filter((c: any) => c.created_by === emp.id).length,
        totalRevenue: customers
          .filter((c: any) => c.created_by === emp.id)
          .reduce((sum: number, c: any) => sum + (parseFloat(c.discussed_amount) || 0), 0)
      }))

      setTopEmployees(employeeStats.sort((a: any, b: any) => b.customerCount - a.customerCount).slice(0, 5))

      // Generate recent activity
      const activities = [
        ...customers.slice(0, 3).map((c: any) => ({
          type: 'customer',
          message: `New customer "${c.customer_name}" added`,
          time: new Date(c.created_at).toLocaleDateString(),
          icon: '👤'
        })),
        ...camps.slice(0, 3).map((c: any) => ({
          type: 'camp',
          message: `Camp "${c.location}" scheduled`,
          time: new Date(c.camp_date).toLocaleDateString(),
          icon: '🏕️'
        })),
        ...employees.slice(0, 2).map((e: any) => ({
          type: 'employee',
          message: `Employee "${e.name}" joined`,
          time: new Date(e.created_at).toLocaleDateString(),
          icon: '👥'
        }))
      ]

      setRecentActivity(activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8))

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
      setErrorMessage(error.message || 'Failed to fetch dashboard data')
      
      // Set default values when there's an error
      setSystemStats({
        totalEmployees: 0,
        totalCustomers: 0,
        totalCamps: 0,
        totalCards: 0,
        totalClaims: 0
      })
      
      setFinancialStats({
        totalDiscussedAmount: 0,
        totalPendingAmount: 0,
        totalPaidAmount: 0,
        discussedCount: 0,
        pendingCount: 0,
        paidCount: 0
      })
      
      setCampStats({
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        cancelled: 0
      })
      
      setClaimTypeStats({})
      setTopEmployees([])
      setRecentActivity([])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="flex">
        {/* Admin Navbar */}
        <AdminNavbar 
          user={user} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode}
          currentPage="dashboard"
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            
            {/* Dashboard Header */}
            <div className="mb-8">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 mb-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      Admin Dashboard
                    </h1>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                      Welcome back, {user.name}! Here's your system overview.
                    </p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => fetchDashboardData()}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isDarkMode 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      🔄 Refresh Data
                    </button>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {systemStats.totalEmployees}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Total Employees
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                        {systemStats.totalCustomers}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Total Customers
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                        {systemStats.totalCamps}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Total Camps
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* No Data Message */}
            {systemStats.totalEmployees === 0 && systemStats.totalCustomers === 0 && systemStats.totalCamps === 0 && (
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 mb-8`}>
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
                    No Data Available
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                    It looks like your system is empty. Start by adding some data to see your dashboard come to life!
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => router.push('/pages/admin/add-employee')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Add Employee
                    </button>
                    <button
                      onClick={() => router.push('/pages/admin/add-camp')}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Add Camp
                    </button>
                    <button
                      onClick={() => router.push('/pages/admin/customers')}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      Add Customer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>Error:</strong> {errorMessage}
                    </div>
                    <button 
                      onClick={() => setErrorMessage('')}
                      className="text-red-500 hover:text-red-700 ml-4"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-2 text-sm">
                    <p>Possible solutions:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>Make sure the backend server is running on port 5000</li>
                      <li>Check your internet connection</li>
                      <li>Verify your authentication token is valid</li>
                      <li>Try refreshing the page</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Overview */}
            <div className="mb-8">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6`}>
                Financial Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Discussed Amount */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 border-l-4 border-blue-500`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          Total Discussed
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Across all customers
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        ₹{financialStats.totalDiscussedAmount.toLocaleString()}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {financialStats.discussedCount} customers
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Pending Amount */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 border-l-4 border-orange-500`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          Pending Amount
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Outstanding payments
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">
                        ₹{financialStats.totalPendingAmount.toLocaleString()}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {financialStats.pendingCount} customers
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Paid Amount */}
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 border-l-4 border-green-500`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          Paid Amount
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Completed payments
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ₹{financialStats.totalPaidAmount.toLocaleString()}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {financialStats.paidCount} customers
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Statistics & Employee Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              {/* System Statistics */}
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6`}>
                  System Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{systemStats.totalEmployees}</div>
                    <div className="text-sm text-blue-600">Employees</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{systemStats.totalCustomers}</div>
                    <div className="text-sm text-green-600">Customers</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{systemStats.totalCamps}</div>
                    <div className="text-sm text-purple-600">Camps</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{systemStats.totalCards}</div>
                    <div className="text-sm text-orange-600">Cards</div>
                  </div>
                </div>
              </div>

              {/* Top Employees */}
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6`}>
                  Top Performers
                </h3>
                <div className="space-y-4">
                  {topEmployees.map((employee, index) => (
                    <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <div className="font-semibold text-gray-800">{employee.name}</div>
                          <div className="text-sm text-gray-600">{employee.customerCount} customers</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">₹{employee.totalRevenue.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Camp Management & Claim Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              {/* Camp Status Distribution */}
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6`}>
                  Camp Status Distribution
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{campStats.upcoming}</div>
                    <div className="text-sm text-blue-600">Upcoming</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{campStats.ongoing}</div>
                    <div className="text-sm text-green-600">Ongoing</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{campStats.completed}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{campStats.cancelled}</div>
                    <div className="text-sm text-red-600">Cancelled</div>
                  </div>
                </div>
              </div>

              {/* Claim Type Distribution */}
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6`}>
                  Claim Types
                </h3>
                <div className="space-y-3">
                  {Object.entries(claimTypeStats).map(([claimType, count], index) => {
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500']
                    const color = colors[index % colors.length]
                    return (
                      <div key={claimType} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 ${color} rounded-full mr-3`}></div>
                          <span className="text-gray-700">{claimType}</span>
                        </div>
                        <span className="font-semibold text-gray-800">{count}</span>
                      </div>
                    )
                  })}
                  {Object.keys(claimTypeStats).length === 0 && (
                    <div className="text-center text-gray-500 py-4">No claims data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 mb-8`}>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6`}>
                Recent Activity
              </h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mr-4">{activity.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{activity.message}</div>
                      <div className="text-sm text-gray-600">{activity.time}</div>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className="text-center text-gray-500 py-8">No recent activity</div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6`}>
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push('/pages/admin/add-employee')}
                  className={`p-6 rounded-lg border-2 border-dashed ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'} transition-colors text-center`}
                >
                  <div className="text-3xl mb-2">👥</div>
                  <div className="font-semibold">Add Employee</div>
                  <div className="text-sm text-gray-600 mt-1">Register new team member</div>
                </button>
                
                <button
                  onClick={() => router.push('/pages/admin/add-camp')}
                  className={`p-6 rounded-lg border-2 border-dashed ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'} transition-colors text-center`}
                >
                  <div className="text-3xl mb-2">🏕️</div>
                  <div className="font-semibold">Add Camp</div>
                  <div className="text-sm text-gray-600 mt-1">Schedule new camp</div>
                </button>
                
                <button
                  onClick={() => router.push('/pages/admin/customers')}
                  className={`p-6 rounded-lg border-2 border-dashed ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'} transition-colors text-center`}
                >
                  <div className="text-3xl mb-2">👤</div>
                  <div className="font-semibold">View All Customers</div>
                  <div className="text-sm text-gray-600 mt-1">Manage customer data</div>
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
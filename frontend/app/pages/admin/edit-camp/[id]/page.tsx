'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function EditCampPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<any[]>([])
  const [formData, setFormData] = useState({
    camp_date: '',
    location: '',
    location_link: '',
    phone_number: '',
    status: 'planned',
    conducted_by: '',
    assigned_to: [] as string[]
  })
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const params = useParams()

  // Get camp ID from URL params
  const campId = params?.id as string

  console.log('🔍 Edit Camp Page - Params:', params)
  console.log('🔍 Edit Camp Page - Camp ID:', campId)

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
          fetchEmployees()
          if (campId) {
            fetchCampData()
          }
        } else {
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
  }, [router, campId])

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        // Filter out admin users, only show employees
        const employeeOnly = (data.employees || []).filter((emp: any) => emp.role === 'employee')
        setEmployees(employeeOnly)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchCampData = async () => {
    if (!campId) {
      setError('Invalid camp ID')
      return
    }

    console.log('🔍 Fetching camp data for ID:', campId)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/camps/${campId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        const campData = data.camp
        console.log('🔍 Raw camp data:', campData)
        console.log('🔍 Raw camp_date:', campData.camp_date)
        console.log('🔍 Formatted camp_date:', campData.camp_date ? new Date(campData.camp_date).toISOString().split('T')[0] : '')
        
        setFormData({
          camp_date: campData.camp_date ? new Date(campData.camp_date).toISOString().split('T')[0] : '',
          location: campData.location,
          location_link: campData.location_link || '',
          phone_number: campData.phone_number || '',
          status: campData.status,
          conducted_by: campData.conducted_by,
          assigned_to: campData.assigned_to || []
        })
      } else {
        setError(data.error || 'Failed to fetch camp data')
      }
    } catch (error) {
      console.error('Error fetching camp data:', error)
      setError('Network error. Please try again.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleAddEmployee = () => {
    if (selectedEmployee && !formData.assigned_to.includes(selectedEmployee)) {
      setFormData(prev => ({
        ...prev,
        assigned_to: [...prev.assigned_to, selectedEmployee]
      }))
      setSelectedEmployee('')
    }
  }

  const handleRemoveEmployee = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_to: prev.assigned_to.filter(id => id !== employeeId)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/camps/${campId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Camp updated successfully!')
        router.push('/pages/admin/camps')
      } else {
        setError(data.error || 'Failed to update camp')
      }
    } catch (err) {
      console.error('Network error:', err)
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
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
                Edit Camp
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              <button
                onClick={() => router.push('/pages/admin/camps')}
                className="px-4 py-2 rounded-lg text-gray-700 font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Back to Camps
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('token')
                  localStorage.removeItem('user')
                  router.push('/')
                }}
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
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Camp Details</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="camp_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Camp Date *
                </label>
                <input
                  type="date"
                  id="camp_date"
                  name="camp_date"
                  value={formData.camp_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="planned">Planned</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter camp location"
              />
            </div>

            <div>
              <label htmlFor="location_link" className="block text-sm font-medium text-gray-700 mb-1">
                Location Link
              </label>
              <input
                type="url"
                id="location_link"
                name="location_link"
                value={formData.location_link}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter contact phone number"
              />
            </div>

            <div>
              <label htmlFor="conducted_by" className="block text-sm font-medium text-gray-700 mb-1">
                Conducted By *
              </label>
              <input
                type="text"
                id="conducted_by"
                name="conducted_by"
                value={formData.conducted_by}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter conductor name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Employees
              </label>
              
              {/* Search and Select */}
              <div className="flex gap-2 mb-3">
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select an employee...</option>
                  {employees
                    .filter(emp => !formData.assigned_to.includes(emp.id.toString()))
                    .map((employee) => (
                      <option key={employee.id} value={employee.id.toString()}>
                        {employee.name} ({employee.employee_id})
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddEmployee}
                  disabled={!selectedEmployee}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Selected Employees */}
              {formData.assigned_to.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Assigned Employees:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.assigned_to.map((employeeId) => {
                      const employee = employees.find(emp => emp.id.toString() === employeeId)
                      return (
                        <span
                          key={employeeId}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {employee?.name || 'Unknown'}
                          <button
                            type="button"
                            onClick={() => handleRemoveEmployee(employeeId)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {employees.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">No employees available</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium transition-colors"
              style={{ backgroundColor: '#fcb72d' }}
            >
              {submitting ? 'Updating Camp...' : 'Update Camp'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

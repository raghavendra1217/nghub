'use client'

import { useState } from 'react'

interface ClaimFormProps {
  cardId: number
  customerName: string
  onSuccess: () => void
  onError: (error: string) => void
}

export default function ClaimForm({ cardId, customerName, onSuccess, onError }: ClaimFormProps) {
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

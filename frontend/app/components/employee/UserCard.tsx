'use client'

import { useRef, useState } from 'react'

interface UserCardProps {
  cardNumber: string
  registerNumber: string
  cardHolderName: string
  agentName: string
  agentMobile: string
  createdDate: string
}

export default function UserCard({ 
  cardNumber, 
  registerNumber, 
  cardHolderName, 
  agentName, 
  agentMobile, 
  createdDate 
}: UserCardProps) {
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

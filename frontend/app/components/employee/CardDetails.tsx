'use client'

import UserCard from './UserCard'

interface CardDetailsProps {
  card: any
  onRefresh: () => void
}

export default function CardDetails({ card, onRefresh }: CardDetailsProps) {
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

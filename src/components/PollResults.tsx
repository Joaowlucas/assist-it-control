
import React from 'react'
import { Progress } from '@/components/ui/progress'

interface PollResultsProps {
  options: string[]
  votes: Record<string, string[]>
}

export function PollResults({ options, votes }: PollResultsProps) {
  const totalVotes = Object.values(votes).reduce((acc, voters) => 
    acc + (Array.isArray(voters) ? voters.length : 0), 0
  )

  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const optionVotes = votes[index.toString()] || []
        const voteCount = Array.isArray(optionVotes) ? optionVotes.length : 0
        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0

        return (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{option}</span>
              <span className="text-muted-foreground">
                {voteCount} voto{voteCount !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        )
      })}
      <p className="text-sm text-muted-foreground text-center">
        Total: {totalVotes} voto{totalVotes !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

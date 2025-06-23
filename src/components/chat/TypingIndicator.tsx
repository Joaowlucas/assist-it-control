
import { useUserPresence } from "@/hooks/useUserPresence"
import { useAuth } from "@/hooks/useAuth"

interface TypingIndicatorProps {
  conversationId: string
}

export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const { profile } = useAuth()
  const { getTypingUsers } = useUserPresence()
  
  const typingUsers = getTypingUsers(conversationId).filter(user => user.id !== profile?.id)

  if (typingUsers.length === 0) return null

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} está digitando...`
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} e ${typingUsers[1].name} estão digitando...`
    } else {
      return `${typingUsers.length} pessoas estão digitando...`
    }
  }

  return (
    <div className="px-4 py-2">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span>{getTypingText()}</span>
      </div>
    </div>
  )
}

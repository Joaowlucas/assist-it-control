
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/useAuth"
import { UserProfileSection } from "@/components/UserProfileSection"
import { User, LogOut, ChevronDown } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"

export function TechnicianProfileDropdown() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    setIsPopoverOpen(false)
    
    try {
      console.log('Technician logout initiated...')
      toast({
        title: "Fazendo logout...",
        description: "Aguarde um momento.",
      })
      
      await signOut()
    } catch (error) {
      console.error('Error during logout:', error)
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro, mas você será redirecionado.",
        variant: "destructive",
      })
      // Força redirect mesmo com erro
      setTimeout(() => {
        window.location.href = '/login'
      }, 1000)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarUrl = () => {
    if (!profile?.avatar_url) return undefined
    
    if (profile.avatar_url.startsWith('http')) {
      return profile.avatar_url
    }
    
    return `https://riqievnbraelqrzrovyr.supabase.co/storage/v1/object/public/profile-pictures/${profile.avatar_url}`
  }

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center gap-3 px-3 py-2 h-auto hover:bg-slate-200 transition-colors"
            disabled={isLoggingOut}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={getAvatarUrl()} alt={profile?.name || 'Técnico'} />
              <AvatarFallback className="bg-slate-600 text-white text-sm">
                {profile?.name ? getUserInitials(profile.name) : 'T'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-slate-700">
                {profile?.name || 'Técnico'}
              </span>
              <span className="text-xs text-slate-500">
                {profile?.unit?.name || 'Técnico'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="end">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-700 hover:bg-slate-100"
              onClick={() => {
                setIsProfileDialogOpen(true)
                setIsPopoverOpen(false)
              }}
              disabled={isLoggingOut}
            >
              <User className="mr-2 h-4 w-4" />
              Ver Perfil
            </Button>
            <div className="border-t border-slate-200 my-1" />
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? 'Saindo...' : 'Sair'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-slate-50 border-slate-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-700">Meu Perfil</DialogTitle>
            <DialogDescription className="text-slate-600">
              Visualize suas informações pessoais
            </DialogDescription>
          </DialogHeader>
          <UserProfileSection />
        </DialogContent>
      </Dialog>
    </>
  )
}


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload"
import { useAuth } from "@/hooks/useAuth"
import { User } from "lucide-react"

export function UserProfileSection() {
  const { profile } = useAuth()

  return (
    <Card className="bg-slate-100/50 border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-700 flex items-center gap-2">
          <User className="h-5 w-5" />
          Meu Perfil
        </CardTitle>
        <CardDescription className="text-slate-600">
          Gerencie suas informações pessoais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-slate-700 text-base font-medium">Foto de Perfil</Label>
          <div className="mt-2">
            <ProfilePictureUpload />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-slate-700">Nome</Label>
            <Input 
              value={profile?.name || ''}
              disabled
              className="bg-slate-100 border-slate-300"
            />
          </div>
          
          <div>
            <Label className="text-slate-700">Email</Label>
            <Input 
              value={profile?.email || ''}
              disabled
              className="bg-slate-100 border-slate-300"
            />
          </div>
          
          <div>
            <Label className="text-slate-700">Unidade</Label>
            <Input 
              value={profile?.unit?.name || 'Unidade não definida'}
              disabled
              className="bg-slate-100 border-slate-300"
            />
          </div>
          
          <div>
            <Label className="text-slate-700">Status</Label>
            <Input 
              value={profile?.status || ''}
              disabled
              className="bg-slate-100 border-slate-300"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

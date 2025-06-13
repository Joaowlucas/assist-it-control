
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { Upload, X } from "lucide-react"

export function ProfilePictureUpload() {
  const { user, profile, updateProfile } = useAuth()
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}.${fileExt}`

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('profile-pictures')
            .remove([`${user?.id}/${oldPath}`])
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(`${user?.id}/${fileName}`, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(`${user?.id}/${fileName}`)

      // Update profile
      await updateProfile({ avatar_url: data.publicUrl })

      toast({
        title: 'Foto atualizada!',
        description: 'Sua foto de perfil foi atualizada com sucesso.',
      })
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast({
        title: 'Erro no upload',
        description: error.message || 'Erro ao fazer upload da foto.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    try {
      setUploading(true)

      if (profile?.avatar_url) {
        const path = profile.avatar_url.split('/').pop()
        if (path) {
          await supabase.storage
            .from('profile-pictures')
            .remove([`${user?.id}/${path}`])
        }
      }

      await updateProfile({ avatar_url: null })

      toast({
        title: 'Foto removida!',
        description: 'Sua foto de perfil foi removida.',
      })
    } catch (error: any) {
      console.error('Error removing avatar:', error)
      toast({
        title: 'Erro ao remover foto',
        description: error.message || 'Erro ao remover a foto.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center space-x-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback className="text-lg">
          {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col space-y-2">
        <Label htmlFor="avatar-upload" className="cursor-pointer">
          <Button variant="outline" size="sm" disabled={uploading} asChild>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Enviando...' : 'Alterar foto'}
            </span>
          </Button>
        </Label>
        <Input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="hidden"
        />
        
        {profile?.avatar_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={removeAvatar}
            disabled={uploading}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-2" />
            Remover foto
          </Button>
        )}
      </div>
    </div>
  )
}

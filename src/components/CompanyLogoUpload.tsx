
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Upload, X, Building2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useSystemSettings, useUpdateSystemSettings } from "@/hooks/useSystemSettings"

export function CompanyLogoUpload() {
  const { profile } = useAuth()
  const { data: systemSettings } = useSystemSettings()
  const updateSettings = useUpdateSystemSettings()
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile || !systemSettings) return

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath)

      updateSettings.mutate({
        id: systemSettings.id,
        company_logo_url: data.publicUrl
      })

      toast({
        title: "Logo enviada!",
        description: "A logo da empresa foi atualizada com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message || "Erro ao fazer upload da logo.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!systemSettings) return

    try {
      updateSettings.mutate({
        id: systemSettings.id,
        company_logo_url: null
      })

      toast({
        title: "Logo removida",
        description: "A logo da empresa foi removida com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao remover a logo.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {systemSettings?.company_logo_url ? (
            <div className="relative">
              <img
                src={systemSettings.company_logo_url}
                alt="Logo da empresa"
                className="h-16 w-16 object-contain border border-border rounded-md"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={handleRemoveLogo}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="h-16 w-16 border-2 border-dashed border-border rounded-md flex items-center justify-center">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <Label htmlFor="logo-upload" className="cursor-pointer">
            <Button variant="outline" disabled={uploading} asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Enviando..." : "Alterar Logo"}
              </span>
            </Button>
          </Label>
          <Input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Recomendado: PNG ou JPG, máximo 2MB
          </p>
        </div>
      </div>
    </div>
  )
}

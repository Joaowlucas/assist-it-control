
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useSystemSettings, useUpdateSystemSettings } from "@/hooks/useSystemSettings"
import { Loader2, MessageSquare, TestTube } from "lucide-react"

export function WhatsAppConfigSection() {
  const { toast } = useToast()
  const { data: systemSettings, isLoading } = useSystemSettings()
  const updateSettings = useUpdateSystemSettings()
  const [isTesting, setIsTesting] = useState(false)

  const [formData, setFormData] = useState({
    evolution_api_url: systemSettings?.evolution_api_url || '',
    evolution_api_token: systemSettings?.evolution_api_token || '',
    evolution_instance_name: systemSettings?.evolution_instance_name || '',
    whatsapp_enabled: systemSettings?.whatsapp_enabled || false
  })

  // Atualizar form data quando as configurações carregarem
  useState(() => {
    if (systemSettings) {
      setFormData({
        evolution_api_url: systemSettings.evolution_api_url || '',
        evolution_api_token: systemSettings.evolution_api_token || '',
        evolution_instance_name: systemSettings.evolution_instance_name || '',
        whatsapp_enabled: systemSettings.whatsapp_enabled || false
      })
    }
  })

  const handleSave = () => {
    if (systemSettings) {
      updateSettings.mutate({
        id: systemSettings.id,
        ...formData
      })
    }
  }

  const testConnection = async () => {
    if (!formData.evolution_api_url || !formData.evolution_api_token || !formData.evolution_instance_name) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos antes de testar a conexão.',
        variant: 'destructive'
      })
      return
    }

    setIsTesting(true)
    try {
      const response = await fetch('/api/test-evolution-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formData.evolution_api_url,
          token: formData.evolution_api_token,
          instance: formData.evolution_instance_name
        })
      })

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Conexão com Evolution API estabelecida com sucesso!',
        })
      } else {
        throw new Error('Falha na conexão')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao conectar com a Evolution API. Verifique as configurações.',
        variant: 'destructive'
      })
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Configurações WhatsApp
          </CardTitle>
          <CardDescription>
            Configure a integração com Evolution API para envio de notificações via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="whatsapp-enabled"
              checked={formData.whatsapp_enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, whatsapp_enabled: checked }))}
            />
            <Label htmlFor="whatsapp-enabled">Habilitar notificações WhatsApp</Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="evolution-url">URL da Evolution API</Label>
            <Input
              id="evolution-url"
              placeholder="https://sua-evolution-api.com"
              value={formData.evolution_api_url}
              onChange={(e) => setFormData(prev => ({ ...prev, evolution_api_url: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="evolution-token">Token da API</Label>
            <Input
              id="evolution-token"
              type="password"
              placeholder="Seu token de acesso"
              value={formData.evolution_api_token}
              onChange={(e) => setFormData(prev => ({ ...prev, evolution_api_token: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="evolution-instance">Nome da Instância</Label>
            <Input
              id="evolution-instance"
              placeholder="nome-da-instancia"
              value={formData.evolution_instance_name}
              onChange={(e) => setFormData(prev => ({ ...prev, evolution_instance_name: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Testar Conexão
                </>
              )}
            </Button>

            <Button 
              onClick={handleSave} 
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

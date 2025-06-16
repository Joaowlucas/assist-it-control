
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useSystemSettings, useUpdateSystemSettings } from "@/hooks/useSystemSettings"
import { Loader2, MessageSquare, TestTube } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

export function WhatsAppConfigSection() {
  const { toast } = useToast()
  const { data: systemSettings, isLoading } = useSystemSettings()
  const updateSettings = useUpdateSystemSettings()
  const [isTesting, setIsTesting] = useState(false)

  const [formData, setFormData] = useState({
    evolution_api_url: '',
    evolution_api_token: '',
    evolution_instance_name: '',
    whatsapp_enabled: false
  })

  // Atualizar form data quando as configurações carregarem
  useEffect(() => {
    if (systemSettings) {
      setFormData({
        evolution_api_url: systemSettings.evolution_api_url || '',
        evolution_api_token: systemSettings.evolution_api_token || '',
        evolution_instance_name: systemSettings.evolution_instance_name || '',
        whatsapp_enabled: systemSettings.whatsapp_enabled || false
      })
    }
  }, [systemSettings])

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

    // Validar formato da URL
    try {
      const url = new URL(formData.evolution_api_url)
      if (!url.protocol.startsWith('http')) {
        throw new Error('URL deve começar com http:// ou https://')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'URL da API inválida. Use o formato: https://sua-api.com',
        variant: 'destructive'
      })
      return
    }

    setIsTesting(true)
    try {
      console.log('Testando conexão Evolution API...', {
        url: formData.evolution_api_url,
        instance: formData.evolution_instance_name,
        hasToken: !!formData.evolution_api_token
      })

      // CORRIGIDO: Usar supabase.functions.invoke em vez de fetch direto
      const { data, error } = await supabase.functions.invoke('test-evolution-api', {
        body: {
          url: formData.evolution_api_url,
          token: formData.evolution_api_token,
          instance: formData.evolution_instance_name
        }
      })

      console.log('Resposta do teste:', { data, error })

      if (error) {
        console.error('Erro na função:', error)
        throw new Error(error.message || 'Erro na função de teste')
      }

      if (data?.success) {
        toast({
          title: 'Sucesso',
          description: data.message || 'Conexão com Evolution API estabelecida com sucesso!',
        })
        console.log('Estado da conexão:', data.connectionState)
      } else {
        throw new Error(data?.error || 'Falha na conexão')
      }
    } catch (error) {
      console.error('Erro no teste de conexão:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao conectar com a Evolution API. Verifique as configurações.',
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
            <p className="text-xs text-muted-foreground">
              Exemplo: https://api.evolutionapi.com ou http://localhost:8080
            </p>
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
            <p className="text-xs text-muted-foreground">
              Token gerado na Evolution API para autenticação
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="evolution-instance">Nome da Instância</Label>
            <Input
              id="evolution-instance"
              placeholder="nome-da-instancia"
              value={formData.evolution_instance_name}
              onChange={(e) => setFormData(prev => ({ ...prev, evolution_instance_name: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Nome da instância do WhatsApp configurada na Evolution API
            </p>
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

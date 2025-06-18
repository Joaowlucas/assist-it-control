
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserManagement } from "@/components/UserManagement"
import { UnitManagement } from "@/components/UnitManagement"
import { WhatsAppConfigSection } from "@/components/WhatsAppConfigSection"
import { WhatsAppLogsSection } from "@/components/WhatsAppLogsSection"
import { CompanyLogoUpload } from "@/components/CompanyLogoUpload"
import { LandingPageManagement } from "@/components/LandingPageManagement"
import { useAuth } from "@/hooks/useAuth"
import { useSystemSettings } from "@/hooks/useSystemSettings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Separator } from "@/components/ui/separator"

export default function Settings() {
  const { profile } = useAuth()
  const { data: settings, refetch } = useSystemSettings()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [companyName, setCompanyName] = useState(settings?.company_name || "")
  const [whatsappEnabled, setWhatsappEnabled] = useState(settings?.whatsapp_enabled || false)
  const [landingPageEnabled, setLandingPageEnabled] = useState(settings?.landing_page_enabled || false)

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name || "")
      setWhatsappEnabled(settings.whatsapp_enabled || false)
      setLandingPageEnabled(settings.landing_page_enabled || false)
    }
  }, [settings])

  const handleGeneralSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const updates = {
        company_name: companyName,
        whatsapp_enabled: whatsappEnabled,
        landing_page_enabled: landingPageEnabled,
      }

      const { error } = await supabase
        .from('system_settings')
        .update(updates)
        .eq('id', settings?.id)

      if (error) {
        throw error
      }

      toast({
        title: "Sucesso",
        description: "Configurações gerais atualizadas com sucesso.",
      })
      refetch()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações: " + error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">Apenas administradores podem acessar as configurações.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações gerais, usuários e integrações do sistema.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="units">Unidades</TabsTrigger>
          <TabsTrigger value="landing">Landing Page</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Gerencie as configurações básicas do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleGeneralSettingsSubmit} className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="companyName">Nome da Empresa</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label htmlFor="whatsappEnabled">WhatsApp Habilitado</Label>
                    <Switch
                      id="whatsappEnabled"
                      checked={whatsappEnabled}
                      onCheckedChange={(checked) => setWhatsappEnabled(checked)}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label htmlFor="landingPageEnabled">Landing Page Habilitada</Label>
                    <Switch
                      id="landingPageEnabled"
                      checked={landingPageEnabled}
                      onCheckedChange={(checked) => setLandingPageEnabled(checked)}
                    />
                  </div>
                </div>

                <Button disabled={isLoading} type="submit">
                  {isLoading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Logo da Empresa</CardTitle>
              <CardDescription>
                Atualize o logo da empresa exibido no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanyLogoUpload />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <UnitManagement />
        </TabsContent>

        <TabsContent value="landing" className="space-y-4">
          <LandingPageManagement />
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <WhatsAppConfigSection />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <WhatsAppLogsSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

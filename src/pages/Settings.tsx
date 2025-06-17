
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompanyLogoUpload } from "@/components/CompanyLogoUpload"
import { WhatsAppConfigSection } from "@/components/WhatsAppConfigSection"
import { WhatsAppLogsSection } from "@/components/WhatsAppLogsSection"
import { LandingPageManagement } from "@/components/LandingPageManagement"
import { Settings as SettingsIcon, Building2, MessageCircle, Activity, Globe } from "lucide-react"

export default function Settings() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="landing" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Landing Page
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <CompanyLogoUpload />
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

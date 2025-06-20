
import { AdminGuard } from "@/components/AdminGuard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TicketConfigurationTabs } from "@/components/TicketConfigurationTabs"
import { UserManagement } from "@/components/UserManagement"
import { WhatsAppConfigSection } from "@/components/WhatsAppConfigSection"
import { WhatsAppLogsSection } from "@/components/WhatsAppLogsSection"
import { CompanySettingsSection } from "@/components/CompanySettingsSection"
import { UnitManagementSection } from "@/components/UnitManagementSection"
import { ChatManagement } from "@/components/ChatManagement"
import { Settings as SettingsIcon, Users, MessageSquare, Building, Ticket, MessageCircle } from "lucide-react"

export default function Settings() {
  return (
    <AdminGuard>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Chamados
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Unidades
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Empresa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>
                  Gerencie usuários, perfis e permissões do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Chamados</CardTitle>
                <CardDescription>
                  Configure categorias, templates e textos pré-definidos para chamados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TicketConfigurationTabs />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <ChatManagement />
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4">
            <div className="grid gap-4">
              <WhatsAppConfigSection />
              <WhatsAppLogsSection />
            </div>
          </TabsContent>

          <TabsContent value="units" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Unidades</CardTitle>
                <CardDescription>
                  Gerencie as unidades organizacionais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UnitManagementSection />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Empresa</CardTitle>
                <CardDescription>
                  Configure informações gerais da empresa, logos e emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompanySettingsSection />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminGuard>
  )
}


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "@/components/UserManagement"
import { UnitManagementSection } from "@/components/UnitManagementSection"
import { TicketConfigurationTabs } from "@/components/TicketConfigurationTabs"
import { CompanySettingsSection } from "@/components/CompanySettingsSection"
import { WhatsAppConfigSection } from "@/components/WhatsAppConfigSection"
import WhatsAppTicketConfigSection from "@/components/WhatsAppTicketConfigSection"
import WhatsAppAdminPanel from "@/components/WhatsAppAdminPanel"
import { WhatsAppLogsSection } from "@/components/WhatsAppLogsSection"
import { AssignmentManagementSection } from "@/components/AssignmentManagementSection"

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="units">Unidades</TabsTrigger>
          <TabsTrigger value="tickets">Chamados</TabsTrigger>
          <TabsTrigger value="assignments">Atribuições</TabsTrigger>
          <TabsTrigger value="company">Empresa</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Gerencie usuários, técnicos e administradores do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Unidades</CardTitle>
              <CardDescription>
                Configure e gerencie as unidades da organização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UnitManagementSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <TicketConfigurationTabs />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Atribuições</CardTitle>
              <CardDescription>
                Configure as opções relacionadas às atribuições de equipamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssignmentManagementSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <CompanySettingsSection />
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <WhatsAppConfigSection />
          <WhatsAppTicketConfigSection />
          <WhatsAppAdminPanel />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <WhatsAppLogsSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

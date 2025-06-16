
import React from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SystemSettingsForm } from '@/components/SystemSettingsForm'
import { UnitManagementSection } from '@/components/UnitManagementSection'
import { CompanyLogoUpload } from '@/components/CompanyLogoUpload'
import { NotificationSettingsSection } from '@/components/NotificationSettingsSection'
import { NotificationManagementSection } from '@/components/NotificationManagementSection'
import { useAuth } from '@/hooks/useAuth'
import { Settings as SettingsIcon, Building2, Bell, MessageSquare, Palette } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Unidades
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Aparência
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="notification-logs" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <SystemSettingsForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="units">
            <UnitManagementSection />
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Aparência e Marca</CardTitle>
              </CardHeader>
              <CardContent>
                <CompanyLogoUpload />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettingsSection />
          </TabsContent>

          <TabsContent value="notification-logs">
            <NotificationManagementSection />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

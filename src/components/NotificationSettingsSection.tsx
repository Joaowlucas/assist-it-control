
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/useAuth'
import { useProfiles } from '@/hooks/useProfiles'
import { useNotificationSettings, useUpdateNotificationSetting, useNotificationLogs, useTestWhatsAppConnection } from '@/hooks/useNotificationSettings'
import { Phone, Bell, MessageSquare, Send, AlertCircle, CheckCircle } from 'lucide-react'

const notificationTypes = [
  {
    key: 'tickets' as const,
    label: 'Chamados',
    description: 'Receber notificações sobre criação, atualização e fechamento de chamados',
    icon: '🎫'
  },
  {
    key: 'assignments' as const,
    label: 'Atribuições de Equipamento',
    description: 'Receber notificações sobre atribuições e devoluções de equipamentos',
    icon: '📦'
  },
  {
    key: 'equipment' as const,
    label: 'Equipamentos',
    description: 'Receber notificações sobre cadastro e alterações de equipamentos',
    icon: '🖥️'
  }
]

export function NotificationSettingsSection() {
  const { user } = useAuth()
  const { data: profiles } = useProfiles()
  const { data: settings, isLoading: settingsLoading } = useNotificationSettings(user?.id)
  const { data: logs } = useNotificationLogs(user?.id)
  const updateSetting = useUpdateNotificationSetting()
  const testConnection = useTestWhatsAppConnection()
  
  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState('')

  const currentProfile = profiles?.find(p => p.id === user?.id)

  const handleToggle = (type: string, enabled: boolean) => {
    if (!user?.id) return
    
    updateSetting.mutate({
      user_id: user.id,
      notification_type: type,
      enabled
    })
  }

  const handlePhoneOverride = (type: string, phone: string) => {
    if (!user?.id) return
    
    updateSetting.mutate({
      user_id: user.id,
      notification_type: type,
      phone_override: phone || null
    })
  }

  const handleTestConnection = () => {
    const phone = testPhone || currentProfile?.phone
    if (!phone) return

    testConnection.mutate({
      phone,
      message: testMessage || undefined
    })
  }

  const getSettingForType = (type: string) => {
    return settings?.find(s => s.notification_type === type)
  }

  const recentLogs = logs?.slice(0, 5) || []

  if (settingsLoading) {
    return <div>Carregando configurações...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configurações de Notificação WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações do telefone principal */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone Principal
            </Label>
            <div className="flex items-center gap-2">
              <Input 
                value={currentProfile?.phone || ''} 
                placeholder="(11) 99999-9999"
                readOnly
                className="bg-muted"
              />
              <Badge variant={currentProfile?.phone ? 'default' : 'destructive'}>
                {currentProfile?.phone ? 'Configurado' : 'Não configurado'}
              </Badge>
            </div>
            {!currentProfile?.phone && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Configure seu telefone no perfil para receber notificações.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Configurações por tipo de notificação */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Tipos de Notificação</Label>
            
            {notificationTypes.map((type) => {
              const setting = getSettingForType(type.key)
              const isEnabled = setting?.enabled ?? true

              return (
                <Card key={type.key} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{type.icon}</span>
                          <Label className="font-medium">{type.label}</Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleToggle(type.key, checked)}
                        disabled={updateSetting.isPending}
                      />
                    </div>

                    {isEnabled && (
                      <div className="space-y-2">
                        <Label className="text-sm">
                          Telefone Alternativo (opcional)
                        </Label>
                        <Input
                          placeholder="(11) 99999-9999"
                          value={setting?.phone_override || ''}
                          onChange={(e) => handlePhoneOverride(type.key, e.target.value)}
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Deixe em branco para usar o telefone principal
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          <Separator />

          {/* Teste de conexão */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Teste de Conexão
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Telefone (opcional)</Label>
                <Input
                  placeholder="Usar telefone principal"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Mensagem (opcional)</Label>
                <Input
                  placeholder="Mensagem de teste personalizada"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={handleTestConnection}
              disabled={testConnection.isPending || (!testPhone && !currentProfile?.phone)}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {testConnection.isPending ? 'Enviando...' : 'Enviar Teste'}
            </Button>
          </div>

          {/* Log de notificações recentes */}
          {recentLogs.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label>Notificações Recentes</Label>
                <div className="space-y-2">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {log.notification_type} - {log.entity_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant={log.status === 'sent' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                        {log.status === 'sent' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Enviado</>
                        ) : log.status === 'failed' ? (
                          <><AlertCircle className="h-3 w-3 mr-1" /> Falhou</>
                        ) : (
                          'Pendente'
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

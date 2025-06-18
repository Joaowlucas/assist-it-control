
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Building, Mail, Upload, Save } from 'lucide-react'
import { CompanyLogoUpload } from '@/components/CompanyLogoUpload'
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/useSystemSettings'
import { useToast } from '@/hooks/use-toast'

export function CompanySettingsSection() {
  const { data: systemSettings, isLoading } = useSystemSettings()
  const updateSettings = useUpdateSystemSettings()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    company_name: '',
    department_name: '',
    support_email: '',
    ticket_email: '',
    equipment_email: ''
  })

  const [isFormInitialized, setIsFormInitialized] = useState(false)

  // Inicializar formulário com dados do sistema
  React.useEffect(() => {
    if (systemSettings && !isFormInitialized) {
      setFormData({
        company_name: systemSettings.company_name || '',
        department_name: systemSettings.department_name || '',
        support_email: systemSettings.support_email || '',
        ticket_email: systemSettings.ticket_email || '',
        equipment_email: systemSettings.equipment_email || ''
      })
      setIsFormInitialized(true)
    }
  }, [systemSettings, isFormInitialized])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!systemSettings?.id) {
      toast({
        title: 'Erro',
        description: 'Configurações do sistema não encontradas',
        variant: 'destructive'
      })
      return
    }

    try {
      await updateSettings.mutateAsync({
        id: systemSettings.id,
        ...formData
      })
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-4">Carregando configurações...</div>
  }

  return (
    <div className="space-y-6">
      {/* Informações da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Informações da Empresa
          </CardTitle>
          <CardDescription>
            Configure o nome da empresa e departamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da Empresa</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Digite o nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department_name">Nome do Departamento/Setor</Label>
              <Input
                id="department_name"
                value={formData.department_name}
                onChange={(e) => handleInputChange('department_name', e.target.value)}
                placeholder="Ex: Tecnologia da Informação"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de E-mail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configurações de E-mail
          </CardTitle>
          <CardDescription>
            Configure os e-mails utilizados pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="support_email">E-mail de Suporte</Label>
              <Input
                id="support_email"
                type="email"
                value={formData.support_email}
                onChange={(e) => handleInputChange('support_email', e.target.value)}
                placeholder="suporte@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket_email">E-mail para Chamados</Label>
              <Input
                id="ticket_email"
                type="email"
                value={formData.ticket_email}
                onChange={(e) => handleInputChange('ticket_email', e.target.value)}
                placeholder="chamados@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment_email">E-mail para Equipamentos</Label>
              <Input
                id="equipment_email"
                type="email"
                value={formData.equipment_email}
                onChange={(e) => handleInputChange('equipment_email', e.target.value)}
                placeholder="equipamentos@empresa.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Logo da Empresa
          </CardTitle>
          <CardDescription>
            Faça upload do logo da empresa que aparecerá no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyLogoUpload />
        </CardContent>
      </Card>

      {/* Botão de Salvar */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {updateSettings.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  )
}

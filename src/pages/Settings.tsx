import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useSystemSettings, useUpdateSystemSettings } from "@/hooks/useSystemSettings"
import { useUnits } from "@/hooks/useUnits"
import { useCreateUnit, useDeleteUnit } from "@/hooks/useUnitManagement"
import { Loader2, Trash2, Settings as SettingsIcon, Building2, MessageSquare, Ticket } from "lucide-react"
import { CompanyLogoUpload } from "@/components/CompanyLogoUpload"
import { WhatsAppConfigSection } from "@/components/WhatsAppConfigSection"
import { WhatsAppLogsSection } from "@/components/WhatsAppLogsSection"
import { ChatManagement } from "@/components/ChatManagement"
import { TicketTemplateManagement } from "@/components/TicketTemplateManagement"
import { PredefinedTextsManagement } from "@/components/PredefinedTextsManagement"
import { TicketCategoriesManagement } from "@/components/TicketCategoriesManagement"

export default function Settings() {
  const { toast } = useToast()
  const { data: systemSettings, isLoading: isLoadingSettings } = useSystemSettings()
  const { data: units, isLoading: isLoadingUnits } = useUnits()
  const updateSettings = useUpdateSystemSettings()
  const createUnit = useCreateUnit()
  const deleteUnit = useDeleteUnit()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    company_name: '',
    department_name: '',
    support_email: '',
    ticket_email: '',
    equipment_email: '',
    auto_assign_tickets: true,
    default_priority: 'media'
  })

  // Atualizar form data quando as configurações carregarem
  useState(() => {
    if (systemSettings) {
      setFormData({
        company_name: systemSettings.company_name,
        department_name: systemSettings.department_name,
        support_email: systemSettings.support_email,
        ticket_email: systemSettings.ticket_email,
        equipment_email: systemSettings.equipment_email,
        auto_assign_tickets: systemSettings.auto_assign_tickets,
        default_priority: systemSettings.default_priority
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

  const handleSubmitUnit = (e: React.FormEvent) => {
    e.preventDefault()
    const formDataUnit = new FormData(e.target as HTMLFormElement)
    
    createUnit.mutate({
      name: formDataUnit.get('name') as string,
      description: formDataUnit.get('description') as string,
    })

    setIsDialogOpen(false)
  }

  const handleDeleteUnit = (unitId: string) => {
    if (confirm('Tem certeza que deseja remover esta unidade?')) {
      deleteUnit.mutate(unitId)
    }
  }

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema de suporte
        </p>
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
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Chamados
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Identidade Visual</CardTitle>
              <CardDescription>
                Configure a logo da empresa que aparecerá no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Logo da Empresa</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    A logo será exibida na barra lateral e na tela de login
                  </p>
                  <CompanyLogoUpload />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configurações básicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="company">Nome da Empresa</Label>
                <Input 
                  id="company" 
                  value={formData.company_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="department">Departamento de TI</Label>
                <Input 
                  id="department" 
                  value={formData.department_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, department_name: e.target.value }))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail de Suporte</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.support_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, support_email: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ticketEmail">E-mail para novos chamados</Label>
                <Input 
                  id="ticketEmail" 
                  type="email" 
                  value={formData.ticket_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, ticket_email: e.target.value }))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="equipmentEmail">E-mail para equipamentos</Label>
                <Input 
                  id="equipmentEmail" 
                  type="email" 
                  value={formData.equipment_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipment_email: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="autoAssign">Auto-atribuição de chamados</Label>
                <Select 
                  value={formData.auto_assign_tickets ? "enabled" : "disabled"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, auto_assign_tickets: value === "enabled" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enabled">Habilitado</SelectItem>
                    <SelectItem value="disabled">Desabilitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridade padrão para novos chamados</Label>
                <Select 
                  value={formData.default_priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, default_priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Unidades de Atendimento</CardTitle>
                <CardDescription>
                  Gerencie as unidades da empresa para organizar chamados
                </CardDescription>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Nova Unidade</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Unidade</DialogTitle>
                    <DialogDescription>
                      Adicione uma nova unidade de atendimento
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitUnit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome da Unidade</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        placeholder="Ex: Matriz São Paulo"
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Input 
                        id="description" 
                        name="description" 
                        placeholder="Descrição da unidade"
                        required 
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createUnit.isPending}>
                        {createUnit.isPending ? "Criando..." : "Criar Unidade"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingUnits ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units?.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell>{unit.description}</TableCell>
                        <TableCell>{new Date(unit.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUnit(unit.id)}
                            disabled={deleteUnit.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <div className="space-y-6">
            <TicketTemplateManagement />
            <PredefinedTextsManagement />
            <TicketCategoriesManagement />
          </div>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <ChatManagement />
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <WhatsAppConfigSection />
          <WhatsAppLogsSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

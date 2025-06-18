import { useState, useMemo } from "react"
import { AdminLayout } from "@/components/AdminLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TicketDetails } from "@/components/TicketDetails"
import { TicketFilters } from "@/components/TicketFilters"
import { useTickets, useCreateTicket, useUpdateTicket } from "@/hooks/useTickets"
import { useUnits } from "@/hooks/useUnits"
import { useProfiles } from "@/hooks/useProfiles"
import { useAuth } from "@/hooks/useAuth"
import { useTicketCategories } from "@/hooks/useTicketCategories"
import { useTicketTemplates } from "@/hooks/useTicketTemplates"
import { usePredefinedTexts } from "@/hooks/usePredefinedTexts"
import { Eye, Edit, Plus, FileText } from "lucide-react"

export default function Tickets() {
  const { profile } = useAuth()
  const { data: tickets = [], isLoading } = useTickets()
  const { data: units = [] } = useUnits()
  const { data: profiles = [] } = useProfiles()
  const { data: categories = [] } = useTicketCategories()
  const { data: templates = [] } = useTicketTemplates()
  const { data: predefinedTexts = [] } = usePredefinedTexts()
  const createTicketMutation = useCreateTicket()
  const updateTicketMutation = useUpdateTicket()

  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media' as 'baixa' | 'media' | 'alta' | 'critica'
  })

  // Filtrar textos pré-definidos pela categoria selecionada
  const filteredTexts = useMemo(() => {
    if (!selectedCategory) return predefinedTexts
    return predefinedTexts.filter(text => 
      !text.category || text.category === selectedCategory
    )
  }, [predefinedTexts, selectedCategory])

  const titleTexts = filteredTexts.filter(text => text.type === 'title')
  const descriptionTexts = filteredTexts.filter(text => text.type === 'description')

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSelectedCategory(template.category)
      setFormData({
        title: template.title_template,
        description: template.description_template,
        priority: template.priority as 'baixa' | 'media' | 'alta' | 'critica'
      })
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'media'
      })
    }
    setSelectedTemplate(templateId)
  }

  const handleInsertPredefinedText = (textContent: string, type: 'title' | 'description') => {
    if (type === 'title') {
      setFormData(prev => ({ ...prev, title: textContent }))
    } else {
      setFormData(prev => ({ ...prev, description: textContent }))
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formDataObj = new FormData(form)

    const ticketData = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      category: selectedCategory,
      requester_id: profile?.id,
      unit_id: formDataObj.get('unit_id') as string,
      assignee_id: formDataObj.get('assignee_id') as string || null,
      status: 'aberto' as const
    }

    try {
      await createTicketMutation.mutateAsync(ticketData)
      setIsCreateOpen(false)
      setSelectedTemplate("")
      setSelectedCategory("")
      setFormData({
        title: '',
        description: '',
        priority: 'media'
      })
      form.reset()
    } catch (error) {
      console.error('Error creating ticket:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critica": return "destructive"
      case "alta": return "destructive"
      case "media": return "default"
      case "baixa": return "secondary"
      default: return "default"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto": return "destructive"
      case "em_andamento": return "default"
      case "aguardando": return "secondary"
      case "fechado": return "outline"
      default: return "default"
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chamados</h1>
            <p className="text-muted-foreground">
              Gerencie todos os chamados de suporte do sistema
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Chamado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Chamado</DialogTitle>
                <DialogDescription>
                  Crie um novo chamado de suporte no sistema
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                {/* Template Selector */}
                <div>
                  <Label htmlFor="template">Template (Opcional)</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template para agilizar o preenchimento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem template</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} - {template.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Título</Label>
                  <div className="space-y-2">
                    <Input 
                      id="title" 
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Título do chamado"
                      required 
                    />
                    {titleTexts.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {titleTexts.slice(0, 3).map((text) => (
                          <Button
                            key={text.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleInsertPredefinedText(text.text_content, 'title')}
                            className="text-xs"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            {text.text_content.substring(0, 20)}...
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <div className="space-y-2">
                    <Textarea 
                      id="description" 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição detalhada do problema"
                      required 
                    />
                    {descriptionTexts.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {descriptionTexts.slice(0, 2).map((text) => (
                          <Button
                            key={text.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleInsertPredefinedText(text.text_content, 'description')}
                            className="text-xs"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            {text.text_content.substring(0, 25)}...
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
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
                  
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select 
                      value={selectedCategory} 
                      onValueChange={setSelectedCategory}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unit_id">Unidade</Label>
                    <Select name="unit_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="assignee_id">Atribuir para (Opcional)</Label>
                    <Select name="assignee_id">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um técnico" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles
                          .filter(p => p.role === 'technician' || p.role === 'admin')
                          .map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTicketMutation.isPending || !selectedCategory}
                  >
                    {createTicketMutation.isPending ? 'Criando...' : 'Criar Chamado'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="open">Abertos</TabsTrigger>
            <TabsTrigger value="in_progress">Em Andamento</TabsTrigger>
            <TabsTrigger value="closed">Fechados</TabsTrigger>
          </TabsList>

          <TicketFilters />

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Chamados</CardTitle>
                <CardDescription>
                  Lista completa de chamados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Solicitante</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">
                            #{ticket.ticket_number}
                          </TableCell>
                          <TableCell>{ticket.title}</TableCell>
                          <TableCell>{ticket.requester?.name}</TableCell>
                          <TableCell>{ticket.unit?.name}</TableCell>
                          <TableCell>{ticket.category}</TableCell>
                          <TableCell>
                            <Badge variant={getPriorityColor(ticket.priority) as any}>
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(ticket.status) as any}>
                              {ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTicket(ticket)
                                  setIsDetailsOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="open" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chamados Abertos</CardTitle>
                <CardDescription>
                  Lista de chamados com status "Aberto"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Solicitante</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets
                        .filter((ticket) => ticket.status === 'aberto')
                        .map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">
                              #{ticket.ticket_number}
                            </TableCell>
                            <TableCell>{ticket.title}</TableCell>
                            <TableCell>{ticket.requester?.name}</TableCell>
                            <TableCell>{ticket.unit?.name}</TableCell>
                            <TableCell>{ticket.category}</TableCell>
                            <TableCell>
                              <Badge variant={getPriorityColor(ticket.priority) as any}>
                                {ticket.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(ticket.status) as any}>
                                {ticket.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTicket(ticket)
                                    setIsDetailsOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chamados Em Andamento</CardTitle>
                <CardDescription>
                  Lista de chamados com status "Em Andamento"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Solicitante</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets
                        .filter((ticket) => ticket.status === 'em_andamento')
                        .map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">
                              #{ticket.ticket_number}
                            </TableCell>
                            <TableCell>{ticket.title}</TableCell>
                            <TableCell>{ticket.requester?.name}</TableCell>
                            <TableCell>{ticket.unit?.name}</TableCell>
                            <TableCell>{ticket.category}</TableCell>
                            <TableCell>
                              <Badge variant={getPriorityColor(ticket.priority) as any}>
                                {ticket.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(ticket.status) as any}>
                                {ticket.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTicket(ticket)
                                    setIsDetailsOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="closed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chamados Fechados</CardTitle>
                <CardDescription>
                  Lista de chamados com status "Fechado"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Solicitante</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets
                        .filter((ticket) => ticket.status === 'fechado')
                        .map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">
                              #{ticket.ticket_number}
                            </TableCell>
                            <TableCell>{ticket.title}</TableCell>
                            <TableCell>{ticket.requester?.name}</TableCell>
                            <TableCell>{ticket.unit?.name}</TableCell>
                            <TableCell>{ticket.category}</TableCell>
                            <TableCell>
                              <Badge variant={getPriorityColor(ticket.priority) as any}>
                                {ticket.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(ticket.status) as any}>
                                {ticket.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTicket(ticket)
                                    setIsDetailsOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedTicket && (
          <TicketDetails
            ticket={selectedTicket}
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            units={units}
            technicians={profiles.filter(p => p.role === 'technician' || p.role === 'admin')}
          />
        )}
      </div>
    </AdminLayout>
  )
}

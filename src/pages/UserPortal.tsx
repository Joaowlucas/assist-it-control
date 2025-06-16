
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ImageUpload } from "@/components/ImageUpload"
import { UserProfileSection } from "@/components/UserProfileSection"
import { EditTicketDialog } from "@/components/EditTicketDialog"
import { EquipmentRequestsSection } from "@/components/EquipmentRequestsSection"
import { OpenTicketsModal, ClosedTicketsModal, ActiveEquipmentModal, AllAssignmentsModal } from "@/components/UserPortalModals"
import { useUserTickets, useCreateUserTicket, useDeleteUserTicket, UserTicket } from "@/hooks/useUserTickets"
import { useUserAssignments } from "@/hooks/useUserAssignments"
import { useTechnicianUnits } from "@/hooks/useTechnicianUnits"
import { useAuth } from "@/hooks/useAuth"
import { Edit, Trash2, Eye, Plus } from "lucide-react"

export default function UserPortal() {
  const { profile } = useAuth()
  const { data: tickets = [], isLoading: ticketsLoading } = useUserTickets()
  const { data: assignments = [], isLoading: assignmentsLoading } = useUserAssignments()
  const { data: technicianUnits = [] } = useTechnicianUnits(profile?.role === 'technician' ? profile.id : undefined)
  const createTicketMutation = useCreateUserTicket()
  const deleteTicketMutation = useDeleteUserTicket()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [editingTicket, setEditingTicket] = useState<UserTicket | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUnitId, setSelectedUnitId] = useState<string>("")

  // Estados para os modais
  const [openTicketsModalOpen, setOpenTicketsModalOpen] = useState(false)
  const [closedTicketsModalOpen, setClosedTicketsModalOpen] = useState(false)
  const [activeEquipmentModalOpen, setActiveEquipmentModalOpen] = useState(false)
  const [allAssignmentsModalOpen, setAllAssignmentsModalOpen] = useState(false)

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

  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case "ativo": return "default"
      case "finalizado": return "secondary"
      default: return "default"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "critica": return "Crítica"
      case "alta": return "Alta"
      case "media": return "Média"
      case "baixa": return "Baixa"
      default: return priority
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aberto": return "Aberto"
      case "em_andamento": return "Em Andamento"
      case "aguardando": return "Aguardando"
      case "fechado": return "Fechado"
      default: return status
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "hardware": return "Hardware"
      case "software": return "Software"
      case "rede": return "Rede"
      case "acesso": return "Acesso"
      case "outros": return "Outros"
      default: return category
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    // Para técnicos, usar a unidade selecionada, para usuários normais usar sua unidade
    const unitId = profile?.role === 'technician' ? selectedUnitId : profile?.unit_id
    
    if (!unitId) {
      console.error('Unidade não selecionada')
      return
    }
    
    const ticketData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as 'baixa' | 'media' | 'alta' | 'critica',
      category: formData.get('category') as 'hardware' | 'software' | 'rede' | 'acesso' | 'outros',
      unit_id: unitId,
      images: images.length > 0 ? images : undefined
    }

    try {
      await createTicketMutation.mutateAsync(ticketData)
      setIsDialogOpen(false)
      setImages([])
      setSelectedUnitId("")
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      console.error('Error creating ticket:', error)
    }
  }

  const handleEditTicket = (ticket: UserTicket) => {
    setEditingTicket(ticket)
    setIsEditDialogOpen(true)
  }

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await deleteTicketMutation.mutateAsync(ticketId)
    } catch (error) {
      console.error('Error deleting ticket:', error)
    }
  }

  const canEditOrDelete = (ticket: UserTicket) => {
    return ticket.status === 'aberto'
  }

  const openTickets = tickets.filter(t => t.status !== "fechado")
  const closedTickets = tickets.filter(t => t.status === "fechado")
  const activeAssignments = assignments.filter(a => a.status === "ativo")

  // Verificar se é técnico e tem unidades atribuídas
  const isTechnician = profile?.role === 'technician'
  const availableUnits = isTechnician ? technicianUnits : []

  if (ticketsLoading || assignmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Portal do Usuário</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Gerencie seus chamados e visualize seus equipamentos
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Chamado
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Criar Novo Chamado</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Descreva seu problema e nossa equipe irá ajudá-lo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title" className="text-foreground">Título</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    placeholder="Descreva brevemente o problema"
                    required 
                    className="bg-background border-border text-foreground"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-foreground">Descrição</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Descreva detalhadamente o problema"
                    required 
                    className="bg-background border-border text-foreground"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority" className="text-foreground">Prioridade</Label>
                    <Select name="priority" required>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="critica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="category" className="text-foreground">Categoria</Label>
                    <Select name="category" required>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="hardware">Hardware</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="rede">Rede</SelectItem>
                        <SelectItem value="acesso">Acesso</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <ImageUpload 
                  images={images}
                  onImagesChange={setImages}
                  maxImages={5}
                />
                
                <div>
                  <Label className="text-foreground">Unidade</Label>
                  {isTechnician && availableUnits.length > 0 ? (
                    <Select value={selectedUnitId} onValueChange={setSelectedUnitId} required>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {availableUnits.map((unit) => (
                          <SelectItem key={unit.unit_id} value={unit.unit_id}>
                            {unit.unit?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input 
                      value={profile?.unit?.name || 'Unidade não definida'}
                      disabled
                      className="bg-muted border-border text-muted-foreground"
                    />
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {isTechnician 
                      ? 'Selecione a unidade onde o problema está ocorrendo'
                      : 'Sua unidade será automaticamente selecionada'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)} 
                  disabled={createTicketMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTicketMutation.isPending || (isTechnician && !selectedUnitId)}
                  className="w-full sm:w-auto"
                >
                  {createTicketMutation.isPending ? 'Criando...' : 'Criar Chamado'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard Cards com Modais */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors bg-card border-border" onClick={() => setOpenTicketsModalOpen(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-foreground">Chamados Abertos</CardTitle>
            <Eye className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="text-xl md:text-2xl font-bold text-foreground">{openTickets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors bg-card border-border" onClick={() => setClosedTicketsModalOpen(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-foreground">Chamados Fechados</CardTitle>
            <Eye className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="text-xl md:text-2xl font-bold text-foreground">{closedTickets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors bg-card border-border" onClick={() => setActiveEquipmentModalOpen(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-foreground">Equipamentos Ativos</CardTitle>
            <Eye className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="text-xl md:text-2xl font-bold text-foreground">{activeAssignments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors bg-card border-border" onClick={() => setAllAssignmentsModalOpen(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-foreground">Total de Atribuições</CardTitle>
            <Eye className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="text-xl md:text-2xl font-bold text-foreground">{assignments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs section */}
      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="tickets" className="text-xs md:text-sm">Meus Chamados</TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs md:text-sm">Meus Equipamentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tickets" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-lg md:text-xl">Histórico de Chamados</CardTitle>
              <CardDescription className="text-muted-foreground">
                Todos os seus chamados de suporte
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-6">
              <div className="rounded-md border border-border overflow-hidden bg-card">
                <ScrollArea className="h-[400px] md:h-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-muted/50">
                        <TableHead className="text-muted-foreground text-xs md:text-sm">ID</TableHead>
                        <TableHead className="text-muted-foreground text-xs md:text-sm">Título</TableHead>
                        <TableHead className="hidden md:table-cell text-muted-foreground text-xs md:text-sm">Unidade</TableHead>
                        <TableHead className="hidden sm:table-cell text-muted-foreground text-xs md:text-sm">Categoria</TableHead>
                        <TableHead className="text-muted-foreground text-xs md:text-sm">Prioridade</TableHead>
                        <TableHead className="text-muted-foreground text-xs md:text-sm">Status</TableHead>
                        <TableHead className="hidden lg:table-cell text-muted-foreground text-xs md:text-sm">Criado em</TableHead>
                        <TableHead className="text-muted-foreground text-xs md:text-sm">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id} className="border-border hover:bg-muted/50">
                          <TableCell className="font-medium text-foreground text-xs md:text-sm">
                            #{ticket.ticket_number}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            <div>
                              <div className="font-medium text-foreground">{ticket.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {ticket.description.length > 30 
                                  ? `${ticket.description.substring(0, 30)}...` 
                                  : ticket.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-xs md:text-sm">{ticket.unit?.name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground text-xs md:text-sm">{getCategoryLabel(ticket.category)}</TableCell>
                          <TableCell>
                            <Badge variant={getPriorityColor(ticket.priority) as any} className="text-xs">
                              {getPriorityLabel(ticket.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(ticket.status) as any} className="text-xs">
                              {getStatusLabel(ticket.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground text-xs md:text-sm">
                            {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {canEditOrDelete(ticket) && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditTicket(ticket)}
                                    className="h-6 w-6 p-0 md:h-8 md:w-8"
                                  >
                                    <Edit className="h-3 w-3 md:h-4 md:w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 md:h-8 md:w-8 text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="w-[95vw] max-w-md bg-card border-border">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-foreground">Confirmar exclusão</AlertDialogTitle>
                                        <AlertDialogDescription className="text-muted-foreground">
                                          Tem certeza que deseja excluir o chamado #{ticket.ticket_number}? 
                                          Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                        <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteTicket(ticket.id)}
                                          className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assignments" className="space-y-4">
          <EquipmentRequestsSection />
          
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-lg md:text-xl">Histórico de Equipamentos</CardTitle>
              <CardDescription className="text-muted-foreground">
                Todos os equipamentos que você utilizou ou está utilizando
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-6">
              <div className="rounded-md border border-border overflow-hidden bg-card">
                <ScrollArea className="h-[400px] md:h-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-muted/50">
                        <TableHead className="text-muted-foreground text-xs md:text-sm">Equipamento</TableHead>
                        <TableHead className="hidden sm:table-cell text-muted-foreground text-xs md:text-sm">Tipo</TableHead>
                        <TableHead className="hidden md:table-cell text-muted-foreground text-xs md:text-sm">Marca/Modelo</TableHead>
                        <TableHead className="text-muted-foreground text-xs md:text-sm">Data de Início</TableHead>
                        <TableHead className="hidden lg:table-cell text-muted-foreground text-xs md:text-sm">Data de Fim</TableHead>
                        <TableHead className="text-muted-foreground text-xs md:text-sm">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id} className="border-border hover:bg-muted/50">
                          <TableCell className="font-medium text-foreground text-xs md:text-sm">
                            {assignment.equipment.name}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground text-xs md:text-sm">
                            {assignment.equipment.type}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-xs md:text-sm">
                            {assignment.equipment.brand && assignment.equipment.model 
                              ? `${assignment.equipment.brand} ${assignment.equipment.model}`
                              : assignment.equipment.brand || assignment.equipment.model || '-'
                            }
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs md:text-sm">
                            {new Date(assignment.start_date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground text-xs md:text-sm">
                            {assignment.end_date 
                              ? new Date(assignment.end_date).toLocaleDateString('pt-BR') 
                              : "-"
                            }
                          </TableCell>
                          <TableCell>
                            <Badge variant={getAssignmentStatusColor(assignment.status) as any} className="text-xs">
                              {assignment.status === 'ativo' ? 'Ativo' : 'Finalizado'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <OpenTicketsModal
        open={openTicketsModalOpen}
        onOpenChange={setOpenTicketsModalOpen}
        tickets={openTickets}
      />

      <ClosedTicketsModal
        open={closedTicketsModalOpen}
        onOpenChange={setClosedTicketsModalOpen}
        tickets={closedTickets}
      />

      <ActiveEquipmentModal
        open={activeEquipmentModalOpen}
        onOpenChange={setActiveEquipmentModalOpen}
        assignments={activeAssignments}
      />

      <AllAssignmentsModal
        open={allAssignmentsModalOpen}
        onOpenChange={setAllAssignmentsModalOpen}
        assignments={assignments}
      />

      <EditTicketDialog
        ticket={editingTicket}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) setEditingTicket(null)
        }}
      />
    </div>
  )
}

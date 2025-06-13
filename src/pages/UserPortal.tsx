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
import { ImageUpload } from "@/components/ImageUpload"
import { UserProfileSection } from "@/components/UserProfileSection"
import { EditTicketDialog } from "@/components/EditTicketDialog"
import { EquipmentRequestsSection } from "@/components/EquipmentRequestsSection"
import { useUserTickets, useCreateUserTicket, useDeleteUserTicket, UserTicket } from "@/hooks/useUserTickets"
import { useUserAssignments } from "@/hooks/useUserAssignments"
import { useAuth } from "@/hooks/useAuth"
import { Edit, Trash2 } from "lucide-react"

export default function UserPortal() {
  const { profile } = useAuth()
  const { data: tickets = [], isLoading: ticketsLoading } = useUserTickets()
  const { data: assignments = [], isLoading: assignmentsLoading } = useUserAssignments()
  const createTicketMutation = useCreateUserTicket()
  const deleteTicketMutation = useDeleteUserTicket()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [editingTicket, setEditingTicket] = useState<UserTicket | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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
    
    const ticketData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as 'baixa' | 'media' | 'alta' | 'critica',
      category: formData.get('category') as 'hardware' | 'software' | 'rede' | 'acesso' | 'outros',
      images: images.length > 0 ? images : undefined
    }

    try {
      await createTicketMutation.mutateAsync(ticketData)
      setIsDialogOpen(false)
      setImages([])
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

  if (ticketsLoading || assignmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-700">Portal do Usuário</h2>
          <p className="text-slate-500">
            Gerencie seus chamados e visualize seus equipamentos
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-600 hover:bg-slate-700 text-white">Novo Chamado</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-slate-50 border-slate-200 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-slate-700">Criar Novo Chamado</DialogTitle>
              <DialogDescription className="text-slate-600">
                Descreva seu problema e nossa equipe irá ajudá-lo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title" className="text-slate-700">Título</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    placeholder="Descreva brevemente o problema"
                    required 
                    className="border-slate-300 focus:border-slate-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-slate-700">Descrição</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Descreva detalhadamente o problema"
                    required 
                    className="border-slate-300 focus:border-slate-400"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority" className="text-slate-700">Prioridade</Label>
                    <Select name="priority" required>
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Selecione a prioridade" />
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
                    <Label htmlFor="category" className="text-slate-700">Categoria</Label>
                    <Select name="category" required>
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
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
                  <Label className="text-slate-700">Unidade</Label>
                  <Input 
                    value={profile?.unit?.name || 'Unidade não definida'}
                    disabled
                    className="bg-slate-100 border-slate-300"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Sua unidade será automaticamente selecionada
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)} 
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  disabled={createTicketMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-slate-600 hover:bg-slate-700 text-white"
                  disabled={createTicketMutation.isPending}
                >
                  {createTicketMutation.isPending ? 'Criando...' : 'Criar Chamado'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-100/70 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Chamados Abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{openTickets.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-100/70 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Chamados Fechados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{closedTickets.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-100/70 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Equipamentos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{activeAssignments.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-100/70 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Total de Atribuições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{assignments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList className="bg-slate-200 border-slate-300">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-slate-100 text-slate-700">Meus Chamados</TabsTrigger>
          <TabsTrigger value="assignments" className="data-[state=active]:bg-slate-100 text-slate-700">Meus Equipamentos</TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-slate-100 text-slate-700">Perfil</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tickets" className="space-y-4">
          <Card className="bg-slate-100/50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-700">Histórico de Chamados</CardTitle>
              <CardDescription className="text-slate-600">
                Todos os seus chamados de suporte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-600">ID</TableHead>
                    <TableHead className="text-slate-600">Título</TableHead>
                    <TableHead className="text-slate-600">Unidade</TableHead>
                    <TableHead className="text-slate-600">Categoria</TableHead>
                    <TableHead className="text-slate-600">Prioridade</TableHead>
                    <TableHead className="text-slate-600">Status</TableHead>
                    <TableHead className="text-slate-600">Criado em</TableHead>
                    <TableHead className="text-slate-600">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-slate-200">
                      <TableCell className="font-medium text-slate-700">
                        #{ticket.ticket_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-700">{ticket.title}</div>
                          <div className="text-sm text-slate-500">
                            {ticket.description.length > 40 
                              ? `${ticket.description.substring(0, 40)}...` 
                              : ticket.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{ticket.unit?.name}</TableCell>
                      <TableCell className="text-slate-600">{getCategoryLabel(ticket.category)}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(ticket.priority) as any}>
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(ticket.status) as any}>
                          {getStatusLabel(ticket.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
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
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o chamado #{ticket.ticket_number}? 
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTicket(ticket.id)}
                                      className="bg-red-600 hover:bg-red-700"
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
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assignments" className="space-y-4">
          <EquipmentRequestsSection />
          
          <Card className="bg-slate-100/50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-700">Histórico de Equipamentos</CardTitle>
              <CardDescription className="text-slate-600">
                Todos os equipamentos que você utilizou ou está utilizando
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-600">Equipamento</TableHead>
                    <TableHead className="text-slate-600">Tipo</TableHead>
                    <TableHead className="text-slate-600">Marca/Modelo</TableHead>
                    <TableHead className="text-slate-600">Data de Início</TableHead>
                    <TableHead className="text-slate-600">Data de Fim</TableHead>
                    <TableHead className="text-slate-600">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id} className="border-slate-200">
                      <TableCell className="font-medium text-slate-700">
                        {assignment.equipment.name}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {assignment.equipment.type}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {assignment.equipment.brand && assignment.equipment.model 
                          ? `${assignment.equipment.brand} ${assignment.equipment.model}`
                          : assignment.equipment.brand || assignment.equipment.model || '-'
                        }
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(assignment.start_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {assignment.end_date 
                          ? new Date(assignment.end_date).toLocaleDateString('pt-BR') 
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={getAssignmentStatusColor(assignment.status) as any}>
                          {assignment.status === 'ativo' ? 'Ativo' : 'Finalizado'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <UserProfileSection />
        </TabsContent>
      </Tabs>

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

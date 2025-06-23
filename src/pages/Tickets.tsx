import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ImageUpload } from "@/components/ImageUpload";
import { useTickets, useCreateTicket } from "@/hooks/useTickets";
import { useCreateUserTicket, useDeleteUserTicket } from "@/hooks/useUserTickets";
import { useUnits } from "@/hooks/useUnits";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { useTechnicianUnits } from "@/hooks/useTechnicianUnits";
import { TicketFilters } from "@/components/TicketFilters";
import { TicketDetailsDialog } from "@/components/TicketDetailsDialog";
import { EditTicketDialog } from "@/components/EditTicketDialog";
import { useUpdateTicketStatus, useAssignTicket } from "@/hooks/useTicketStatus";
import { Edit, Plus, Eye, Clock, User, MapPin, Trash2, UserCheck } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
export default function Tickets() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [attachmentImages, setAttachmentImages] = useState<File[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const {
    user,
    profile
  } = useAuth();
  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    error: ticketsError
  } = useTickets();
  const {
    data: allUnits = []
  } = useUnits();
  const {
    data: technicianUnits = []
  } = useTechnicianUnits(profile?.id);
  const {
    data: profiles = []
  } = useProfiles();
  const createUserTicket = useCreateUserTicket();
  const deleteTicket = useDeleteUserTicket();
  const updateStatus = useUpdateTicketStatus();
  const assignTicket = useAssignTicket();

  // Determinar unidades disponíveis baseado no papel do usuário
  const availableUnits = profile?.role === 'admin' ? allUnits : technicianUnits.map(tu => ({
    id: tu.unit_id,
    name: tu.unit?.name || ''
  }));

  // Filtrar técnicos
  const technicians = profiles.filter(profile => profile.role === 'technician' || profile.role === 'admin');

  // Filtrar usuários regulares
  const systemUsers = profiles.filter(profile => profile.role === 'user');

  // Aplicar filtros
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchTerm || ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) || ticket.requester?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    const matchesAssignee = assigneeFilter === 'all' || assigneeFilter === 'unassigned' && !ticket.assignee_id || assigneeFilter === 'pending' && !ticket.assignee_id || ticket.assignee_id === assigneeFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssignee;
  });

  // Calcular estatísticas incluindo pendentes
  const pendingTickets = tickets.filter(t => !t.assignee_id);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'aguardando':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
      case 'fechado':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'alta':
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'baixa':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };
  const isPendingTicket = (ticket: any) => {
    return !ticket.assignee_id;
  };
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const ticketData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as any,
      category: formData.get('category') as any,
      requester_id: user.id,
      unit_id: formData.get('unit_id') as string
    };
    await createUserTicket.mutateAsync({
      ...ticketData,
      images: attachmentImages
    });
    setIsCreateDialogOpen(false);
    setAttachmentImages([]);
  };
  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    await updateStatus.mutateAsync({
      id: ticketId,
      status: newStatus as any
    });
  };
  const handleAssigneeChange = async (ticketId: string, assigneeId: string) => {
    const actualAssigneeId = assigneeId === 'unassigned' ? null : assigneeId;
    await assignTicket.mutateAsync({
      id: ticketId,
      assigneeId: actualAssigneeId
    });
  };
  const handleAssignToSelf = async (ticketId: string) => {
    if (!profile?.id) return;
    await assignTicket.mutateAsync({
      id: ticketId,
      assigneeId: profile.id
    });
  };
  const handleDeleteTicket = async (ticketId: string) => {
    await deleteTicket.mutateAsync(ticketId);
  };
  const openTicketDetails = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsDetailsDialogOpen(true);
  };
  const openEditDialog = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsEditDialogOpen(true);
  };
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setAssigneeFilter('all');
  };

  // Verificar se o usuário pode editar/excluir chamados
  const canEditTicket = (ticket: any) => {
    return profile?.role === 'admin';
  };

  // Verificar se o usuário pode se atribuir ao chamado
  const canAssignToSelf = (ticket: any) => {
    return (profile?.role === 'technician' || profile?.role === 'admin') && !ticket.assignee_id;
  };
  if (ticketsLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando chamados...</div>
      </div>;
  }
  if (ticketsError) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Erro ao carregar chamados: {ticketsError.message}</div>
      </div>;
  }
  return <div className="space-y-4 md:space-y-6 bg-background min-h-screen p-3 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Chamados</h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Gerencie todos os chamados de suporte
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="text-primary-foreground w-full sm:w-auto bg-zinc-600 hover:bg-zinc-500">
              <Plus className="mr-2 h-4 w-4" />
              Novo Chamado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-card mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Chamado</DialogTitle>
              <DialogDescription>
                Preencha as informações do chamado de suporte
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-foreground">Título</Label>
                  <Input id="title" name="title" placeholder="Descreva brevemente o problema" required className="border-input focus:border-ring" />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-foreground">Descrição</Label>
                  <Textarea id="description" name="description" placeholder="Descreva detalhadamente o problema" required className="border-input focus:border-ring min-h-[100px]" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority" className="text-foreground">Prioridade</Label>
                    <Select name="priority" defaultValue="media">
                      <SelectTrigger className="border-input">
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
                    <Label htmlFor="category" className="text-foreground">Categoria</Label>
                    <Select name="category">
                      <SelectTrigger className="border-input">
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
                
                <div>
                  <Label htmlFor="unit_id" className="text-foreground">
                    Unidade {profile?.role === 'admin' ? '(Todas disponíveis)' : '(Suas unidades atribuídas)'}
                  </Label>
                  <Select name="unit_id">
                    <SelectTrigger className="border-input">
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map(unit => <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Upload de Anexos */}
                <div className="border-t border-border pt-4">
                  <ImageUpload images={attachmentImages} onImagesChange={setAttachmentImages} maxImages={5} />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                setAttachmentImages([]);
              }} className="border-input text-muted-foreground hover:bg-muted" disabled={createUserTicket.isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createUserTicket.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {createUserTicket.isPending ? 'Criando...' : 'Criar Chamado'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <TicketFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} priorityFilter={priorityFilter} onPriorityFilterChange={setPriorityFilter} categoryFilter={categoryFilter} onCategoryFilterChange={setCategoryFilter} assigneeFilter={assigneeFilter} onAssigneeFilterChange={setAssigneeFilter} onClearFilters={clearFilters} technicians={technicians} />

      {/* Estatísticas - Incluindo chamados pendentes */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-400"></div>
              <span className="text-xs md:text-sm text-muted-foreground">Pendentes</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">
              {pendingTickets.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <span className="text-xs md:text-sm text-muted-foreground">Abertos</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">
              {tickets.filter(t => t.status === 'aberto').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="text-xs md:text-sm text-muted-foreground">Em Andamento</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">
              {tickets.filter(t => t.status === 'em_andamento').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              <span className="text-xs md:text-sm text-muted-foreground">Aguardando</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">
              {tickets.filter(t => t.status === 'aguardando').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs md:text-sm text-muted-foreground">Fechados</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">
              {tickets.filter(t => t.status === 'fechado').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Chamados */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-lg md:text-xl">Lista de Chamados</CardTitle>
          <CardDescription className="text-muted-foreground">
            {filteredTickets.length} de {tickets.length} chamados
            {pendingTickets.length > 0 && <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs dark:bg-orange-900/20 dark:text-orange-400">
                {pendingTickets.length} pendente(s)
              </span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Tabela para desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">#</TableHead>
                  <TableHead className="text-muted-foreground">Título</TableHead>
                  <TableHead className="text-muted-foreground">Solicitante</TableHead>
                  <TableHead className="text-muted-foreground">Unidade</TableHead>
                  <TableHead className="text-muted-foreground">Categoria</TableHead>
                  <TableHead className="text-muted-foreground">Prioridade</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Técnico</TableHead>
                  <TableHead className="text-muted-foreground">Criado</TableHead>
                  <TableHead className="text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map(ticket => <TableRow key={ticket.id} className={`border-border hover:bg-muted/50 ${isPendingTicket(ticket) ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}>
                    <TableCell className="font-medium text-foreground">
                      #{ticket.ticket_number}
                      {isPendingTicket(ticket) && <Badge variant="outline" className="ml-2 text-xs bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                          Pendente
                        </Badge>}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{ticket.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {ticket.description.length > 50 ? `${ticket.description.substring(0, 50)}...` : ticket.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{ticket.requester?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{ticket.unit?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-foreground">{ticket.category}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getPriorityColor(ticket.priority)} capitalize`}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={ticket.status} onValueChange={value => handleStatusChange(ticket.id, value)}>
                        <SelectTrigger className="w-32 bg-background border-input">
                          <Badge className={`${getStatusColor(ticket.status)} capitalize border-0`}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aberto">Aberto</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="aguardando">Aguardando</SelectItem>
                          <SelectItem value="fechado">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={ticket.assignee_id || 'unassigned'} onValueChange={value => handleAssigneeChange(ticket.id, value)}>
                        <SelectTrigger className="w-32 bg-background border-input">
                          <SelectValue placeholder="Atribuir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Não atribuído</SelectItem>
                          {technicians.map(tech => <SelectItem key={tech.id} value={tech.id}>
                              {tech.name}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(ticket.created_at), 'dd/MM/yyyy', {
                        locale: ptBR
                      })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openTicketDetails(ticket)} className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canAssignToSelf(ticket) && <Button variant="ghost" size="sm" onClick={() => handleAssignToSelf(ticket.id)} className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30" title="Assumir chamado">
                            <UserCheck className="h-4 w-4" />
                          </Button>}
                        {canEditTicket(ticket) && <>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(ticket)} className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/30">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o chamado #{ticket.ticket_number}? 
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTicket(ticket.id)} className="bg-red-600 hover:bg-red-700">
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>}
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>

          {/* Cards para mobile e tablet */}
          <div className="lg:hidden space-y-4 p-4">
            {filteredTickets.map(ticket => <Card key={ticket.id} className={`border border-border ${isPendingTicket(ticket) ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800' : ''}`}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground">#{ticket.ticket_number} - {ticket.title}</h3>
                          {isPendingTicket(ticket) && <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                              Pendente
                            </Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {ticket.description.length > 100 ? `${ticket.description.substring(0, 100)}...` : ticket.description}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button variant="ghost" size="sm" onClick={() => openTicketDetails(ticket)} className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canAssignToSelf(ticket) && <Button variant="ghost" size="sm" onClick={() => handleAssignToSelf(ticket.id)} className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30" title="Assumir chamado">
                            <UserCheck className="h-4 w-4" />
                          </Button>}
                        {canEditTicket(ticket) && <>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(ticket)} className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/30">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o chamado #{ticket.ticket_number}? 
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTicket(ticket.id)} className="bg-red-600 hover:bg-red-700">
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Solicitante:</span>
                        <div className="font-medium text-foreground">{ticket.requester?.name}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unidade:</span>
                        <div className="font-medium text-foreground">{ticket.unit?.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`${getStatusColor(ticket.status)} capitalize text-xs`}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={`${getPriorityColor(ticket.priority)} capitalize text-xs`}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-border">
                        {ticket.category}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Criado em {format(new Date(ticket.created_at), 'dd/MM/yyyy', {
                    locale: ptBR
                  })}
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>
          
          {filteredTickets.length === 0 && <div className="text-center py-8 text-muted-foreground">
              Nenhum chamado encontrado com os filtros aplicados
            </div>}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <TicketDetailsDialog ticket={selectedTicket} open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen} units={availableUnits} technicians={technicians} />

      {/* Dialog de Edição */}
      <EditTicketDialog ticket={selectedTicket} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
    </div>;
}
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar as CalendarIcon, Wrench, Ticket, FileText, Search } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useCreateTask } from '@/hooks/useKanbanTasks'
import { useAvailableUsers } from '@/hooks/useAvailableUsers'
import { useAvailableEquipment, useAvailableTickets } from '@/hooks/useKanbanIntegrations'
import { KanbanColumn } from '@/hooks/useKanbanColumns'

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: string
  defaultStatus: string
  columns: KanbanColumn[]
}

export function CreateTaskDialog({ open, onOpenChange, boardId, defaultStatus, columns }: CreateTaskDialogProps) {
  const [activeTab, setActiveTab] = useState('custom')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: defaultStatus,
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    task_type: 'custom' as 'custom' | 'equipment' | 'ticket',
    equipment_id: '',
    ticket_id: ''
  })
  
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [equipmentSearch, setEquipmentSearch] = useState('')
  const [ticketSearch, setTicketSearch] = useState('')

  const createTask = useCreateTask()
  const { data: users } = useAvailableUsers()
  const { data: equipment } = useAvailableEquipment()
  const { data: tickets } = useAvailableTickets()

  // Filtrar equipamentos baseado na busca
  const filteredEquipment = equipment?.filter(eq => 
    eq.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    eq.type.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    eq.tombamento?.toLowerCase().includes(equipmentSearch.toLowerCase())
  )

  // Filtrar tickets baseado na busca
  const filteredTickets = tickets?.filter(ticket => 
    ticket.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
    ticket.ticket_number.toString().includes(ticketSearch) ||
    ticket.description.toLowerCase().includes(ticketSearch.toLowerCase())
  )

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: defaultStatus,
      priority: 'medium',
      assigned_to: '',
      due_date: '',
      task_type: 'custom',
      equipment_id: '',
      ticket_id: ''
    })
    setSelectedDate(undefined)
    setActiveTab('custom')
    setEquipmentSearch('')
    setTicketSearch('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let taskData: any = {
      board_id: boardId,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      status: formData.status,
      priority: formData.priority,
      assigned_to: formData.assigned_to || undefined,
      due_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
      task_type: formData.task_type,
    }

    if (formData.task_type === 'equipment' && formData.equipment_id) {
      taskData.equipment_id = formData.equipment_id
    }

    if (formData.task_type === 'ticket' && formData.ticket_id) {
      taskData.ticket_id = formData.ticket_id
    }

    await createTask.mutateAsync(taskData)
    resetForm()
    onOpenChange(false)
  }

  const handleEquipmentSelect = (equipmentId: string) => {
    const selectedEquipment = equipment?.find(eq => eq.id === equipmentId)
    if (selectedEquipment) {
      setFormData(prev => ({
        ...prev,
        task_type: 'equipment',
        equipment_id: equipmentId,
        title: `Equipamento: ${selectedEquipment.name}`,
        description: `Tipo: ${selectedEquipment.type}\nTombamento: ${selectedEquipment.tombamento || 'N/A'}\nStatus: ${selectedEquipment.status}`
      }))
    }
  }

  const handleTicketSelect = (ticketId: string) => {
    const selectedTicket = tickets?.find(t => t.id === ticketId)
    if (selectedTicket) {
      setFormData(prev => ({
        ...prev,
        task_type: 'ticket',
        ticket_id: ticketId,
        title: `Ticket #${selectedTicket.ticket_number}: ${selectedTicket.title}`,
        description: selectedTicket.description
      }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value)
          if (value === 'custom') {
            setFormData(prev => ({ ...prev, task_type: 'custom', equipment_id: '', ticket_id: '' }))
          }
        }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Personalizada
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Equipamento
            </TabsTrigger>
            <TabsTrigger value="ticket" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Chamado
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Digite o título da tarefa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva a tarefa"
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="equipment" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Buscar Equipamento</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Busque por nome, tipo ou tombamento..."
                      value={equipmentSearch}
                      onChange={(e) => setEquipmentSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredEquipment?.map((eq) => (
                    <div
                      key={eq.id}
                      className={`
                        p-3 border rounded-lg cursor-pointer transition-colors
                        ${formData.equipment_id === eq.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                        }
                      `}
                      onClick={() => handleEquipmentSelect(eq.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{eq.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {eq.type} • Tombamento: {eq.tombamento || 'N/A'}
                          </p>
                        </div>
                        <Badge variant={eq.status === 'disponivel' ? 'default' : 'secondary'}>
                          {eq.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ticket" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Buscar Chamado</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Busque por título, número ou descrição..."
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredTickets?.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`
                        p-3 border rounded-lg cursor-pointer transition-colors
                        ${formData.ticket_id === ticket.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                        }
                      `}
                      onClick={() => handleTicketSelect(ticket.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">#{ticket.ticket_number} - {ticket.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {ticket.description}
                          </p>
                          {ticket.profiles && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Solicitado por: {ticket.profiles.name}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={ticket.status === 'aberto' ? 'destructive' : 'default'}>
                            {ticket.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {ticket.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <Separator />

            {/* Campos comuns a todos os tipos de tarefa */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: string) => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((column) => (
                      <SelectItem key={column.id} value={column.name}>
                        {column.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value: string) => 
                    setFormData(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select 
                  value={formData.assigned_to} 
                  onValueChange={(value: string) => 
                    setFormData(prev => ({ ...prev, assigned_to: value === "none" ? "" : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data de Vencimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Mostrar título e descrição preenchidos automaticamente */}
            {(formData.task_type === 'equipment' || formData.task_type === 'ticket') && formData.title && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="preview-title">Título da Tarefa</Label>
                  <Input
                    id="preview-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preview-description">Descrição</Label>
                  <Textarea
                    id="preview-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm()
                  onOpenChange(false)
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={!formData.title.trim() || createTask.isPending}
              >
                {createTask.isPending ? 'Criando...' : 'Criar Tarefa'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
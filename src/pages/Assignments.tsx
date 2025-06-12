
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

interface Assignment {
  id: string
  equipmentId: string
  equipmentName: string
  userId: string
  userName: string
  userDepartment: string
  assignedDate: string
  returnDate?: string
  status: "Ativo" | "Finalizado"
  notes?: string
}

const mockAssignments: Assignment[] = [
  {
    id: "AS-001",
    equipmentId: "EQ-001",
    equipmentName: "Desktop Marketing 01",
    userId: "USR-001",
    userName: "João Silva",
    userDepartment: "Marketing",
    assignedDate: "2024-01-15",
    status: "Ativo",
    notes: "Computador principal para designer"
  },
  {
    id: "AS-002",
    equipmentId: "EQ-004",
    equipmentName: "Notebook Vendas 02",
    userId: "USR-002",
    userName: "Maria Santos",
    userDepartment: "Vendas",
    assignedDate: "2024-02-01",
    returnDate: "2024-05-30",
    status: "Finalizado",
    notes: "Empréstimo para trabalho remoto"
  },
  {
    id: "AS-003",
    equipmentId: "EQ-005",
    equipmentName: "Tablet Apresentações",
    userId: "USR-003",
    userName: "Carlos Oliveira",
    userDepartment: "Comercial",
    assignedDate: "2024-03-10",
    status: "Ativo",
    notes: "Para apresentações em campo"
  }
]

const availableEquipment = [
  { id: "EQ-002", name: "Monitor Financeiro" },
  { id: "EQ-006", name: "Notebook Backup 01" },
  { id: "EQ-007", name: "Tablet Suporte" }
]

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const newAssignment: Assignment = {
      id: `AS-${String(assignments.length + 1).padStart(3, '0')}`,
      equipmentId: formData.get('equipmentId') as string,
      equipmentName: availableEquipment.find(eq => eq.id === formData.get('equipmentId'))?.name || '',
      userId: `USR-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      userName: formData.get('userName') as string,
      userDepartment: formData.get('userDepartment') as string,
      assignedDate: formData.get('assignedDate') as string,
      status: "Ativo",
      notes: formData.get('notes') as string || undefined
    }

    setAssignments([newAssignment, ...assignments])
    setIsDialogOpen(false)
    toast({
      title: "Equipamento atribuído com sucesso!",
      description: `${newAssignment.equipmentName} foi atribuído a ${newAssignment.userName}.`,
    })
  }

  const handleReturn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssignment) return

    const formData = new FormData(e.target as HTMLFormElement)
    const returnDate = formData.get('returnDate') as string

    setAssignments(assignments.map(assignment => 
      assignment.id === selectedAssignment.id 
        ? { ...assignment, returnDate, status: "Finalizado" as const }
        : assignment
    ))
    
    setIsReturnDialogOpen(false)
    setSelectedAssignment(null)
    toast({
      title: "Equipamento devolvido com sucesso!",
      description: `${selectedAssignment.equipmentName} foi devolvido por ${selectedAssignment.userName}.`,
    })
  }

  const handleReturnClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setIsReturnDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Atribuições de Equipamentos</h2>
          <p className="text-muted-foreground">
            Controle de equipamentos entregues aos usuários
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Nova Atribuição</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Atribuir Equipamento</DialogTitle>
              <DialogDescription>
                Entregue um equipamento para um usuário
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="equipmentId">Equipamento</Label>
                  <Select name="equipmentId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o equipamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEquipment.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.id}>
                          {equipment.name} ({equipment.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="userName">Nome do Usuário</Label>
                  <Input 
                    id="userName" 
                    name="userName" 
                    placeholder="Nome completo do usuário"
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="userDepartment">Departamento</Label>
                  <Input 
                    id="userDepartment" 
                    name="userDepartment" 
                    placeholder="Departamento do usuário"
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="assignedDate">Data de Entrega</Label>
                  <Input 
                    id="assignedDate" 
                    name="assignedDate" 
                    type="date"
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Input 
                    id="notes" 
                    name="notes" 
                    placeholder="Observações sobre a atribuição (opcional)"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Atribuir Equipamento</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog para devolução */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Registrar Devolução</DialogTitle>
            <DialogDescription>
              {selectedAssignment && (
                <>Registre a devolução de {selectedAssignment.equipmentName} por {selectedAssignment.userName}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReturn} className="space-y-4">
            <div>
              <Label htmlFor="returnDate">Data de Devolução</Label>
              <Input 
                id="returnDate" 
                name="returnDate" 
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                required 
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsReturnDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Registrar Devolução</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Equipamentos em Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignments.filter(a => a.status === "Ativo").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Atualmente atribuídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Devoluções este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignments.filter(a => a.status === "Finalizado" && a.returnDate && new Date(a.returnDate).getMonth() === new Date().getMonth()).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Equipamentos devolvidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Atribuições
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">
              Histórico completo
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atribuições</CardTitle>
          <CardDescription>
            Registro completo de equipamentos entregues e devolvidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Data Entrega</TableHead>
                <TableHead>Data Devolução</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{assignment.equipmentName}</div>
                      <div className="text-sm text-muted-foreground">{assignment.equipmentId}</div>
                    </div>
                  </TableCell>
                  <TableCell>{assignment.userName}</TableCell>
                  <TableCell>{assignment.userDepartment}</TableCell>
                  <TableCell>{assignment.assignedDate}</TableCell>
                  <TableCell>{assignment.returnDate || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={assignment.status === "Ativo" ? "default" : "outline"}>
                      {assignment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {assignment.status === "Ativo" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleReturnClick(assignment)}
                      >
                        Registrar Devolução
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

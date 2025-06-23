
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAssignments } from "@/hooks/useAssignments"
import { useAvailableUsers } from "@/hooks/useAvailableUsers"
import { useAvailableEquipment } from "@/hooks/useAvailableEquipment"
import { useCreateAssignment } from "@/hooks/useCreateAssignment"
import { toast } from "@/hooks/use-toast"

interface Assignment {
  id: string
  user_id: string
  equipment_id: string
  start_date: string
  end_date: string
  notes: string
  status: 'active' | 'inactive' | 'returned'
  created_at: string
  updated_at: string
}

interface User {
  id: string
  name: string
  email: string
  avatar_url: string
  unit_id: string
  role: string
}

interface Equipment {
  id: string
  name: string
  description: string
  serial_number: string
  status: 'active' | 'inactive' | 'available' | 'unavailable'
  created_at: string
  updated_at: string
}

export function AssignmentManagementSection() {
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedEquipment, setSelectedEquipment] = useState<string>('')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [notes, setNotes] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const { data: assignments, isLoading: assignmentsLoading } = useAssignments()
  const { users, loading: usersLoading } = useAvailableUsers()
  const { data: equipment, isLoading: equipmentLoading } = useAvailableEquipment()
  const { mutate: createAssignment, isPending: createLoading } = useCreateAssignment()

  const handleCreateAssignment = async () => {
    if (!selectedUser || !selectedEquipment || !startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive"
      })
      return
    }

    try {
      createAssignment({
        user_id: selectedUser,
        equipment_id: selectedEquipment,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        notes
      })

      toast({
        title: "Sucesso",
        description: "Atribuição criada com sucesso",
      })

      // Limpar os campos após a criação
      setSelectedUser('')
      setSelectedEquipment('')
      setStartDate(undefined)
      setEndDate(undefined)
      setNotes('')
      setIsCreateDialogOpen(false)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar atribuição",
        variant: "destructive"
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gerenciar Atribuições</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="user">Usuário</Label>
            <Select onValueChange={setSelectedUser}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="equipment">Equipamento</Label>
            <Select onValueChange={setSelectedEquipment}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um equipamento" />
              </SelectTrigger>
              <SelectContent>
                {equipment?.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>{eq.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Data de Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  {startDate ? (
                    startDate?.toLocaleDateString()
                  ) : (
                    <span>Escolha uma data</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Data de Término</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  {endDate ? (
                    endDate?.toLocaleDateString()
                  ) : (
                    <span>Escolha uma data</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Observações</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button onClick={handleCreateAssignment} disabled={createLoading}>
          Criar Atribuição
        </Button>
      </CardContent>
    </Card>
  )
}

function cn(...inputs: any[]): string {
  return inputs.filter(Boolean).join(' ')
}

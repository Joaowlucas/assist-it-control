
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCreateChatRoom } from '@/hooks/useChat'
import { useUnits } from '@/hooks/useUnits'
import { useToast } from '@/hooks/use-toast'
import { Users, Building2 } from 'lucide-react'

interface CreateGroupRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoomCreated?: (roomId: string) => void
}

export function CreateGroupRoomDialog({ 
  open, 
  onOpenChange, 
  onRoomCreated 
}: CreateGroupRoomDialogProps) {
  const [roomName, setRoomName] = useState('')
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  
  const { data: units = [] } = useUnits()
  const createRoom = useCreateChatRoom()
  const { toast } = useToast()

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do grupo é obrigatório",
        variant: "destructive",
      })
      return
    }

    if (selectedUnits.length === 0) {
      toast({
        title: "Erro", 
        description: "Selecione pelo menos uma unidade",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      const roomId = await createRoom.mutateAsync({
        name: roomName,
        type: 'group',
        selectedUnits: selectedUnits
      })

      toast({
        title: "Sucesso",
        description: "Grupo criado com sucesso!",
      })

      onRoomCreated?.(roomId)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Error creating group room:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar grupo. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setRoomName('')
    setSelectedUnits([])
  }

  const handleUnitToggle = (unitId: string) => {
    setSelectedUnits(prev => 
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    )
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        onOpenChange(newOpen)
        if (!newOpen) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Criar Grupo
          </DialogTitle>
          <DialogDescription>
            Crie um grupo para múltiplas unidades colaborarem
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Nome do Grupo</Label>
            <Input
              id="room-name"
              placeholder="Ex: Grupo TI Geral"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Unidades Participantes</Label>
            <ScrollArea className="h-32 border rounded-md p-2">
              <div className="space-y-2">
                {units.map((unit) => (
                  <div key={unit.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={unit.id}
                      checked={selectedUnits.includes(unit.id)}
                      onCheckedChange={() => handleUnitToggle(unit.id)}
                    />
                    <Label
                      htmlFor={unit.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Building2 className="h-4 w-4" />
                      {unit.name}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <p className="text-xs text-muted-foreground">
              {selectedUnits.length} unidade(s) selecionada(s)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateRoom}
              disabled={isCreating || !roomName.trim() || selectedUnits.length === 0}
              className="flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Criando...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Criar Grupo
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateChatRoom } from '@/hooks/useChat'
import { useUnits } from '@/hooks/useUnits'
import { useToast } from '@/hooks/use-toast'
import { Building2 } from 'lucide-react'

interface CreateUnitRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoomCreated?: (roomId: string) => void
}

export function CreateUnitRoomDialog({ 
  open, 
  onOpenChange, 
  onRoomCreated 
}: CreateUnitRoomDialogProps) {
  const [roomName, setRoomName] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  
  const { data: units = [] } = useUnits()
  const createRoom = useCreateChatRoom()
  const { toast } = useToast()

  const selectedUnit = units.find(u => u.id === selectedUnitId)

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da sala é obrigatório",
        variant: "destructive",
      })
      return
    }

    if (!selectedUnitId) {
      toast({
        title: "Erro", 
        description: "Selecione uma unidade",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      const roomId = await createRoom.mutateAsync({
        name: roomName,
        type: 'unit',
        unitId: selectedUnitId
      })

      toast({
        title: "Sucesso",
        description: "Sala de unidade criada com sucesso!",
      })

      onRoomCreated?.(roomId)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Error creating unit room:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar sala. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setRoomName('')
    setSelectedUnitId('')
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
            <Building2 className="h-5 w-5" />
            Criar Sala de Unidade
          </DialogTitle>
          <DialogDescription>
            Crie uma sala específica para uma unidade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unit-select">Unidade</Label>
            <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma unidade" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {unit.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room-name">Nome da Sala</Label>
            <Input
              id="room-name"
              placeholder={selectedUnit ? `Sala ${selectedUnit.name}` : "Ex: Sala TI"}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
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
              disabled={isCreating || !roomName.trim() || !selectedUnitId}
              className="flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Criando...
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4" />
                  Criar Sala
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

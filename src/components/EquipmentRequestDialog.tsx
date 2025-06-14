
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCreateEquipmentRequest, CreateEquipmentRequestData } from "@/hooks/useEquipmentRequests"
import { equipmentTypes, specificationsConfig } from "@/constants/equipmentTypes"
import { Plus } from "lucide-react"

export function EquipmentRequestDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<string>("")
  const [specifications, setSpecifications] = useState<Record<string, string>>({})
  
  const createRequestMutation = useCreateEquipmentRequest()
  const { register, handleSubmit, reset, setValue, watch } = useForm<CreateEquipmentRequestData>()
  
  const justification = watch('justification')

  const handleEquipmentTypeChange = (value: string) => {
    setSelectedEquipmentType(value)
    setSpecifications({})
    setValue('equipment_type', value)
  }

  const handleSpecificationChange = (name: string, value: string) => {
    setSpecifications(prev => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (data: CreateEquipmentRequestData) => {
    try {
      await createRequestMutation.mutateAsync({
        ...data,
        specifications
      })
      setIsOpen(false)
      reset()
      setSelectedEquipmentType("")
      setSpecifications({})
    } catch (error) {
      console.error('Error submitting request:', error)
    }
  }

  const currentSpecs = selectedEquipmentType ? specificationsConfig[selectedEquipmentType] || [] : []

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-600 hover:bg-slate-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Solicitar Equipamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-slate-50 border-slate-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-700">Solicitar Novo Equipamento</DialogTitle>
          <DialogDescription className="text-slate-600">
            Preencha os dados do equipamento que você precisa
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4">
            <div>
              <Label className="text-slate-700">Tipo de Equipamento</Label>
              <Select onValueChange={handleEquipmentTypeChange} required>
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecione o tipo de equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEquipmentType && currentSpecs.length > 0 && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-slate-700 text-base">Especificações Técnicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentSpecs.map((spec) => (
                    <div key={spec.name}>
                      <Label className="text-slate-700">{spec.label}</Label>
                      {spec.type === 'select' ? (
                        <Select onValueChange={(value) => handleSpecificationChange(spec.name, value)}>
                          <SelectTrigger className="border-slate-300">
                            <SelectValue placeholder={`Selecione ${spec.label.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {spec.options?.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={spec.type}
                          placeholder={spec.placeholder}
                          onChange={(e) => handleSpecificationChange(spec.name, e.target.value)}
                          className="border-slate-300 focus:border-slate-400"
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div>
              <Label className="text-slate-700">Justificativa</Label>
              <Textarea
                {...register('justification', { required: true })}
                placeholder="Explique por que você precisa deste equipamento e como ele será utilizado"
                className="border-slate-300 focus:border-slate-400"
                rows={4}
              />
              <p className="text-xs text-slate-500 mt-1">
                {justification?.length || 0}/500 caracteres
              </p>
            </div>

            <div>
              <Label className="text-slate-700">Prioridade</Label>
              <Select onValueChange={(value) => setValue('priority', value as any)} required>
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
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
              disabled={createRequestMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-slate-600 hover:bg-slate-700 text-white"
              disabled={createRequestMutation.isPending || !selectedEquipmentType}
            >
              {createRequestMutation.isPending ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


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
import { Plus } from "lucide-react"

interface SpecificationField {
  name: string
  label: string
  type: 'text' | 'number' | 'select'
  options?: string[]
  placeholder?: string
}

const equipmentTypes = [
  { value: 'notebook', label: 'Notebook' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'impressora', label: 'Impressora' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'outros', label: 'Outros' }
]

const specificationsConfig: Record<string, SpecificationField[]> = {
  notebook: [
    { name: 'processor', label: 'Processador', type: 'text', placeholder: 'Ex: Intel Core i5, AMD Ryzen 5' },
    { name: 'ram', label: 'Memória RAM', type: 'select', options: ['4GB', '8GB', '16GB', '32GB'] },
    { name: 'storage', label: 'Armazenamento', type: 'select', options: ['256GB SSD', '512GB SSD', '1TB SSD', '1TB HDD'] },
    { name: 'screen_size', label: 'Tamanho da Tela', type: 'select', options: ['13"', '14"', '15.6"', '17"'] },
    { name: 'graphics', label: 'Placa de Vídeo', type: 'text', placeholder: 'Ex: Integrada, NVIDIA GTX, AMD Radeon' }
  ],
  desktop: [
    { name: 'processor', label: 'Processador', type: 'text', placeholder: 'Ex: Intel Core i5, AMD Ryzen 5' },
    { name: 'ram', label: 'Memória RAM', type: 'select', options: ['8GB', '16GB', '32GB', '64GB'] },
    { name: 'storage', label: 'Armazenamento', type: 'select', options: ['512GB SSD', '1TB SSD', '2TB SSD', '1TB HDD', '2TB HDD'] },
    { name: 'graphics', label: 'Placa de Vídeo', type: 'text', placeholder: 'Ex: Integrada, NVIDIA GTX, AMD Radeon' },
    { name: 'form_factor', label: 'Formato', type: 'select', options: ['Mini PC', 'Torre Compacta', 'Torre Média', 'Torre Completa'] }
  ],
  monitor: [
    { name: 'screen_size', label: 'Tamanho', type: 'select', options: ['21.5"', '23.8"', '27"', '32"', '34"'] },
    { name: 'resolution', label: 'Resolução', type: 'select', options: ['1920x1080 (Full HD)', '2560x1440 (2K)', '3840x2160 (4K)'] },
    { name: 'panel_type', label: 'Tipo de Painel', type: 'select', options: ['IPS', 'VA', 'TN'] },
    { name: 'connections', label: 'Conexões', type: 'text', placeholder: 'Ex: HDMI, DisplayPort, USB-C' }
  ],
  impressora: [
    { name: 'type', label: 'Tipo', type: 'select', options: ['Jato de Tinta', 'Laser', 'Matricial'] },
    { name: 'color', label: 'Cor', type: 'select', options: ['Monocromática', 'Colorida'] },
    { name: 'functions', label: 'Funções', type: 'select', options: ['Apenas Impressão', 'Multifuncional (Scanner/Cópia)'] },
    { name: 'speed', label: 'Velocidade', type: 'text', placeholder: 'Ex: 20 ppm, 30 ppm' }
  ],
  telefone: [
    { name: 'type', label: 'Tipo', type: 'select', options: ['Fixo Analógico', 'IP/VOIP', 'Sem Fio'] },
    { name: 'features', label: 'Recursos', type: 'text', placeholder: 'Ex: Viva-voz, identificador de chamadas' }
  ],
  tablet: [
    { name: 'screen_size', label: 'Tamanho da Tela', type: 'select', options: ['8"', '10"', '11"', '12.9"'] },
    { name: 'storage', label: 'Armazenamento', type: 'select', options: ['32GB', '64GB', '128GB', '256GB'] },
    { name: 'connectivity', label: 'Conectividade', type: 'select', options: ['Wi-Fi', 'Wi-Fi + Celular'] },
    { name: 'os', label: 'Sistema Operacional', type: 'select', options: ['Android', 'iOS', 'Windows'] }
  ],
  outros: [
    { name: 'description', label: 'Descrição do Equipamento', type: 'text', placeholder: 'Descreva o equipamento necessário' },
    { name: 'specifications', label: 'Especificações', type: 'text', placeholder: 'Detalhe as especificações técnicas' }
  ]
}

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

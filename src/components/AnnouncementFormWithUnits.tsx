
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Upload } from 'lucide-react'
import { useImageUpload } from '@/hooks/useImageUpload'
import { UnitSelector } from './UnitSelector'
import { useAuth } from '@/hooks/useAuth'

interface AnnouncementFormWithUnitsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AnnouncementFormData) => Promise<void>
  loading?: boolean
}

export interface AnnouncementFormData {
  title: string
  content: string
  type: 'text' | 'poll' | 'image'
  is_featured: boolean
  media_url?: string
  poll_options?: string[]
  unit_ids: string[]
}

export function AnnouncementFormWithUnits({ 
  open, 
  onOpenChange, 
  onSubmit, 
  loading = false 
}: AnnouncementFormWithUnitsProps) {
  const { profile } = useAuth()
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    type: 'text',
    is_featured: false,
    poll_options: [],
    unit_ids: [],
  })
  const [newPollOption, setNewPollOption] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { uploadImage, uploading } = useImageUpload()

  useEffect(() => {
    if (open && profile) {
      // Pré-selecionar unidade do usuário se ele não for admin
      let defaultUnitIds: string[] = []
      
      if (profile.role === 'user' && profile.unit_id) {
        defaultUnitIds = [profile.unit_id]
      } else if (profile.role === 'technician' && profile.technician_units) {
        // Para técnicos, pré-selecionar todas suas unidades
        defaultUnitIds = profile.technician_units.map(tu => tu.unit_id)
      }
      
      setFormData({
        title: '',
        content: '',
        type: 'text',
        is_featured: false,
        poll_options: [],
        unit_ids: defaultUnitIds,
      })
      setSelectedFile(null)
    }
  }, [open, profile])

  const handleAddPollOption = () => {
    if (newPollOption.trim() && formData.poll_options && formData.poll_options.length < 10) {
      setFormData(prev => ({
        ...prev,
        poll_options: [...(prev.poll_options || []), newPollOption.trim()]
      }))
      setNewPollOption('')
    }
  }

  const handleRemovePollOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      poll_options: prev.poll_options?.filter((_, i) => i !== index)
    }))
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let mediaUrl = formData.media_url

    // Upload da imagem se selecionada
    if (selectedFile && formData.type === 'image') {
      try {
        mediaUrl = await uploadImage(selectedFile)
      } catch (error) {
        console.error('Erro no upload:', error)
        return
      }
    }

    await onSubmit({
      ...formData,
      media_url: mediaUrl,
    })
  }

  const isFormValid = formData.title.trim() && 
    formData.content.trim() && 
    formData.unit_ids.length > 0 &&
    (formData.type !== 'poll' || (formData.poll_options && formData.poll_options.length >= 2)) &&
    (formData.type !== 'image' || selectedFile || formData.media_url)

  const canSetFeatured = profile?.role === 'admin'
  const isUserRole = profile?.role === 'user'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Novo Comunicado
            {isUserRole && (
              <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300">
                Sujeito à aprovação
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Digite o título do comunicado"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'text' | 'poll' | 'image') => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Comunicado de Texto</SelectItem>
                    <SelectItem value="poll">Enquete</SelectItem>
                    <SelectItem value="image">Post com Imagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite o conteúdo do comunicado"
                  className="min-h-[120px]"
                  required
                />
              </div>

              {canSetFeatured && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_featured: checked }))
                    }
                  />
                  <Label htmlFor="featured">Marcar como destaque</Label>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <UnitSelector
                selectedUnits={formData.unit_ids}
                onUnitsChange={(units) => setFormData(prev => ({ ...prev, unit_ids: units }))}
                required
              />
            </div>
          </div>

          {formData.type === 'poll' && (
            <div className="space-y-4">
              <Label>Opções da Enquete *</Label>
              
              <div className="flex gap-2">
                <Input
                  value={newPollOption}
                  onChange={(e) => setNewPollOption(e.target.value)}
                  placeholder="Digite uma opção"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPollOption())}
                />
                <Button 
                  type="button" 
                  onClick={handleAddPollOption}
                  disabled={!newPollOption.trim() || (formData.poll_options?.length || 0) >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {formData.poll_options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex-1 justify-between">
                      {option}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePollOption(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  </div>
                ))}
              </div>

              {(formData.poll_options?.length || 0) < 2 && (
                <p className="text-sm text-muted-foreground">
                  Adicione pelo menos 2 opções para a enquete.
                </p>
              )}
            </div>
          )}

          {formData.type === 'image' && (
            <div className="space-y-4">
              <Label>Imagem *</Label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600">
                    Clique para selecionar uma imagem (JPEG/PNG)
                  </p>
                </label>
              </div>

              {selectedFile && (
                <div className="text-sm text-green-600">
                  Arquivo selecionado: {selectedFile.name}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || loading || uploading}
            >
              {loading || uploading ? 'Salvando...' : 
               isUserRole ? 'Enviar para Aprovação' : 'Publicar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

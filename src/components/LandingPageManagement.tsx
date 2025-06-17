
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/useSystemSettings'
import { useLandingPageContent, useCreateLandingPageContent, useUpdateLandingPageContent, useDeleteLandingPageContent } from '@/hooks/useLandingPage'
import { ImageUpload } from '@/components/ImageUpload'
import { Trash2, Edit, Plus, Image, MessageSquare, Eye, EyeOff } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export function LandingPageManagement() {
  const { data: settings } = useSystemSettings()
  const updateSettings = useUpdateSystemSettings()
  const { data: content, refetch } = useLandingPageContent()
  const createContent = useCreateLandingPageContent()
  const updateContent = useUpdateLandingPageContent()
  const deleteContent = useDeleteLandingPageContent()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingContent, setEditingContent] = useState<any>(null)
  const [newContent, setNewContent] = useState({
    type: 'announcement' as 'image' | 'announcement',
    title: '',
    content: '',
    image_url: '',
    display_order: 0
  })

  const handleSettingsUpdate = async (field: string, value: any) => {
    if (!settings) return
    
    await updateSettings.mutateAsync({
      ...settings,
      [field]: value
    })
  }

  const handleCreateContent = async () => {
    try {
      await createContent.mutateAsync({
        ...newContent,
        display_order: (content?.length || 0) + 1
      })
      setNewContent({
        type: 'announcement',
        title: '',
        content: '',
        image_url: '',
        display_order: 0
      })
      setShowCreateDialog(false)
      refetch()
    } catch (error) {
      console.error('Error creating content:', error)
    }
  }

  const handleUpdateContent = async () => {
    if (!editingContent) return
    
    try {
      await updateContent.mutateAsync(editingContent)
      setEditingContent(null)
      refetch()
    } catch (error) {
      console.error('Error updating content:', error)
    }
  }

  const handleDeleteContent = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este conteúdo?')) {
      try {
        await deleteContent.mutateAsync(id)
        refetch()
      } catch (error) {
        console.error('Error deleting content:', error)
      }
    }
  }

  const toggleContentActive = async (contentItem: any) => {
    try {
      await updateContent.mutateAsync({
        ...contentItem,
        is_active: !contentItem.is_active
      })
      refetch()
    } catch (error) {
      console.error('Error toggling content:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Landing Page Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Landing Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings?.landing_page_enabled || false}
              onCheckedChange={(checked) => handleSettingsUpdate('landing_page_enabled', checked)}
            />
            <Label>Habilitar Landing Page</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="landing-title">Título Principal</Label>
              <Input
                id="landing-title"
                value={settings?.landing_page_title || ''}
                onChange={(e) => handleSettingsUpdate('landing_page_title', e.target.value)}
                placeholder="Título da landing page"
              />
            </div>
            <div>
              <Label htmlFor="landing-subtitle">Subtítulo</Label>
              <Input
                id="landing-subtitle"
                value={settings?.landing_page_subtitle || ''}
                onChange={(e) => handleSettingsUpdate('landing_page_subtitle', e.target.value)}
                placeholder="Subtítulo da landing page"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Conteúdo da Landing Page</CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Conteúdo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Conteúdo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo de Conteúdo</Label>
                    <Select 
                      value={newContent.type} 
                      onValueChange={(value: 'image' | 'announcement') => 
                        setNewContent(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Imagem</SelectItem>
                        <SelectItem value="announcement">Comunicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="new-title">Título</Label>
                    <Input
                      id="new-title"
                      value={newContent.title}
                      onChange={(e) => setNewContent(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título do conteúdo"
                    />
                  </div>

                  {newContent.type === 'announcement' && (
                    <div>
                      <Label htmlFor="new-content">Conteúdo</Label>
                      <Textarea
                        id="new-content"
                        value={newContent.content}
                        onChange={(e) => setNewContent(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Texto do comunicado"
                        rows={4}
                      />
                    </div>
                  )}

                  {newContent.type === 'image' && (
                    <div>
                      <Label>Imagem</Label>
                      <ImageUpload
                        onImageUpload={(url) => setNewContent(prev => ({ ...prev, image_url: url }))}
                        currentImage={newContent.image_url}
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateContent} disabled={createContent.isPending}>
                      {createContent.isPending ? 'Criando...' : 'Criar'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {content?.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.type === 'image' ? (
                      <Image className="h-4 w-4" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                    <span className="font-medium">{item.title}</span>
                    <Badge variant={item.is_active ? 'default' : 'secondary'}>
                      {item.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => toggleContentActive(item)}
                    >
                      {item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setEditingContent(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteContent(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {item.type === 'image' && item.image_url && (
                  <img 
                    src={item.image_url} 
                    alt={item.title} 
                    className="w-full h-32 object-cover rounded mt-2"
                  />
                )}
                
                {item.type === 'announcement' && item.content && (
                  <p className="text-sm text-muted-foreground mt-2">{item.content}</p>
                )}
              </div>
            ))}
            
            {(!content || content.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum conteúdo adicionado ainda</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Content Dialog */}
      <Dialog open={!!editingContent} onOpenChange={() => setEditingContent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Conteúdo</DialogTitle>
          </DialogHeader>
          {editingContent && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  value={editingContent.title || ''}
                  onChange={(e) => setEditingContent(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {editingContent.type === 'announcement' && (
                <div>
                  <Label htmlFor="edit-content">Conteúdo</Label>
                  <Textarea
                    id="edit-content"
                    value={editingContent.content || ''}
                    onChange={(e) => setEditingContent(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                  />
                </div>
              )}

              {editingContent.type === 'image' && (
                <div>
                  <Label>Imagem</Label>
                  <ImageUpload
                    onImageUpload={(url) => setEditingContent(prev => ({ ...prev, image_url: url }))}
                    currentImage={editingContent.image_url}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateContent} disabled={updateContent.isPending}>
                  {updateContent.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button variant="outline" onClick={() => setEditingContent(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

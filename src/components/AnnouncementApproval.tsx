
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AnnouncementWithUnits } from '@/hooks/useAnnouncementsWithUnits'
import { useApproveAnnouncement, usePendingAnnouncements } from '@/hooks/useAnnouncementsWithUnits'
import { useUnits } from '@/hooks/useUnits'

export function AnnouncementApproval() {
  const { data: pendingAnnouncements = [], isLoading } = usePendingAnnouncements()
  const { data: units = [] } = useUnits()
  const approveAnnouncement = useApproveAnnouncement()
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementWithUnits | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const handleApprove = async (announcement: AnnouncementWithUnits) => {
    await approveAnnouncement.mutateAsync({
      id: announcement.id,
      approved: true
    })
  }

  const handleReject = async () => {
    if (!selectedAnnouncement) return
    
    await approveAnnouncement.mutateAsync({
      id: selectedAnnouncement.id,
      approved: false,
      reason: rejectionReason
    })
    
    setShowRejectDialog(false)
    setSelectedAnnouncement(null)
    setRejectionReason('')
  }

  const getUnitNames = (unitIds: string[]) => {
    if (unitIds.includes('all')) return 'Todas as unidades'
    return unitIds
      .map(id => units.find(u => u.id === id)?.name)
      .filter(Boolean)
      .join(', ') || 'Unidades não encontradas'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (pendingAnnouncements.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum comunicado pendente</h3>
          <p className="text-muted-foreground">
            Todos os comunicados foram revisados e aprovados.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-amber-500" />
        <h2 className="text-xl font-semibold">
          Comunicados Pendentes de Aprovação ({pendingAnnouncements.length})
        </h2>
      </div>

      <div className="space-y-4">
        {pendingAnnouncements.map((announcement) => (
          <Card key={announcement.id} className="border-l-4 border-l-amber-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={announcement.profiles.avatar_url} />
                    <AvatarFallback>
                      {announcement.profiles.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{announcement.profiles.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(announcement.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  <Clock className="h-3 w-3 mr-1" />
                  Pendente
                </Badge>
              </div>
              
              <CardTitle className="mt-3">{announcement.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="whitespace-pre-wrap text-sm">
                {announcement.content}
              </div>
              
              {announcement.media_url && (
                <div className="rounded-lg overflow-hidden max-w-sm">
                  <img
                    src={announcement.media_url}
                    alt={announcement.title}
                    className="w-full h-auto max-h-48 object-cover"
                  />
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Tipo:</p>
                <Badge variant="secondary">
                  {announcement.type === 'text' && 'Comunicado'}
                  {announcement.type === 'poll' && 'Enquete'}
                  {announcement.type === 'image' && 'Imagem'}
                </Badge>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Unidades:</p>
                <p className="text-sm text-muted-foreground">
                  {getUnitNames(announcement.unit_ids)}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleApprove(announcement)}
                  disabled={approveAnnouncement.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
                
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      onClick={() => setSelectedAnnouncement(announcement)}
                      disabled={approveAnnouncement.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Rejeitar Comunicado</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Informe o motivo da rejeição (opcional):
                      </p>
                      <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Motivo da rejeição..."
                        className="min-h-[100px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowRejectDialog(false)
                            setSelectedAnnouncement(null)
                            setRejectionReason('')
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleReject}
                          disabled={approveAnnouncement.isPending}
                        >
                          Confirmar Rejeição
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

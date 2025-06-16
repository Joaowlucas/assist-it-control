
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationData {
  type: 'ticket' | 'assignment' | 'equipment'
  action: 'created' | 'updated' | 'deleted' | 'assigned' | 'completed'
  entityId: string
  entityData: any
  oldData?: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type, action, entityId, entityData, oldData }: NotificationData = await req.json()

    // Buscar destinatários para este tipo de notificação
    const { data: recipients, error: recipientsError } = await supabaseClient
      .rpc('get_notification_recipients', {
        notification_type: type,
        entity_data: entityData || {}
      })

    if (recipientsError) {
      console.error('Erro ao buscar destinatários:', recipientsError)
      throw recipientsError
    }

    if (!recipients || recipients.length === 0) {
      console.log('Nenhum destinatário encontrado para notificação')
      return new Response(JSON.stringify({ success: true, message: 'Nenhum destinatário encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Configurações da Evolution API
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL')
    const evolutionToken = Deno.env.get('EVOLUTION_API_TOKEN')
    const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME')

    if (!evolutionUrl || !evolutionToken || !instanceName) {
      throw new Error('Configurações da Evolution API não encontradas')
    }

    // Gerar mensagem baseada no tipo e ação
    const message = generateMessage(type, action, entityData, oldData)

    const results = []

    // Enviar mensagem para cada destinatário
    for (const recipient of recipients) {
      try {
        // Limpar e formatar número de telefone
        const phone = recipient.phone.replace(/\D/g, '') // Remove caracteres não numéricos
        
        if (phone.length < 10) {
          console.error(`Telefone inválido para ${recipient.name}: ${recipient.phone}`)
          continue
        }

        // Adicionar código do país se necessário (55 para Brasil)
        const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`

        // Registrar log de notificação
        const { data: logData, error: logError } = await supabaseClient
          .from('notification_logs')
          .insert({
            user_id: recipient.user_id,
            notification_type: type,
            entity_type: type,
            entity_id: entityId,
            phone: formattedPhone,
            message: message,
            status: 'pending'
          })
          .select()
          .single()

        if (logError) {
          console.error('Erro ao criar log de notificação:', logError)
          continue
        }

        // Enviar mensagem via Evolution API
        const evolutionResponse = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionToken,
          },
          body: JSON.stringify({
            number: formattedPhone,
            text: message,
          }),
        })

        const evolutionData = await evolutionResponse.json()

        if (evolutionResponse.ok) {
          // Atualizar log como enviado
          await supabaseClient
            .from('notification_logs')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', logData.id)

          results.push({
            recipient: recipient.name,
            phone: formattedPhone,
            status: 'sent',
            messageId: evolutionData.key?.id || null
          })
        } else {
          // Atualizar log como falha
          await supabaseClient
            .from('notification_logs')
            .update({
              status: 'failed',
              error_message: JSON.stringify(evolutionData)
            })
            .eq('id', logData.id)

          results.push({
            recipient: recipient.name,
            phone: formattedPhone,
            status: 'failed',
            error: evolutionData
          })
        }

      } catch (error) {
        console.error(`Erro ao enviar mensagem para ${recipient.name}:`, error)
        results.push({
          recipient: recipient.name,
          phone: recipient.phone,
          status: 'failed',
          error: error.message
        })
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      totalRecipients: recipients.length,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro na função de notificações:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

function generateMessage(type: string, action: string, entityData: any, oldData?: any): string {
  const baseUrl = 'https://riqievnbraelqrzrovyr.supabase.co'
  
  switch (type) {
    case 'ticket':
      return generateTicketMessage(action, entityData, oldData, baseUrl)
    case 'assignment':
      return generateAssignmentMessage(action, entityData, oldData, baseUrl)
    case 'equipment':
      return generateEquipmentMessage(action, entityData, oldData, baseUrl)
    default:
      return `Nova notificação: ${action} em ${type}`
  }
}

function generateTicketMessage(action: string, data: any, oldData?: any, baseUrl?: string): string {
  const ticketNumber = data.ticket_number || 'N/A'
  const title = data.title || 'Sem título'
  const requesterName = data.requester?.name || 'Usuário desconhecido'
  const priority = data.priority || 'média'
  const status = data.status || 'desconhecido'
  
  switch (action) {
    case 'created':
      return `🎫 *Novo Chamado #${ticketNumber}*

📋 *Título:* ${title}
👤 *Solicitante:* ${requesterName}
🔥 *Prioridade:* ${priority}
📍 *Status:* ${status}

Acesse o sistema para mais detalhes.`

    case 'updated':
      let changes = []
      if (oldData?.status !== data.status) {
        changes.push(`Status: ${oldData?.status} → ${status}`)
      }
      if (oldData?.priority !== data.priority) {
        changes.push(`Prioridade: ${oldData?.priority} → ${priority}`)
      }
      if (oldData?.assignee_id !== data.assignee_id) {
        const assigneeName = data.assignee?.name || 'Não atribuído'
        changes.push(`Atribuído para: ${assigneeName}`)
      }

      return `🔄 *Chamado #${ticketNumber} Atualizado*

📋 *Título:* ${title}

${changes.length > 0 ? '*Alterações:*\n' + changes.map(c => `• ${c}`).join('\n') : 'Detalhes atualizados'}

Acesse o sistema para mais informações.`

    default:
      return `🎫 Chamado #${ticketNumber}: ${action}`
  }
}

function generateAssignmentMessage(action: string, data: any, oldData?: any, baseUrl?: string): string {
  const userName = data.user?.name || 'Usuário desconhecido'
  const equipmentName = data.equipment?.name || 'Equipamento desconhecido'
  const startDate = data.start_date ? new Date(data.start_date).toLocaleDateString('pt-BR') : 'Data não informada'
  
  switch (action) {
    case 'created':
    case 'assigned':
      return `📦 *Nova Atribuição de Equipamento*

👤 *Usuário:* ${userName}
🖥️ *Equipamento:* ${equipmentName}
📅 *Data de Início:* ${startDate}

O equipamento foi atribuído com sucesso.`

    case 'completed':
      const endDate = data.end_date ? new Date(data.end_date).toLocaleDateString('pt-BR') : 'Hoje'
      return `✅ *Atribuição Finalizada*

👤 *Usuário:* ${userName}
🖥️ *Equipamento:* ${equipmentName}
📅 *Data de Devolução:* ${endDate}

O equipamento foi devolvido e está disponível novamente.`

    default:
      return `📦 Atribuição ${action}: ${equipmentName} - ${userName}`
  }
}

function generateEquipmentMessage(action: string, data: any, oldData?: any, baseUrl?: string): string {
  const name = data.name || 'Equipamento sem nome'
  const type = data.type || 'Tipo não informado'
  const tombamento = data.tombamento || 'N/A'
  const status = data.status || 'disponível'
  
  switch (action) {
    case 'created':
      return `🆕 *Novo Equipamento Cadastrado*

🏷️ *Nome:* ${name}
📱 *Tipo:* ${type}
🔢 *Tombamento:* ${tombamento}
📍 *Status:* ${status}

Um novo equipamento foi adicionado ao sistema.`

    case 'updated':
      let changes = []
      if (oldData?.status !== data.status) {
        changes.push(`Status: ${oldData?.status} → ${status}`)
      }
      if (oldData?.location !== data.location && data.location) {
        changes.push(`Localização: ${data.location}`)
      }

      return `🔄 *Equipamento Atualizado*

🏷️ *Nome:* ${name}
🔢 *Tombamento:* ${tombamento}

${changes.length > 0 ? '*Alterações:*\n' + changes.map(c => `• ${c}`).join('\n') : 'Informações atualizadas'}

Acesse o sistema para mais detalhes.`

    default:
      return `🖥️ Equipamento ${action}: ${name} (${tombamento})`
  }
}

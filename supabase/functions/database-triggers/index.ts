
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { table, type, record, old_record } = await req.json()

    console.log(`Trigger acionado: ${table} - ${type}`, { record, old_record })

    // Determinar tipo de notificação e ação
    let notificationType: string
    let action: string
    let entityData: any = record

    switch (table) {
      case 'tickets':
        notificationType = 'tickets'
        action = type === 'INSERT' ? 'created' : 'updated'
        
        // Buscar dados relacionados para tickets
        if (record.requester_id) {
          const { data: requester } = await supabaseClient
            .from('profiles')
            .select('name, email')
            .eq('id', record.requester_id)
            .single()
          entityData.requester = requester
        }

        if (record.assignee_id) {
          const { data: assignee } = await supabaseClient
            .from('profiles')
            .select('name, email')
            .eq('id', record.assignee_id)
            .single()
          entityData.assignee = assignee
        }

        if (record.unit_id) {
          const { data: unit } = await supabaseClient
            .from('units')
            .select('name')
            .eq('id', record.unit_id)
            .single()
          entityData.unit = unit
        }
        break

      case 'assignments':
        notificationType = 'assignments'
        action = type === 'INSERT' ? 'assigned' : 
                 (record.status === 'finalizado' && old_record?.status !== 'finalizado') ? 'completed' : 'updated'

        // Buscar dados relacionados para assignments
        if (record.user_id) {
          const { data: user } = await supabaseClient
            .from('profiles')
            .select('name, email')
            .eq('id', record.user_id)
            .single()
          entityData.user = user
        }

        if (record.equipment_id) {
          const { data: equipment } = await supabaseClient
            .from('equipment')
            .select('name, type, tombamento')
            .eq('id', record.equipment_id)
            .single()
          entityData.equipment = equipment
        }
        break

      case 'equipment':
        notificationType = 'equipment'
        action = type === 'INSERT' ? 'created' : 'updated'

        if (record.unit_id) {
          const { data: unit } = await supabaseClient
            .from('units')
            .select('name')
            .eq('id', record.unit_id)
            .single()
          entityData.unit = unit
        }
        break

      default:
        console.log(`Tabela não configurada para notificações: ${table}`)
        return new Response(JSON.stringify({ success: true, message: 'Tabela não configurada' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
    }

    // Chamar função de notificações WhatsApp
    const { data: notificationResult, error: notificationError } = await supabaseClient.functions.invoke('whatsapp-notifications', {
      body: {
        type: notificationType,
        action: action,
        entityId: record.id,
        entityData: entityData,
        oldData: old_record
      }
    })

    if (notificationError) {
      console.error('Erro ao enviar notificações:', notificationError)
      // Não falhar o trigger por erro de notificação
    }

    console.log('Resultado das notificações:', notificationResult)

    return new Response(JSON.stringify({ 
      success: true, 
      table, 
      type, 
      action,
      notificationResult 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro no trigger:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

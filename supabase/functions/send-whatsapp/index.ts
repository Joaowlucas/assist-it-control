
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendWhatsAppRequest {
  phone: string
  message: string
  notificationId?: string // Torna opcional
  ticketId?: string
  userId?: string
}

// Função para validar número de telefone brasileiro
function validateBrazilianPhone(phone: string): { isValid: boolean; formatted?: string; error?: string } {
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Verificar tamanho mínimo
  if (cleanPhone.length < 10) {
    return { isValid: false, error: 'Número muito curto (mínimo 10 dígitos)' }
  }
  
  // Se tem mais de 13 dígitos, não é válido
  if (cleanPhone.length > 13) {
    return { isValid: false, error: 'Número muito longo (máximo 13 dígitos)' }
  }
  
  let formattedPhone = cleanPhone
  
  // Se não tem código do país, adicionar
  if (!formattedPhone.startsWith('55')) {
    formattedPhone = `55${formattedPhone}`
  }
  
  // Se ficou muito longo após adicionar código do país, remover dígitos extras do início
  if (formattedPhone.length > 13) {
    // Manter apenas os últimos 13 dígitos
    formattedPhone = formattedPhone.slice(-13)
  }
  
  // Se ainda não tem 13 dígitos, pode ser um número local que precisa de formatação
  if (formattedPhone.length < 13) {
    // Para números com 10-11 dígitos, adicionar código 55 do Brasil
    if (formattedPhone.length === 10 || formattedPhone.length === 11) {
      formattedPhone = `55${formattedPhone}`
    }
  }
  
  // Validação final: deve ter exatamente 13 dígitos
  if (formattedPhone.length !== 13) {
    return { isValid: false, error: `Formato inválido (${formattedPhone.length} dígitos, esperado 13)` }
  }
  
  // Verificar se começa com 55 (Brasil)
  if (!formattedPhone.startsWith('55')) {
    return { isValid: false, error: 'Deve ser um número brasileiro (código 55)' }
  }
  
  // Verificar se o DDD é válido (11-99)
  const ddd = formattedPhone.substring(2, 4)
  const dddNumber = parseInt(ddd)
  if (dddNumber < 11 || dddNumber > 99) {
    return { isValid: false, error: `DDD inválido: ${ddd}` }
  }
  
  return { isValid: true, formatted: formattedPhone }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Iniciando envio de WhatsApp ===')
    const { phone, message, notificationId, ticketId, userId }: SendWhatsAppRequest = await req.json()
    
    console.log('Dados recebidos:', { 
      phone: phone?.substring(0, 4) + '****', 
      messageLength: message?.length,
      notificationId 
    })

    // Validações básicas
    if (!phone || !message) {
      throw new Error('Telefone e mensagem são obrigatórios')
    }

    // Validar telefone
    const phoneValidation = validateBrazilianPhone(phone)
    if (!phoneValidation.isValid) {
      throw new Error(`Número de telefone inválido: ${phoneValidation.error}`)
    }
    const formattedPhone = phoneValidation.formatted!

    console.log('Telefone formatado:', formattedPhone.substring(0, 4) + '****')

    // Buscar configurações do sistema
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    console.log('Buscando configurações do sistema...')
    const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/system_settings?select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    })

    if (!settingsResponse.ok) {
      console.error('Erro ao buscar configurações:', settingsResponse.status, settingsResponse.statusText)
      throw new Error(`Erro ao buscar configurações do sistema: ${settingsResponse.status}`)
    }

    const settings = await settingsResponse.json()
    if (!settings || settings.length === 0) {
      console.error('Configurações não encontradas')
      throw new Error('Configurações do sistema não encontradas')
    }

    const systemSettings = settings[0]
    console.log('Configurações carregadas:', {
      whatsapp_enabled: systemSettings.whatsapp_enabled,
      has_api_url: !!systemSettings.evolution_api_url,
      has_token: !!systemSettings.evolution_api_token,
      has_instance: !!systemSettings.evolution_instance_name
    })

    if (!systemSettings.whatsapp_enabled) {
      console.error('WhatsApp não está habilitado')
      throw new Error('WhatsApp não está habilitado nas configurações do sistema')
    }

    if (!systemSettings.evolution_api_url || !systemSettings.evolution_api_token || !systemSettings.evolution_instance_name) {
      console.error('Configurações da Evolution API incompletas:', {
        has_url: !!systemSettings.evolution_api_url,
        has_token: !!systemSettings.evolution_api_token,
        has_instance: !!systemSettings.evolution_instance_name
      })
      throw new Error('Configurações da Evolution API incompletas. Verifique URL, token e nome da instância.')
    }

    // Limpar URL da API - remover /manager se presente
    let cleanApiUrl = systemSettings.evolution_api_url.trim()
    if (cleanApiUrl.endsWith('/')) {
      cleanApiUrl = cleanApiUrl.slice(0, -1)
    }
    if (cleanApiUrl.endsWith('/manager')) {
      cleanApiUrl = cleanApiUrl.slice(0, -8)
    }

    // Preparar dados para envio
    const evolutionPayload = {
      number: formattedPhone,
      text: message,
    }
    
    const evolutionUrl = `${cleanApiUrl}/message/sendText/${systemSettings.evolution_instance_name}`
    
    console.log('Enviando para Evolution API...', {
      url: evolutionUrl,
      instance: systemSettings.evolution_instance_name,
      phone: formattedPhone.substring(0, 4) + '****',
      cleanApiUrl: cleanApiUrl
    })

    // Enviar mensagem via Evolution API
    const evolutionResponse = await fetch(evolutionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': systemSettings.evolution_api_token,
      },
      body: JSON.stringify(evolutionPayload),
      signal: AbortSignal.timeout(30000) // 30 segundos timeout
    })

    console.log('Resposta da Evolution API:', evolutionResponse.status, evolutionResponse.statusText)
    console.log('Headers da resposta:', Object.fromEntries(evolutionResponse.headers.entries()))

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text()
      console.error('Erro da Evolution API:', errorText)
      
      // Mensagens de erro mais específicas
      let errorMessage = `Erro da Evolution API (${evolutionResponse.status})`
      if (evolutionResponse.status === 401) {
        errorMessage = 'Token da Evolution API inválido'
      } else if (evolutionResponse.status === 404) {
        errorMessage = `Instância '${systemSettings.evolution_instance_name}' não encontrada ou endpoint incorreto. Verifique se a URL não contém /manager.`
      } else if (evolutionResponse.status === 400) {
        errorMessage = 'Dados inválidos enviados para a Evolution API'
      } else if (errorText) {
        errorMessage += `: ${errorText}`
      }
      
      throw new Error(errorMessage)
    }

    // Verificar se a resposta é JSON
    const contentType = evolutionResponse.headers.get('content-type')
    let evolutionResult
    if (contentType && contentType.includes('application/json')) {
      evolutionResult = await evolutionResponse.json()
      console.log('Mensagem enviada com sucesso:', {
        messageId: evolutionResult.key?.id,
        status: evolutionResult.status
      })
    } else {
      const responseText = await evolutionResponse.text()
      console.log('Resposta não-JSON da Evolution API:', responseText.substring(0, 200))
      evolutionResult = { status: 'sent', message: 'Enviado com sucesso' }
    }

    // Atualizar notificação como enviada (se existir)
    if (notificationId) {
      console.log('Atualizando status da notificação...')
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_notifications?id=eq.${notificationId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'sent',
          sent_at: new Date().toISOString(),
          evolution_message_id: evolutionResult.key?.id || null,
        }),
      })

      if (!updateResponse.ok) {
        console.error('Erro ao atualizar status da notificação:', updateResponse.status)
        const errorText = await updateResponse.text()
        console.error('Detalhes do erro:', errorText)
      } else {
        console.log('Status da notificação atualizado com sucesso')
      }
    } else {
      console.log('Sem notificationId - mensagem enviada diretamente')
    }

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: evolutionResult.key?.id,
      phone: formattedPhone,
      status: evolutionResult.status || 'sent'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('=== Erro no envio de WhatsApp ===')
    console.error('Erro:', error)
    console.error('Stack:', error.stack)
    
    // Extrair notificationId do request para atualizar a notificação
    let notificationId: string | null = null
    try {
      const requestClone = req.clone()
      const body = await requestClone.json()
      notificationId = body.notificationId
    } catch {
      console.log('Não foi possível extrair notificationId do request')
    }
    
    // Tentar atualizar o status da notificação para failed
    if (notificationId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        
        await fetch(`${supabaseUrl}/rest/v1/whatsapp_notifications?id=eq.${notificationId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Erro desconhecido',
          }),
        })
        console.log('Status da notificação atualizado para failed')
      } catch (updateError) {
        console.error('Erro ao atualizar status de falha:', updateError)
      }
    }
    
    let errorMessage = 'Erro desconhecido'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

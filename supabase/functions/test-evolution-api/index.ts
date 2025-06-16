
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestConnectionRequest {
  url: string
  token: string
  instance: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Testando conexão Evolution API ===')
    const { url, token, instance }: TestConnectionRequest = await req.json()

    console.log('Parâmetros de teste:', {
      url: url,
      hasToken: !!token,
      instance: instance,
      tokenLength: token?.length || 0
    })

    // Validações mais rigorosas
    if (!url || !token || !instance) {
      throw new Error('URL, token e nome da instância são obrigatórios')
    }

    // Verificar se a URL é válida
    let apiUrl: URL
    try {
      apiUrl = new URL(url)
      if (!apiUrl.protocol.startsWith('http')) {
        throw new Error('URL deve começar com http:// ou https://')
      }
    } catch {
      throw new Error('URL da API inválida - formato: https://sua-api.com')
    }

    // Verificar se o token tem tamanho mínimo
    if (token.length < 10) {
      throw new Error('Token parece ser muito curto - verifique se está correto')
    }

    // Verificar se o nome da instância é válido
    if (instance.length < 3) {
      throw new Error('Nome da instância deve ter pelo menos 3 caracteres')
    }

    // Primeiro, testar se a API está respondendo
    console.log('Testando conectividade básica da API...')
    const baseUrl = `${url.replace(/\/$/, '')}`
    
    // Testar endpoint básico primeiro
    try {
      const pingResponse = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          'apikey': token,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 segundos timeout
      })
      
      console.log('Ping response:', pingResponse.status)
      
      if (!pingResponse.ok) {
        // Se der 401/403, é problema de autenticação
        if (pingResponse.status === 401 || pingResponse.status === 403) {
          throw new Error('Token de API inválido ou sem permissões')
        }
        // Se der 404, talvez a URL esteja errada
        if (pingResponse.status === 404) {
          throw new Error('URL da API não encontrada - verifique se está correta')
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          throw new Error('Timeout ao conectar com a API - verifique a URL e conectividade')
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Não foi possível conectar com a API - verifique a URL e se a API está online')
        }
        throw error
      }
      throw new Error('Erro desconhecido ao testar conectividade')
    }

    // Agora testar o estado da conexão da instância
    console.log('Testando estado da instância:', `${baseUrl}/instance/connectionState/${instance}`)
    
    const response = await fetch(`${baseUrl}/instance/connectionState/${instance}`, {
      method: 'GET',
      headers: {
        'apikey': token,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000) // 15 segundos timeout
    })

    console.log('Resposta da API:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro da API:', errorText)
      
      // Mensagens de erro mais específicas
      if (response.status === 401) {
        throw new Error('Token de API inválido')
      } else if (response.status === 404) {
        throw new Error(`Instância '${instance}' não encontrada - verifique o nome`)
      } else if (response.status === 403) {
        throw new Error('Token não tem permissões para acessar esta instância')
      } else {
        throw new Error(`Erro HTTP ${response.status}: ${errorText || response.statusText}`)
      }
    }

    const result = await response.json()
    console.log('Estado da conexão:', result)
    
    // Verificar se a instância está conectada
    let connectionStatus = 'unknown'
    let additionalInfo = ''
    
    if (result.instance) {
      connectionStatus = result.instance.state || 'unknown'
      additionalInfo = result.instance.qrcode ? 'QR Code disponível' : 'Instância configurada'
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      connectionState: result,
      connectionStatus,
      additionalInfo,
      message: `Conexão testada com sucesso! Status: ${connectionStatus}${additionalInfo ? ` - ${additionalInfo}` : ''}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('=== Erro no teste de conexão ===')
    console.error('Erro:', error)
    console.error('Stack:', error.stack)
    
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  messageType: string;
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  pushName: string;
  messageTimestamp: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Webhook WhatsApp recebido');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('Dados recebidos:', JSON.stringify(body, null, 2));

    // Verificar se é uma mensagem recebida (não enviada pelo bot)
    if (!body.data || body.data.key?.fromMe) {
      console.log('Mensagem ignorada: enviada pelo bot ou sem dados');
      return new Response(JSON.stringify({ success: true, message: 'Ignored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messageData: WhatsAppMessage = body.data;
    
    // Extrair texto da mensagem
    let messageText = '';
    if (messageData.message?.conversation) {
      messageText = messageData.message.conversation;
    } else if (messageData.message?.extendedTextMessage?.text) {
      messageText = messageData.message.extendedTextMessage.text;
    }

    if (!messageText || messageText.trim().length === 0) {
      console.log('Mensagem sem texto ignorada');
      return new Response(JSON.stringify({ success: true, message: 'No text' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extrair número de telefone (remover @s.whatsapp.net)
    const phoneNumber = messageData.key.remoteJid.replace('@s.whatsapp.net', '');
    console.log('Número extraído:', phoneNumber);

    // Normalizar número - remover código do país se presente e manter formato consistente
    const normalizePhone = (phone: string): string => {
      // Remove todos os caracteres não numéricos
      const cleaned = phone.replace(/\D/g, '');
      
      // Se começar com 55 (código do Brasil) e tiver mais de 11 dígitos, remove o 55
      if (cleaned.startsWith('55') && cleaned.length > 11) {
        return cleaned.substring(2);
      }
      
      return cleaned;
    };
    
    const normalizedPhone = normalizePhone(phoneNumber);
    console.log('Número normalizado:', normalizedPhone);

    // Buscar usuário pelo telefone (tentando ambos os formatos)
    const { data: userProfiles, error: userError } = await supabase
      .from('profiles')
      .select('id, name, email, unit_id')
      .or(`phone.eq.${phoneNumber},phone.eq.${normalizedPhone}`)
      .eq('status', 'ativo')
      .limit(1);

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      throw userError;
    }

    if (!userProfiles || userProfiles.length === 0) {
      console.log('Usuário não encontrado para o telefone:', phoneNumber);
      
      // Enviar mensagem informando que o número não está cadastrado
      await supabase.functions.invoke('send-whatsapp', {
        body: {
          phone: phoneNumber,
          message: `Olá! Seu número não está cadastrado no sistema. Entre em contato com o administrador para cadastrar seu telefone e poder criar chamados via WhatsApp.`
        }
      });

      return new Response(JSON.stringify({ success: true, message: 'User not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userProfile = userProfiles[0];
    console.log('Usuário encontrado:', userProfile.name);

    // Usar OpenAI para analisar a mensagem e extrair informações
    const aiPrompt = `
Analise a seguinte mensagem de WhatsApp e extraia as informações para criar um chamado de TI:

Mensagem: "${messageText}"

Retorne APENAS um JSON válido com as seguintes informações:
{
  "title": "título curto e claro do problema (máximo 100 caracteres)",
  "description": "descrição detalhada do problema baseada na mensagem",
  "category": "uma das opções: hardware, software, rede, impressora, email, acesso, outros",
  "priority": "uma das opções: baixa, media, alta, critica"
}

Regras:
- Se a mensagem não parecer ser um problema de TI, use category "outros"
- Para problemas urgentes ou que impedem o trabalho, use priority "alta" ou "critica"
- Seja conciso no título mas detalhado na descrição
- Mantenha o contexto original da mensagem do usuário
`;

    console.log('Enviando para OpenAI...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um assistente especializado em análise de chamados de TI. Sempre retorne apenas JSON válido.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const aiResult = await openaiResponse.json();
    const aiContent = aiResult.choices[0].message.content.trim();
    
    console.log('Resposta da IA:', aiContent);

    let ticketData;
    try {
      // Tentar extrair JSON da resposta (pode vir com markdown)
      const jsonMatch = aiContent.match(/\{.*\}/s);
      if (jsonMatch) {
        ticketData = JSON.parse(jsonMatch[0]);
      } else {
        ticketData = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error('Erro ao parsear resposta da IA:', parseError);
      // Fallback para dados padrão
      ticketData = {
        title: 'Chamado via WhatsApp',
        description: messageText,
        category: 'outros',
        priority: 'media'
      };
    }

    console.log('Dados do chamado extraídos:', ticketData);

    // Criar o chamado no sistema
    const { data: newTicket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        title: ticketData.title,
        description: `CHAMADO CRIADO VIA WHATSAPP\n\nMensagem original: "${messageText}"\n\nUsuário: ${userProfile.name}\nTelefone: ${phoneNumber}\n\n${ticketData.description}`,
        category: ticketData.category,
        priority: ticketData.priority,
        requester_id: userProfile.id,
        unit_id: userProfile.unit_id,
        status: 'aberto'
      })
      .select('ticket_number, id')
      .single();

    if (ticketError) {
      console.error('Erro ao criar chamado:', ticketError);
      throw ticketError;
    }

    console.log('Chamado criado:', newTicket);

    // Enviar confirmação via WhatsApp
    const confirmationMessage = `✅ Chamado criado com sucesso!

📋 Número: #${newTicket.ticket_number}
📝 Título: ${ticketData.title}
📂 Categoria: ${ticketData.category}
⚡ Prioridade: ${ticketData.priority}

Sua solicitação foi registrada e será atendida em breve. Você pode acompanhar o status pelo sistema ou aguardar nosso contato.`;

    await supabase.functions.invoke('send-whatsapp', {
      body: {
        phone: phoneNumber,
        message: confirmationMessage,
        ticketId: newTicket.id,
        userId: userProfile.id
      }
    });

    console.log('Confirmação enviada via WhatsApp');

    return new Response(JSON.stringify({ 
      success: true, 
      ticket: newTicket,
      user: userProfile.name 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no webhook WhatsApp:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders
      })
    }

    const { prospect_id, instagram_user_id } = await req.json()

    if (!prospect_id || !instagram_user_id) {
      return new Response(JSON.stringify({ 
        error: 'prospect_id e instagram_user_id son requeridos' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    console.log('🤖 Generando sugerencia para prospecto:', prospect_id)

    // 1. Obtener la API key de OpenAI del usuario
    const { data: user, error: userError } = await supabase
      .from('instagram_users')
      .select('openai_api_key, username')
      .eq('instagram_user_id', instagram_user_id)
      .single()

    if (userError || !user) {
      console.error('❌ Error obteniendo usuario:', userError)
      return new Response(JSON.stringify({ 
        error: 'Usuario no encontrado' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    if (!user.openai_api_key) {
      return new Response(JSON.stringify({ 
        error: 'API Key de OpenAI no configurada',
        needs_api_key: true
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // 2. Obtener información del prospecto
    const { data: prospect, error: prospectError } = await supabase
      .from('prospects')
      .select('username, prospect_instagram_id')
      .eq('id', prospect_id)
      .single()

    if (prospectError || !prospect) {
      console.error('❌ Error obteniendo prospecto:', prospectError)
      return new Response(JSON.stringify({ 
        error: 'Prospecto no encontrado' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // 3. Obtener toda la conversación del prospecto
    const { data: messages, error: messagesError } = await supabase
      .from('prospect_messages')
      .select('*')
      .eq('prospect_id', prospect_id)
      .order('message_timestamp', { ascending: true })

    if (messagesError) {
      console.error('❌ Error obteniendo mensajes:', messagesError)
      return new Response(JSON.stringify({ 
        error: 'Error obteniendo conversación' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No hay conversación disponible para analizar' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // 4. Construir el contexto de la conversación
    const conversationContext = messages.map(msg => {
      const sender = msg.is_from_prospect ? prospect.username : user.username
      const timestamp = new Date(msg.message_timestamp).toLocaleString()
      return `[${timestamp}] ${sender}: ${msg.message_text || '[Mensaje sin texto]'}`
    }).join('\n')

    console.log('📝 Contexto de conversación preparado:', conversationContext.length, 'caracteres')

    // 5. Preparar el prompt para OpenAI
    const systemPrompt = `Eres un experto en ventas conversacionales y prospección por Instagram. Tu objetivo es analizar conversaciones y sugerir el siguiente mensaje más efectivo para:

OBJETIVOS PRINCIPALES:
1. Agendar una reunión con el prospecto de manera orgánica y conversacional
2. O alternativamente, obtener el número de teléfono del prospecto

INSTRUCCIONES:
- Analiza toda la conversación proporcionada
- Identifica el tono y estilo de comunicación del prospecto
- Mantén un enfoque natural y no agresivo
- Sugiere un mensaje que se sienta como una continuación natural de la conversación
- El mensaje debe ser breve pero efectivo (máximo 2-3 oraciones)
- Adapta el lenguaje al estilo del prospecto (formal/informal)
- Si detectas interés, sugiere agendar reunión; si no hay interés claro, sugiere intercambiar contactos

FORMATO DE RESPUESTA:
Responde SOLO con el mensaje sugerido, sin explicaciones adicionales.`

    const userPrompt = `Analiza esta conversación con ${prospect.username} y sugiere el siguiente mensaje más efectivo:

CONVERSACIÓN:
${conversationContext}

MENSAJE SUGERIDO:`

    // 6. Llamar a OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.openai_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error('❌ Error de OpenAI:', errorData)
      return new Response(JSON.stringify({ 
        error: 'Error al generar sugerencia con IA',
        details: errorData.error?.message || 'Error desconocido'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    const aiResult = await openaiResponse.json()
    const suggestion = aiResult.choices?.[0]?.message?.content?.trim()

    if (!suggestion) {
      return new Response(JSON.stringify({ 
        error: 'No se pudo generar una sugerencia' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    console.log('✅ Sugerencia generada exitosamente')

    return new Response(JSON.stringify({ 
      success: true,
      suggestion: suggestion,
      prospect_username: prospect.username,
      messages_analyzed: messages.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })

  } catch (error) {
    console.error('❌ Error en ai-prospect-suggestion:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('🚀 Función generate-prospect-messages iniciada')
  console.log('📝 Método:', req.method)

  try {
    console.log('📨 Procesando request...')
    const requestBody = await req.json()
    console.log('📋 Body recibido:', requestBody)
    
    const { 
      messageLimit,
      username,
      tema,
      typeOfProspection,
      followObservationText 
    } = requestBody

    console.log('🔑 Verificando OpenAI API key...')
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('❌ OpenAI API key no configurada')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    console.log('✅ OpenAI API key encontrada')

    // Crear el prompt específico con las variables
    const contextDataList = [username, tema]
    
    const prompt = `# 🧠 ROL
Eres un redactor creativo experto en prospección fría por Instagram. Generas mensajes 100 % humanos, cálidos, espontáneos y cero comerciales.

---

# 🎯 OBJETIVO
Crear **${messageLimit}** mensajes autónomos (no parten de un MENSAJE_BASE) que:
• Sigan la narrativa Saludo + Observación + Gancho + Pregunta abierta (+ P.D. opcional).
• Mantengan tono conversacional, cercano y natural.
• Despierten curiosidad y motiven respuesta sin parecer venta ni spam.

---

# 📥 VARIABLES DISPONIBLES
- **TEMA** → ${contextDataList[1]}
- **USERNAME** → @${contextDataList[0]}
- **typeOfProspection** → ${typeOfProspection} (puede ser **followers** o **comments**)
- **followObservationText** → ${followObservationText}
- **messageLimit** → número fijo de salidas a generar
- **[NOMBRE]** → marcador que **NO** debes reemplazar ni eliminar

---

# 🛠️ INSTRUCCIONES DE GENERACIÓN

## 1. Cantidad
Debes generar exactamente **${messageLimit}** mensajes distintos. Si generas más o menos, la salida es inválida.

## 2. Estructura interna de cada mensaje (una sola línea)
a. **Saludo** casual + espacio + [NOMBRE], (coma opcional)
b. **Observación** ► el inicio debe depender estrictamente de *typeOfProspection*:
   • **followers** → \`[NOMBRE], vi que ${followObservationText}\` / \`Hola [NOMBRE], noté que ${followObservationText}\`
   • **comments** → \`[NOMBRE], vi tu comentario en ${contextDataList[0]} sobre ${contextDataList[1]}\` / \`Hola [NOMBRE], vi que comentaste en ${contextDataList[0]} sobre ${contextDataList[1]}\`
   (Si followObservationText está vacío, usa "Sobre ${contextDataList[1]}…")
c. **Gancho personal** : frase de conexión suave con el tema (máx. 15 palabras).
d. **Pregunta abierta** : exactamente UNA pregunta que empiece con «¿» y termine con «?».
   • Debe ser curiosa o exploratoria; prohíbe inicios como: "¿Te gustaría…", "¿Quieres…", "¿Te interesaría…", "¿Puedo…", "¿Podrías…".
   • El mensaje completo solo puede contener un signo «¿» y un signo «?».
   • No incluyas palabras como "seguidores", "likes", "comments", "comentarios", "followers"
e. **P.D. (opcional)** : si la añades, debe comenzar con "P.D." y aludir a *typeOfProspection* o al TEMA en un cierre breve.

## 3. Longitud
22 – 40 palabras (contando P.D. si existe).

## 4. Prohibiciones
– No uses: "oportunidad", "negocio", "ganancias", "cliente", "precio", "vender", "te interesa", "tengo algo", "ingreso extra".
– **Evita frases de oferta o venta como: "¿Te gustaría conocer/tener/saber…?", "¿Quieres que te cuente…?", "puedo mostrarte/ayudarte…".**
– Sin llamadas a la acción ("agenda…", "únete…", etc.), sin emojis, comillas, viñetas ni saltos de línea internos.
– Solo un signo de interrogación por pregunta.
– **P.D.** debe comenzar con "P.D." y usar **SOLO** estas fórmulas de cierre (elige una distinta cada vez):
  - "P.D. encantado de cruzarnos por aquí!."
  - "P.D. solo quiero compartir buena vibra!."
  - "P.D. me mueve conocer historias nuevas!."
  - "P.D. escribo para sumar, no vender!."
  - "P.D. solo busco intercambiar ideas!."
  - "P.D. me inspira conectar con gente afín!."
  - "P.D. esto va sin agenda oculta, lo prometo!."
  - "P.D. aquí para aprender de tu experiencia!."
  - "P.D. feliz de romper el hielo así!."
  - "P.D. valoro tu tiempo, gracias por leerme!."
  - P.D. **NO PUEDE Y NO DEBE** ser una pregunta! Si pones una pregunta tu respuesta COMPLETA se considera INVALIDA!

## 5. Variabilidad
– Cambia vocabulario, orden sintáctico y ritmo entre mensajes.
– No repitas literalmente frases o preguntas.
– Si añades P.D., usa fórmulas de cierre diferentes ("P.D. solo lo pregunto para conectar!…", "P.D. encantado de conocerte!…", etc.).

---

# 🗒️ FORMATO DE SALIDA (obligatorio)
\`Mensaje 1 && Mensaje 2 && Mensaje 3 … && Mensaje ${messageLimit}\`

---

# REGLAS ESTRICTAS DE FORMATO
• Cada mensaje ocupa UNA sola línea, está separado por '&&' al final del mensaje!.
• POR NINGUN MOTIVO incluyas el caracter '\\n' explicitamente en la salida, mas bien quiero dar a entender que debes hacer el salto de linea que representa '\\n'
• '&&' debe aparecer **SOLO** EN LÍNEAS INDIVIDUALES, sin espacios antes/ después.
• No añadas líneas en blanco antes, después ni entre los mensajes y los separadores.

# Ejemplo de salida:
Mensaje1 && Mensaje2 && Mensaje3 ... MensajeN

---

**IMPORTANTE:** No seguir las reglas de formato TAL CUAL como están descritas, resultará en una mala respuesta y **NO SERÁ TOMADA EN CUENTA!!**

---

# ⚠️ VALIDACIÓN RÁPIDA
Si cualquier mensaje:
• omite [NOMBRE]
• viola las frases de observación exigidas
• contiene MÁS de un «¿» o más de un «?»
• contiene palabras prohibidas, CTAs, emojis
→ Deséchalo y regenera hasta cumplir todas las reglas.

(GENERA LA SALIDA AHORA SIGUIENDO LAS INSTRUCCIONES.)`

    console.log('🤖 Generando mensajes de prospección con OpenAI...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      
      return new Response(
        JSON.stringify({ 
          error: 'Error calling OpenAI API',
          details: errorData.error?.message || 'Unknown error'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    const generatedContent = data.choices?.[0]?.message?.content?.trim()

    if (!generatedContent) {
      return new Response(
        JSON.stringify({ error: 'No content generated' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Separar los mensajes usando &&
    const messages = generatedContent.split('&&').map(msg => msg.trim()).filter(msg => msg.length > 0)

    console.log('✅ Mensajes generados:', messages.length)

    return new Response(
      JSON.stringify({ 
        messages,
        rawContent: generatedContent
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in generate-prospect-messages:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
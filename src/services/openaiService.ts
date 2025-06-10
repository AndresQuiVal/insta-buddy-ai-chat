import { toast } from '@/hooks/use-toast';

// Función para obtener la API key del localStorage
const getOpenAIKey = (): string => {
  const key = localStorage.getItem('hower-openai-key');
  if (!key) {
    toast({
      title: "API Key requerida",
      description: "Por favor, configura tu API key de OpenAI en Configuración",
      variant: "destructive"
    });
    throw new Error('No hay API key de OpenAI configurada');
  }
  return key;
};

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Genera una respuesta de ChatGPT utilizando la API de OpenAI
 */
export const generateAIResponse = async (
  messages: ChatMessage[], 
  config: Partial<OpenAIConfig> = {}
): Promise<string> => {
  try {
    const apiKey = getOpenAIKey();
    const finalConfig = {
      apiKey,
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 500,
      ...config
    };

    // Verificar que el último mensaje no sea una respuesta genérica
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      console.log('📝 Último mensaje del usuario:', lastUserMessage.content);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalConfig.apiKey}`
      },
      body: JSON.stringify({
        model: finalConfig.model,
        messages: [
          {
            role: 'system',
            content: `Eres un asistente experto que NUNCA da respuestas genéricas o vagas.

REGLAS ESTRICTAS:
1. PROHIBIDO usar frases como:
   - "Interesante, cuéntame más"
   - "Me gustaría saber más"
   - "Qué interesante"
   - Cualquier variación de estas frases genéricas

2. SIEMPRE debes:
   - Responder específicamente al contenido del mensaje
   - Hacer preguntas concretas sobre detalles específicos
   - Si no entiendes algo, pedir aclaración sobre puntos específicos

3. Si el mensaje es un saludo o muy corto:
   - Preséntate y haz una pregunta específica sobre el tema principal
   - NO respondas solo "hola" o "¿cómo estás?"

RESPONDE de manera específica y útil, NUNCA con respuestas genéricas.`
          },
          ...messages
        ],
        temperature: finalConfig.temperature,
        max_tokens: finalConfig.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error en la API de OpenAI: ${error}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;

    // VERIFICACIÓN DE RESPUESTAS GENÉRICAS
    const genericPhrases = [
      'interesante',
      'cuéntame más',
      'qué bien',
      'me gustaría saber más',
      'qué interesante',
      'dime más'
    ];

    const responseLower = aiResponse.toLowerCase();
    if (genericPhrases.some(phrase => responseLower.includes(phrase))) {
      console.log('⚠️ Respuesta genérica detectada, generando nueva respuesta...');
      
      // Intentar generar una respuesta más específica
      const retryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalConfig.apiKey}`
        },
        body: JSON.stringify({
          model: finalConfig.model,
          messages: [
            {
              role: 'system',
              content: 'La última respuesta fue demasiado genérica. Genera una respuesta más específica y relevante, haciendo preguntas concretas sobre el tema.'
            },
            ...messages
          ],
          temperature: 0.8,
          max_tokens: finalConfig.maxTokens
        })
      });

      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        const retryContent = retryData.choices[0].message.content;
        
        // Verificar si la nueva respuesta también es genérica
        if (!genericPhrases.some(phrase => retryContent.toLowerCase().includes(phrase))) {
          aiResponse = retryContent;
        }
      }
    }

    return aiResponse;
  } catch (error) {
    console.error('Error al generar respuesta con ChatGPT:', error);
    if (error instanceof Error && error.message.includes('No hay API key')) {
      return "⚠️ API Key de OpenAI no configurada. Ve a Configuración para agregarla.";
    }
    toast({
      title: "Error de ChatGPT",
      description: "No se pudo generar una respuesta. Verifica tu API key.",
      variant: "destructive"
    });
    return "Lo siento, tuve un problema al procesar tu mensaje. Por favor, inténtalo de nuevo más tarde.";
  }
};

/**
 * Crea un sistema de prompt EQUILIBRADO entre conversación y filtrado estratégico
 */
export const createStrategicSystemPrompt = (config: {
  idealClientTraits: string[];
  currentMatchPoints: number;
  metTraits: string[];
  conversationSummary?: string;
}): string => {
  const { idealClientTraits, currentMatchPoints, metTraits, conversationSummary } = config;
  const pendingTraits = idealClientTraits.filter(trait => !metTraits.includes(trait));
  const nextTrait = pendingTraits[0]; // Próxima característica a descubrir
  
  return `
Eres un VENDEDOR EXPERTO que combina conversación GENUINA con filtrado ESTRATÉGICO de prospectos.

🎯 TU MISIÓN DOBLE:
1. Tener conversaciones NATURALES y crear CONEXIÓN
2. Descubrir sistemáticamente si cumple las características del cliente ideal

📊 PROGRESO ACTUAL:
- ✅ CARACTERÍSTICAS CONFIRMADAS: ${currentMatchPoints}/${idealClientTraits.length}
- ✅ YA IDENTIFICASTE: ${metTraits.length > 0 ? metTraits.join(' | ') : 'NINGUNA AÚN'}
- 🎯 PRÓXIMO OBJETIVO: ${nextTrait || 'TODAS IDENTIFICADAS - BUSCAR CONTACTO'}
- 🔍 PENDIENTES: ${pendingTraits.join(' | ')}

🗣️ TU ESTRATEGIA CONVERSACIONAL:
${currentMatchPoints === 0 ? `
🌟 INICIO - Conexión + Primer filtrado
- Saluda de forma auténtica y crea RAPPORT inicial
- Haz 1-2 preguntas de conexión personal 
- Incluye UNA pregunta estratégica que pueda revelar: "${nextTrait}"
- La pregunta debe ser NATURAL pero con propósito específico
- EJEMPLO: Si necesitas saber sobre presupuesto → "¿Qué tipo de inversiones o proyectos has hecho últimamente?"
- EJEMPLO: Si necesitas saber sobre ubicación → "¿De qué parte del país me escribes? Me gusta conocer de dónde son mis contactos"
` : currentMatchPoints < idealClientTraits.length ? `
💬 FILTRADO ACTIVO - Conversación con propósito
- Progreso: ${currentMatchPoints}/${idealClientTraits.length} características confirmadas
- Continúa la conversación pero ENFÓCATE en descubrir: "${nextTrait}"
- Haz preguntas de seguimiento que conecten con sus respuestas anteriores
- Cada mensaje debe tener una pregunta estratégica para revelar la característica pendiente
- Sé empático pero mantén el objetivo claro
- EJEMPLOS según la característica:
  * Presupuesto: "¿Has considerado hacer una inversión en algo así?" o "¿Qué presupuesto manejas para este tipo de cosas?"
  * Interés: "¿Qué te motiva exactamente sobre esto?" o "¿Es algo que has estado pensando hacer por mucho tiempo?"
  * Ubicación: "¿Necesitarías que fuera algo local o no te importa la distancia?"
  * Decisión: "¿Eres de los que cuando algo les convence actúan rápido, o prefieres tomarte tu tiempo para decidir?"
` : `
🏆 CLIENTE IDEAL CONFIRMADO - Conseguir contacto
- ¡EXCELENTE! Este prospecto cumple las ${idealClientTraits.length} características
- AHORA tu objetivo es conseguir una llamada o WhatsApp
- Sé más directo: "Me parece que podemos trabajar juntos, ¿te gustaría que platicáramos por teléfono?"
- Ofrece valor específico: "Tengo algunas ideas que creo te van a encantar, ¿cuándo podríamos hablar?"
- Crea urgencia suave: "¿Te parece si coordinamos una llamada esta semana?"
`}

🎭 REGLAS DE CONVERSACIÓN EQUILIBRADA:
1. **SIEMPRE conecta emocionalmente** - Muestra interés genuino en sus respuestas
2. **CADA mensaje debe tener propósito** - Una pregunta conversacional + una estratégica
3. **Sé empático pero enfocado** - No te desvíes del objetivo de filtrado
4. **Pregunta con contexto** - Justifica por qué preguntas (curiosidad, experiencia, etc.)
5. **NUNCA reveles que estás evaluando características** específicas
6. **Construye sobre respuestas anteriores** - Demuestra que escuchas
7. **Mantén el ritmo** - No hagas muchas preguntas seguidas

💡 EJEMPLOS DE PREGUNTAS EQUILIBRADAS (Conversación + Filtrado):

Para PRESUPUESTO:
- "Me da curiosidad, ¿qué tipo de inversiones te han funcionado bien? ¿Eres de los que prefiere invertir con cuidado o más aventurero?"

Para UBICACIÓN:
- "¿Cómo está el ambiente por donde vives? ¿Es un lugar donde hay buenas oportunidades o prefieres buscar en otros lados?"

Para INTERÉS:
- "Se nota que esto te llama la atención, ¿es algo que has estado pensando hacer por mucho tiempo o surgió de repente?"

Para DECISIÓN:
- "¿Eres de los que cuando algo les convence actúan rápido, o prefieres tomarte tu tiempo para decidir?"

🚫 EVITA:
- Interrogatorios sin conexión emocional
- Preguntas demasiado obvias sobre las características
- Conversación sin propósito de filtrado
- Muchas preguntas seguidas sin dar valor

💬 TONO Y ESTRUCTURA:
- Amigable pero profesional
- Cada mensaje: Comentario empático + Pregunta estratégica
- Muestra experiencia e interés genuino
- Crea confianza mientras filtras

RESPONDE SOLO con tu siguiente mensaje natural, conversacional pero estratégico.
  `.trim();
};

/**
 * Verifica si la configuración de OpenAI está completa
 */
export const isOpenAIConfigured = (): boolean => {
  const key = localStorage.getItem('hower-openai-key');
  return key !== null && key.trim() !== '';
};

/**
 * Genera una respuesta ULTRA ESTRATÉGICA y PROACTIVA
 */
export const handleStrategicResponse = async (
  conversationHistory: ChatMessage[],
  currentMatchPoints: number,
  metTraits: string[],
  idealClientTraits: string[]
): Promise<string> => {
  try {
    const apiKey = getOpenAIKey();
    
    console.log("🎯 GENERANDO RESPUESTA ULTRA ESTRATÉGICA:");
    console.log(`📊 Progreso: ${currentMatchPoints}/${idealClientTraits.length} características`);
    console.log(`✅ Cumplidas: ${metTraits.join(', ')}`);
    
    const pendingTraits = idealClientTraits.filter(trait => !metTraits.includes(trait));
    console.log(`🎯 Pendientes: ${pendingTraits.join(', ')}`);
    console.log(`⚡ Próximo objetivo: ${pendingTraits[0] || 'CONSEGUIR LLAMADA/WHATSAPP'}`);
    
    // Crear resumen estratégico de la conversación
    const conversationSummary = currentMatchPoints === 0 
      ? 'Conversación inicial - establecer rapport y empezar filtrado'
      : `Progreso: ${currentMatchPoints}/${idealClientTraits.length} - continuar filtrado activo`;

    // Crear prompt ULTRA estratégico
    const systemPrompt = createStrategicSystemPrompt({
      idealClientTraits,
      currentMatchPoints,
      metTraits,
      conversationSummary
    });

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10) // Solo últimos 10 mensajes para mantener contexto relevante
    ];

    console.log("🚀 Enviando prompt ULTRA ESTRATÉGICO a OpenAI...");
    
    const response = await generateAIResponse(messages, {
      apiKey,
      model: 'gpt-4o',
      temperature: 0.9, // Más creativo para conversaciones naturales pero directas
      maxTokens: 150 // Mensajes concisos y directos
    });

    console.log("⚡ RESPUESTA ESTRATÉGICA:", response);
    
    // Log del progreso
    if (currentMatchPoints === idealClientTraits.length) {
      console.log("🏆 PROSPECTO CALIFICADO - Respuesta debe buscar llamada/WhatsApp");
    } else {
      console.log(`🎯 RESPUESTA debe descubrir: ${pendingTraits[0]}`);
    }
    
    return response;
    
  } catch (error) {
    console.error('❌ Error al generar respuesta estratégica:', error);
    return "¡Hola! Me da mucho gusto conectar contigo. Cuéntame, ¿qué tipo de cosas te interesan? 😊";
  }
};

/**
 * Genera una respuesta automática LEGACY (mantenido para compatibilidad)
 */
export const handleAutomaticResponse = async (
  message: string, 
  conversationHistory: ChatMessage[],
  businessConfig: {
    businessName: string;
    businessDescription: string;
    tone: string;
    idealClientTraits: string[];
  },
  customPrompt?: string
): Promise<string> => {
  try {
    console.log('🤖 Generando respuesta automática...');
    console.log('📝 Mensaje actual:', message);
    console.log('📚 Historial de conversación:', conversationHistory);

    // Verificar si hay suficiente contexto
    if (!conversationHistory || conversationHistory.length === 0) {
      console.log('⚠️ No hay historial de conversación');
      return "¡Hola! ¿En qué puedo ayudarte?";
    }

    // Obtener datos de análisis previo desde localStorage
    const savedConversationsStr = localStorage.getItem('hower-conversations');
    let currentMatchPoints = 0;
    let metTraits: string[] = [];
    
    if (savedConversationsStr) {
      const conversations = JSON.parse(savedConversationsStr);
      const lastConv = conversations[conversations.length - 1];
      if (lastConv) {
        currentMatchPoints = lastConv.matchPoints || 0;
        metTraits = lastConv.metTraits || [];
      }
    }

    // Crear un prompt más específico y contextual
    const systemPrompt = `Eres un asistente de ventas profesional y empático. Tu objetivo es mantener conversaciones naturales y significativas.

CONTEXTO IMPORTANTE:
- Nombre de la empresa: ${businessConfig.businessName}
- Descripción: ${businessConfig.businessDescription}
- Tono de comunicación: ${businessConfig.tone}

INSTRUCCIONES CRÍTICAS:
1. SIEMPRE lee y analiza TODA la conversación anterior
2. NO repitas respuestas genéricas como "Interesante, cuéntame más"
3. Responde específicamente al contenido del mensaje del usuario
4. Mantén el contexto de mensajes anteriores
5. Si el usuario menciona algo previo, refiérete a ello específicamente
6. Si no entiendes algo, pide clarificación específica
7. NO generes respuestas vagas o genéricas

ESTRUCTURA DE RESPUESTA:
1. Reconoce el mensaje específico del usuario
2. Relaciona con contexto previo si existe
3. Proporciona una respuesta relevante y específica
4. Haz preguntas concretas si necesitas más información

EVITA ABSOLUTAMENTE:
- Respuestas genéricas como "Interesante, cuéntame más"
- Ignorar el contexto previo
- Repetir la misma respuesta
- Respuestas vagas o sin dirección

Responde de manera natural y específica al contexto actual.`;

    // Preparar el historial de conversación para OpenAI
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Últimos 10 mensajes para mantener contexto relevante
      { role: 'user', content: message }
    ];

    console.log('📤 Enviando a OpenAI con contexto completo...');
    
    const response = await generateAIResponse(messages, {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 150
    });

    console.log('📥 Respuesta recibida:', response);

    // Verificar si la respuesta es genérica
    const genericResponses = [
      'interesante, cuéntame más',
      'cuéntame más sobre eso',
      'qué interesante',
      'me gustaría saber más'
    ];

    const normalizedResponse = response.toLowerCase().trim();
    if (genericResponses.some(generic => normalizedResponse.includes(generic.toLowerCase()))) {
      console.log('⚠️ Respuesta demasiado genérica detectada, generando nueva respuesta...');
      return await generateAIResponse([
        { 
          role: 'system', 
          content: 'La última respuesta fue demasiado genérica. Genera una respuesta más específica y relevante al contexto actual.' 
        },
        ...messages
      ], {
        model: 'gpt-4',
        temperature: 0.8,
        maxTokens: 150
      });
    }

    return response;
    
  } catch (error) {
    console.error('❌ Error al generar respuesta automática:', error);
    return "Lo siento, tuve un problema al procesar tu mensaje. ¿Podrías reformularlo?";
  }
};

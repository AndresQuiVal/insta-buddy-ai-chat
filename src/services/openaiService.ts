import { toast } from '@/hooks/use-toast';

// Using the API key provided by the user
const OPENAI_API_KEY = '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';

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
  config: OpenAIConfig = {
    apiKey: OPENAI_API_KEY,
    model: 'gpt-4o', // Modelo por defecto
    temperature: 0.7,
    maxTokens: 500
  }
): Promise<string> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error en la API de OpenAI: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error al generar respuesta con ChatGPT:', error);
    toast({
      title: "Error de ChatGPT",
      description: "No se pudo generar una respuesta. Verifica tu API key.",
      variant: "destructive"
    });
    return "Lo siento, tuve un problema al procesar tu mensaje. Por favor, inténtalo de nuevo más tarde.";
  }
};

/**
 * Crea un sistema de prompt NATURAL y SUTIL para filtrar prospectos
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
Eres un VENDEDOR EXPERTO que tiene conversaciones GENUINAS y NATURALES para conocer mejor a los prospectos.

🎯 TU OBJETIVO SECRETO:
- Progreso: ${currentMatchPoints}/${idealClientTraits.length} características identificadas
- ✅ YA IDENTIFICASTE: ${metTraits.length > 0 ? metTraits.join(' | ') : 'NINGUNA'}
- 🔍 AÚN NECESITAS DESCUBRIR: ${pendingTraits.join(' | ')}
- 🎯 PRÓXIMO OBJETIVO SUTIL: ${nextTrait || 'TODAS IDENTIFICADAS - BUSCAR LLAMADA/WHATSAPP'}

🗣️ TU ESTILO DE CONVERSACIÓN:
${currentMatchPoints === 0 ? `
🌟 INICIO - Conversación natural y genuina
- Saluda de forma amigable y auténtica
- Haz preguntas de CONEXIÓN PERSONAL que indirectamente revelen: "${nextTrait}"
- NO preguntes directamente sobre la característica
- Genera CURIOSIDAD y construye RAPPORT
- EJEMPLO: En lugar de "¿Te interesan los aviones?" → "¿Qué tipo de cosas te gusta hacer en tu tiempo libre?"
` : currentMatchPoints < idealClientTraits.length ? `
💬 CONVERSACIÓN ACTIVA - Sigue siendo natural
- Ya identificaste ${currentMatchPoints} características, te faltan ${pendingTraits.length}
- Haz preguntas de SEGUIMIENTO NATURAL que indirectamente revelen: "${nextTrait}"
- Conecta con lo que ya sabes del prospecto
- Muestra INTERÉS GENUINO en sus respuestas
- EJEMPLOS SUTILES según la característica:
  * Para descubrir presupuesto: "¿Has invertido en proyectos personales antes?" o "¿Qué tipo de decisiones importantes has tomado últimamente?"
  * Para descubrir ubicación: "¿Cómo está el clima por donde vives?" o "¿De qué parte del país me escribes?"
  * Para descubrir necesidad: "¿Qué te motivó a buscar información sobre esto?" o "¿Hay algo específico que te tiene pensando en esto?"
` : `
🏆 PROSPECTO CALIFICADO - Momento de avanzar naturalmente
- ¡Este prospecto cumple las ${idealClientTraits.length} características!
- AHORA sí puedes ser más directo sobre dar el siguiente paso
- Sugerir llamada o WhatsApp de forma NATURAL y GENUINA
- "Me encantaría platicar más contigo, ¿tienes unos minutos para una llamada?" 
- "¿Te parece si coordinamos una llamada rápida? Creo que te puedo ayudar mucho"
`}

🎭 REGLAS DE CONVERSACIÓN NATURAL:
1. SÉ AUTÉNTICO - Habla como una persona real interesada en conocer al prospecto
2. ESCUCHA ACTIVAMENTE - Haz seguimiento a las respuestas que te den
3. CONECTA EMOCIONALMENTE - Muestra empatía y comprensión
4. PREGUNTA POR CURIOSIDAD GENUINA - No por interrogatorio
5. CONSTRUYE RAPPORT ANTES de filtrar
6. NUNCA reveles que estás evaluando características específicas
7. Si detectas una característica, NO la menciones directamente, solo tómala en cuenta

💡 EJEMPLOS DE PREGUNTAS NATURALES Y SUTILES:
- "¿Qué te gusta hacer cuando no estás trabajando?"
- "¿Cómo descubriste esto que me estás comentando?"
- "¿Qué es lo que más te emociona de este tipo de cosas?"
- "¿Has tenido experiencias similares antes?"
- "¿Qué te motivó a buscar información sobre esto?"
- "¿Cómo te imaginas que esto podría ayudarte?"

🚫 NUNCA HAGAS:
- Preguntas que suenen como cuestionario
- Preguntas demasiado directas sobre las características
- Interrogatorios sin contexto
- Mencionar que estás "evaluando" al prospecto
- Preguntar múltiples cosas seguidas sin esperar respuesta

💬 TONO Y PERSONALIDAD:
- Amigable pero profesional
- Curioso pero no invasivo
- Genuinamente interesado en ayudar
- Natural y conversacional
- Empático y comprensivo

RESPONDE SOLO con tu siguiente mensaje natural y genuino, SIN explicaciones técnicas.
  `.trim();
};

/**
 * Verifica si la configuración de OpenAI está completa
 */
export const isOpenAIConfigured = (): boolean => {
  return OPENAI_API_KEY.trim() !== '';
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
      apiKey: OPENAI_API_KEY,
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
    // Obtener datos de análisis previo desde localStorage
    const savedConversationsStr = localStorage.getItem('hower-conversations');
    let currentMatchPoints = 0;
    let metTraits: string[] = [];
    
    if (savedConversationsStr) {
      const conversations = JSON.parse(savedConversationsStr);
      // Buscar la conversación actual (esto es una aproximación)
      const lastConv = conversations[conversations.length - 1];
      if (lastConv) {
        currentMatchPoints = lastConv.matchPoints || 0;
        metTraits = lastConv.metTraits || [];
      }
    }

    // Usar el nuevo sistema ULTRA estratégico
    return await handleStrategicResponse(
      conversationHistory,
      currentMatchPoints,
      metTraits,
      businessConfig.idealClientTraits
    );
    
  } catch (error) {
    console.error('Error al manejar respuesta automática:', error);
    return "Lo siento, no pude procesar tu mensaje en este momento.";
  }
};

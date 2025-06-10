
import { toast } from '@/hooks/use-toast';

interface Trait {
  trait: string;
  enabled: boolean;
  position: number;
}

interface AnalysisResult {
  matchPoints: number;
  metTraits: string[];
  metTraitIndices?: number[];
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

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

/**
 * Carga las características ideales desde localStorage
 */
export const loadIdealTraitsFromStorage = (): Trait[] => {
  try {
    const savedTraits = localStorage.getItem('hower-ideal-client-traits');
    if (savedTraits) {
      const parsedTraits = JSON.parse(savedTraits);
      return parsedTraits.map((item: any, index: number) => ({
        trait: item.trait,
        enabled: item.enabled,
        position: index
      }));
    }
  } catch (error) {
    console.error("Error al cargar características:", error);
  }

  // Características por defecto
  return [
    { trait: "Interesado en nuestros productos o servicios", enabled: true, position: 0 },
    { trait: "Tiene presupuesto adecuado para adquirir nuestras soluciones", enabled: true, position: 1 },
    { trait: "Está listo para tomar una decisión de compra", enabled: true, position: 2 },
    { trait: "Se encuentra en nuestra zona de servicio", enabled: true, position: 3 }
  ];
};

/**
 * Crea un prompt estratégico personalizado basado en las características y el progreso actual
 */
export const createStrategicPrompt = (
  idealTraits: Trait[],
  currentAnalysis: AnalysisResult,
  conversationHistory: ChatMessage[],
  userMessage: string
): string => {
  const enabledTraits = idealTraits.filter(t => t.enabled);
  const pendingTraits = enabledTraits.filter(trait => !currentAnalysis.metTraits.includes(trait.trait));
  const nextTrait = pendingTraits[0]; // Próxima característica a descubrir

  console.log("🎯 CREANDO PROMPT ESTRATÉGICO:");
  console.log(`📊 Progreso: ${currentAnalysis.matchPoints}/${enabledTraits.length} características`);
  console.log(`✅ Cumplidas: ${currentAnalysis.metTraits.join(', ')}`);
  console.log(`🎯 Próximo objetivo: ${nextTrait?.trait || 'CONSEGUIR CONTACTO'}`);

  return `Eres María, una asesora de viajes experta y vendedora estratégica. Tu misión es tener conversaciones NATURALES pero con un objetivo claro: descubrir si el prospecto cumple las características del cliente ideal.

🎯 CARACTERÍSTICAS DEL CLIENTE IDEAL A EVALUAR:
${enabledTraits.map((trait, i) => `${i + 1}. ${trait.trait}`).join('\n')}

📊 PROGRESO ACTUAL DEL PROSPECTO:
- ✅ CARACTERÍSTICAS CONFIRMADAS: ${currentAnalysis.matchPoints}/${enabledTraits.length}
- ✅ YA CUMPLE: ${currentAnalysis.metTraits.length > 0 ? currentAnalysis.metTraits.join(' | ') : 'NINGUNA AÚN'}
- 🎯 PRÓXIMO OBJETIVO: ${nextTrait ? `"${nextTrait.trait}"` : 'CONSEGUIR CONTACTO/WHATSAPP'}
- 🔍 PENDIENTES: ${pendingTraits.length > 0 ? pendingTraits.map(t => t.trait).join(' | ') : 'TODAS COMPLETADAS'}

🗣️ ESTRATEGIA CONVERSACIONAL SEGÚN PROGRESO:

${currentAnalysis.matchPoints === 0 ? `
🌟 ETAPA INICIAL - Crear conexión + primer filtrado
- Responde de forma auténtica y empática al mensaje del usuario
- Crea RAPPORT y muestra interés genuino en lo que dice
- Incluye UNA pregunta estratégica que pueda revelar: "${nextTrait?.trait}"
- La pregunta debe ser NATURAL, no obvia
- EJEMPLO para descubrir interés: "¿Qué tipo de experiencias de viaje te emocionan más?"
- EJEMPLO para descubrir presupuesto: "¿Has hecho algún viaje especial últimamente?"
` : currentAnalysis.matchPoints < enabledTraits.length ? `
💬 FILTRADO ACTIVO - Conversación dirigida
- Progreso: ${currentAnalysis.matchPoints}/${enabledTraits.length} características confirmadas
- Responde empáticamente a su mensaje actual
- ENFÓCATE en descubrir: "${nextTrait?.trait}"
- Haz preguntas de seguimiento que conecten con sus respuestas
- Cada mensaje debe tener una pregunta estratégica para la característica pendiente
- Sé empático pero mantén el objetivo claro

EJEMPLOS según la característica a descubrir:
* Para "presupuesto": "¿Qué inversión consideras razonable para una experiencia inolvidable?"
* Para "interés": "¿Qué es lo que más te atrae de esta idea?"
* Para "ubicación": "¿Desde qué parte del país nos escribes?"
* Para "decisión": "¿Eres de los que cuando algo les convence actúan rápido?"
` : `
🏆 CLIENTE IDEAL CONFIRMADO - Conseguir contacto
- ¡EXCELENTE! Este prospecto cumple TODAS las ${enabledTraits.length} características
- AHORA tu objetivo es conseguir WhatsApp o agendar una llamada
- Sé más directo: "Me parece que tenemos la opción perfecta para ti, ¿te gustaría que habláramos por WhatsApp?"
- Ofrece valor específico: "Tengo algunas propuestas que creo te van a encantar"
- Crea urgencia suave: "¿Te parece si coordinamos una llamada esta semana?"
`}

💬 MENSAJE ACTUAL DEL USUARIO:
"${userMessage}"

🎭 REGLAS PARA TU RESPUESTA:
1. **Responde de forma empática** al mensaje actual del usuario
2. **Construye sobre lo que dice** - demuestra que escuchas
3. **Incluye UNA pregunta estratégica** relacionada con la característica pendiente
4. **Mantén el tono conversacional** - no parezcas un interrogatorio
5. **Justifica tus preguntas** con curiosidad personal o experiencia
6. **NO reveles que estás evaluando características** específicas
7. **Máximo 2-3 oraciones** - sé concisa pero efectiva

RESPONDE COMO MARÍA, de forma natural pero estratégica, enfocándote en descubrir la siguiente característica.`;
};

/**
 * Genera una respuesta estratégica usando OpenAI basada en las características ideales
 */
export const generateStrategicResponse = async (
  userMessage: string,
  conversationHistory: ChatMessage[],
  currentAnalysis: AnalysisResult = { matchPoints: 0, metTraits: [], metTraitIndices: [] }
): Promise<string> => {
  try {
    console.log("🤖 GENERANDO RESPUESTA ESTRATÉGICA:");
    console.log(`💬 Mensaje usuario: "${userMessage}"`);
    console.log(`📊 Análisis actual:`, currentAnalysis);

    const apiKey = getOpenAIKey();
    const idealTraits = loadIdealTraitsFromStorage();
    const enabledTraits = idealTraits.filter(t => t.enabled);

    if (enabledTraits.length === 0) {
      console.log("⚠️ No hay características habilitadas, respuesta genérica");
      return "¡Hola! Gracias por contactarme. ¿En qué puedo ayudarte hoy?";
    }

    // Crear prompt estratégico personalizado
    const systemPrompt = createStrategicPrompt(idealTraits, currentAnalysis, conversationHistory, userMessage);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6), // Solo últimos 6 mensajes para contexto
      { role: 'user', content: userMessage }
    ];

    console.log("📤 Enviando a OpenAI con prompt estratégico...");

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.8, // Más creativo para conversaciones naturales
        max_tokens: 200, // Respuestas concisas
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error en la API de OpenAI: ${error}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log("✅ Respuesta estratégica generada:", aiResponse);

    // Verificar que no sea una respuesta genérica
    const genericPhrases = ['interesante', 'cuéntame más', 'qué bien'];
    if (genericPhrases.some(phrase => aiResponse.toLowerCase().includes(phrase))) {
      console.log("⚠️ Respuesta demasiado genérica detectada");
      
      // Respuesta de emergencia según el progreso
      const pendingTraits = enabledTraits.filter(trait => !currentAnalysis.metTraits.includes(trait.trait));
      const nextTrait = pendingTraits[0];
      
      if (nextTrait) {
        return `Gracias por compartir eso conmigo. Me da curiosidad, ${nextTrait.trait.toLowerCase().includes('presupuesto') ? '¿qué tipo de inversiones has hecho últimamente?' : '¿podrías contarme un poco más sobre lo que buscas?'}`;
      }
    }

    return aiResponse;

  } catch (error) {
    console.error('❌ Error al generar respuesta estratégica:', error);
    
    // Respuesta de fallback
    if (error instanceof Error && error.message.includes('No hay API key')) {
      return "⚠️ API Key de OpenAI no configurada. Ve a Configuración para agregarla.";
    }
    
    return "Gracias por tu mensaje. ¿Podrías contarme un poco más sobre lo que buscas?";
  }
};

/**
 * Obtiene el análisis actual de un prospecto desde localStorage
 */
export const getCurrentProspectAnalysis = (senderId: string): AnalysisResult => {
  try {
    const conversationsStr = localStorage.getItem('hower-conversations');
    if (conversationsStr) {
      const conversations = JSON.parse(conversationsStr);
      const prospect = conversations.find((conv: any) => 
        conv.id === senderId || conv.senderId === senderId
      );
      
      if (prospect) {
        return {
          matchPoints: prospect.matchPoints || 0,
          metTraits: prospect.metTraits || [],
          metTraitIndices: prospect.metTraitIndices || []
        };
      }
    }
  } catch (error) {
    console.error("Error al obtener análisis actual:", error);
  }
  
  return { matchPoints: 0, metTraits: [], metTraitIndices: [] };
};

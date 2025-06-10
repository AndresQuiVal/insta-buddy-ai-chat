
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
 * Crea preguntas estratégicas naturales basadas en la característica objetivo
 */
const createNaturalStrategicQuestion = (trait: string, userMessage: string): string => {
  const traitLower = trait.toLowerCase();
  
  // Preguntas para INTERÉS
  if (traitLower.includes('interesado') || traitLower.includes('interés') || traitLower.includes('productos') || traitLower.includes('servicios')) {
    const interestQuestions = [
      "Me da curiosidad, ¿qué fue lo que te llamó la atención inicialmente?",
      "¿Es algo que has estado considerando por mucho tiempo?",
      "¿Qué te motivó a buscar información sobre esto?",
      "¿Hay algo específico que estés buscando resolver?",
      "¿Qué esperas lograr con esto?"
    ];
    return interestQuestions[Math.floor(Math.random() * interestQuestions.length)];
  }
  
  // Preguntas para PRESUPUESTO
  if (traitLower.includes('presupuesto') || traitLower.includes('adquirir') || traitLower.includes('inversión')) {
    const budgetQuestions = [
      "¿Has considerado hacer algún tipo de inversión en algo así?",
      "¿Qué tipo de presupuesto manejas para este tipo de cosas?",
      "¿Has hecho alguna inversión similar anteriormente?",
      "¿Es algo para lo que ya tienes recursos destinados?",
      "¿Qué rango de inversión consideras razonable?"
    ];
    return budgetQuestions[Math.floor(Math.random() * budgetQuestions.length)];
  }
  
  // Preguntas para DECISIÓN
  if (traitLower.includes('decisión') || traitLower.includes('listo') || traitLower.includes('compra')) {
    const decisionQuestions = [
      "¿Eres de los que cuando algo les convence actúan rápido?",
      "¿Prefieres tomarte tu tiempo para decidir o eres más impulsivo?",
      "¿Tienes algún plazo en mente para tomar una decisión?",
      "¿Es algo urgente para ti o puedes esperar?",
      "¿Hay algo específico que necesites saber antes de decidir?"
    ];
    return decisionQuestions[Math.floor(Math.random() * decisionQuestions.length)];
  }
  
  // Preguntas para UBICACIÓN
  if (traitLower.includes('zona') || traitLower.includes('ubicación') || traitLower.includes('servicio') || traitLower.includes('local')) {
    const locationQuestions = [
      "¿De qué parte del país me escribes?",
      "¿Necesitarías que fuera algo local o no te importa la distancia?",
      "¿Cómo está la situación por tu zona para este tipo de cosas?",
      "¿Prefieres proveedores locales o no es relevante para ti?",
      "¿En qué ciudad o región te encuentras?"
    ];
    return locationQuestions[Math.floor(Math.random() * locationQuestions.length)];
  }
  
  // Pregunta genérica estratégica
  return "Cuéntame un poco más sobre tu situación actual con esto.";
};

/**
 * Crea un prompt estratégico NATURAL y EQUILIBRADO
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

  console.log("🎯 CREANDO PROMPT ESTRATÉGICO NATURAL:");
  console.log(`📊 Progreso: ${currentAnalysis.matchPoints}/${enabledTraits.length} características`);
  console.log(`✅ Cumplidas: ${currentAnalysis.metTraits.join(', ')}`);
  console.log(`🎯 Próximo objetivo: ${nextTrait?.trait || 'CONSEGUIR CONTACTO'}`);

  // Generar pregunta estratégica natural
  const strategicQuestion = nextTrait ? createNaturalStrategicQuestion(nextTrait.trait, userMessage) : null;

  return `Eres María, una asesora de viajes experta y vendedora NATURAL pero ESTRATÉGICA. Tu objetivo es tener conversaciones GENUINAS que conecten con las personas, pero con un propósito claro: identificar sutilmente si son clientes ideales.

🎯 CARACTERÍSTICAS DEL CLIENTE IDEAL:
${enabledTraits.map((trait, i) => `${i + 1}. ${trait.trait}`).join('\n')}

📊 PROGRESO ACTUAL DEL PROSPECTO:
- ✅ CARACTERÍSTICAS CONFIRMADAS: ${currentAnalysis.matchPoints}/${enabledTraits.length}
- ✅ YA CUMPLE: ${currentAnalysis.metTraits.length > 0 ? currentAnalysis.metTraits.join(' | ') : 'NINGUNA AÚN'}
- 🎯 PRÓXIMO OBJETIVO: ${nextTrait ? `"${nextTrait.trait}"` : 'CONSEGUIR CONTACTO/WHATSAPP'}

🗣️ ESTRATEGIA DE CONVERSACIÓN EQUILIBRADA:

${currentAnalysis.matchPoints === 0 ? `
🌱 ETAPA INICIAL - Conexión + Primer filtrado sutil
- Responde de forma AUTÉNTICA y empática al mensaje del usuario
- Muestra INTERÉS GENUINO en lo que dice y construye sobre ello
- Conecta emocionalmente con su situación o necesidad
- Incluye UNA pregunta estratégica que fluya naturalmente: "${strategicQuestion}"
- La pregunta debe sentirse como curiosidad personal, NO como interrogatorio
- EJEMPLO: "Me da mucha curiosidad tu situación. [PREGUNTA ESTRATÉGICA] Es que me gusta entender bien a cada persona para poder ayudar mejor."
` : currentAnalysis.matchPoints < enabledTraits.length ? `
💬 CONVERSACIÓN ESTRATÉGICA - Equilibrio perfecto
- Progreso: ${currentAnalysis.matchPoints}/${enabledTraits.length} características confirmadas
- RESPONDE específicamente a lo que dice en su mensaje actual
- CONECTA emocionalmente con sus palabras y situación
- HAZ UNA TRANSICIÓN NATURAL hacia: "${strategicQuestion}"
- Justifica tu pregunta con experiencia personal o profesional
- EJEMPLO: "Entiendo perfectamente lo que dices sobre [tema actual]. Me recuerda a otros clientes que... [TRANSICIÓN] ${strategicQuestion}"
- NUNCA hagas más de UNA pregunta estratégica por mensaje
` : `
🏆 CLIENTE IDEAL CONFIRMADO - Conseguir contacto natural
- ¡EXCELENTE! Este prospecto cumple TODAS las ${enabledTraits.length} características
- Responde a su mensaje actual de forma empática
- Menciona que tienes "varias opciones que podrían encajar perfecto"
- Sugiere naturalmente hablar por WhatsApp: "¿Te parece si coordinamos una llamada esta semana para ver las mejores opciones?"
- Crea valor específico: "Tengo algunas propuestas que creo te van a encantar basándome en lo que me has contado"
`}

💬 MENSAJE ACTUAL DEL USUARIO:
"${userMessage}"

🎭 REGLAS PARA RESPUESTA NATURAL PERO ESTRATÉGICA:

1. **SIEMPRE responde específicamente** a lo que dice el usuario en su mensaje actual
2. **CONECTA emocionalmente** - Muestra que realmente entiendes su situación
3. **CONSTRUYE SOBRE SUS PALABRAS** - Usa elementos de su mensaje para crear continuidad
4. **UNA sola pregunta estratégica por mensaje** - Debe fluir naturalmente de la conversación
5. **JUSTIFICA tu curiosidad** - "Me da curiosidad porque...", "Es importante para mí entender...", "Me ayuda a visualizar mejor..."
6. **NUNCA uses lenguaje de ventas** - Evita "características", "requisitos", "calificar"
7. **MANTÉN el tono conversacional** - Como si fueras una amiga genuinamente interesada
8. **Máximo 3-4 oraciones** - Sé concisa pero cálida

📝 ESTRUCTURA IDEAL:
1. Respuesta empática a su mensaje (1 oración)
2. Conexión personal/profesional (1 oración)  
3. Pregunta estratégica natural con justificación (1-2 oraciones)

EJEMPLO DE RESPUESTA EQUILIBRADA:
"Ay, entiendo perfectamente esa sensación de [retomar tema actual]. Me pasa seguido que la gente me cuenta situaciones similares. ${strategicQuestion} Es que me gusta entender bien el contexto para poder sugerir las mejores opciones."

RESPONDE COMO MARÍA de forma natural, cálida pero con propósito estratégico claro.`;
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
    console.log("🤖 GENERANDO RESPUESTA ESTRATÉGICA NATURAL:");
    console.log(`💬 Mensaje usuario: "${userMessage}"`);
    console.log(`📊 Análisis actual:`, currentAnalysis);

    const apiKey = getOpenAIKey();
    const idealTraits = loadIdealTraitsFromStorage();
    const enabledTraits = idealTraits.filter(t => t.enabled);

    if (enabledTraits.length === 0) {
      console.log("⚠️ No hay características habilitadas, respuesta genérica");
      return "¡Hola! Gracias por contactarme. ¿En qué puedo ayudarte hoy?";
    }

    // Crear prompt estratégico natural
    const systemPrompt = createStrategicPrompt(idealTraits, currentAnalysis, conversationHistory, userMessage);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6), // Solo últimos 6 mensajes para contexto
      { role: 'user', content: userMessage }
    ];

    console.log("📤 Enviando a OpenAI con prompt estratégico natural...");

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.85, // Más creatividad para conversaciones naturales
        max_tokens: 180, // Respuestas concisas pero completas
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error en la API de OpenAI: ${error}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log("✅ Respuesta estratégica natural generada:", aiResponse);

    // Verificar calidad de la respuesta
    const responseQuality = checkResponseQuality(aiResponse, userMessage);
    if (!responseQuality.isGood) {
      console.log("⚠️ Respuesta no cumple estándares de calidad:", responseQuality.issues);
      
      // Generar respuesta de respaldo más natural
      const pendingTraits = enabledTraits.filter(trait => !currentAnalysis.metTraits.includes(trait.trait));
      const nextTrait = pendingTraits[0];
      
      if (nextTrait) {
        const naturalQuestion = createNaturalStrategicQuestion(nextTrait.trait, userMessage);
        return `Me parece muy interesante lo que me cuentas. ${naturalQuestion} Me ayuda mucho entender el contexto completo.`;
      }
      
      return "Qué interesante lo que me cuentas. ¿Podrías contarme un poco más sobre tu situación actual?";
    }

    return aiResponse;

  } catch (error) {
    console.error('❌ Error al generar respuesta estratégica:', error);
    
    // Respuesta de fallback natural
    if (error instanceof Error && error.message.includes('No hay API key')) {
      return "⚠️ API Key de OpenAI no configurada. Ve a Configuración para agregarla.";
    }
    
    return "Me da mucho gusto que me hayas contactado. ¿Podrías contarme un poco más sobre lo que buscas?";
  }
};

/**
 * Verifica la calidad de la respuesta generada
 */
const checkResponseQuality = (response: string, userMessage: string): { isGood: boolean; issues: string[] } => {
  const issues: string[] = [];
  const responseLower = response.toLowerCase();
  
  // Verificar respuestas demasiado genéricas
  const genericPhrases = ['interesante', 'cuéntame más', 'qué bien', 'me gustaría saber más'];
  if (genericPhrases.some(phrase => responseLower.includes(phrase))) {
    issues.push('Respuesta demasiado genérica');
  }
  
  // Verificar que no sea demasiado larga
  if (response.length > 300) {
    issues.push('Respuesta muy larga');
  }
  
  // Verificar que tenga al menos una pregunta
  if (!response.includes('¿')) {
    issues.push('No contiene pregunta estratégica');
  }
  
  // Verificar que no tenga múltiples preguntas
  const questionCount = (response.match(/¿/g) || []).length;
  if (questionCount > 2) {
    issues.push('Demasiadas preguntas');
  }
  
  return {
    isGood: issues.length === 0,
    issues
  };
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

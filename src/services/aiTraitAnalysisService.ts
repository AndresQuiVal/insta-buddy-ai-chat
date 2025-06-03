
interface Trait {
  trait: string;
  enabled: boolean;
}

interface ConversationMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AnalysisResult {
  matchPoints: number;
  metTraits: string[];
  confidence: number;
}

export const analyzeConversationWithAI = async (
  messages: ConversationMessage[], 
  idealTraits: Trait[]
): Promise<AnalysisResult> => {
  console.log("🤖 DEBUG: === ANÁLISIS CON IA - SERVICIO ===");
  console.log("📊 DEBUG: Características recibidas:", idealTraits);
  console.log("💬 DEBUG: Mensajes recibidos:", messages);
  
  const openaiKey = localStorage.getItem('hower-openai-key-demo') || localStorage.getItem('hower-openai-key');
  console.log("🔑 DEBUG: OpenAI Key en servicio:", openaiKey ? 'CONFIGURADA' : 'NO CONFIGURADA');
  
  if (!openaiKey) {
    console.log("⚠️ DEBUG: No hay API Key de OpenAI, usando análisis básico");
    return analyzeWithKeywords(messages, idealTraits);
  }

  const enabledTraits = idealTraits.filter(t => t.enabled);
  console.log("🎯 DEBUG: Características habilitadas para análisis:", enabledTraits);
  
  if (enabledTraits.length === 0) {
    console.log("⚠️ DEBUG: No hay características habilitadas");
    return { matchPoints: 0, metTraits: [], confidence: 0 };
  }

  // Crear texto de conversación SOLO del usuario
  const userMessages = messages.filter(msg => msg.sender === 'user');
  const conversationText = userMessages.map(msg => msg.text).join('\n');

  console.log("📝 DEBUG: Texto del usuario para IA:", conversationText);

  // MEJORAR EL PROMPT - MÁS ESPECÍFICO Y DIRECTO
  const prompt = `Analiza este mensaje del prospecto y determina qué características cumple:

MENSAJE DEL PROSPECTO:
"${conversationText}"

CARACTERÍSTICAS A EVALUAR:
${enabledTraits.map((trait, i) => `${i + 1}. ${trait.trait}`).join('\n')}

INSTRUCCIONES ESPECÍFICAS:
- Analiza ÚNICAMENTE el contenido del mensaje del prospecto
- Si menciona palabras relacionadas con cruceros, viajes, vacaciones → cumple característica sobre cruceros
- Si menciona presupuesto, dinero, precios, "puedo pagar" → cumple característica sobre presupuesto  
- Si dice "quiero", "necesito", "me interesa", "comprar" → cumple característica sobre interés
- Si menciona ubicación, ciudad, país → cumple característica sobre zona de servicio

RESPUESTA:
Responde SOLO con JSON válido en este formato exacto:
{"characteristics": [números de características que SÍ cumple], "confidence": 0.8}

Si NO cumple ninguna característica: {"characteristics": [], "confidence": 0}`;

  console.log("🎯 DEBUG: Prompt mejorado para OpenAI:", prompt);

  try {
    console.log("📡 DEBUG: Enviando consulta a OpenAI...");
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto analizador de prospectos de ventas. Tu trabajo es identificar si un mensaje cumple características específicas del cliente ideal. Responde solo con JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.1,
      }),
    });

    console.log("📨 DEBUG: Respuesta HTTP de OpenAI:", response.status, response.statusText);

    if (!response.ok) {
      console.error("❌ DEBUG: Error HTTP de OpenAI:", response.status);
      throw new Error(`Error OpenAI: ${response.status}`);
    }

    const data = await response.json();
    console.log("📋 DEBUG: Datos completos de OpenAI:", data);
    
    const content = data.choices?.[0]?.message?.content || '';
    console.log("🤖 DEBUG: Contenido de respuesta de OpenAI:", content);

    // Parsear respuesta JSON
    const parsed = JSON.parse(content);
    console.log("🔍 DEBUG: JSON parseado:", parsed);
    
    const characteristicIndices = parsed.characteristics || [];
    const confidence = parsed.confidence || 0;

    console.log("📊 DEBUG: Índices de características detectadas:", characteristicIndices);

    const metTraits = characteristicIndices
      .map((index: number) => enabledTraits[index - 1]?.trait)
      .filter(Boolean);

    console.log("✅ DEBUG: Características finales detectadas:", metTraits);

    const result = {
      matchPoints: metTraits.length,
      metTraits,
      confidence
    };

    console.log("🎯 DEBUG: Resultado final del análisis:", result);
    return result;

  } catch (error) {
    console.error("❌ DEBUG: Error en análisis con IA:", error);
    console.log("🔄 DEBUG: Fallback a análisis por palabras clave");
    return analyzeWithKeywords(messages, idealTraits);
  }
};

// ANÁLISIS MEJORADO CON PALABRAS CLAVE
const analyzeWithKeywords = (messages: ConversationMessage[], idealTraits: Trait[]): AnalysisResult => {
  console.log("🔤 DEBUG: === ANÁLISIS CON PALABRAS CLAVE MEJORADO ===");
  
  const enabledTraits = idealTraits.filter(t => t.enabled);
  const userMessages = messages.filter(msg => msg.sender === 'user');
  const conversationText = userMessages.map(msg => msg.text).join(' ').toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Quitar acentos

  console.log("📝 DEBUG: Texto normalizado para análisis:", conversationText);

  // MAPA DE PALABRAS CLAVE MÁS ESPECÍFICO
  const keywordMap: Record<string, string[]> = {
    // Interés en productos/servicios
    "interesado en nuestros productos o servicios": [
      "crucero", "cruceros", "viaje", "viajes", "vacaciones", "turismo",
      "tour", "tours", "excursion", "excursiones", "destino", "destinos",
      "interesa", "intereso", "me gusta", "me gustan", "quiero", "quisiera",
      "necesito", "busco", "producto", "servicio", "oferta", "informacion"
    ],
    "le gustan los cruceros": [
      "crucero", "cruceros", "barco", "navegar", "mar", "oceano", 
      "navegacion", "cruise", "viaje en barco", "vacation", "vacaciones"
    ],
    "tiene presupuesto adecuado": [
      "presupuesto", "dinero", "pago", "pagar", "precio", "costo",
      "puedo pagar", "tengo dinero", "dispongo", "cuento con",
      "tarjeta", "efectivo", "financiamiento", "cuanto cuesta"
    ],
    "listo para decidir": [
      "decidido", "decidida", "listo", "lista", "preparado", "preparada",
      "comprar", "reservar", "apartar", "confirmar", "ahora", "ya", "hoy"
    ],
    "zona de servicio": [
      "vivo", "estoy", "ubicado", "direccion", "ciudad", "mexico", "españa"
    ]
  };

  const metTraits: string[] = [];
  
  enabledTraits.forEach(trait => {
    const traitLower = trait.trait.toLowerCase();
    console.log(`🔍 DEBUG: Analizando característica: "${trait.trait}"`);
    
    // Buscar coincidencias directas primero
    let keywords: string[] = [];
    
    // Mapear características a palabras clave
    if (traitLower.includes('crucero') || traitLower.includes('viaje')) {
      keywords = keywordMap["le gustan los cruceros"];
    } else if (traitLower.includes('interesado') || traitLower.includes('producto') || traitLower.includes('servicio')) {
      keywords = keywordMap["interesado en nuestros productos o servicios"];
    } else if (traitLower.includes('presupuesto') || traitLower.includes('dinero')) {
      keywords = keywordMap["tiene presupuesto adecuado"];
    } else if (traitLower.includes('decision') || traitLower.includes('compra')) {
      keywords = keywordMap["listo para decidir"];
    } else if (traitLower.includes('zona') || traitLower.includes('servicio') || traitLower.includes('ubicac')) {
      keywords = keywordMap["zona de servicio"];
    } else {
      // Usar palabras de la característica misma
      keywords = traitLower.split(' ').filter(word => word.length > 3);
    }
    
    console.log(`   Palabras clave a buscar:`, keywords);
    
    const hasMatch = keywords.some(keyword => {
      const found = conversationText.includes(keyword);
      if (found) {
        console.log(`✅ DEBUG: Palabra clave encontrada: "${keyword}" en "${trait.trait}"`);
      }
      return found;
    });
    
    if (hasMatch) {
      metTraits.push(trait.trait);
      console.log(`🎯 DEBUG: Característica detectada: ${trait.trait}`);
    } else {
      console.log(`❌ DEBUG: NO detectada: ${trait.trait}`);
    }
  });

  const result = {
    matchPoints: metTraits.length,
    metTraits,
    confidence: 0.8
  };

  console.log("🔤 DEBUG: Resultado del análisis por palabras clave:", result);
  return result;
};

export const analyzeAllConversations = async (idealTraits: Trait[]): Promise<void> => {
  console.log("🔍 DEBUG: === ANALIZANDO TODAS LAS CONVERSACIONES ===");
  
  try {
    const conversationsStr = localStorage.getItem('hower-conversations');
    console.log("💾 DEBUG: Conversaciones encontradas:", conversationsStr);
    
    if (!conversationsStr) {
      console.log("⚠️ DEBUG: No hay conversaciones para analizar");
      return;
    }

    const conversations = JSON.parse(conversationsStr);
    console.log("📊 DEBUG: Número de conversaciones a analizar:", conversations.length);
    
    for (const conv of conversations) {
      console.log(`🔍 DEBUG: Analizando conversación: ${conv.userName}`);
      console.log(`📝 DEBUG: lastMessage: "${conv.lastMessage}"`);
      
      let messagesToAnalyze: ConversationMessage[] = [];
      
      // Si hay mensajes estructurados, usarlos
      if (conv.messages && conv.messages.length > 0) {
        messagesToAnalyze = conv.messages;
        console.log(`✅ DEBUG: Usando ${messagesToAnalyze.length} mensajes estructurados`);
      } 
      // Si no hay mensajes estructurados pero hay lastMessage, crear un mensaje artificial
      else if (conv.lastMessage && conv.lastMessage.trim()) {
        messagesToAnalyze = [{
          id: '1',
          text: conv.lastMessage,
          sender: 'user' as const,
          timestamp: new Date()
        }];
        console.log(`🔄 DEBUG: Creando mensaje artificial desde lastMessage: "${conv.lastMessage}"`);
      } else {
        console.log(`⚠️ DEBUG: Conversación ${conv.userName} sin contenido para analizar`);
        continue;
      }
      
      console.log(`🤖 DEBUG: Analizando ${messagesToAnalyze.length} mensajes para ${conv.userName}`);
      
      const result = await analyzeConversationWithAI(messagesToAnalyze, idealTraits);
      
      // Actualizar la conversación con los resultados
      conv.matchPoints = result.matchPoints;
      conv.metTraits = result.metTraits;
      
      console.log(`✅ DEBUG: ${conv.userName}: ${result.matchPoints} características detectadas:`, result.metTraits);
    }

    // Guardar conversaciones actualizadas
    localStorage.setItem('hower-conversations', JSON.stringify(conversations));
    console.log("💾 DEBUG: Conversaciones actualizadas guardadas");
    
    // Mostrar resumen final
    const totalMatches = conversations.reduce((sum: number, conv: any) => sum + (conv.matchPoints || 0), 0);
    const totalTraits = conversations.reduce((sum: number, conv: any) => sum + (conv.metTraits?.length || 0), 0);
    
    console.log("🎯 DEBUG: RESUMEN FINAL:");
    console.log(`📊 Conversaciones finales con matches: ${conversations.length}`);
    console.log(`⭐ Total match points: ${totalMatches}`);
    console.log(`🏷️ Total met traits: ${totalTraits}`);
    
    conversations.forEach((conv: any) => {
      if (conv.matchPoints > 0) {
        console.log(`✅ ${conv.userName}: ${conv.matchPoints} puntos, características: ${conv.metTraits?.join(', ') || 'ninguna'}`);
      }
    });
    
    // Disparar evento para actualizar UI
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('conversations-updated'));
    
    console.log("✅ DEBUG: ANÁLISIS COMPLETO FINALIZADO");
    
  } catch (error) {
    console.error("❌ DEBUG: Error al analizar conversaciones:", error);
  }
};

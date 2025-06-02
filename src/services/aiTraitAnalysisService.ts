
import { supabase } from '@/integrations/supabase/client';

interface Trait {
  trait: string;
  enabled: boolean;
  position: number;
}

interface AIAnalysisResult {
  matchPoints: number;
  metTraits: string[];
  metTraitIndices: number[];
  confidence: number;
}

interface AIResponse {
  matches: Array<{
    trait: string;
    confidence: number;
    reason: string;
  }>;
}

export const analyzeConversationWithAI = async (
  conversationText: string,
  idealTraits: Trait[]
): Promise<AIAnalysisResult> => {
  console.log("🤖 INICIANDO ANÁLISIS CON IA REAL...");
  console.log("📝 Conversación a analizar:", conversationText.substring(0, 200) + "...");
  console.log("🎯 Características objetivo:", idealTraits);
  
  if (!conversationText || idealTraits.length === 0) {
    console.log("❌ No hay conversación o características para analizar");
    return { matchPoints: 0, metTraits: [], metTraitIndices: [], confidence: 0 };
  }

  const enabledTraits = idealTraits.filter(t => t.enabled);
  if (enabledTraits.length === 0) {
    console.log("❌ No hay características habilitadas");
    return { matchPoints: 0, metTraits: [], metTraitIndices: [], confidence: 0 };
  }

  console.log("✅ Características habilitadas para análisis:", enabledTraits);

  try {
    // Crear el prompt para la IA
    const systemPrompt = `Eres un experto analizador de conversaciones de ventas. Tu trabajo es determinar si un prospecto cumple con ciertas características basándote en la conversación completa.

CARACTERÍSTICAS A EVALUAR:
${enabledTraits.map((trait, idx) => `${idx + 1}. ${trait.trait}`).join('\n')}

INSTRUCCIONES:
- Analiza toda la conversación de forma contextual
- Para cada característica, determina si el prospecto la cumple (confianza mínima 0.7)
- Considera el contexto completo, no solo palabras clave
- Responde SOLO en formato JSON válido

FORMATO DE RESPUESTA:
{
  "matches": [
    {
      "trait": "nombre exacto de la característica",
      "confidence": 0.95,
      "reason": "breve explicación"
    }
  ]
}`;

    const userPrompt = `CONVERSACIÓN A ANALIZAR:
${conversationText}

Analiza esta conversación y determina qué características cumple el prospecto.`;

    console.log("📤 Enviando conversación a OpenAI...");
    console.log("🎯 Sistema prompt:", systemPrompt.substring(0, 300) + "...");

    // Llamar a la función edge de ChatGPT
    const { data, error } = await supabase.functions.invoke('chatgpt-response', {
      body: {
        message: userPrompt,
        systemPrompt: systemPrompt
      }
    });

    if (error) {
      console.error("❌ Error en análisis IA:", error);
      throw new Error(`Error en análisis IA: ${error.message}`);
    }

    if (!data?.response) {
      throw new Error("No se recibió respuesta de la IA");
    }

    console.log("📥 Respuesta cruda de IA:", data.response);

    // Parsear la respuesta JSON
    let aiResponse: AIResponse;
    try {
      // Limpiar la respuesta por si tiene texto extra
      const cleanResponse = data.response.replace(/```json\n?|\n?```/g, '').trim();
      aiResponse = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("❌ Error parseando JSON:", parseError);
      console.log("Respuesta que falló:", data.response);
      throw new Error("La IA no devolvió un JSON válido");
    }

    // Procesar los resultados
    const metTraits: string[] = [];
    const metTraitIndices: number[] = [];
    let totalConfidence = 0;

    console.log("🔍 Procesando matches de la IA:", aiResponse.matches);

    aiResponse.matches.forEach(match => {
      // Buscar la característica exacta
      const traitIndex = enabledTraits.findIndex(t => 
        t.trait.toLowerCase().trim() === match.trait.toLowerCase().trim()
      );
      
      console.log(`🔍 Buscando "${match.trait}" en características habilitadas...`);
      console.log(`   Índice encontrado: ${traitIndex}`);
      console.log(`   Confianza: ${match.confidence}`);
      
      if (traitIndex !== -1 && match.confidence >= 0.7) {
        metTraits.push(enabledTraits[traitIndex].trait);
        metTraitIndices.push(traitIndex);
        totalConfidence += match.confidence;
        
        console.log(`✅ CARACTERÍSTICA DETECTADA: ${match.trait} (confianza: ${match.confidence})`);
        console.log(`   Razón: ${match.reason}`);
      } else if (traitIndex === -1) {
        console.log(`⚠️ Característica "${match.trait}" no encontrada en la lista habilitada`);
      } else {
        console.log(`⚠️ Confianza muy baja para "${match.trait}": ${match.confidence}`);
      }
    });

    const avgConfidence = metTraits.length > 0 ? totalConfidence / metTraits.length : 0;

    const result = {
      matchPoints: metTraits.length,
      metTraits,
      metTraitIndices,
      confidence: avgConfidence
    };

    console.log("📊 RESULTADO ANÁLISIS IA:");
    console.log(`   Características detectadas: ${result.matchPoints}/${enabledTraits.length}`);
    console.log(`   Confianza promedio: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`   Características: ${metTraits.join(', ')}`);

    return result;

  } catch (error) {
    console.error("💥 Error en análisis con IA:", error);
    
    // Mostrar error detallado
    if (error instanceof Error && error.message.includes('API key')) {
      throw new Error("Configura la API key de OpenAI en Supabase");
    }
    
    throw error;
  }
};

export const analyzeAllConversations = async (idealTraits: Trait[]) => {
  console.log("🔍 INICIANDO ANÁLISIS MASIVO CON IA...");
  console.log("🎯 Características recibidas para análisis masivo:", idealTraits);
  
  try {
    // Obtener todas las conversaciones del localStorage
    const savedConversations = localStorage.getItem('hower-conversations');
    if (!savedConversations) {
      console.log("❌ No hay conversaciones para analizar");
      return;
    }

    const conversations = JSON.parse(savedConversations);
    console.log(`📋 Analizando ${conversations.length} conversaciones...`);

    // Analizar cada conversación
    for (const conversation of conversations) {
      if (conversation.messages && conversation.messages.length > 0) {
        // Combinar todos los mensajes en una conversación
        const conversationText = conversation.messages
          .map((msg: any) => `${msg.sender === 'user' ? 'Usuario' : 'Asistente'}: ${msg.text}`)
          .join('\n');

        console.log(`🔍 Analizando conversación: ${conversation.userName}`);
        console.log(`📝 Texto de conversación: ${conversationText.substring(0, 200)}...`);

        const result = await analyzeConversationWithAI(conversationText, idealTraits);

        // Actualizar la conversación con los nuevos resultados
        conversation.matchPoints = result.matchPoints;
        conversation.metTraits = result.metTraits;
        conversation.metTraitIndices = result.metTraitIndices;
        conversation.aiConfidence = result.confidence;

        console.log(`✅ Conversación ${conversation.userName} actualizada:`);
        console.log(`   Match points: ${result.matchPoints}`);
        console.log(`   Características: ${result.metTraits.join(', ')}`);
        console.log(`   Confianza: ${(result.confidence * 100).toFixed(1)}%`);
      }
    }

    // Guardar las conversaciones actualizadas
    localStorage.setItem('hower-conversations', JSON.stringify(conversations));
    
    // Disparar evento para actualizar la UI
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('conversations-updated', {
      detail: { type: 'bulk-analysis-complete' }
    }));

    console.log("🎉 ANÁLISIS MASIVO COMPLETADO");

  } catch (error) {
    console.error("💥 Error en análisis masivo:", error);
    throw error;
  }
};

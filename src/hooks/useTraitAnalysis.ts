import { useState, useCallback } from 'react';

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

interface ProspectData {
  id: string;
  senderId: string;
  userName: string;
  matchPoints: number;
  metTraits: string[];
  metTraitIndices?: number[];
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

async function analyzeWithOpenAI(conversationText: string, idealTraits: Trait[]): Promise<{matchPoints: number, metTraits: string[], metTraitIndices: number[]}> {
  const openaiKey = localStorage.getItem('hower-openai-key-demo') || localStorage.getItem('hower-openai-key');
  if (!openaiKey) throw new Error('No hay API Key de OpenAI configurada.');
  if (!conversationText.trim() || idealTraits.length === 0) return { matchPoints: 0, metTraits: [], metTraitIndices: [] };

  const prompt = `Dada la siguiente conversación de Instagram:
"""
${conversationText}
"""
Y estas características del cliente ideal:
${idealTraits.map((t, i) => `${i + 1}. ${t.trait}`).join('\n')}

Responde SOLO con una lista JSON de los números de las características que cumple el prospecto. Ejemplo: [1,3,4] si cumple la 1, 3 y 4. Si no cumple ninguna, responde [].`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Eres un asistente de análisis de prospectos para Instagram.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 100,
      temperature: 0.2,
    }),
  });
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  let indices: number[] = [];
  try {
    indices = JSON.parse(content);
    if (!Array.isArray(indices)) indices = [];
  } catch {
    indices = [];
  }
  const metTraits = indices.map(idx => idealTraits[idx - 1]?.trait).filter(Boolean);
  const metTraitIndices = indices.map(idx => idx - 1).filter(idx => idx >= 0 && idx < idealTraits.length);
  return { matchPoints: metTraits.length, metTraits, metTraitIndices };
}

export const useTraitAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMessage = useCallback(async (messageText: string, idealTraits: Trait[]): Promise<AnalysisResult> => {
    // Si hay API Key, usar OpenAI
    const openaiKey = localStorage.getItem('hower-openai-key-demo') || localStorage.getItem('hower-openai-key');
    if (openaiKey) {
      try {
        const result = await analyzeWithOpenAI(messageText, idealTraits);
        return result;
      } catch (e) {
        console.error('Fallo análisis con OpenAI, usando palabras clave:', e);
        // Fallback a palabras clave
      }
    }
    // Fallback: palabras clave local
    if (!messageText || idealTraits.length === 0) {
      return { matchPoints: 0, metTraits: [], metTraitIndices: [] };
    }
    const enabledTraits = idealTraits.filter(t => t.enabled);
    const conversationText = messageText.toLowerCase();
    let customKeywordMap: Record<string, string[]> = {};
    try {
      const stored = localStorage.getItem('hower-ideal-client-keywords');
      if (stored) {
        customKeywordMap = JSON.parse(stored);
      }
    } catch (e) {
      customKeywordMap = {};
    }
    const defaultKeywordMap: Record<string, string[]> = {
      "Interesado en nuestros productos o servicios": [
        "interesa", "producto", "servicio", "necesito", "busco", "quiero", "comprar", 
        "tienen", "ofrecen", "información", "conocer", "saber", "precio", "cotización", 
        "propuesta", "me gusta", "me interesa", "quisiera", "podría", "puedo", 
        "disponible", "opciones", "planes", "paquetes", "ofertas", "promociones",
        "cruceros", "viajes", "tours", "excursiones", "vacaciones", "destinos",
        "gustan", "encantan", "fascinan", "amo", "adoro", "interesan"
      ],
      "Tiene presupuesto adecuado para adquirir nuestras soluciones": [
        "presupuesto", "dispongo", "puedo pagar", "cuesta", "precio", "inversión", 
        "económico", "financiar", "pago", "costo", "dinero", "gastar", "pagar", 
        "efectivo", "tarjeta", "recursos", "vale la pena", "cuánto", "valor",
        "accesible", "costoso", "barato", "caro", "asequible", "financiamiento"
      ],
      "Está listo para tomar una decisión de compra": [
        "decidido", "comprar", "adquirir", "cuando", "ahora", "inmediato", "listo", 
        "proceder", "compra", "ya", "hoy", "pronto", "mañana", "semana", "momento", 
        "urgente", "necesito ya", "reservar", "apartar", "confirmar", "programar",
        "adelante", "hagamos", "vamos", "perfecto", "de acuerdo"
      ],
      "Se encuentra en nuestra zona de servicio": [
        "vivo", "ubicado", "dirección", "ciudad", "zona", "región", "local", 
        "envío", "entrega", "domicilio", "casa", "oficina", "trabajo", "calle", 
        "avenida", "país", "área", "cerca", "lejos", "distancia", "lugar",
        "méxico", "cdmx", "guadalajara", "monterrey", "puebla", "cancún"
      ]
    };
    const metTraits: string[] = [];
    const metTraitIndices: number[] = [];
    enabledTraits.forEach((trait, idx) => {
      const keywords = customKeywordMap[trait.trait] || defaultKeywordMap[trait.trait] || [];
      const matchFound = keywords.some(keyword => {
        return conversationText.includes(keyword.toLowerCase());
      });
      if (matchFound) {
        metTraits.push(trait.trait);
        metTraitIndices.push(idx);
      }
    });
    const matchPoints = metTraits.length;
    return { matchPoints, metTraits, metTraitIndices };
  }, []);

  const updateProspectInStorage = useCallback((
    senderId: string,
    userName: string,
    matchPoints: number,
    metTraits: string[],
    messageText: string,
    metTraitIndices?: number[]
  ) => {
    try {
      const savedConversationsStr = localStorage.getItem('hower-conversations');
      let conversations: ProspectData[] = [];
      
      if (savedConversationsStr) {
        conversations = JSON.parse(savedConversationsStr);
      }
      
      const existingIndex = conversations.findIndex(conv => 
        conv.id === senderId || 
        conv.senderId === senderId ||
        conv.userName === userName
      );
      
      if (existingIndex !== -1) {
        // Actualizar conversación existente - ACUMULAR características
        const existing = conversations[existingIndex];
        const combinedTraits = [...new Set([...(existing.metTraits || []), ...metTraits])];
        const combinedTraitIndices = [...new Set([...(existing.metTraitIndices || []), ...(metTraitIndices || [])])];
        
        conversations[existingIndex] = {
          ...existing,
          matchPoints: combinedTraits.length,
          metTraits: combinedTraits,
          metTraitIndices: combinedTraitIndices,
          lastMessage: messageText.substring(0, 100),
          timestamp: '1m'
        };
        
        console.log(`✅ PROSPECTO ACTUALIZADO: ${userName}`, {
          matchPoints: combinedTraits.length,
          metTraits: combinedTraits
        });
      } else {
        // Crear nueva conversación
        const newConversation: ProspectData = {
          id: senderId,
          senderId,
          userName: userName || `Usuario ${senderId.slice(-4)}`,
          matchPoints,
          metTraits,
          metTraitIndices: metTraitIndices || [],
          lastMessage: messageText.substring(0, 100),
          timestamp: '1m',
          unread: true
        };
        
        conversations.push(newConversation);
        
        console.log(`✅ PROSPECTO CREADO: ${userName}`, {
          matchPoints,
          metTraits
        });
      }
      
      localStorage.setItem('hower-conversations', JSON.stringify(conversations));
      
      // Forzar actualización de la UI
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('conversations-updated', { 
        detail: { senderId, matchPoints, metTraits, metTraitIndices }
      }));
      
      console.log("💾 DATOS GUARDADOS EN LOCALSTORAGE CORRECTAMENTE");
      
    } catch (error) {
      console.error("❌ Error al actualizar prospecto:", error);
    }
  }, []);

  const analyzeAndUpdateProspect = useCallback(async (
    senderId: string,
    userName: string,
    messageText: string,
    idealTraits: Trait[]
  ): Promise<AnalysisResult> => {
    console.log("🔍 ANALIZANDO Y ACTUALIZANDO PROSPECTO:", userName, "Mensaje:", messageText);
    
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeMessage(messageText, idealTraits);
      
      if (result.matchPoints > 0) {
        updateProspectInStorage(senderId, userName, result.matchPoints, result.metTraits, messageText, result.metTraitIndices);
      }
      
      return result;
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeMessage, updateProspectInStorage]);

  return {
    isAnalyzing,
    analyzeMessage,
    analyzeAndUpdateProspect
  };
};

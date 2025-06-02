
import { useState, useCallback } from 'react';

interface Trait {
  trait: string;
  enabled: boolean;
  position: number;
}

interface AnalysisResult {
  matchPoints: number;
  metTraits: string[];
}

interface ProspectData {
  id: string;
  senderId: string;
  userName: string;
  matchPoints: number;
  metTraits: string[];
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

export const useTraitAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMessage = useCallback((messageText: string, idealTraits: Trait[]): AnalysisResult => {
    if (!messageText || idealTraits.length === 0) {
      return { matchPoints: 0, metTraits: [] };
    }

    console.log("🔍 ANALIZANDO MENSAJE:", messageText);
    
    const enabledTraits = idealTraits.filter(t => t.enabled);
    if (enabledTraits.length === 0) {
      return { matchPoints: 0, metTraits: [] };
    }

    const conversationText = messageText.toLowerCase();
    console.log("📝 Texto normalizado:", conversationText);
    
    // Mapa extendido de palabras clave
    const keywordMap: Record<string, string[]> = {
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
    
    enabledTraits.forEach(trait => {
      const keywords = keywordMap[trait.trait] || [];
      
      const matchFound = keywords.some(keyword => {
        return conversationText.includes(keyword.toLowerCase());
      });
      
      console.log(`🎯 Característica "${trait.trait}"`);
      console.log(`   Palabras clave: ${keywords.slice(0, 5).join(', ')}...`);
      console.log(`   Coincidencia: ${matchFound}`);
      
      if (matchFound) {
        metTraits.push(trait.trait);
        console.log(`✅ CARACTERÍSTICA DETECTADA: ${trait.trait}`);
      }
    });
    
    const matchPoints = metTraits.length;
    
    console.log("📊 RESULTADO DEL ANÁLISIS:");
    console.log(`   Características detectadas: ${metTraits.length}`);
    console.log(`   Puntos de compatibilidad: ${matchPoints}/${enabledTraits.length}`);
    
    return { matchPoints, metTraits };
  }, []);

  const updateProspectInStorage = useCallback((
    senderId: string,
    userName: string,
    matchPoints: number,
    metTraits: string[],
    messageText: string
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
        
        conversations[existingIndex] = {
          ...existing,
          matchPoints: combinedTraits.length,
          metTraits: combinedTraits,
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
        detail: { senderId, matchPoints, metTraits }
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
      const result = analyzeMessage(messageText, idealTraits);
      
      if (result.matchPoints > 0) {
        updateProspectInStorage(senderId, userName, result.matchPoints, result.metTraits, messageText);
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


import { supabase } from '@/integrations/supabase/client';
import { updateProspectActivity } from '@/services/autoResetService';

interface Trait {
  trait: string;
  enabled: boolean;
  position: number;
}

interface ProspectData {
  id: string;
  userName: string;
  matchPoints: number;
  metTraits: string[];
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  avatar?: string;
}

export const analyzeAndUpdateProspect = async (
  conversationId: string,
  userName: string,
  messageText: string,
  idealTraits: Trait[]
) => {
  console.log("🔍 ANALIZANDO PROSPECTO:", userName, "Mensaje:", messageText);
  
  // Actualizar actividad del prospecto en base de datos
  try {
    await updateProspectActivity(conversationId);
  } catch (error) {
    console.error("Error actualizando actividad del prospecto:", error);
  }
  
  if (!messageText || idealTraits.length === 0) {
    return { matchPoints: 0, metTraits: [] };
  }

  // Obtener características habilitadas
  const enabledTraits = idealTraits.filter(t => t.enabled);
  if (enabledTraits.length === 0) {
    return { matchPoints: 0, metTraits: [] };
  }

  const conversationText = messageText.toLowerCase();
  
  // Mapa de palabras clave extendido
  const keywordMap: Record<string, string[]> = {
    "Interesado en nuestros productos o servicios": [
      "interesa", "producto", "servicio", "necesito", "busco", "quiero", "comprar", 
      "tienen", "ofrecen", "información", "conocer", "saber", "precio", "cotización", 
      "propuesta", "me gusta", "me interesa", "quisiera", "podría", "puedo", 
      "disponible", "opciones", "planes", "paquetes", "ofertas", "promociones",
      "cruceros", "viajes", "tours", "excursiones", "vacaciones", "destinos",
      "gustan", "encantan", "fascinan", "amo", "adoro"
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
  
  // Analizar características
  const metTraits: string[] = [];
  
  enabledTraits.forEach(trait => {
    const keywords = keywordMap[trait.trait] || [];
    
    const matchFound = keywords.some(keyword => {
      return conversationText.includes(keyword.toLowerCase());
    });
    
    console.log(`🎯 "${trait.trait}" - Match: ${matchFound}`);
    
    if (matchFound) {
      metTraits.push(trait.trait);
      console.log(`✅ CARACTERÍSTICA DETECTADA: ${trait.trait}`);
    }
  });
  
  const matchPoints = Math.min(metTraits.length, enabledTraits.length);
  
  // 💾 GUARDAR EN BASE DE DATOS (ya no localStorage)
  try {
    // Actualizar análisis del prospecto en la base de datos
    const { error: analysisError } = await supabase
      .from('prospect_analysis')
      .upsert({
        sender_id: conversationId,
        match_points: matchPoints,
        met_traits: metTraits,
        last_analyzed_at: new Date().toISOString(),
        message_count: 1,
        analysis_data: {
          keywords_detected: metTraits,
          analysis_timestamp: new Date().toISOString(),
          message_analyzed: messageText.substring(0, 100)
        }
      }, {
        onConflict: 'sender_id'
      });

    if (analysisError) {
      console.error('❌ Error actualizando análisis del prospecto:', analysisError);
    } else {
      console.log("💾 ANÁLISIS DEL PROSPECTO GUARDADO EN BD:", {
        sender_id: conversationId,
        userName,
        matchPoints,
        metTraits: metTraits.length,
        total: enabledTraits.length
      });
    }
    
  } catch (error) {
    console.error("Error al guardar análisis del prospecto en BD:", error);
  }
  
  return { matchPoints, metTraits };
};

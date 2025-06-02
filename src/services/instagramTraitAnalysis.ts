
import { analyzeAndUpdateProspect } from './prospectAnalysisService';

interface Trait {
  trait: string;
  enabled: boolean;
  position: number;
}

// Función para cargar características desde localStorage
const loadIdealTraits = (): Trait[] => {
  try {
    const savedTraits = localStorage.getItem('hower-ideal-client-traits');
    if (savedTraits) {
      return JSON.parse(savedTraits);
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

// Función para analizar mensajes de Instagram automáticamente
export const analyzeInstagramMessage = async (
  senderId: string,
  messageText: string,
  username?: string
) => {
  console.log("📱 ANALIZANDO MENSAJE DE INSTAGRAM:", { senderId, messageText, username });
  
  if (!messageText || messageText.trim().length === 0) {
    console.log("❌ Mensaje vacío, saltando análisis");
    return;
  }
  
  // Cargar características ideales
  const idealTraits = loadIdealTraits();
  const enabledTraits = idealTraits.filter(t => t.enabled);
  
  if (enabledTraits.length === 0) {
    console.log("❌ No hay características habilitadas para analizar");
    return;
  }
  
  console.log("✅ Características cargadas:", enabledTraits.map(t => t.trait));
  
  // Analizar y actualizar prospecto
  const result = await analyzeAndUpdateProspect(
    senderId,
    username || `Usuario ${senderId.slice(-4)}`,
    messageText,
    idealTraits
  );
  
  console.log("📊 RESULTADO ANÁLISIS INSTAGRAM:", {
    senderId,
    matchPoints: result.matchPoints,
    metTraits: result.metTraits.length,
    characteristics: result.metTraits
  });
  
  return result;
};

// Función para escuchar eventos de storage y recargar características
export const setupTraitAnalysisListener = () => {
  console.log("🔧 Configurando listener para análisis de características");
  
  // Escuchar cambios en las características
  window.addEventListener('traits-updated', (event: any) => {
    console.log("🔄 Características actualizadas para análisis:", event.detail);
  });
  
  // Escuchar nuevos mensajes (si se implementa un sistema de eventos)
  window.addEventListener('new-instagram-message', (event: any) => {
    const { senderId, messageText, username } = event.detail;
    analyzeInstagramMessage(senderId, messageText, username);
  });
};

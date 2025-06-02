
import { useState, useCallback } from 'react';
import { analyzeConversationWithAI, analyzeAllConversations } from '@/services/aiTraitAnalysisService';

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

export const useAITraitAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadIdealTraits = useCallback((): Trait[] => {
    try {
      const savedTraits = localStorage.getItem('hower-ideal-client-traits');
      if (savedTraits) {
        const parsedTraits = JSON.parse(savedTraits);
        return parsedTraits.map((item: any) => ({
          trait: item.trait,
          enabled: item.enabled
        }));
      }
    } catch (error) {
      console.error("Error al cargar características:", error);
    }

    // Características por defecto
    return [
      { trait: "Interesado en nuestros productos o servicios", enabled: true },
      { trait: "Tiene presupuesto adecuado para adquirir nuestras soluciones", enabled: true },
      { trait: "Está listo para tomar una decisión de compra", enabled: true },
      { trait: "Se encuentra en nuestra zona de servicio", enabled: true }
    ];
  }, []);

  const analyzeConversation = useCallback(async (
    messages: ConversationMessage[]
  ): Promise<AnalysisResult> => {
    const idealTraits = loadIdealTraits();
    return await analyzeConversationWithAI(messages, idealTraits);
  }, [loadIdealTraits]);

  const analyzeAll = useCallback(async (): Promise<void> => {
    setIsAnalyzing(true);
    try {
      const idealTraits = loadIdealTraits();
      await analyzeAllConversations(idealTraits);
    } finally {
      setIsAnalyzing(false);
    }
  }, [loadIdealTraits]);

  const updateConversationInStorage = useCallback((
    conversationId: string,
    matchPoints: number,
    metTraits: string[]
  ) => {
    try {
      const conversationsStr = localStorage.getItem('hower-conversations');
      if (!conversationsStr) return;

      const conversations = JSON.parse(conversationsStr);
      const convIndex = conversations.findIndex((conv: any) => conv.id === conversationId);
      
      if (convIndex !== -1) {
        conversations[convIndex].matchPoints = matchPoints;
        conversations[convIndex].metTraits = metTraits;
        
        localStorage.setItem('hower-conversations', JSON.stringify(conversations));
        
        // Disparar eventos para actualizar UI
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('conversations-updated'));
        
        console.log(`✅ Conversación ${conversationId} actualizada:`, { matchPoints, metTraits });
      }
    } catch (error) {
      console.error("Error al actualizar conversación:", error);
    }
  }, []);

  return {
    isAnalyzing,
    analyzeConversation,
    analyzeAll,
    updateConversationInStorage,
    loadIdealTraits
  };
};

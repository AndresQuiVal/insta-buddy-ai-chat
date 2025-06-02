
import { useState, useCallback } from 'react';
import { analyzeAllConversations } from '@/services/aiTraitAnalysisService';
import { toast } from '@/hooks/use-toast';

interface Trait {
  trait: string;
  enabled: boolean;
  position: number;
}

export const useAITraitAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeAllWithAI = useCallback(async (idealTraits: Trait[]) => {
    if (idealTraits.length === 0) {
      toast({
        title: "⚠️ No hay características configuradas",
        description: "Configure las características del cliente ideal primero",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      console.log("🚀 INICIANDO ANÁLISIS MASIVO CON IA...");
      
      toast({
        title: "🤖 Iniciando análisis masivo con IA",
        description: "Analizando todas las conversaciones...",
      });

      await analyzeAllConversations(idealTraits);

      toast({
        title: "🎉 ¡Análisis masivo completado!",
        description: "Todas las conversaciones han sido analizadas con IA",
      });

    } catch (error) {
      console.error("❌ Error en análisis masivo:", error);
      
      let errorMessage = "Error desconocido";
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = "Configura la API key de OpenAI en Supabase";
        } else if (error.message.includes('quota')) {
          errorMessage = "Cuota de OpenAI agotada";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "❌ Error en análisis masivo",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    isAnalyzing,
    analyzeAllWithAI
  };
};

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DreamCustomerRadarProps {
  onBack: () => void;
}

interface RadarResult {
  score: number;
  completedBlocks: string[];
  missingBlocks: string[];
  suggestions: string[];
  searchKeywords: string[];
}

const DreamCustomerRadar: React.FC<DreamCustomerRadarProps> = ({ onBack }) => {
  const [icpDescription, setIcpDescription] = useState('');
  const [result, setResult] = useState<RadarResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyzeICP = async () => {
    if (!icpDescription.trim()) {
      toast({
        title: "Campo requerido",
        description: "Por favor describe tu cliente ideal",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chatgpt-response', {
        body: {
          prompt: `Analiza esta descripción de cliente ideal y evalúa qué tan completa está según estos 4 bloques:

WHO (Quién es): edad, género, situación actual, problema principal
WHERE (Dónde está): qué páginas sigue, qué hashtags usa, qué comunidades/podcasts/blogs consume
BAIT (Qué lo atrae): qué hook, historia u oferta irresistible lo engancharía
RESULT (Resultado deseado): qué logro máximo busca, medible y concreto

Descripción a analizar: "${icpDescription}"

Responde en formato JSON exactamente así:
{
  "score": [número del 0-4 según cuántos bloques están completos],
  "completedBlocks": ["WHO", "WHERE", "BAIT", "RESULT"] [solo los que están completos],
  "missingBlocks": ["WHO", "WHERE", "BAIT", "RESULT"] [solo los que faltan],
  "suggestions": ["sugerencia 1", "sugerencia 2"] [máximo 3 sugerencias específicas],
  "searchKeywords": ["keyword1", "keyword2"] [solo si score es 4, palabras clave de búsqueda basadas en dolores]
}`
        },
      });

      if (error) throw error;

      const response = data?.response;
      let parsedResult;
      
      try {
        parsedResult = JSON.parse(response);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error('Error al procesar la respuesta de análisis');
      }

      setResult(parsedResult);
      
      if (parsedResult.score === 4) {
        toast({
          title: "¡Bullseye! 🎯",
          description: "Tu ICP está perfectamente definido. Palabras de búsqueda desbloqueadas.",
        });
      } else if (parsedResult.score >= 2) {
        toast({
          title: "Anillo Intermedio 🎯",
          description: "Buen progreso, sigue mejorando tu ICP.",
        });
      } else {
        toast({
          title: "Anillo Externo ⭕",
          description: "Tu ICP necesita más definición para ser útil.",
        });
      }

    } catch (error) {
      console.error('Error analyzing ICP:', error);
      toast({
        title: "Error",
        description: "No se pudo analizar tu ICP. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRadarLevel = (score: number) => {
    if (score === 4) return { level: 'Bullseye', color: 'bg-green-500', description: 'ICP perfectamente definido' };
    if (score >= 2) return { level: 'Anillo Intermedio', color: 'bg-yellow-500', description: 'ICP parcialmente definido' };
    return { level: 'Anillo Externo', color: 'bg-red-500', description: 'ICP necesita más definición' };
  };

  const shareProgress = () => {
    if (!result) return;
    
    const { level } = getRadarLevel(result.score);
    const message = `Dream Customer Radar 🎯\n\nMi ICP está en: ${level} (${result.score}/4 bloques completos)\n\n¡Vamos por el Bullseye! 💪`;
    
    // Copiar al portapapeles
    navigator.clipboard.writeText(message).then(() => {
      toast({
        title: "Copiado",
        description: "Mensaje listo para compartir en WhatsApp",
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">🧭 Dream Customer Radar</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Define tu Cliente Ideal (ICP)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Describe tu cliente ideal respondiendo WHO, WHERE, BAIT y RESULT:
            </label>
            <Textarea
              placeholder="Ejemplo: Mujeres de 25-35 años en España, que ya intentaron emprender online pero están estancadas. Siguen cuentas de motivación y marketing, escuchan podcasts de negocio, quieren generar ingresos extras y sueñan con dejar su empleo..."
              value={icpDescription}
              onChange={(e) => setIcpDescription(e.target.value)}
              rows={6}
            />
          </div>
          
          <Button 
            onClick={analyzeICP} 
            disabled={loading || !icpDescription.trim()}
            className="w-full"
          >
            {loading ? "Analizando..." : "🎯 Analizar mi ICP"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Resultado del Radar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className={`inline-block px-4 py-2 rounded-full text-white font-bold ${getRadarLevel(result.score).color}`}>
                {getRadarLevel(result.score).level}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {getRadarLevel(result.score).description}
              </p>
              <p className="text-lg font-semibold mt-2">
                {result.score}/4 bloques completos
              </p>
            </div>

            {/* Bloques completados */}
            {result.completedBlocks.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-600 flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  Bloques Completos
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.completedBlocks.map((block) => (
                    <Badge key={block} variant="secondary" className="bg-green-100 text-green-800">
                      {block}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Bloques faltantes */}
            {result.missingBlocks.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-600 flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4" />
                  Bloques Faltantes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.missingBlocks.map((block) => (
                    <Badge key={block} variant="secondary" className="bg-red-100 text-red-800">
                      {block}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Sugerencias */}
            {result.suggestions.length > 0 && (
              <div>
                <h4 className="font-semibold text-blue-600 flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  Sugerencias para Mejorar
                </h4>
                <ul className="space-y-1">
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-blue-500">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Palabras de búsqueda (solo en Bullseye) */}
            {result.score === 4 && result.searchKeywords.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-700 mb-2">
                  🎯 Palabras de Búsqueda Desbloqueadas
                </h4>
                <p className="text-sm text-green-600 mb-3">
                  Usa estas palabras en el buscador de Hower para encontrar prospectos:
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.searchKeywords.map((keyword) => (
                    <Badge key={keyword} className="bg-green-600 text-white">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={shareProgress} variant="outline" className="flex-1">
                📱 Compartir Progreso
              </Button>
              <Button onClick={() => setResult(null)} variant="outline">
                🔄 Nuevo Análisis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DreamCustomerRadar;
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, CheckCircle, XCircle, Lightbulb, Share2, Trophy, Sparkles, Radar } from 'lucide-react';
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
  const [showShareModal, setShowShareModal] = useState(false);
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
          title: "¡BULLSEYE! 🎯",
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
    if (score === 4) return { 
      level: 'Bullseye', 
      color: 'from-green-400 to-emerald-500', 
      bgColor: 'bg-green-500',
      textColor: 'text-green-800',
      description: 'ICP perfectamente definido 🎯',
      emoji: '🎯',
      ring: 'border-green-400'
    };
    if (score >= 2) return { 
      level: 'Anillo Intermedio', 
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'bg-yellow-500', 
      textColor: 'text-yellow-800',
      description: 'ICP parcialmente definido ⚡',
      emoji: '⚡',
      ring: 'border-yellow-400'
    };
    return { 
      level: 'Anillo Externo', 
      color: 'from-red-400 to-pink-500',
      bgColor: 'bg-red-500', 
      textColor: 'text-red-800',
      description: 'ICP necesita más definición ❌',
      emoji: '❌',
      ring: 'border-red-400'
    };
  };

  const shareProgress = () => {
    setShowShareModal(true);
  };

  const copyShareMessage = () => {
    if (!result) return;
    
    const { level, emoji } = getRadarLevel(result.score);
    const message = `🎯 Dream Customer Radar Update!

${emoji} Mi ICP está en: ${level} (${result.score}/4 bloques completos)

${result.completedBlocks.length > 0 ? `✅ Completos: ${result.completedBlocks.join(', ')}` : ''}
${result.missingBlocks.length > 0 ? `❌ Me faltan: ${result.missingBlocks.join(', ')}` : ''}

${result.score === 4 ? '🔓 ¡PALABRAS DE BÚSQUEDA DESBLOQUEADAS!' : '🚀 ¡Vamos por el Bullseye!'}

#DreamCustomerRadar #ICP #Hower`;
    
    navigator.clipboard.writeText(message).then(() => {
      toast({
        title: "¡Copiado! 📋",
        description: "Mensaje listo para compartir en WhatsApp",
      });
      setShowShareModal(false);
    });
  };

  const RadarVisualization = ({ score }: { score: number }) => {
    const { emoji, ring } = getRadarLevel(score);
    
    return (
      <div className="relative w-48 h-48 mx-auto mb-6">
        {/* Anillos del radar */}
        <div className="absolute inset-0 border-4 border-red-300 rounded-full opacity-40 animate-pulse"></div>
        <div className="absolute inset-6 border-4 border-yellow-300 rounded-full opacity-50"></div>
        <div className="absolute inset-12 border-4 border-green-300 rounded-full opacity-60"></div>
        
        {/* Líneas del radar */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-0.5 bg-gray-300 opacity-30"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-full w-0.5 bg-gray-300 opacity-30"></div>
        </div>
        
        {/* Punto del usuario */}
        <div className={`absolute inset-${score === 4 ? '20' : score >= 2 ? '14' : '2'} ${ring} border-4 bg-white rounded-full shadow-lg animate-bounce flex items-center justify-center`}>
          <span className="text-2xl">{emoji}</span>
        </div>
        
        {/* Labels */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-green-600">
          Bullseye
        </div>
        <div className="absolute top-12 -right-8 text-xs font-semibold text-yellow-600">
          Intermedio
        </div>
        <div className="absolute top-1/2 -left-10 transform -translate-y-1/2 text-xs font-semibold text-red-600">
          Externo
        </div>
      </div>
    );
  };

  const ShareModal = () => {
    if (!showShareModal || !result) return null;
    
    const { level, color, emoji } = getRadarLevel(result.score);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in"
          style={{
            backgroundImage: `
              linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
              linear-gradient(#f9fafb 0%, #ffffff 100%)
            `,
            backgroundSize: '20px 1px, 100% 100%',
            backgroundPosition: '0 20px, 0 0'
          }}
        >
          <div className="text-center mb-6">
            <div className={`inline-block p-4 bg-gradient-to-r ${color} rounded-full mb-4 shadow-lg`}>
              <Share2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 font-mono">¡Comparte tu progreso!</h2>
          </div>
          
          {/* Vista previa del mensaje */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="font-mono text-sm text-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🎯</span>
                  <strong>Dream Customer Radar Update!</strong>
                </div>
                
                <div className="space-y-1 ml-6">
                  <p><span className="text-lg">{emoji}</span> Mi ICP está en: <strong>{level}</strong> ({result.score}/4)</p>
                  
                  {result.completedBlocks.length > 0 && (
                    <p className="text-green-600">✅ Completos: {result.completedBlocks.join(', ')}</p>
                  )}
                  
                  {result.missingBlocks.length > 0 && (
                    <p className="text-red-600">❌ Me faltan: {result.missingBlocks.join(', ')}</p>
                  )}
                  
                  <p className="text-blue-600 font-semibold">
                    {result.score === 4 ? '🔓 ¡PALABRAS DESBLOQUEADAS!' : '🚀 ¡Vamos por el Bullseye!'}
                  </p>
                  
                  <p className="text-xs text-gray-500 mt-2">#DreamCustomerRadar #ICP #Hower</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowShareModal(false)} 
              variant="outline" 
              className="flex-1 font-mono"
            >
              Cancelar
            </Button>
            <Button 
              onClick={copyShareMessage} 
              className={`flex-1 bg-gradient-to-r ${color} text-white font-mono font-bold`}
            >
              📋 Copiar mensaje
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header con estilo cuaderno */}
        <div className="relative mb-8">
          <div 
            className="bg-white rounded-2xl shadow-xl border-t-8 border-red-400 p-6 sm:p-8"
            style={{
              backgroundImage: `
                linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                linear-gradient(#f9fafb 0%, #ffffff 100%)
              `,
              backgroundSize: '24px 1px, 100% 100%',
              backgroundPosition: '0 40px, 0 0'
            }}
          >
            {/* Espiral del cuaderno */}
            <div className="absolute left-4 top-0 bottom-0 w-1 flex flex-col justify-evenly">
              {Array.from({length: 10}).map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-red-400 shadow-inner" />
              ))}
            </div>
            
            <div className="ml-4 sm:ml-6">
              <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" onClick={onBack} className="p-2 hover:bg-purple-100 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-purple-600" />
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 font-mono flex items-center gap-2">
                  <Radar className="w-8 h-8 text-blue-600 animate-spin" />
                  Dream Customer Radar
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario principal - Estilo cuaderno */}
        <div 
          className="bg-white rounded-2xl shadow-xl border-l-4 border-blue-400 p-6 sm:p-8 mb-8"
          style={{
            backgroundImage: `
              linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
              linear-gradient(#f8fafc 0%, #ffffff 100%)
            `,
            backgroundSize: '24px 1px, 100% 100%',
            backgroundPosition: '0 30px, 0 0'
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full animate-pulse">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 font-mono">📝 Define tu Cliente Ideal</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-lg font-semibold text-gray-700 font-mono flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Describe tu cliente ideal (WHO, WHERE, BAIT, RESULT):
              </label>
              
              {/* Guía visual de los bloques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg text-center">
                  <div className="font-bold text-blue-800 text-sm">WHO</div>
                  <div className="text-xs text-blue-600">¿Quién es?</div>
                </div>
                <div className="bg-green-100 p-2 rounded-lg text-center">
                  <div className="font-bold text-green-800 text-sm">WHERE</div>
                  <div className="text-xs text-green-600">¿Dónde está?</div>
                </div>
                <div className="bg-purple-100 p-2 rounded-lg text-center">
                  <div className="font-bold text-purple-800 text-sm">BAIT</div>
                  <div className="text-xs text-purple-600">¿Qué lo atrae?</div>
                </div>
                <div className="bg-orange-100 p-2 rounded-lg text-center">
                  <div className="font-bold text-orange-800 text-sm">RESULT</div>
                  <div className="text-xs text-orange-600">¿Qué busca?</div>
                </div>
              </div>
              
              <Textarea
                placeholder="Ejemplo: Mujeres de 25-35 años en España, que ya intentaron emprender online pero están estancadas. Siguen cuentas de motivación (@emprendeconmigo, @marketingfacil), usan hashtags como #emprendimiento #motivacion, escuchan podcasts de negocio. Buscan una oferta que les prometa ingresos rápidos con poco esfuerzo, sueñan con ganar 3000€/mes para dejar su empleo..."
                value={icpDescription}
                onChange={(e) => setIcpDescription(e.target.value)}
                rows={8}
                className="font-mono text-sm leading-relaxed"
              />
            </div>
            
            <Button 
              onClick={analyzeICP} 
              disabled={loading || !icpDescription.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Analizando con IA...
                </div>
              ) : (
                "🤖 Analizar mi ICP con Inteligencia Artificial"
              )}
            </Button>
          </div>
        </div>

        {/* Resultados - Estilo cuaderno */}
        {result && (
          <div 
            className="bg-white rounded-2xl shadow-xl border-l-4 border-green-400 p-6 sm:p-8 mb-8"
            style={{
              backgroundImage: `
                linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                linear-gradient(#f8fafc 0%, #ffffff 100%)
              `,
              backgroundSize: '24px 1px, 100% 100%',
              backgroundPosition: '0 30px, 0 0'
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 font-mono">🎯 Resultado del Radar</h2>
            </div>

            {/* Radar visual */}
            <div className="text-center mb-8">
              <RadarVisualization score={result.score} />
              
              <div className={`inline-block px-6 py-3 rounded-2xl text-white font-bold text-xl shadow-lg bg-gradient-to-r ${getRadarLevel(result.score).color}`}>
                {getRadarLevel(result.score).level}
              </div>
              <p className={`text-lg font-semibold mt-2 ${getRadarLevel(result.score).textColor}`}>
                {getRadarLevel(result.score).description}
              </p>
              <p className="text-2xl font-bold mt-2 text-gray-700">
                {result.score}/4 bloques completos
              </p>
            </div>

            {/* Bloques completados y faltantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Bloques completados */}
              {result.completedBlocks.length > 0 && (
                <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
                  <h4 className="font-bold text-green-700 flex items-center gap-2 mb-4 text-lg">
                    <CheckCircle className="w-6 h-6" />
                    Bloques Completos ✅
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.completedBlocks.map((block) => (
                      <Badge key={block} className="bg-green-500 text-white px-3 py-1 text-sm font-bold">
                        {block}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Bloques faltantes */}
              {result.missingBlocks.length > 0 && (
                <div className="bg-red-50 p-6 rounded-xl border-2 border-red-200">
                  <h4 className="font-bold text-red-700 flex items-center gap-2 mb-4 text-lg">
                    <XCircle className="w-6 h-6" />
                    Bloques Faltantes ❌
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.missingBlocks.map((block) => (
                      <Badge key={block} className="bg-red-500 text-white px-3 py-1 text-sm font-bold">
                        {block}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sugerencias */}
            {result.suggestions.length > 0 && (
              <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200 mb-8">
                <h4 className="font-bold text-blue-700 flex items-center gap-2 mb-4 text-lg">
                  <Lightbulb className="w-6 h-6" />
                  💡 Sugerencias para Mejorar
                </h4>
                <ul className="space-y-3">
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                      <span className="text-blue-500 font-bold text-lg">{index + 1}.</span>
                      <span className="text-gray-700 font-mono">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Palabras de búsqueda (solo en Bullseye) */}
            {result.score === 4 && result.searchKeywords.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-yellow-300 mb-8 animate-pulse">
                <h4 className="font-bold text-yellow-800 mb-4 text-xl flex items-center gap-2">
                  🎯 ¡PALABRAS DE BÚSQUEDA DESBLOQUEADAS! 🔓
                </h4>
                <p className="text-yellow-700 mb-4 font-mono">
                  🚀 Usa estas palabras en el buscador de Hower para encontrar prospectos:
                </p>
                <div className="flex flex-wrap gap-3">
                  {result.searchKeywords.map((keyword, index) => (
                    <div key={index} className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full blur opacity-75 animate-pulse"></div>
                      <Badge className="relative bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 text-sm font-bold shadow-lg">
                        "{keyword}"
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={shareProgress} 
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Share2 className="w-5 h-5 mr-2" />
                📱 Compartir mi progreso
              </Button>
              <Button 
                onClick={() => setResult(null)} 
                variant="outline" 
                className="flex-1 font-mono border-2 hover:bg-gray-50"
              >
                🔄 Nuevo análisis
              </Button>
            </div>
          </div>
        )}

        <ShareModal />
      </div>
    </div>
  );
};

export default DreamCustomerRadar;
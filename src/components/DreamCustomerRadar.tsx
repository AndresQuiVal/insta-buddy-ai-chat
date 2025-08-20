import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Target, CheckCircle, XCircle, Lightbulb, Share2, Trophy, Sparkles, Radar, Download, Copy, Zap, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { useProspects } from '@/hooks/useProspects';

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
  const [animationStep, setAnimationStep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();
  const { prospects: realProspects } = useProspects(currentUser?.instagram_user_id);

  // Calculate prospect metrics similar to TasksToDo
  const prospectsMetrics = useMemo(() => {
    if (!realProspects.length) {
      return {
        today: { nuevosProspectos: 0, seguimientosHechos: 0, agendados: 0 },
        yesterday: { nuevosProspectos: 0, seguimientosHechos: 0, agendados: 0 },
        week: { nuevosProspectos: 0, seguimientosHechos: 0, agendados: 0 }
      };
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Map real prospects to the structure
    const prospects = realProspects.map(prospect => ({
      id: prospect.senderId,
      firstContactDate: prospect.lastMessageTime,
      lastContactDate: prospect.lastMessageTime,
      status: prospect.state === 'pending' ? 'esperando_respuesta' : 
              prospect.state === 'invited' ? 'enviado' : 
              (prospect.state === 'yesterday' || prospect.state === 'week') ? 'seguimiento' : 'esperando_respuesta'
    }));

    // Today's metrics
    const todayNewProspects = prospects.filter(p => {
      const contactDate = new Date(p.firstContactDate);
      return contactDate >= todayStart && p.status === 'esperando_respuesta';
    }).length;

    const todayFollowUps = prospects.filter(p => {
      const lastMessage = new Date(p.lastContactDate);
      return p.status === 'seguimiento' && lastMessage >= todayStart;
    }).length;

    // Yesterday's metrics
    const yesterdayNewProspects = prospects.filter(p => {
      const contactDate = new Date(p.firstContactDate);
      return contactDate >= yesterday && contactDate < todayStart && p.status === 'esperando_respuesta';
    }).length;

    const yesterdayFollowUps = prospects.filter(p => {
      const lastMessage = new Date(p.lastContactDate);
      return p.status === 'seguimiento' && 
             lastMessage >= yesterday && 
             lastMessage < todayStart;
    }).length;

    // Week's metrics
    const weekNewProspects = prospects.filter(p => {
      const contactDate = new Date(p.firstContactDate);
      return contactDate >= sevenDaysAgo && p.status === 'esperando_respuesta';
    }).length;

    const weekFollowUps = prospects.filter(p => {
      const lastMessage = new Date(p.lastContactDate);
      return p.status === 'seguimiento' && lastMessage >= sevenDaysAgo;
    }).length;

    return {
      today: { 
        nuevosProspectos: todayNewProspects, 
        seguimientosHechos: todayFollowUps, 
        agendados: 0 
      },
      yesterday: { 
        nuevosProspectos: yesterdayNewProspects, 
        seguimientosHechos: yesterdayFollowUps, 
        agendados: 0 
      },
      week: { 
        nuevosProspectos: weekNewProspects, 
        seguimientosHechos: weekFollowUps, 
        agendados: 0 
      }
    };
  }, [realProspects]);

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
    setAnimationStep(0);
    
    try {
      const { data, error } = await supabase.functions.invoke('chatgpt-response', {
        body: {
          prompt: `Analiza esta descripción de cliente ideal y evalúa qué tan completa está según estos 4 bloques:

WHO (¿Quién es?): edad, género, situación actual, problema principal, ubicación geográfica
WHERE (¿Dónde los encuentras online?): qué influencers/cuentas siguen, qué hashtags usan, en qué grupos de Facebook/Telegram están, qué podcasts escuchan, qué blogs/websites visitan, qué comunidades online frecuentan
BAIT (¿Qué los atrae?): qué hook, historia, testimonio u oferta irresistible los engancharía para detenerse y prestar atención
RESULT (¿Qué resultado buscan?): qué transformación específica y medible quieren lograr

Descripción a analizar: "${icpDescription}"

Responde en formato JSON exactamente así:
{
  "score": [número del 0-4 según cuántos bloques están completos],
  "completedBlocks": ["WHO", "WHERE", "BAIT", "RESULT"] [solo los que están completos],
  "missingBlocks": ["WHO", "WHERE", "BAIT", "RESULT"] [solo los que faltan],
  "suggestions": ["sugerencia 1", "sugerencia 2"] [máximo 3 sugerencias específicas],
  "searchKeywords": ["frase1", "frase2", "frase3", "frase4", "frase5"] [solo si score es 4, genera 8-10 frases de 2-4 palabras para buscar en Instagram/Google cuentas que tengan seguidores similares al ICP. Ejemplos: "coaching empresarial", "madre emprendedora", "fitness mujeres", "inversión Bitcoin", "motivación personal"]
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

      // Animación de revelación
      setAnimationStep(1);
      setTimeout(() => setAnimationStep(2), 500);
      setTimeout(() => setAnimationStep(3), 1000);
      setTimeout(() => {
        setResult(parsedResult);
        setAnimationStep(4);
      }, 1500);
      
      if (parsedResult.score === 4) {
        setTimeout(() => {
          toast({
            title: "🎯 ¡BULLSEYE ALCANZADO!",
            description: "ICP perfecto. Palabras de búsqueda desbloqueadas.",
          });
        }, 2000);
      } else if (parsedResult.score >= 2) {
        setTimeout(() => {
          toast({
            title: "⚡ Anillo Intermedio",
            description: "Buen progreso, refina un poco más tu ICP.",
          });
        }, 2000);
      } else {
        setTimeout(() => {
          toast({
            title: "🔴 Anillo Externo", 
            description: "Tu ICP necesita más definición.",
          });
        }, 2000);
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
      level: 'BULLSEYE', 
      color: 'from-green-400 via-emerald-500 to-green-600', 
      bgColor: 'bg-green-500',
      textColor: 'text-green-800',
      borderColor: 'border-green-500',
      description: 'ICP perfectamente definido',
      emoji: '🎯',
      ring: 'ring-green-500',
      glow: 'shadow-green-500/50',
      position: 85, // % desde el centro
      ringSize: 20
    };
    if (score >= 2) return { 
      level: 'INTERMEDIO', 
      color: 'from-yellow-400 via-orange-500 to-yellow-600',
      bgColor: 'bg-yellow-500', 
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-500',
      description: 'ICP parcialmente definido',
      emoji: '⚡',
      ring: 'ring-yellow-500',
      glow: 'shadow-yellow-500/50',
      position: 60,
      ringSize: 50
    };
    return { 
      level: 'EXTERNO', 
      color: 'from-red-400 via-pink-500 to-red-600',
      bgColor: 'bg-red-500', 
      textColor: 'text-red-800',
      borderColor: 'border-red-500',
      description: 'ICP necesita más definición',
      emoji: '🔴',
      ring: 'ring-red-500',
      glow: 'shadow-red-500/50',
      position: 30,
      ringSize: 80
    };
  };

  // Radar visual super gráfico
  const RadarVisualization = ({ score, showAnimation }: { score: number; showAnimation: boolean }) => {
    const { emoji, ring, glow, position, color } = getRadarLevel(score);
    
    useEffect(() => {
      if (!canvasRef.current || !showAnimation) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY) - 20;

      let animationFrame = 0;
      
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
        gradient.addColorStop(1, 'rgba(147, 51, 234, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Radar rings
        const rings = [
          { radius: maxRadius * 0.9, color: 'rgba(239, 68, 68, 0.3)', label: 'EXTERNO', labelColor: '#DC2626' },
          { radius: maxRadius * 0.6, color: 'rgba(245, 158, 11, 0.4)', label: 'INTERMEDIO', labelColor: '#D97706' },
          { radius: maxRadius * 0.3, color: 'rgba(34, 197, 94, 0.5)', label: 'BULLSEYE', labelColor: '#16A34A' }
        ];

        rings.forEach((ringData, index) => {
          // Ring glow effect
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringData.radius, 0, 2 * Math.PI);
          ctx.strokeStyle = ringData.color;
          ctx.lineWidth = 4;
          ctx.stroke();
          
          // Ring solid line
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringData.radius, 0, 2 * Math.PI);
          ctx.strokeStyle = ringData.labelColor;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Labels
          ctx.font = 'bold 14px monospace';
          ctx.fillStyle = ringData.labelColor;
          ctx.textAlign = 'center';
          
          if (index === 0) { // Externo - arriba
            ctx.fillText(ringData.label, centerX, centerY - ringData.radius - 10);
          } else if (index === 1) { // Intermedio - derecha
            ctx.fillText(ringData.label, centerX + ringData.radius + 40, centerY + 5);
          } else { // Bullseye - centro
            ctx.fillText(ringData.label, centerX, centerY - 5);
          }
        });

        // Radar sweeping lines
        const sweepAngle = (animationFrame * 0.02) % (2 * Math.PI);
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(
            centerX + Math.cos(angle) * maxRadius * 0.9,
            centerY + Math.sin(angle) * maxRadius * 0.9
          );
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Animated sweep line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(sweepAngle) * maxRadius * 0.9,
          centerY + Math.sin(sweepAngle) * maxRadius * 0.9
        );
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // User position dot
        if (showAnimation && result) {
          const targetRadius = maxRadius * (position / 100);
          const dotX = centerX + Math.cos(sweepAngle + Math.PI/4) * targetRadius;
          const dotY = centerY + Math.sin(sweepAngle + Math.PI/4) * targetRadius;
          
          // Dot glow
          const dotGradient = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 15);
          dotGradient.addColorStop(0, score === 4 ? '#10B981' : score >= 2 ? '#F59E0B' : '#EF4444');
          dotGradient.addColorStop(1, 'transparent');
          ctx.fillStyle = dotGradient;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 15, 0, 2 * Math.PI);
          ctx.fill();
          
          // Dot
          ctx.beginPath();
          ctx.arc(dotX, dotY, 8, 0, 2 * Math.PI);
          ctx.fillStyle = score === 4 ? '#10B981' : score >= 2 ? '#F59E0B' : '#EF4444';
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(dotX, dotY, 8, 0, 2 * Math.PI);
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        animationFrame++;
        if (showAnimation) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    }, [showAnimation, score, result]);

    return (
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={400} 
          className="rounded-2xl border-4 border-gray-200 shadow-2xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
        />
        
        {/* Resultado superpuesto */}
        {result && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`bg-gradient-to-r ${color} text-white px-6 py-3 rounded-full font-bold text-lg shadow-2xl animate-bounce-in border-4 border-white`}>
              {emoji} {getRadarLevel(score).level}
            </div>
          </div>
        )}
      </div>
    );
  };

  const shareProgress = () => {
    setShowShareModal(true);
  };

  const generateShareImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600; 
    canvas.height = 600; // Más compacto sin métricas
    const ctx = canvas.getContext('2d');
    if (!ctx || !result) return '';

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#1e1b4b');
    gradient.addColorStop(1, '#7c3aed');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 600);

    const { emoji, level } = getRadarLevel(result.score);

    // Logo de Hower (simulado como rectángulo con texto por ahora)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(225, 30, 150, 40);
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Hower', 300, 55);

    // Title
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('🎯 Conoce tu Cliente Ideal', 300, 100);

    // Radar simplified
    const centerX = 300;
    const centerY = 220;
    const rings = [
      { radius: 80, color: '#EF4444', label: 'EXTERNO' },
      { radius: 50, color: '#F59E0B', label: 'INTERMEDIO' },
      { radius: 25, color: '#10B981', label: 'BULLSEYE' }
    ];

    rings.forEach(ring => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, ring.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 4;
      ctx.stroke();
    });

    // User position
    const targetRadius = rings[result.score === 4 ? 2 : result.score >= 2 ? 1 : 0].radius;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
    ctx.fillStyle = result.score === 4 ? '#10B981' : result.score >= 2 ? '#F59E0B' : '#EF4444';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Result text
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`${emoji} ${level}`, 300, 340);
    
    ctx.font = '20px Arial';
    ctx.fillText(`${result.score}/4 bloques completos`, 300, 370);

    // Blocks status
    let yPos = 420;
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    if (result.completedBlocks.length > 0) {
      ctx.fillStyle = '#10B981';
      const completedText = `✅ Completos: ${result.completedBlocks.join(', ')}`;
      const lines = completedText.match(/.{1,45}/g) || [completedText];
      lines.forEach((line, index) => {
        ctx.fillText(line, 50, yPos + (index * 25));
      });
      yPos += lines.length * 25 + 10;
    }
    
    if (result.missingBlocks.length > 0) {
      ctx.fillStyle = '#EF4444';
      const missingText = `❌ Faltan: ${result.missingBlocks.join(', ')}`;
      const lines = missingText.match(/.{1,45}/g) || [missingText];
      lines.forEach((line, index) => {
        ctx.fillText(line, 50, yPos + (index * 25));
      });
    }

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Hecho con Hower', 300, 580);

    return canvas.toDataURL('image/png');
  };

  const downloadImage = () => {
    const imageUrl = generateShareImage();
    const link = document.createElement('a');
    link.download = 'dream-customer-radar-result.png';
    link.href = imageUrl;
    link.click();
    
    toast({
      title: "¡Imagen descargada! 📸",
      description: "Lista para compartir en redes sociales",
    });
  };

  const copyShareMessage = () => {
    if (!result) return;
    
    const { level, emoji } = getRadarLevel(result.score);
    const message = `🎯 MI CLIENTE IDEAL DEFINIDO

${emoji} NIVEL: ${level} (${result.score}/4 bloques)

${result.completedBlocks.length > 0 ? `✅ TENGO: ${result.completedBlocks.join(' + ')}` : ''}
${result.missingBlocks.length > 0 ? `❌ ME FALTA: ${result.missingBlocks.join(' + ')}` : ''}

${result.score === 4 ? '🚀 ¡ICP perfectamente definido!' : '🚀 ¡Vamos por el BULLSEYE!'}

#ConocetuClienteIdeal #ICP #Hower`;
    
    navigator.clipboard.writeText(message).then(() => {
      toast({
        title: "¡Mensaje copiado! 📋",
        description: "Listo para pegar en WhatsApp/Telegram",
      });
      setShowShareModal(false);
    });
  };

  const shareToWhatsApp = () => {
    if (!result) return;
    
    const { level, emoji } = getRadarLevel(result.score);
    const message = `🎯 MI CLIENTE IDEAL DEFINIDO

${emoji} NIVEL: ${level} (${result.score}/4 bloques)

${result.completedBlocks.length > 0 ? `✅ TENGO: ${result.completedBlocks.join(' + ')}` : ''}
${result.missingBlocks.length > 0 ? `❌ ME FALTA: ${result.missingBlocks.join(' + ')}` : ''}

${result.score === 4 ? '🚀 ¡ICP perfectamente definido!' : '🚀 ¡Vamos por el BULLSEYE!'}

#ConocetuClienteIdeal #ICP #Hower`;
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "¡Abriendo WhatsApp! 📱",
      description: "Compartiendo tu resultado",
    });
  };

  const ShareModal = () => {
    if (!showShareModal || !result) return null;
    
    const { level, color, emoji } = getRadarLevel(result.score);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          style={{
            backgroundImage: `
              linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
              linear-gradient(#f9fafb 0%, #ffffff 100%)
            `,
            backgroundSize: '20px 1px, 100% 100%',
            backgroundPosition: '0 20px, 0 0'
          }}
        >
          {/* Header del modal */}
          <div className={`bg-gradient-to-r ${color} p-6 rounded-t-3xl text-white text-center`}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Share2 className="w-8 h-8" />
              <h2 className="text-2xl font-bold">¡Comparte tu resultado!</h2>
            </div>
            <p className="opacity-90">Motiva a tu equipo mostrando tu progreso</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Vista previa del resultado */}
            <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 rounded-2xl text-white">
              <div className="text-center space-y-4">
                <div className="text-3xl font-bold flex items-center justify-center gap-2">
                  <span className="text-4xl">{emoji}</span>
                  <span>{level}</span>
                </div>
                <div className="text-xl">{result.score}/4 bloques completos</div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {result.completedBlocks.length > 0 && (
                    <div className="bg-green-600/20 p-3 rounded-lg">
                      <div className="font-semibold text-green-300 mb-2">✅ COMPLETOS</div>
                      <div className="text-sm">{result.completedBlocks.join(' • ')}</div>
                    </div>
                  )}
                  
                  {result.missingBlocks.length > 0 && (
                    <div className="bg-red-600/20 p-3 rounded-lg">
                      <div className="font-semibold text-red-300 mb-2">❌ FALTAN</div>
                      <div className="text-sm">{result.missingBlocks.join(' • ')}</div>
                    </div>
                  )}
                </div>

                {result.score === 4 && result.searchKeywords.length > 0 && (
                  <div className="bg-yellow-600/20 p-4 rounded-lg border border-yellow-500">
                    <div className="font-bold text-yellow-300 mb-2">🔓 PALABRAS DESBLOQUEADAS</div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {result.searchKeywords.map(keyword => (
                        <span key={keyword} className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                          "{keyword}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top suggestions */}
            {result.suggestions.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-xl">
                <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  💡 Top sugerencias para mejorar:
                </h4>
                <div className="space-y-2">
                  {result.suggestions.slice(0, 2).map((suggestion, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="text-blue-800 text-sm">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setShowShareModal(false)} 
                variant="outline" 
                className="flex-1 font-mono border-2"
              >
                Cerrar
              </Button>
              <Button 
                onClick={shareToWhatsApp} 
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold"
              >
                📱 Compartir WhatsApp
              </Button>
              <Button 
                onClick={downloadImage} 
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold"
              >
                <Download className="w-5 h-5 mr-2" />
                📸 Descargar imagen
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header con estilo cuaderno */}
        <div className="mb-8">
          {/* Logo de Hower */}
          <div className="flex justify-center mb-6">
            <img 
              src="/lovable-uploads/af1c9636-71e9-49d6-a2fc-2fbeab94a9ef.png" 
              alt="Hower Logo" 
              className="h-16 w-auto"
            />
          </div>
          
          <div 
            className="relative bg-white rounded-2xl shadow-xl border-t-8 border-red-400 p-6 sm:p-8 overflow-hidden"
            style={{
              backgroundImage: `
                linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                linear-gradient(#f9fafb 0%, #ffffff 100%)
              `,
              backgroundSize: '24px 1px, 100% 100%',
              backgroundPosition: '24px 40px, 0 0'
            }}
          >
            {/* Espiral del cuaderno - dentro del contenedor */}
            <div className="absolute left-0 top-12 bottom-12 w-6 flex flex-col justify-evenly items-center">
              {Array.from({length: 6}).map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-red-400 shadow-inner" />
              ))}
            </div>
            
            <div className="ml-8">
              <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" onClick={onBack} className="p-2 hover:bg-purple-100 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-purple-600" />
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 font-mono flex items-center gap-2">
                  <Radar className="w-8 h-8 text-blue-600 animate-spin" />
                  Conoce tu Cliente Ideal
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel izquierdo - Formulario */}
          <div 
            className="bg-white rounded-2xl shadow-xl border-l-4 border-blue-400 p-6 sm:p-8"
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
              <h2 className="text-2xl font-bold text-gray-800 font-mono">📝 Define tu ICP</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-lg font-semibold text-gray-700 font-mono flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Describe tu cliente ideal:
                </label>
                
                {/* Guía visual de los bloques */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-3 rounded-lg text-center border border-blue-300">
                    <div className="font-bold text-blue-800">WHO</div>
                    <div className="text-xs text-blue-600">¿Quién es?</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-100 to-green-200 p-3 rounded-lg text-center border border-green-300">
                    <div className="font-bold text-green-800">WHERE</div>
                    <div className="text-xs text-green-600">¿Dónde online?</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-3 rounded-lg text-center border border-purple-300">
                    <div className="font-bold text-purple-800">BAIT</div>
                    <div className="text-xs text-purple-600">¿Qué lo atrae?</div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-100 to-orange-200 p-3 rounded-lg text-center border border-orange-300">
                    <div className="font-bold text-orange-800">RESULT</div>
                    <div className="text-xs text-orange-600">¿Qué busca?</div>
                  </div>
                </div>
                
                <Textarea
                  placeholder="Ejemplo: Mujeres de 25-35 años en España, que ya intentaron emprender online pero están estancadas (WHO). Siguen cuentas de motivación (@emprendeconmigo), usan #emprendimiento, escuchan podcasts de negocio (WHERE). Buscan una oferta que prometa ingresos rápidos con poco esfuerzo (BAIT). Sueñan con ganar 3000€/mes para dejar su empleo (RESULT)..."
                  value={icpDescription}
                  onChange={(e) => setIcpDescription(e.target.value)}
                  rows={12}
                  className="font-mono text-sm leading-relaxed resize-none"
                />
              </div>
              
              <Button 
                onClick={analyzeICP} 
                disabled={loading || !icpDescription.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Analizando con IA...
                  </div>
                ) : (
                  <>
                    <Zap className="w-6 h-6 mr-2" />
                    🤖 Analizar mi ICP con IA
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Panel derecho - Radar y Resultados */}
          <div className="space-y-6">
            {/* Radar visual */}
            <div 
              className="bg-white rounded-2xl shadow-xl border-l-4 border-green-400 p-6 text-center"
              style={{
                backgroundImage: `
                  linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                  linear-gradient(#f8fafc 0%, #ffffff 100%)
                `,
                backgroundSize: '24px 1px, 100% 100%',
                backgroundPosition: '0 30px, 0 0'
              }}
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 font-mono">🎯 Tu Radar ICP</h2>
              </div>

              {loading && (
                <div className="space-y-4">
                  <div className="text-lg font-mono text-gray-600">
                    {animationStep === 1 && "🔍 Analizando WHO..."}
                    {animationStep === 2 && "📍 Analizando WHERE..."}
                    {animationStep === 3 && "🎣 Analizando BAIT & RESULT..."}
                  </div>
                </div>
              )}

              {result ? (
                <div>
                  <RadarVisualization score={result.score} showAnimation={true} />
                  
                  <div className="mt-6 space-y-4">
                    <div className={`text-2xl font-bold ${getRadarLevel(result.score).textColor}`}>
                      {getRadarLevel(result.score).description}
                    </div>
                    <div className="text-3xl font-bold text-gray-700">
                      {result.score}/4 bloques completos
                    </div>
                  </div>
                </div>
              ) : !loading && (
                <div className="py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <div className="text-xl font-mono text-gray-600">
                    Esperando tu descripción para analizar...
                  </div>
                </div>
              )}
            </div>

            {/* Resultados detallados */}
            {result && (
              <div 
                className="bg-white rounded-2xl shadow-xl border-l-4 border-yellow-400 p-6"
                style={{
                  backgroundImage: `
                    linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                    linear-gradient(#f8fafc 0%, #ffffff 100%)
                  `,
                  backgroundSize: '24px 1px, 100% 100%',
                  backgroundPosition: '0 30px, 0 0'
                }}
              >
                <div className="space-y-6">
                  {/* Bloques completados y faltantes */}
                  <div className="grid grid-cols-1 gap-4">
                    {result.completedBlocks.length > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                        <h4 className="font-bold text-green-700 flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5" />
                          ✅ Bloques Completos
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {result.completedBlocks.map((block) => (
                            <Badge key={block} className="bg-green-600 text-white px-3 py-1 font-bold text-sm">
                              {block}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.missingBlocks.length > 0 && (
                      <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-xl border-2 border-red-200">
                        <h4 className="font-bold text-red-700 flex items-center gap-2 mb-3">
                          <XCircle className="w-5 h-5" />
                          ❌ Te faltan
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {result.missingBlocks.map((block) => (
                            <Badge key={block} className="bg-red-600 text-white px-3 py-1 font-bold text-sm">
                              {block}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Palabras de búsqueda (solo en Bullseye) */}
                  {result.score === 4 && result.searchKeywords.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 p-6 rounded-xl border-3 border-yellow-400 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 to-orange-300/20 animate-pulse"></div>
                      <div className="relative">
                        <h4 className="font-bold text-yellow-800 mb-4 text-xl flex items-center gap-2">
                          🚀 Palabras de búsqueda para encontrar tu ICP:
                        </h4>
                        <p className="text-yellow-700 mb-4 font-mono">
                          🚀 Usa estas palabras en el buscador de Hower:
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {result.searchKeywords.map((keyword, index) => (
                            <div key={index} className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full blur opacity-75 animate-pulse"></div>
                              <Badge className="relative bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-4 py-2 font-bold shadow-xl">
                                "{keyword}"
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex flex-col gap-3">
                    <Button 
                      onClick={shareProgress} 
                      className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold py-4 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <Share2 className="w-6 h-6 mr-2" />
                      🚀 Compartir mi resultado
                    </Button>
                    <Button 
                      onClick={() => setResult(null)} 
                      variant="outline" 
                      className="w-full font-mono border-2 hover:bg-gray-50 py-3"
                    >
                      🔄 Nuevo análisis
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <ShareModal />
      </div>
    </div>
  );
};

export default DreamCustomerRadar;
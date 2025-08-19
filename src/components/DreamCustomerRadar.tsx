import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Target, Lightbulb, Share2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ICPBlock {
  id: 'who' | 'where' | 'bait' | 'result';
  title: string;
  description: string;
  completed: boolean;
  suggestion?: string;
}

const DreamCustomerRadar: React.FC = () => {
  const { toast } = useToast();
  const [icpDescription, setIcpDescription] = useState('');
  const [blocks, setBlocks] = useState<ICPBlock[]>([
    {
      id: 'who',
      title: 'WHO - ¿Quién es?',
      description: 'Edad, género, situación actual, problema específico',
      completed: false,
      suggestion: 'Incluye edad específica (ej: 25-35 años), situación laboral y problema principal que enfrentan.'
    },
    {
      id: 'where',
      title: 'WHERE - ¿Dónde se congrega?',
      description: 'Páginas que sigue, hashtags, podcasts, grupos',
      completed: false,
      suggestion: 'Agrega al menos 2 cuentas de Instagram, 2 hashtags y 1 podcast o grupo que siga tu ICP.'
    },
    {
      id: 'bait',
      title: 'BAIT - ¿Qué lo atrae?',
      description: 'Hooks, historias y oferta irresistible',
      completed: false,
      suggestion: 'Incluye un hook con número y tiempo (ej: "+5kg en 8 semanas") y una historia de antes-después.'
    },
    {
      id: 'result',
      title: 'RESULT - ¿Qué resultado busca?',
      description: 'Objetivo específico, medible, que le cambiaría la vida',
      completed: false,
      suggestion: 'Define un resultado concreto y medible que tu cliente ideal quiere lograr.'
    }
  ]);

  const [radarLevel, setRadarLevel] = useState<'bullseye' | 'intermedio' | 'externo'>('externo');
  const [points, setPoints] = useState(0);

  // Analizar la descripción del ICP
  const analyzeICP = () => {
    if (!icpDescription.trim()) {
      toast({
        title: "Campo vacío",
        description: "Por favor escribe una descripción de tu cliente ideal",
        variant: "destructive"
      });
      return;
    }

    const text = icpDescription.toLowerCase();
    const updatedBlocks = blocks.map(block => {
      let completed = false;

      switch (block.id) {
        case 'who':
          // Buscar indicadores de demografía y problema
          const hasAge = /\d+[-–]\d+|años|adultos?|jóvenes?|mayores?/.test(text);
          const hasGender = /mujer|hombre|madre|padre|empresari[oa]|profesional/.test(text);
          const hasProblem = /problema|dificultad|estancad[oa]|frustrad[oa]|necesita|busca|quiere|desea/.test(text);
          completed = hasAge && (hasGender || hasProblem);
          break;

        case 'where':
          // Buscar indicadores de dónde se congregan
          const hasSocial = /instagram|facebook|tiktok|youtube|linkedin|@|#|hashtag|cuenta|página|perfil/.test(text);
          const hasPodcast = /podcast|escucha|audio|programa|canal/.test(text);
          const hasGroup = /grupo|comunidad|foro|club|asociación|sigue/.test(text);
          completed = (hasSocial && hasPodcast) || (hasSocial && hasGroup) || (hasPodcast && hasGroup);
          break;

        case 'bait':
          // Buscar indicadores de ganchos y ofertas
          const hasNumbers = /\d+\s*(kg|kilos|días|semanas|meses|horas|%|porciento|euros?|dólares?)/.test(text);
          const hasTime = /en\s+\d+|dentro\s+de|rápido|rápidamente|inmediato/.test(text);
          const hasOffer = /oferta|promoción|descuento|gratis|gratuito|bonus|regalo/.test(text);
          completed = (hasNumbers && hasTime) || hasOffer;
          break;

        case 'result':
          // Buscar indicadores de resultado específico
          const hasGoal = /objetivo|meta|lograr|conseguir|alcanzar|obtener/.test(text);
          const hasSpecific = /\d+|específico|concreto|medible|cambio|transformación/.test(text);
          const hasLifeChange = /vida|libertad|independencia|éxito|sueño|futuro/.test(text);
          completed = (hasGoal && hasSpecific) || hasLifeChange;
          break;
      }

      return { ...block, completed };
    });

    setBlocks(updatedBlocks);
    
    // Calcular nivel del radar
    const completedCount = updatedBlocks.filter(b => b.completed).length;
    setPoints(completedCount);

    if (completedCount === 4) {
      setRadarLevel('bullseye');
      toast({
        title: "🎯 ¡BULLSEYE!",
        description: "¡Excelente! Tu ICP está perfectamente definido",
      });
    } else if (completedCount >= 2) {
      setRadarLevel('intermedio');
      toast({
        title: "🎯 Anillo Intermedio",
        description: `Buen progreso. Tienes ${completedCount}/4 bloques completos`,
      });
    } else {
      setRadarLevel('externo');
      toast({
        title: "🎯 Anillo Externo",
        description: `Necesitas más detalle. Solo ${completedCount}/4 bloques completos`,
      });
    }
  };

  const shareProgress = () => {
    const completedCount = blocks.filter(b => b.completed).length;
    const levelText = radarLevel === 'bullseye' ? 'Bullseye' : 
                     radarLevel === 'intermedio' ? 'Anillo Intermedio' : 'Anillo Externo';
    
    const message = `🎯 Dream Customer Radar: Estoy en ${levelText}, ${completedCount}/4 bloques completos. ${radarLevel === 'bullseye' ? '¡Listo para prospectar!' : 'Trabajando en mejorar mi ICP.'}`;
    
    navigator.clipboard.writeText(message).then(() => {
      toast({
        title: "Copiado",
        description: "Progreso copiado al portapapeles para compartir",
      });
    });
  };

  const getRadarColor = () => {
    switch (radarLevel) {
      case 'bullseye': return 'bg-green-500';
      case 'intermedio': return 'bg-yellow-500';
      case 'externo': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl flex items-center justify-center gap-2">
            🧭 Dream Customer Radar
          </CardTitle>
          <p className="text-muted-foreground">
            Define tu Cliente Ideal (ICP) de forma tan clara que puedas reconocerlo fácilmente
          </p>
        </CardHeader>
      </Card>

      {/* Radar Visualization */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Radar Visual */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-gray-300">
              {/* Circles */}
              <div className="absolute inset-4 rounded-full border-2 border-yellow-300 bg-yellow-50"></div>
              <div className="absolute inset-12 rounded-full border-2 border-green-300 bg-green-50"></div>
              <div className="absolute inset-20 rounded-full border-2 border-green-500 bg-green-100"></div>
              
              {/* Center point */}
              <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${getRadarColor()}`}></div>
              
              {/* Labels */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm font-bold">Anillo Externo</div>
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-sm font-bold text-yellow-700">Intermedio</div>
              <div className="absolute top-16 left-1/2 transform -translate-x-1/2 text-sm font-bold text-green-700">Bullseye</div>
            </div>

            {/* Score */}
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{points}/4</div>
              <div className="text-sm text-muted-foreground">Bloques Completados</div>
              <Badge variant="secondary" className="mt-2">
                {radarLevel === 'bullseye' ? '🎯 Bullseye' : 
                 radarLevel === 'intermedio' ? '🔸 Anillo Intermedio' : '🔴 Anillo Externo'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Describe tu Cliente Ideal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Ejemplo: Mujeres de 25–35 años en España, que ya intentaron emprender online, pero están estancadas. Siguen cuentas de motivación y marketing, escuchan podcasts de negocio, quieren generar ingresos extras y sueñan con dejar su empleo."
            value={icpDescription}
            onChange={(e) => setIcpDescription(e.target.value)}
            rows={4}
            className="w-full"
          />
          <div className="flex gap-2">
            <Button onClick={analyzeICP} className="flex-1">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analizar ICP
            </Button>
            {points > 0 && (
              <Button onClick={shareProgress} variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Compartir Progreso
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Blocks Analysis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {blocks.map((block) => (
          <Card key={block.id} className={`${block.completed ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {block.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                {block.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {block.description}
              </p>
              {!block.completed && block.suggestion && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Sugerencia:</p>
                      <p className="text-sm text-blue-700">{block.suggestion}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gamification */}
      {radarLevel === 'bullseye' && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-4xl">🏆</div>
              <h3 className="text-xl font-bold text-green-800">¡Felicitaciones!</h3>
              <p className="text-green-700">
                Has completado todos los bloques. Tu ICP está perfectamente definido 
                y listo para empezar a prospectar con precisión.
              </p>
              <Button className="bg-green-600 hover:bg-green-700">
                🚀 Desbloquear Plantillas de Mensajes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DreamCustomerRadar;
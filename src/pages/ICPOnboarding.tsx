import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, CheckCircle, Target, Users, Globe, Star, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import WhatsAppConfigStep from '@/components/WhatsAppConfigStep';

interface ICPData {
  who: string;
  where: string;
  bait: string;
  result: string;
}

const ICPOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setSaving] = useState(false);
  const [icpData, setIcpData] = useState<ICPData>({
    who: '',
    where: '',
    bait: '',
    result: ''
  });

  const totalSteps = 6; // 4 preguntas ICP + WhatsApp config + completado

  useEffect(() => {
    // SEO
    document.title = 'Onboarding - Define tu Cliente Ideal | Hower Assistant';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Define tu cliente ideal paso a paso para obtener mejores resultados en tu prospección automatizada.';
      document.head.appendChild(m);
    } else {
      metaDesc.setAttribute('content', 'Define tu cliente ideal paso a paso para obtener mejores resultados en tu prospección automatizada.');
    }
  }, []);

  const questions = [
    {
      id: 'who',
      title: '¿QUIÉN es tu cliente ideal?',
      subtitle: 'Describe a tu cliente perfecto',
      placeholder: 'Ejemplo: Emprendedores de 25-45 años, dueños de pequeñas empresas de servicios, que facturan entre $50K-$200K anuales, ubicados en México y países de habla hispana. Personas ambiciosas que buscan escalar su negocio pero se sienten abrumados por las tareas operativas...',
      icon: Users,
      key: 'who' as keyof ICPData
    },
    {
      id: 'where',
      title: '¿DÓNDE consume contenido tu cliente ideal?',
      subtitle: 'Recursos digitales, cuentas que sigue, hashtags',
      placeholder: 'Ejemplo: Siguen cuentas como @emprendedores, @biznesmx, @carlosmunoz. Consumen contenido de podcasts como "Leyendas Legendarias", blogs de marketing digital, grupos de Facebook de emprendedores. Hashtags: #emprendedor #negocio #ventas #marketing...',
      icon: Globe,
      key: 'where' as keyof ICPData
    },
    {
      id: 'bait',
      title: '¿QUÉ los atrae y capta su atención?',
      subtitle: 'Hooks, historias, ofertas irresistibles',
      placeholder: 'Ejemplo: Historias de transformación empresarial, casos de estudio de crecimiento de ventas, ofertas de consultoría gratuita, plantillas y herramientas automatizadas, testimonios de clientes que triplicaron sus ingresos...',
      icon: Star,
      key: 'bait' as keyof ICPData
    },
    {
      id: 'result',
      title: '¿QUÉ resultado buscan obtener?',
      subtitle: 'Transformación específica y medible que desean lograr',
      placeholder: 'Ejemplo: El resultado deseado es duplicar sus ventas en 6 meses, automatizar al menos 50% de sus procesos operativos, generar leads calificados de forma consistente, tener más tiempo libre para enfocarse en estrategia...',
      icon: Target,
      key: 'result' as keyof ICPData
    }
  ];

  const handleNext = () => {
    if (currentStep <= 4) {
      const currentQuestion = questions[currentStep - 1];
      const currentAnswer = icpData[currentQuestion.key];
      
      if (!currentAnswer.trim()) {
        toast({
          title: "Campo requerido",
          description: "Por favor completa esta pregunta antes de continuar",
          variant: "destructive"
        });
        return;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleInputChange = (key: keyof ICPData, value: string) => {
    setIcpData(prev => ({ ...prev, [key]: value }));
  };

  const analyzeICP = async (): Promise<{ score: number; searchKeywords: string[] }> => {
    const fullDescription = `
WHO: ${icpData.who}
WHERE: ${icpData.where}
BAIT: ${icpData.bait}
RESULT: ${icpData.result}
    `.trim();

    try {
      const { data, error } = await supabase.functions.invoke('chatgpt-response', {
        body: {
          prompt: `Analiza esta descripción de cliente ideal y evalúa qué tan completa está según estos 4 bloques:

WHO (¿Quién es?): edad, género, situación actual, problema principal, ubicación geográfica
WHERE (¿Qué recursos digitales consume?): INCLUYE cualquier mención de: influencers/cuentas que siguen (ej: @usuario), hashtags, grupos/comunidades, podcasts, blogs/websites, páginas que consumen, recursos digitales que leen/ven
BAIT (¿Qué los atrae?): qué hook, historia, testimonio u oferta irresistible los engancharía para detenerse y prestar atención  
RESULT (¿Qué resultado buscan?): qué transformación específica y medible quieren lograr. BUSCA frases como "resultado deseado", "objetivo", "meta", "quiere lograr", "busca", "desea", "aspira"

IMPORTANTE PARA RESULT: Si el texto menciona explícitamente "resultado deseado", "El resultado deseado de mi ICP es", "quiere lograr", "objetivo", "meta", etc. entonces RESULT está COMPLETO.

IMPORTANTE: Si mencionan "blogs", "páginas", "cuentas como @...", "consumen", "siguen", etc. CUENTA como WHERE completo.

Descripción a analizar: "${fullDescription}"

Responde en formato JSON exactamente así:
{
  "score": [número del 0-4 según cuántos bloques están completos],
  "completedBlocks": ["WHO", "WHERE", "BAIT", "RESULT"] [solo los que están completos],
  "missingBlocks": ["WHO", "WHERE", "BAIT", "RESULT"] [solo los que faltan],
  "suggestions": ["sugerencia 1", "sugerencia 2"] [IMPORTANTE: Cada sugerencia debe ser SÚPER FÁCIL de entender, como si le explicaras a un niño de 5 años qué debe hacer. Usa palabras simples y da ejemplos concretos. En lugar de decir "Definir ubicación geográfica" di "Escribe en qué ciudad vive tu cliente ideal". En lugar de "Identificar recursos digitales" di "¿Qué páginas de Instagram o YouTube ve tu cliente?". Máximo 3 sugerencias muy simples.],
  "searchKeywords": ["frase1", "frase2", "frase3", "frase4", "frase5"] [solo si score es 4, genera 8-10 frases de 2-4 palabras para buscar en Instagram/Google cuentas que tengan seguidores similares al ICP. Ejemplos: "coaching empresarial", "madre emprendedora", "fitness mujeres", "inversión Bitcoin", "motivación personal"]
}`
        },
      });

      if (error) throw error;

      const response = data?.response;
      let parsedResult;
      
      if (typeof response === 'string') {
        parsedResult = JSON.parse(response);
      } else if (typeof response === 'object') {
        parsedResult = response;
      } else {
        throw new Error('Formato de respuesta inválido');
      }

      return {
        score: parsedResult.score || 0,
        searchKeywords: parsedResult.searchKeywords || []
      };
    } catch (error) {
      console.error('Error analyzing ICP:', error);
      return { score: 0, searchKeywords: [] };
    }
  };

  const saveICP = async () => {
    try {
      setSaving(true);
      
      // Get Instagram user ID
      const instagramUserData = localStorage.getItem('hower-instagram-user');
      if (!instagramUserData) {
        throw new Error('No se encontró usuario de Instagram');
      }
      
      const instagramUser = JSON.parse(instagramUserData);
      const instagramUserId = instagramUser.instagram?.id || instagramUser.facebook?.id;
      
      if (!instagramUserId) {
        throw new Error('No se encontró ID de Instagram');
      }

      // Analyze ICP to get score and keywords
      const { score, searchKeywords } = await analyzeICP();
      
      // Save ICP to database
      const { error } = await supabase
        .from('user_icp')
        .upsert({
          instagram_user_id: instagramUserId,
          who_answer: icpData.who,
          where_answer: icpData.where,
          bait_answer: icpData.bait,
          result_answer: icpData.result,
          search_keywords: searchKeywords,
          bullseye_score: score,
          is_complete: score === 4
        });

      if (error) throw error;

      toast({
        title: score === 4 ? "🎯 ¡BULLSEYE!" : "✅ ICP Guardado",
        description: score === 4 ? 
          "ICP perfecto guardado. Palabras clave generadas." :
          "ICP guardado. Puedes mejorarlo desde el dashboard."
      });

      // Move to next step
      setCurrentStep(6); // Go to completion step
      
    } catch (error) {
      console.error('Error saving ICP:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el ICP. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = () => {
    // Redirect to tasks dashboard
    navigate('/tasks-to-do');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Paso {currentStep} de {totalSteps}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        {currentStep <= 4 && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                {React.createElement(questions[currentStep - 1].icon, { 
                  className: "h-8 w-8 text-primary" 
                })}
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                {questions[currentStep - 1].title}
              </CardTitle>
              <p className="text-muted-foreground">
                {questions[currentStep - 1].subtitle}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Textarea
                placeholder={questions[currentStep - 1].placeholder}
                value={icpData[questions[currentStep - 1].key]}
                onChange={(e) => handleInputChange(questions[currentStep - 1].key, e.target.value)}
                className="min-h-[150px] text-base"
              />
              
              <div className="flex justify-between">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* WhatsApp Configuration Step */}
        {currentStep === 5 && (
          <WhatsAppConfigStep 
            onBack={handleBack}
            onNext={() => saveICP()}
            loading={loading}
          />
        )}

        {/* Completion Step */}
        {currentStep === 6 && (
          <Card className="shadow-lg text-center">
            <CardContent className="pt-8 space-y-6">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-green-600 mb-2">
                  ¡Onboarding Completado!
                </h2>
                <p className="text-muted-foreground text-lg">
                  Tu cliente ideal ha sido definido y tu configuración está lista.
                </p>
              </div>

              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="font-semibold mb-3">¿Qué sigue?</h3>
                <ul className="text-sm space-y-2 text-left max-w-md mx-auto">
                  <li className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    Accede a tu dashboard de prospección
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Podrás editar tu ICP cuando quieras
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Recibe notificaciones de WhatsApp automáticas
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleFinish}
                size="lg"
                className="text-lg px-8"
              >
                Ir al Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ICPOnboarding;
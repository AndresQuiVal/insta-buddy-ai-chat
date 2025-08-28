import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, CheckCircle, Target, Users, Globe, Star, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import howerLogo from '@/assets/hower-logo.png';
import WhatsAppConfigStep from '@/components/WhatsAppConfigStep';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';

interface ICPData {
  who: string;
  where: string;
  bait: string;
  result: string;
}

const ICPOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();
  const [currentStep, setCurrentStep] = useState(0); // Empezar en 0 para pantalla de bienvenida
  const [loading, setSaving] = useState(false);
  const [icpData, setIcpData] = useState<ICPData>({
    who: '',
    where: '',
    bait: '',
    result: ''
  });

  const totalSteps = 6; // pantalla bienvenida + 4 preguntas ICP + WhatsApp config + completado

  // Verificar si el usuario ya tiene ICP configurado y redirigir
  useEffect(() => {
    const checkICPStatus = async () => {
      if (!currentUser?.instagram_user_id) {
        console.log('❌ No currentUser found:', currentUser);
        return;
      }
      
      console.log('🔍 Checking ICP status for user:', currentUser.instagram_user_id);
      
      try {
        const { data, error } = await supabase
          .from('user_icp')
          .select('is_complete, bullseye_score')
          .eq('instagram_user_id', currentUser.instagram_user_id)
          .maybeSingle();
          
        console.log('📊 ICP Data found:', data);
        console.log('❌ Error (if any):', error);
          
        // Si ya tiene ICP configurado, redirigir a tasks-to-do
        if (data && (data.is_complete === true || data.bullseye_score > 0)) {
          console.log('✅ User has ICP configured, redirecting to /tasks-to-do');
          navigate('/tasks-to-do');
          return;
        } else {
          console.log('🚫 User does not have ICP configured, staying on onboarding');
        }
      } catch (error) {
        console.log('❌ Error checking ICP:', error);
      }
    };
    
    checkICPStatus();
  }, [currentUser, navigate]);

  useEffect(() => {
    // SEO
    document.title = 'Onboarding - Define tu Cliente Ideal | Hower AI';
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
      subtitle: '🎯 ¿QUIÉN ES?',
      description: 'Define características específicas de tu cliente ideal: edad, profesión, intereses, problemas principales',
      placeholder: 'Ejemplo: Emprendedores de 25-45 años, dueños de pequeñas empresas de servicios, que facturan entre $50K-$200K anuales, ubicados en México y países de habla hispana. Personas ambiciosas que buscan escalar su negocio pero se sienten abrumados por las tareas operativas...',
      icon: Users,
      key: 'who' as keyof ICPData
    },
    {
      id: 'where',
      title: '¿DÓNDE consume contenido tu cliente ideal?',
      subtitle: '🌍 ¿DÓNDE ESTÁ?',
      description: 'Identifica qué recursos digitales consume: cuentas que sigue, hashtags favoritos, plataformas donde pasa tiempo',
      placeholder: 'Ejemplo: Siguen cuentas como @emprendedores, @biznesmx, @carlosmunoz. Consumen contenido de podcasts como "Leyendas Legendarias", blogs de marketing digital, grupos de Facebook de emprendedores. Hashtags: #emprendedor #negocio #ventas #marketing...',
      icon: Globe,
      key: 'where' as keyof ICPData
    },
    {
      id: 'bait',
      title: '¿QUÉ los atrae y capta su atención?',
      subtitle: '✨ ¿QUÉ LOS ATRAE?',
      description: 'Define qué hooks, historias o ofertas irresistibles captan su atención inmediatamente',
      placeholder: 'Ejemplo: Historias de transformación empresarial, casos de estudio de crecimiento de ventas, ofertas de consultoría gratuita, plantillas y herramientas automatizadas, testimonios de clientes que triplicaron sus ingresos...',
      icon: Star,
      key: 'bait' as keyof ICPData
    },
    {
      id: 'result',
      title: '¿QUÉ resultado buscan obtener?',
      subtitle: '🎯 ¿QUÉ BUSCAN?',
      description: 'Especifica la transformación exacta y medible que tu cliente ideal desea lograr',
      placeholder: 'Ejemplo: El resultado deseado es duplicar sus ventas en 6 meses, automatizar al menos 50% de sus procesos operativos, generar leads calificados de forma consistente, tener más tiempo libre para enfocarse en estrategia...',
      icon: Target,
      key: 'result' as keyof ICPData
    }
  ];

  const handleNext = () => {
    if (currentStep >= 1 && currentStep <= 4) {
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
    setCurrentStep(prev => Math.max(prev - 1, 0));
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
  "searchKeywords": ["frase1", "frase2", "frase3", "frase4", "frase5"] [SIEMPRE genera 8-10 frases de 2-4 palabras para buscar en Instagram/Google cuentas que tengan seguidores similares al ICP, basándote en la información disponible. Ejemplos: "coaching empresarial", "madre emprendedora", "fitness mujeres", "inversión Bitcoin", "motivación personal"]
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

      console.log('🔍 ICP Analysis Result:', parsedResult);
      console.log('🎯 Search Keywords Generated:', parsedResult.searchKeywords);
      
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
      
      // Get Instagram user ID from localStorage
      const instagramUserData = localStorage.getItem('hower-instagram-user');
      if (!instagramUserData) {
        throw new Error('No se encontró usuario de Instagram');
      }
      
      const instagramUser = JSON.parse(instagramUserData);
      console.log('📱 Instagram User Data:', instagramUser);
      
      // Try different possible ID fields
      const instagramUserId = instagramUser.id || 
                             instagramUser.instagram_user_id || 
                             instagramUser.instagram?.id || 
                             instagramUser.facebook?.id;
      
      console.log('🔑 Instagram User ID:', instagramUserId);
      
      if (!instagramUserId) {
        console.error('❌ No Instagram User ID found in:', instagramUser);
        throw new Error('No se encontró ID de Instagram');
      }

      // Analyze ICP to get score and keywords
      console.log('🔍 Starting ICP analysis...');
      const { score, searchKeywords } = await analyzeICP();
      console.log('✅ Analysis complete:', { score, searchKeywords });
      
      // Save ICP to database
      console.log('💾 Saving ICP to database...');
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
        }, {
          onConflict: 'instagram_user_id'
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Header con logo y título */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-3">
            <img 
              src={howerLogo} 
              alt="Hower Logo" 
              className="h-8 sm:h-10 w-auto object-contain"
            />
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Hower AI
            </h1>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Pantalla de Bienvenida */}
        {currentStep === 0 && (
          <div className="relative">
            <div 
              className="bg-white rounded-2xl shadow-xl border-t-8 p-6 sm:p-8 text-center"
              style={{
                borderTopColor: '#7a60ff',
                backgroundImage: `
                  linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                  linear-gradient(#f9fafb 0%, #ffffff 100%)
                `,
                backgroundSize: '24px 1px, 100% 100%',
                backgroundPosition: '0 60px, 0 0'
              }}
            >
              {/* Spiral binding holes */}
              <div className="absolute left-4 top-0 bottom-0 w-1 flex flex-col justify-evenly">
                {Array.from({length: 12}).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full shadow-inner" style={{backgroundColor: '#7a60ff'}} />
                ))}
              </div>

              <div className="ml-4 sm:ml-6 pt-8 space-y-8">
                {/* Logo Hower redondo con shadow */}
                <div className="relative">
                  <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-white shadow-xl overflow-hidden">
                    <img 
                      src={howerLogo} 
                      alt="Hower Logo" 
                      className="w-full h-full object-cover scale-150"
                    />
                  </div>
                </div>

                {/* Título principal */}
                <div className="space-y-4">
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Bienvenid@ a{' '}
                    <span className="font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Hower AI</span>
                  </h1>
                </div>

                {/* Explicación del proceso */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 rounded-xl border border-primary/10 text-left max-w-2xl mx-auto">
                  <h3 className="text-lg font-bold mb-4 text-primary font-mono text-center">¿Qué vamos a hacer?</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-primary font-bold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Definir tu Cliente Ideal</h4>
                        <p className="text-sm text-muted-foreground font-mono">
                          Define tu cliente ideal para encontrar prospectos
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-primary font-bold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Configurar WhatsApp</h4>
                        <p className="text-sm text-muted-foreground font-mono">
                          Recibe notificaciones de nuevos prospectos
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-primary font-bold text-sm">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Deja que la I.A. haga el resto!</h4>
                        <p className="text-sm text-muted-foreground font-mono">
                          La I.A. registra automáticamente tus prospectos
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón para empezar */}
                <div className="pt-4">
                  <Button
                    onClick={handleNext}
                    size="lg"
                    className="w-full sm:w-auto px-8 py-4 text-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg font-mono"
                  >
                    Empezar configuración
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Content ICP Questions */}
        {currentStep >= 1 && currentStep <= 4 && (
          <div className="relative">
            <div 
              className="bg-white rounded-2xl shadow-xl border-t-8 p-6 sm:p-8"
              style={{
                borderTopColor: '#7a60ff',
                backgroundImage: `
                  linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                  linear-gradient(#f9fafb 0%, #ffffff 100%)
                `,
                backgroundSize: '24px 1px, 100% 100%',
                backgroundPosition: '0 60px, 0 0'
              }}
            >
              {/* Spiral binding holes */}
              <div className="absolute left-4 top-0 bottom-0 w-1 flex flex-col justify-evenly">
                {Array.from({length: 12}).map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full shadow-inner" style={{backgroundColor: '#7a60ff'}} />
                ))}
              </div>

              <div className="ml-4 sm:ml-6">
                <div className="text-center pb-4 sm:pb-6">
                  <div className="mx-auto mb-4 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                    {React.createElement(questions[currentStep - 1].icon, { 
                      className: "h-8 w-8 sm:h-10 sm:w-10 text-primary" 
                    })}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-center mb-2 text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {questions[currentStep - 1].title}
                  </h1>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-primary font-mono">
                      {questions[currentStep - 1].subtitle}
                    </p>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto font-mono">
                      {questions[currentStep - 1].description}
                    </p>
                  </div>
                </div>
                <div className="space-y-6 px-4 sm:px-6">
                  <Textarea
                    placeholder={questions[currentStep - 1].placeholder}
                    value={icpData[questions[currentStep - 1].key]}
                    onChange={(e) => handleInputChange(questions[currentStep - 1].key, e.target.value)}
                    className="min-h-[150px] sm:min-h-[180px] text-base resize-none border-primary/20 focus:border-primary focus:ring-primary/20 font-mono bg-white/80 placeholder:text-muted-foreground/40"
                  />
                  
                  <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      disabled={currentStep === 0}
                      className="flex items-center gap-2 border-primary/20 text-primary hover:bg-primary/5 order-2 sm:order-1 font-mono"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    
                    <Button
                      onClick={handleNext}
                      className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg order-1 sm:order-2 font-mono"
                    >
                      Siguiente
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <Card className="shadow-xl border-t-4 border-primary">
                <CardContent className="pt-8 pb-8 px-6 text-center space-y-6">
                  {/* Success Icon */}
                  <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  
                  {/* Title and Description */}
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-green-600">
                      ¡A prospectar!
                    </h2>
                    <p className="text-muted-foreground">
                      Tu cliente ideal ha sido definido y tu configuración está lista.
                    </p>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <h3 className="font-semibold mb-3 text-primary">¿Qué sigue?</h3>
                    <ul className="text-sm space-y-2 text-left">
                      <li className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>Accede a tu dashboard</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>Edita tu ICP cuando quieras</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>Recibe notificaciones automáticas</span>
                      </li>
                    </ul>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={handleFinish}
                    size="lg"
                    className="w-full text-lg"
                  >
                    Ir al Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ICPOnboarding;
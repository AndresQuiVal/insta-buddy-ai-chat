import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, MessageSquare, Users, BookOpen, Gift, Shield, ArrowRight } from 'lucide-react';

const ThreeMonthPlan = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetPlan = () => {
    window.open('https://buy.stripe.com/bJe6oG9gYbJA2eV9p63wQ0A', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <img 
              src="/lovable-uploads/66bc3c7e-9cc2-49c6-9d54-9b1400c0baa1.png" 
              alt="Hower Logo" 
              className="w-24 h-24 object-contain animate-bounce-in"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-fade-in">
            Prospecta y responde en 7 días con IA, o no pagas
          </h1>
        </div>
      </section>

      {/* Oferta Base */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">🌐 Oferta Base (Núcleo)</h2>
          </div>
          
          <Card className="p-8 mb-12 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
                <CardTitle className="text-3xl">1. Hower Prospector</CardTitle>
              </div>
              <CardDescription className="text-lg">
                La herramienta de prospección inteligente de Hower que pone tu negocio en piloto automático. Incluye:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Mensajes ilimitados al mes con IA.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Lista de cuentas o publicaciones de tu nicho directo a tu WhatsApp cada 2 días, seleccionadas por la IA.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Buscador inteligente de cuentas o publicaciones para prospectar en tu nicho con IA.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>IA de seguimiento: sugerencias de mensajes cuando no sabes qué responder a tus prospectos.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>IA de prospección: genera mensajes adaptados a tu nicho para captar más respuestas.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>IA motivacional: te envía tips, recursos, libros y publicaciones para inspirarte y mejorar cada día.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Funciona sin necesidad de tener tu PC encendida.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Segmentación por ubicación.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Optimizado para PCs lentas (no necesitas una máquina potente).</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comunidad de Hower */}
          <Card className="p-8 mb-12 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Users className="w-8 h-8 text-blue-600" />
                <CardTitle className="text-3xl">2. Comunidad de Hower</CardTitle>
              </div>
              <CardDescription className="text-lg">
                Accede a la comunidad privada de WhatsApp con más de 250 networkers de empresas como Fusion, Forlife, Oriflame, InCruises, NuSkin, Doterra, y muchas más.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Grupos separados por empresa (ejemplo: grupo exclusivo para miembros de Fusion).</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Llamadas semanales en vivo con tips de prospección, entrenamientos de uso del software, actualizaciones y estrategias de otros networkers que podrás copiar y pegar.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Libros y accesos exclusivos a networkers del top 1%, como Curtis Harding, Mijail Milet y más.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Tips diarios por correo con estrategias prácticas de prospección usando Hower.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academia de Hower */}
          <Card className="p-8 mb-12 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <BookOpen className="w-8 h-8 text-purple-600" />
                <CardTitle className="text-3xl">3. Academia de Hower</CardTitle>
              </div>
              <CardDescription className="text-lg">
                Acceso a la plataforma con formación práctica enfocada en escalar tu prospección:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Curso de Marca Personal por Curtis Harding (top 1% de Doterra).</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Curso de Mensajes de Prospección efectivos con Hower.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Curso de Seguimientos: qué responder a tus prospectos cuando te llegan.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span>Grabaciones completas de llamadas de Hower con entrenamientos pasados y actualizaciones.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bonuses Exclusivos */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-2 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
              🎁 Bonuses Exclusivos
            </Badge>
          </div>
          
          <Card className="p-8">
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                <span>50+ Plantillas de mensajes de prospección creadas por Mijail Milet, adaptadas a tu nicho y probadas por networkers que ya obtuvieron respuestas con Hower.</span>
              </div>
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                <span>Guía paso a paso de 9 pasos para prospectar y agendar llamadas con Hower (probada por networkers nuevos y sin experiencia).</span>
              </div>
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                <div>
                  <strong>Llamada exclusiva de introducción (25–45 minutos):</strong>
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>• Configuración completa de Hower para tu negocio.</li>
                    <li>• Estrategia probada de prospección para tu empresa.</li>
                    <li>• Tips prácticos para maximizar resultados desde el día 1.</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                <span>Guía Anti-Baneos en Instagram y cómo aumentar progresivamente el volumen de mensajes de prospección de forma segura.</span>
              </div>
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                <span>Grabación privada con Mijail Milet sobre cómo conseguir mejores prospectos en Instagram con Hower.</span>
              </div>
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                <span>Grabación privada con Mijail sobre cómo construir una Marca Personal de top 1% en network marketing.</span>
              </div>
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                <span>Guía en PDF + video con los 3 pasos para tener una biografía de Instagram magnética que atrae prospectos.</span>
              </div>
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                <span>Lista de objeciones comunes + IA entrenada para ayudarte a resolverlas en tus seguimientos.</span>
              </div>
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                <span>Rutina exclusiva "5 minutos al día": el sistema que usan los top 1% networkers con Hower para generar +30 prospectos diarios.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Garantía */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-green-600" />
                <CardTitle className="text-3xl">✅ Garantía</CardTitle>
              </div>
              <CardDescription className="text-lg">
                Estamos tan seguros de lo que obtendrás que:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <span className="text-lg">Si no consigues una respuesta en 7 días, tienes Full Money Back Guarantee.</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <span className="text-lg">Además, te damos 3 meses gratuitos de software con acceso a todos los bonuses.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <Button 
            onClick={handleGetPlan}
            disabled={isLoading}
            size="lg"
            className="text-2xl py-8 px-12 animate-pulse-glow hover-scale"
          >
            {isLoading ? "Procesando..." : "OBTENER ACCESO AHORA"}
            <ArrowRight className="ml-3 w-6 h-6" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ThreeMonthPlan;
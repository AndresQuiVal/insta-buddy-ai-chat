import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, Search, MessageSquare, Phone, Smartphone, Bot, Users, ArrowRight, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const ThreeMonthPlan = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetPlan = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planId: '3-month-plan' }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu solicitud. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Search className="w-6 h-6" />,
      title: "600 Créditos de Buscador",
      description: "Búsquedas mensuales para encontrar cuentas y posts para prospectar",
      details: "Esto se refiere a 600 búsquedas dentro de nuestra funcionalidad de buscar cuentas para prospectar con Hower. Dentro de Hower tenemos una funcionalidad para buscar cuentas para prospectar, esta funcionalidad te permitirá encontrar cuentas o posts para prospectar con la herramienta. Recordando que Hower prospecta a los seguidores de una cuenta X, o a las personas que comentaron un post Y."
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "800 Créditos de Hower Mensajes IA",
      description: "Mensajes de prospección generados por IA mensualmente",
      details: "Esto se refiere a la cantidad de mensajes que te genera la I.A. de prospección al mes, básicamente te permite generar hasta 800 mensajes de prospección al mes personalizados y optimizados para cada prospecto."
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Notificador WhatsApp",
      description: "2 veces por semana con recomendaciones y estadísticas",
      details: "Esto se refiere al notificador de WhatsApp que te va a estar notificando: 1. Cuentas recomendadas que puedes prospectar con Hower, 2. Posts recomendados que puedes prospectar con Hower, 3. Tus estadísticas: cuántos prospectos has contactado, cuántos tienes en seguimiento, cuántos no te han contestado, etc."
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "1 Llamada Exclusiva con Enfoque",
      description: "Asesoría personalizada de 45-60 minutos",
      details: "La idea es mejorar tu marca personal, tus mensajes de prospección y tus seguimientos en una asesoría de 45 minutos a 1 hora. Asimismo, al finalizar la llamada te llevarás una estrategia que puedes empezar a implementar dentro de tu prospección inmediatamente."
    }
  ];

  const bonusSoftware = [
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Hower WhatsApp",
      description: "Sistema de prospección por WhatsApp",
      details: "Un sistema que te ayudará a prospectar a un listado de tus contactos por WhatsApp de manera automatizada y eficiente."
    },
    {
      logo: "/lovable-uploads/bc6dd387-b5ba-4b6a-bd69-64718daf43e0.png",
      title: "Hower Assistant",
      description: "Automatización tipo Manychat para Instagram",
      details: "Un software tipo Manychat que te permitirá automatizar tu Instagram en una máquina de ventas, gestionando respuestas automáticas y flujos de conversación."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Hower LITE",
      description: "Centralización y gestión de prospectos",
      details: "Un software que te permitirá centralizar tus prospectos dentro de un apartado y ver los prospectos que tienes pendiente por contestar, prospectos en seguimiento, prospectos nuevos, así como tus números de prospección: cuántas personas contactas, cuántas agendas, etc."
    },
    {
      logo: "/lovable-uploads/1b715cc3-a572-4ded-9d7d-428ae8f396d6.png",
      title: "Hower Cliente Ideal",
      description: "Encuentra cuentas y publicaciones para prospectar",
      details: "Este software está diseñado para encontrar cuentas para prospectar y publicaciones específicas donde puedes aplicar tu estrategia de prospección de manera más efectiva y dirigida."
    }
  ];

  const testimonials = [
    {
      name: "Noemi",
      quote: "soy mamá, emprendo un negocio, y esta I.A. me ha cambiado la vida",
      video: "hs4dh7si13",
      image: "https://iili.io/3MhMget.png"
    },
    {
      name: "Deisy",
      quote: "ya NO pierdo 2 o 3 horas prospectando en frio, ahora la I.A. lo hace por mi, mientras yo paso tiempo con mis hijos",
      video: "wmbuq3prqd",
      image: "https://iili.io/3MhEsun.png"
    },
    {
      name: "Pedro",
      quote: "tengo un retorno increible de contactos... y todo gracias a esta I.A.",
      video: "ip41h9ax0x",
      image: "https://iili.io/3MhEsun.png"
    },
    {
      name: "Elisa",
      quote: "tengo un retorno increible de contactos... y todo gracias a esta I.A.",
      video: "hpx53mcnod",
      image: "https://iili.io/3MhGPKQ.png"
    },
    {
      name: "Luisa",
      quote: "estoy teniendo llamadas todos los días gracias a la I.A.",
      video: "r9deud5rs0",
      image: "https://iili.io/3MhGPKQ.png"
    }
  ];

  const testimonialImages = [
    "https://i.ibb.co/fdBgbQrW/63b516ddd517da655ffb5362a71ae209-7.jpg",
    "https://i.ibb.co/Xx4dpMHw/6ae7cf04523bb72ff4f1d311d2ce7d6c-5.jpg",
    "https://iili.io/3MXDwMu.md.jpg",
    "https://iili.io/3MXDN6b.md.jpg",
    "https://iili.io/3MhHeKF.jpg",
    "https://iili.io/3MhHkcg.jpg",
    "https://iili.io/3MhHNP1.jpg",
    "https://iili.io/3MhKCMl.jpg",
    "https://iili.io/3MhKnP2.jpg",
    "https://iili.io/3MhKBn4.jpg"
  ];

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
          <Badge className="mb-6 px-6 py-2 text-lg animate-pulse-glow">
            Plan Más Popular 🔥
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-fade-in">
            Plan 3 Meses
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
            La solución completa para revolucionar tu prospección con IA y multiplicar tus resultados
          </p>
          
          <Card className="p-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 animate-scale-in">
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-primary mb-2">$88</div>
              <div className="text-muted-foreground">Pago único por 3 meses</div>
            </div>
            
            <Button 
              onClick={handleGetPlan}
              disabled={isLoading}
              size="lg"
              className="w-full text-lg py-6 animate-bounce-in hover-scale"
            >
              {isLoading ? "Procesando..." : "Obtener Plan 3 Meses"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">¿Qué incluye tu plan?</h2>
          <p className="text-xl text-muted-foreground text-center mb-12">
            Todo lo que necesitas para dominar la prospección con IA
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <Card className="p-6 hover:shadow-lg transition-all cursor-pointer hover-scale animate-fade-in group">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          {feature.icon}
                        </div>
                        <div>
                          <CardTitle className="text-xl">{feature.title}</CardTitle>
                          <CardDescription className="text-base mt-1">
                            {feature.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" size="sm" className="p-0 h-auto font-normal text-primary hover:text-primary/80">
                        Ver detalles completos →
                      </Button>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-primary/10 rounded-lg text-primary">
                        {feature.icon}
                      </div>
                      <DialogTitle className="text-2xl">{feature.title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-base leading-relaxed">
                      {feature.details}
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      </section>

      {/* Bonus Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              BONUS EXCLUSIVOS 🎁
            </Badge>
            <h2 className="text-4xl font-bold mb-4">4 Software Adicionales</h2>
            <p className="text-xl text-muted-foreground">
              Valor adicional de más de $800 - ¡GRATIS con tu plan!
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bonusSoftware.map((bonus, index) => (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <Card className="p-6 hover:shadow-lg transition-all cursor-pointer hover-scale animate-fade-in group">
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto p-4 bg-green-100 rounded-full text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors w-fit">
                        {bonus.logo ? (
                          <img 
                            src={bonus.logo} 
                            alt={bonus.title}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          bonus.icon
                        )}
                      </div>
                      <CardTitle className="text-xl">{bonus.title}</CardTitle>
                      <CardDescription className="text-base">
                        {bonus.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Button variant="ghost" size="sm" className="p-0 h-auto font-normal text-green-600 hover:text-green-500">
                        Ver más detalles →
                      </Button>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-green-100 rounded-lg text-green-600">
                        {bonus.logo ? (
                          <img 
                            src={bonus.logo} 
                            alt={bonus.title}
                            className="w-6 h-6 object-contain"
                          />
                        ) : (
                          bonus.icon
                        )}
                      </div>
                      <DialogTitle className="text-2xl">{bonus.title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-base leading-relaxed">
                      {bonus.details}
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              👇 Networkers de empresas como: 👇
            </h2>
            <p className="text-xl font-bold text-primary mb-2">
              Fuxion, 4Life, inCruises, Farmasi, Herbalife, Amway
            </p>
            <p className="text-2xl font-bold">ya usan Hower 👇</p>
          </div>
          
          {/* Video Testimonials */}
          <div className="space-y-12">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`flex flex-col lg:flex-row gap-8 items-center ${index % 2 === 0 ? '' : 'lg:flex-row-reverse'}`}>
                <div className="flex-1">
                  <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                    <iframe
                      src={`//fast.wistia.net/embed/iframe/${testimonial.video}?autoplay=0&wmode=transparent`}
                      title={`Testimonio de ${testimonial.name}`}
                      className="w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                    />
                  </div>
                </div>
                <div className="flex-1 lg:max-w-md">
                  <Card className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-bold text-lg">- {testimonial.name}</h3>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <blockquote className="text-muted-foreground italic">
                      "- {testimonial.quote}"
                    </blockquote>
                  </Card>
                </div>
              </div>
            ))}
          </div>
          
          {/* Additional Testimonial Images */}
          <div className="mt-16">
            <h3 className="text-3xl font-bold text-center mb-8">👇 y muchos más... 👇</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonialImages.map((image, index) => (
                <Card key={index} className="overflow-hidden hover-scale group">
                  <div className="aspect-[4/5] overflow-hidden">
                    <img 
                      src={image} 
                      alt={`Testimonio ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            ¿Listo para transformar tu prospección?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Únete a cientos de networkers que ya están multiplicando sus resultados con Hower
          </p>
          
          <Card className="p-8 bg-white/50 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-left">
                <div className="text-4xl font-bold text-primary mb-2">$88</div>
                <div className="text-muted-foreground">
                  Pago único • 3 meses completos
                </div>
                <div className="text-sm text-green-600 font-medium mt-1">
                  + $800 en software bonus GRATIS
                </div>
              </div>
              
              <Button 
                onClick={handleGetPlan}
                disabled={isLoading}
                size="lg"
                className="text-lg py-6 px-8 animate-pulse-glow hover-scale"
              >
                {isLoading ? "Procesando..." : "Obtener Plan Ahora"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default ThreeMonthPlan;
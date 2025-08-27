import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Bot, Search, Users, Shield, Star, MessageSquare, Target, Zap, Phone } from 'lucide-react';
import howerLogo from '@/assets/hower-logo.png';

const Beta: React.FC = () => {
  const [activeTab, setActiveTab] = useState("3-meses");

  // Testimonios de video (sin logos de empresas)
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

  // Imágenes de testimonios
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

  // Planes de precios
  const plans3Meses = {
    price: 88,
    features: [
      "I.A. de Prospección completa:",
      "• Mensajes ilimitados al mes con IA",
      "• Lista de cuentas/publicaciones directo a WhatsApp cada 2 días",
      "• Buscador inteligente con IA para tu nicho",
      "• IA de seguimiento: sugerencias cuando no sabes qué responder",
      "• IA de prospección: mensajes adaptados a tu nicho",
      "• IA motivacional: tips, recursos y libros diarios",
      "• Segmentación por ubicación",
      "• Optimizado para PCs lentas",
      "",
      "Comunidad de Hower:",
      "• Acceso a comunidad privada con +250 emprendedores",
      "• Grupos separados por industria y tipo de negocio",
      "• Llamadas semanales en vivo con tips de prospección",
      "• Acceso a expertos en marketing digital y ventas",
      "• Tips diarios por correo con estrategias prácticas"
    ],
    bonuses: [
      "📝 Recursos Pro:",
      "• 50+ Plantillas probadas en el mercado",
      "• Guía 9 pasos para agendar llamadas (infalible)",
      "• Guía Anti-Baneos Instagram",
      "• PDF + Video: Bio magnética que atrae prospectos",
      "",
      "🎯 Sesiones Exclusivas:",
      "• Llamada 1-a-1 de configuración completa (45 min)",
      "• Masterclass: Mejores prospectos Instagram",
      "• Masterclass: Marca Personal de Alto Impacto",
      "• Lista de objeciones + IA para resolverlas",
      "",
      "⭐ BONUS ESPECIAL:",
      "• Rutina '5 minutos al día': Sistema para +30 prospectos diarios"
    ],
    guarantee: {
      title: "Garantía Total",
      subtitle: "Estamos tan seguros de lo que obtendrás que:",
      points: [
        "Si no consigues una respuesta en 7 días, tienes Full Money Back Guarantee",
        "Además, te damos 3 meses gratuitos de software con acceso a todos los bonuses"
      ],
      note: "(aplican condiciones)"
    }
  };

  const plans1Mes = {
    price: 27.99,
    features: [
      "I.A. de Prospección básica:",
      "• Mensajes limitados al mes con IA",
      "• Lista de cuentas/publicaciones semanal",
      "• Buscador básico para tu nicho",
      "• Seguimiento manual de prospectos",
      "• Mensajes básicos de prospección",
      "• Segmentación por ubicación",
      "• Optimizado para PCs lentas",
      "",
      "Comunidad de Hower:",
      "• Acceso básico a comunidad privada",
      "• Grupos generales (sin separación por empresa)",
      "• Llamadas mensuales en vivo",
      "• Tips semanales por correo"
    ]
  };

  const handlePurchase = (planType: string) => {
    const links = {
      "3-meses": "https://buy.stripe.com/bJe6oG9gYbJA2eV9p63wQ0A",
      "1-mes": "https://buy.stripe.com/00g4is64BcHI0IU9B0"
    };
    window.open(links[planType as keyof typeof links], '_blank');
  };

  useEffect(() => {
    // No necesitamos scripts específicos para iframes de Wistia
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="container mx-auto flex justify-end items-center">
          <div className="flex items-center space-x-3">
            <img 
              src={howerLogo} 
              alt="Hower Logo" 
              className="w-4 h-4 rounded object-cover"
            />
            <h1 className="text-2xl font-light text-white">
              Hower <span className="font-bold text-purple-400">AI</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl md:text-6xl font-light text-white mb-8 leading-tight">
            Tu Máquina de Prospectos con Instagram usando <span className="text-purple-400 font-bold">I.A.</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Combina autorespuestas inteligentes, prospección en frío sin baneo y CRM completo en una sola plataforma
          </p>

          {/* Video explicativo */}
          <div className="bg-gray-800 rounded-2xl p-8 mb-16">
            <div className="flex justify-center">
              <div className="aspect-video w-full max-w-4xl rounded-lg overflow-hidden">
                <iframe
                  src="https://fast.wistia.net/embed/iframe/gcks3zv7lu?autoplay=0&wmode=transparent"
                  title="Video explicativo de Hower AI"
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          {/* Iconos explicativos */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Hower Assistant</h3>
              <p className="text-gray-300">Autorespuestas tipo ManyChat pero más inteligentes</p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Hower Prospector</h3>
              <p className="text-gray-300">Prospección en frío sin banear tu cuenta</p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Hower CRM</h3>
              <p className="text-gray-300">Gestión completa de todos tus prospectos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20 px-4 bg-gray-800">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-white">
            Resultados Reales de Nuestros Usuarios
          </h2>
          
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="flex flex-col space-y-6">
                {/* Video testimonial */}
                <div className="aspect-video rounded-lg overflow-hidden shadow-lg bg-gray-100">
                  <iframe
                    src={`//fast.wistia.net/embed/iframe/${testimonial.video}?autoplay=0&wmode=transparent`}
                    title={`Testimonio de ${testimonial.name}`}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
                
                {/* Información del testimonial */}
                <Card className="p-6 bg-gray-700">
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <h4 className="font-semibold text-lg mb-2 text-white">{testimonial.name}</h4>
                      <div className="flex justify-center space-x-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-300 italic text-center">"{testimonial.quote}"</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Imágenes de testimonios */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-8">Más testimonios de nuestros usuarios</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {testimonialImages.map((image, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden border border-gray-600">
                  <img 
                    src={image} 
                    alt={`Testimonio ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Planes de precios */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-white">
            Elige tu Plan
          </h2>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-800 border-gray-700">
              <TabsTrigger value="3-meses" className="text-lg py-3 data-[state=active]:bg-purple-600 data-[state=active]:text-white">3 Meses</TabsTrigger>
              <TabsTrigger value="1-mes" className="text-lg py-3 data-[state=active]:bg-purple-600 data-[state=active]:text-white">1 Mes</TabsTrigger>
            </TabsList>

            <TabsContent value="3-meses">
              <Card className="relative overflow-hidden border-2 border-purple-600 bg-gray-800">
                <Badge className="absolute top-4 right-4 bg-purple-600 text-white">
                  MÁS POPULAR
                </Badge>
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-3xl mb-2 text-white">Plan 3 Meses</CardTitle>
                  <div className="text-5xl font-bold text-purple-400 mb-2">
                    ${plans3Meses.price}
                    <span className="text-lg text-gray-400 font-normal"> USD</span>
                  </div>
                  <CardDescription className="text-lg text-gray-300">La mejor opción para resultados consistentes</CardDescription>
                </CardHeader>

                <CardContent className="space-y-8">
                  {/* Lo que recibes */}
                  <div>
                    <h4 className="font-semibold text-lg mb-4 flex items-center text-white">
                      <Target className="h-5 w-5 mr-2 text-purple-400" />
                      Lo que recibes:
                    </h4>
                    <ul className="space-y-3">
                      {plans3Meses.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bonuses */}
                  <div>
                    <h4 className="font-semibold text-lg mb-4 flex items-center text-white">
                      <Star className="h-5 w-5 mr-2 text-yellow-400" />
                      Bonuses:
                    </h4>
                    <ul className="space-y-3">
                      {plans3Meses.bonuses.map((bonus, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                          <span className="font-medium text-yellow-300">{bonus}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Garantía */}
                  <div className="bg-gradient-to-r from-green-900 to-emerald-900 p-6 rounded-xl border-2 border-green-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                      <img 
                        src="/lovable-uploads/12bad9e9-7b65-43a6-bb60-7e47ae0390c7.png" 
                        alt="Warranty Badge" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h5 className="text-xl font-bold text-green-400">{plans3Meses.guarantee.title}</h5>
                          <p className="text-green-300 text-sm">{plans3Meses.guarantee.subtitle}</p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-3">
                        {plans3Meses.guarantee.points.map((point, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                            <span className="text-green-100 text-sm">{point}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-green-300 text-xs italic text-center">{plans3Meses.guarantee.note}</p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button 
                    onClick={() => handlePurchase("3-meses")}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-6 text-lg"
                    size="lg"
                  >
                    Obtener Plan 3 Meses
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="1-mes">
              <Card className="border border-gray-600 bg-gray-800">
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-3xl mb-2 text-white">Plan 1 Mes</CardTitle>
                  <div className="text-5xl font-bold text-purple-400 mb-2">
                    ${plans1Mes.price}
                    <span className="text-lg text-gray-400 font-normal"> USD</span>
                  </div>
                  <CardDescription className="text-lg text-gray-300">Perfecto para probar la plataforma</CardDescription>
                </CardHeader>

                <CardContent className="space-y-8">
                  {/* Lo que recibes */}
                  <div>
                    <h4 className="font-semibold text-lg mb-4 flex items-center text-white">
                      <Target className="h-5 w-5 mr-2 text-purple-400" />
                      Lo que recibes:
                    </h4>
                    <ul className="space-y-3">
                      {plans1Mes.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button 
                    onClick={() => handlePurchase("1-mes")}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6 text-lg"
                    size="lg"
                  >
                    Obtener Plan 1 Mes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Soporte */}
      <section className="py-20 px-4 bg-gray-800">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 text-white">
            ¿Necesitas Ayuda?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Nuestro equipo de soporte está disponible 24/7 para ayudarte
          </p>
          
          <Button
            onClick={() => window.open('https://wa.me/15551234567?text=Hola,%20necesito%20ayuda%20con%20Hower%20AI', '_blank')}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-6 px-8 text-lg rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg"
            size="lg"
          >
            <Phone className="h-6 w-6 mr-3" />
            Contactar Soporte WhatsApp
          </Button>
          
          <p className="text-gray-400 mt-4">
            +1 (555) 123-4567
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-700 bg-gray-900">
        <div className="container mx-auto text-center">
          <p className="text-gray-400">
            © 2025 Hower AI. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Beta;
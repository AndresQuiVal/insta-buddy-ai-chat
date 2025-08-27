import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Bot, Search, Users, Shield, Star, MessageSquare, Target, Zap, Phone } from 'lucide-react';

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
    price: 247,
    features: [
      "Hower Assistant - Autorespuestas inteligentes",
      "Hower Prospector - Búsqueda automática de clientes",
      "Hower CRM - Gestión completa de prospectos",
      "Mensajes ilimitados con I.A.",
      "Buscador inteligente de cuentas", 
      "Seguimiento automático de prospectos",
      "Optimizado para cuentas sin riesgo de ban"
    ],
    bonuses: [
      "Academia Hower - Cursos exclusivos",
      "Comunidad privada VIP",
      "Llamadas semanales en vivo",
      "Plantillas probadas de mensajería",
      "Soporte prioritario 24/7"
    ],
    guarantee: "Garantía de 30 días o tu dinero de vuelta"
  };

  const plans1Mes = {
    price: 97,
    features: [
      "Hower Assistant - Autorespuestas inteligentes", 
      "Hower Prospector - Búsqueda automática de clientes",
      "Hower CRM - Gestión completa de prospectos",
      "Mensajes limitados con I.A.",
      "Buscador básico de cuentas",
      "Seguimiento manual de prospectos"
    ]
  };

  const handlePurchase = (planType: string) => {
    const links = {
      "3-meses": "https://buy.stripe.com/bJe6oG9gYbJA2eV9p63wQ0A",
      "1-mes": "https://buy.stripe.com/00w7sK1Ow9BsaLr44M3wQ0D"
    };
    window.open(links[planType as keyof typeof links], '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="container mx-auto flex justify-end items-center">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/c0b3827b-3db7-4c68-b4ed-7745f1a18c28.png" 
              alt="Hower Logo" 
              className="h-12 w-auto"
            />
            <h1 className="text-2xl font-light text-primary">
              Hower <span className="font-bold">AI</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
            Tu Máquina de Ventas con Instagram usando <span className="text-primary">I.A.</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Combina autorespuestas inteligentes, prospección en frío sin baneo y CRM completo en una sola plataforma
          </p>

          {/* Iconos explicativos */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="flex flex-col items-center p-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-4 mb-4">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Hower Assistant</h3>
              <p className="text-gray-600">Autorespuestas tipo ManyChat pero más inteligentes</p>
            </div>
            
            <div className="flex flex-col items-center p-6">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-4 mb-4">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Hower Prospector</h3>
              <p className="text-gray-600">Prospección en frío sin banear tu cuenta</p>
            </div>
            
            <div className="flex flex-col items-center p-6">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-4 mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Hower CRM</h3>
              <p className="text-gray-600">Gestión completa de todos tus prospectos</p>
            </div>
          </div>

          {/* Espacio para video explicativo */}
          <div className="bg-gray-100 rounded-2xl p-16 mb-16">
            <div className="text-gray-500 text-lg">
              📹 Video explicativo próximamente
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-100 to-blue-100">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-gray-900">
            Resultados Reales de Nuestros Usuarios
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 italic">"{testimonial.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Imágenes de testimonios */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-8">Más testimonios de nuestros usuarios</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {testimonialImages.map((image, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden">
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
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-gray-900">
            Elige tu Plan
          </h2>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="3-meses" className="text-lg py-3">3 Meses</TabsTrigger>
              <TabsTrigger value="1-mes" className="text-lg py-3">1 Mes</TabsTrigger>
            </TabsList>

            <TabsContent value="3-meses">
              <Card className="relative overflow-hidden border-2 border-primary">
                <Badge className="absolute top-4 right-4 bg-primary text-white">
                  MÁS POPULAR
                </Badge>
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-3xl mb-2">Plan 3 Meses</CardTitle>
                  <div className="text-5xl font-bold text-primary mb-2">
                    ${plans3Meses.price}
                    <span className="text-lg text-gray-500 font-normal"> USD</span>
                  </div>
                  <CardDescription className="text-lg">La mejor opción para resultados consistentes</CardDescription>
                </CardHeader>

                <CardContent className="space-y-8">
                  {/* Lo que recibes */}
                  <div>
                    <h4 className="font-semibold text-lg mb-4 flex items-center">
                      <Target className="h-5 w-5 mr-2 text-primary" />
                      Lo que recibes:
                    </h4>
                    <ul className="space-y-3">
                      {plans3Meses.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bonuses */}
                  <div>
                    <h4 className="font-semibold text-lg mb-4 flex items-center">
                      <Star className="h-5 w-5 mr-2 text-yellow-500" />
                      Bonuses:
                    </h4>
                    <ul className="space-y-3">
                      {plans3Meses.bonuses.map((bonus, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                          <span className="font-medium text-yellow-700">{bonus}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Garantía */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <Shield className="h-5 w-5" />
                      <span className="font-semibold">{plans3Meses.guarantee}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button 
                    onClick={() => handlePurchase("3-meses")}
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-semibold py-6 text-lg"
                    size="lg"
                  >
                    Obtener Plan 3 Meses
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="1-mes">
              <Card className="border border-gray-200">
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-3xl mb-2">Plan 1 Mes</CardTitle>
                  <div className="text-5xl font-bold text-primary mb-2">
                    ${plans1Mes.price}
                    <span className="text-lg text-gray-500 font-normal"> USD</span>
                  </div>
                  <CardDescription className="text-lg">Perfecto para probar la plataforma</CardDescription>
                </CardHeader>

                <CardContent className="space-y-8">
                  {/* Lo que recibes */}
                  <div>
                    <h4 className="font-semibold text-lg mb-4 flex items-center">
                      <Target className="h-5 w-5 mr-2 text-primary" />
                      Lo que recibes:
                    </h4>
                    <ul className="space-y-3">
                      {plans1Mes.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button 
                    onClick={() => handlePurchase("1-mes")}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 text-lg"
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
      <section className="py-20 px-4 bg-gradient-to-r from-gray-50 to-purple-50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 text-gray-900">
            ¿Necesitas Ayuda?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Nuestro equipo de soporte está disponible 24/7 para ayudarte
          </p>
          
          <Card className="inline-block p-8 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-4">
              <div className="bg-green-500 rounded-full p-3">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-lg">Soporte WhatsApp</h3>
                <p className="text-green-600 font-mono text-lg">+1 (555) 123-4567</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200">
        <div className="container mx-auto text-center">
          <p className="text-gray-500">
            © 2024 Hower AI. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Beta;
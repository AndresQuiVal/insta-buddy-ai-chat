import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Search, MessageSquare, Phone, Smartphone, Bot, Users, ArrowRight, Star, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const ThreeMonthPlan = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetPlan = () => {
    window.open('https://buy.stripe.com/bJe6oG9gYbJA2eV9p63wQ0A', '_blank');
  };

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
    <div className="min-h-screen bg-gradient-to-br from-purple-800 via-blue-900 to-purple-900">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <img 
              src="/lovable-uploads/462af5ec-4e83-402d-840d-6f6b49269ee4.png" 
              alt="Hower Logo" 
              className="w-20 h-auto object-contain animate-bounce-in"
            />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white animate-fade-in text-center">
            CON ESTA I.A. GENERARÁS<br />
            <span className="underline">+30 PROSPECTOS CALIFICADOS</span><br />
            EN 5 MINUTOS
            <span className="text-3xl md:text-4xl block mt-2">(o no pagas)</span>
          </h1>
          
          <p className="text-xl text-white mb-4">
            Sin verte como Robot..., sin sacrificar tiempo libre...
          </p>
          
          <p className="text-2xl text-white mb-8">
            y se llama <span className="text-blue-200">Hower</span>!
          </p>
          
          <div className="mb-8 flex justify-center">
            <img 
              src="https://i.ibb.co/G4q8h8v5/Copia-de-Copia-de-Copia-de-Copia-de-Copia-de-Hower-Clase-3-4.png" 
              alt="Hower IA Demo" 
              className="w-96 h-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* Visual Offer Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-white">TODO lo que vas a recibir es...</h2>
          </div>
          
          {/* Visual Grid - First Row */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Column 1 */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <img 
                  src="https://i.ibb.co/mVKPrc1X/4a14a7ab1cad32287f80a1d13a37ee4e-1.gif" 
                  alt="Copia de Copia de Copia de Copia de Hower - Clase 3 (5)"
                  className="w-72 h-auto"
                />
              </div>
              <div className="flex justify-center">
                <img 
                  src="https://i.ibb.co/9mWqbfmp/066500f1339c2e32cf2bd4f4cfc4f34e-8.png" 
                  alt="HOWER WEBINAR (4)"
                  className="w-72 h-auto"
                />
              </div>
            </div>
            
            {/* Column 2 */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <img 
                  src="https://i.ibb.co/dwjHfmDW/cd9a51dfbf992c7a40719a8595136e61-1.gif" 
                  alt="Copia de Copia de Copia de Copia de Hower - Clase 3 (1)"
                  className="w-72 h-auto"
                />
              </div>
              <div className="flex justify-center">
                <img 
                  src="https://i.ibb.co/bM0gX9k4/c8ac4ebb891a0159e7abe2edadd85e6b-1.png" 
                  alt="HOWER WEBINAR"
                  className="w-72 h-auto"
                />
              </div>
            </div>
            
            {/* Column 3 */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <a 
                  href="https://chat.whatsapp.com/FcaEySvfXyi6xdFnys2QB4?mode=ems_copy_t" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img 
                    src="https://i.ibb.co/KcNq5ssG/b4c939d7cd20e1f7418781fe1afc93b5-1.gif" 
                    alt="Copia de Copia de Copia de Copia de Hower - Clase 3 (6)"
                    className="w-72 h-auto"
                  />
                </a>
              </div>
              <div className="flex justify-center">
                <img 
                  src="https://iili.io/3MSYzRp.png" 
                  alt="HOWER WEBINAR (3)"
                  className="w-72 h-auto"
                />
              </div>
            </div>
          </div>

          {/* Visual Grid - Second Row */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Column 1 */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <a 
                  href="https://www.howersoftware.io/clients/blog/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img 
                    src="https://iili.io/3MSZEzb.gif" 
                    alt="Copia de Copia de Copia de Copia de Hower - Clase 3 (7)"
                    className="w-72 h-auto"
                  />
                </a>
              </div>
              <div className="flex justify-center">
                <img 
                  src="https://i.ibb.co/xq8pLNRm/8da90b8e332ae59cff6d04ee8b141756-1.png" 
                  alt="HOWER WEBINAR"
                  className="w-72 h-auto"
                />
              </div>
            </div>
            
            {/* Column 2 */}
            <div className="space-y-4">
              {/* Empty column to maintain layout */}
            </div>
            
            {/* Column 3 */}
            <div className="space-y-4">
              {/* Empty column to maintain layout */}
            </div>
          </div>

          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-white">y mucho más...</h3>
          </div>
        </div>
      </section>

      {/* Core Offer Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          
          <div className="space-y-12">
            {/* 1. I.A. de Prospección */}
            <Card className="p-8 hover:shadow-lg transition-all animate-fade-in">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-primary mb-4">1. I.A. de Prospección</CardTitle>
                <CardDescription className="text-lg mb-6">
                  La herramienta de prospección inteligente de Hower que pone tu negocio en piloto automático. Incluye:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>Mensajes ilimitados al mes con IA.</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>Lista de cuentas o publicaciones de tu nicho directo a tu WhatsApp cada 2 días, seleccionadas por la IA.</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>Buscador inteligente de cuentas o publicaciones para prospectar en tu nicho con IA.</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>IA de seguimiento: sugerencias de mensajes cuando no sabes qué responder a tus prospectos.</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>IA de prospección: genera mensajes adaptados a tu nicho para captar más respuestas.</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>IA motivacional: te envía tips, recursos, libros y publicaciones para inspirarte y mejorar cada día.</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>Segmentación por ubicación.</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>Optimizado para PCs lentas (no necesitas una máquina potente).</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Comunidad de Hower */}
            <Card className="p-8 hover:shadow-lg transition-all animate-fade-in">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-primary mb-4">2. Comunidad de Hower</CardTitle>
                <CardDescription className="text-lg mb-6">
                  Accede a la{' '}
                  <a 
                    href="https://chat.whatsapp.com/FcaEySvfXyi6xdFnys2QB4?mode=ems_copy_t" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline inline-flex items-center gap-1"
                  >
                    comunidad privada de WhatsApp
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {' '}con más de 250 networkers de empresas como Fuxion, 4Life, Oriflame, InCruises, NuSkin, Doterra, y muchas más.
                  <br />Dentro de la comunidad tendrás:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Grupos separados por empresa (ejemplo: grupo exclusivo para miembros de Fuxion).</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Llamadas semanales en vivo con tips de prospección, entrenamientos de uso del software, actualizaciones y estrategias de otros networkers que podrás copiar y pegar.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>
                      Libros y accesos exclusivos a networkers del top 1%, como{' '}
                      <a 
                        href="https://www.instagram.com/papapoderoso/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 underline inline-flex items-center gap-1"
                      >
                        Curtis Harding
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      ,{' '}
                      <a 
                        href="https://www.instagram.com/p/DIu5fZqtqFi/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 underline inline-flex items-center gap-1"
                      >
                        Mihail Millet
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {' '}y más.
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Tips diarios por correo con estrategias prácticas de prospección usando Hower.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Academia de Hower */}
            <Card className="p-8 hover:shadow-lg transition-all animate-fade-in">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-primary mb-4">3. Academia de Hower</CardTitle>
                <CardDescription className="text-lg mb-6">
                  Acceso a la plataforma con formación práctica enfocada en escalar tu prospección:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>
                      Curso de Marca Personal por{' '}
                      <a 
                        href="https://www.instagram.com/papapoderoso/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 underline inline-flex items-center gap-1"
                      >
                        Curtis Harding
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {' '}(top 1% de Doterra).
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Curso de Mensajes de Prospección efectivos con Hower.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Curso de Seguimientos: qué responder a tus prospectos cuando te llegan.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Grabaciones completas de llamadas de Hower con entrenamientos pasados y actualizaciones.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bonus Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-bold">
              🎁 BONUSES EXCLUSIVOS
            </Badge>
            <h2 className="text-3xl font-bold text-white">Además, recibes TODO esto GRATIS</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="space-y-4">
                <h3 className="text-xl font-bold text-orange-800 mb-4">📝 Recursos Pro</h3>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="font-medium">50+ Plantillas de Mihail Millet probadas en el mercado</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="font-medium">Guía 9 pasos para agendar llamadas (infalible)</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="font-medium">Guía Anti-Baneos Instagram</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="font-medium">PDF + Video: Bio magnética que atrae prospectos</span>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="space-y-4">
                <h3 className="text-xl font-bold text-blue-800 mb-4">🎯 Sesiones Exclusivas</h3>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="font-medium">Llamada 1-a-1 de configuración completa (45 min)</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="font-medium">Masterclass con Mihail: Mejores prospectos Instagram</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="font-medium">Masterclass: Marca Personal de Top 1%</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <span className="font-medium">Lista de objeciones + IA para resolverlas</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-green-800 mb-3">⭐ BONUS ESPECIAL</h3>
                <div className="flex items-center justify-center gap-3">
                  <Check className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-lg font-semibold">Rutina "5 minutos al día": Sistema de Top 1% para +30 prospectos diarios</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img 
                  src="/lovable-uploads/22c39a27-f00e-4fe7-abfd-18f76c1e1430.png" 
                  alt="3 Months Warranty" 
                  className="w-32 h-32 object-contain"
                />
              </div>
              <CardTitle className="text-3xl font-bold text-green-800 dark:text-green-100 mb-4">✅ Garantía</CardTitle>
              <CardDescription className="text-lg text-green-700 dark:text-green-200">
                Estamos tan seguros de lo que obtendrás que:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <span className="text-lg text-green-800 dark:text-green-200">Si no consigues una respuesta en 7 días, tienes Full Money Back Guarantee.</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <span className="text-lg text-green-800 dark:text-green-200">Además, te damos 3 meses gratuitos de software con acceso a todos los bonuses.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-white">
              👇 Networkers de empresas como: 👇
            </h2>
            <p className="text-xl font-bold text-white mb-2">
              Fuxion, 4Life, inCruises, Farmasi, Herbalife, Amway
            </p>
            <p className="text-2xl font-bold text-white">ya usan Hower 👇</p>
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
                    <blockquote className="text-gray-700 italic">
                      "- {testimonial.quote}"
                    </blockquote>
                  </Card>
                </div>
              </div>
            ))}
          </div>
          
          {/* Additional Testimonial Images */}
          <div className="mt-16">
            <h3 className="text-3xl font-bold text-center mb-8 text-white">👇 y muchos más... 👇</h3>
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
          <h2 className="text-4xl font-bold mb-6 text-white">
            ¿Listo para transformar tu prospección?
          </h2>
          <p className="text-xl text-white mb-8">
            Únete a cientos de networkers que ya están multiplicando sus resultados con Hower
          </p>
          
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
      </section>
    </div>
  );
};

export default ThreeMonthPlan;
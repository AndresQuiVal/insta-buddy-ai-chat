import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Users, Brain, TrendingUp, MessageSquare, Zap, RefreshCw, ArrowDown, Target, X, Check, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Beta: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    business: ''
  });

  useEffect(() => {
    // Script principal de Wistia para el video principal
    const wistiaScript = document.createElement('script');
    wistiaScript.src = 'https://fast.wistia.com/embed/medias/sxdw3ixmlk.jsonp';
    wistiaScript.async = true;
    document.head.appendChild(wistiaScript);

    // Script del player
    const playerScript = document.createElement('script');
    playerScript.src = 'https://fast.wistia.com/assets/external/E-v1.js';
    playerScript.async = true;
    document.head.appendChild(playerScript);

    // Scripts para los nuevos videos
    const wistiaPlayerScript = document.createElement('script');
    wistiaPlayerScript.src = 'https://fast.wistia.com/player.js';
    wistiaPlayerScript.async = true;
    document.head.appendChild(wistiaPlayerScript);

    // Scripts específicos para cada video
    const videoScripts = [
      'https://fast.wistia.com/embed/sxdw3ixmlk.js',
      'https://fast.wistia.com/embed/f9mwa4wrl9.js',
      'https://fast.wistia.com/embed/fe270kwf7n.js', 
      'https://fast.wistia.com/embed/x6zybq0h5n.js',
      'https://fast.wistia.com/embed/ihs01ndhd7.js'
    ];

    const scriptElements = videoScripts.map(src => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.type = 'module';
      document.head.appendChild(script);
      return script;
    });

    // Styles para los videos
    const style = document.createElement('style');
    style.textContent = `
      wistia-player[media-id='sxdw3ixmlk']:not(:defined) { 
        background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/sxdw3ixmlk/swatch'); 
        display: block; 
        filter: blur(5px); 
        padding-top: 135.83%; 
      }
      wistia-player[media-id='f9mwa4wrl9']:not(:defined) { 
        background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/f9mwa4wrl9/swatch'); 
        display: block; 
        filter: blur(5px); 
        padding-top: 135.83%; 
      }
      wistia-player[media-id='fe270kwf7n']:not(:defined) { 
        background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/fe270kwf7n/swatch'); 
        display: block; 
        filter: blur(5px); 
        padding-top: 135.83%; 
      }
      wistia-player[media-id='x6zybq0h5n']:not(:defined) { 
        background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/x6zybq0h5n/swatch'); 
        display: block; 
        filter: blur(5px); 
        padding-top: 162.5%; 
      }
      wistia-player[media-id='ihs01ndhd7']:not(:defined) { 
        background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/ihs01ndhd7/swatch'); 
        display: block; 
        filter: blur(5px); 
        padding-top: 162.5%; 
      }
    `;
    document.head.appendChild(style);

    // Intersection Observer para animaciones
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observar todos los elementos con clase 'scroll-animate'
    const animateElements = document.querySelectorAll('.scroll-animate');
    animateElements.forEach((el) => observer.observe(el));

    return () => {
      // Cleanup
      if (document.head.contains(wistiaScript)) {
        document.head.removeChild(wistiaScript);
      }
      if (document.head.contains(playerScript)) {
        document.head.removeChild(playerScript);
      }
      if (document.head.contains(wistiaPlayerScript)) {
        document.head.removeChild(wistiaPlayerScript);
      }
      scriptElements.forEach(script => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      });
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
      observer.disconnect();
    };
  }, []);

  const navigate = useNavigate();

  const handleRegister = () => {
    navigate('/signup');
  };

  const painPoints = [
    {
      icon: "⏰",
      text: "Paso horas respondiendo mensajes en Instagram"
    },
    {
      icon: "💸",
      text: "Pierdo ventas porque no respondo a tiempo"
    },
    {
      icon: "😤",
      text: "Quiero dedicarme a vender, no a chatear todo el día"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Header fijo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-light text-primary">Hower <span className="font-bold">Assistant</span></h1>
              <img 
                src="/lovable-uploads/155c9911-22bb-47fc-916f-0f563768a779.png" 
                alt="Manychat"
                className="h-8 rounded-lg transform rotate-3"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section - Problem + Filter */}
      <section className="min-h-screen flex items-center justify-center pt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000 max-w-6xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              <span className="block mb-4 text-red-600">
                Si recibes más de 20 mensajes al día en Instagram,
              </span>
              <span className="block mb-4">
                este mensaje es para ti.
              </span>
              <span className="block text-2xl sm:text-3xl lg:text-4xl text-gray-600 font-normal">
                Si no... puedes cerrar esta página ahora.
              </span>
            </h1>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8 mt-12 mb-8">
              <p className="text-xl sm:text-2xl lg:text-3xl text-gray-800 leading-relaxed">
                🎯 <strong>Para dueños de e-commerce, negocios locales y coaches online</strong> que ya venden por Instagram y quieren dejar de perder tiempo respondiendo manualmente.
              </p>
            </div>

            {/* Video corto en loop */}
            <div className="relative max-w-lg mx-auto mb-8">
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-black">
                <div 
                  className="wistia_responsive_padding" 
                  style={{ padding: '56.25% 0 0 0', position: 'relative' }}
                >
                  <div 
                    className="wistia_responsive_wrapper" 
                    style={{ height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' }}
                  >
                    <div 
                      className="wistia_embed wistia_async_sxdw3ixmlk videoFoam=true autoPlay=true loop=true muted=true" 
                      style={{ height: '100%', position: 'relative', width: '100%' }}
                    >
                      <div 
                        className="wistia_swatch" 
                        style={{
                          height: '100%',
                          left: 0,
                          opacity: 0,
                          overflow: 'hidden',
                          position: 'absolute',
                          top: 0,
                          transition: 'opacity 200ms',
                          width: '100%'
                        }}
                      >
                        <img 
                          src="https://fast.wistia.com/embed/medias/sxdw3ixmlk/swatch" 
                          style={{ filter: 'blur(5px)', height: '100%', objectFit: 'contain', width: '100%' }} 
                          alt=""
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-32 bg-gradient-to-r from-red-50 to-red-100">
        <div className="container mx-auto px-4">
          <div className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000">
            <h2 className="text-4xl lg:text-6xl font-bold text-center mb-16 text-gray-900">
              ¿Te pasa esto?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {painPoints.map((pain, index) => (
                <Card key={index} className="p-8 border-0 bg-white shadow-xl text-center">
                  <div className="text-6xl mb-4">{pain.icon}</div>
                  <div className="flex items-center justify-center mb-4">
                    <X className="w-8 h-8 text-red-500 mr-2" />
                    <span className="text-2xl font-bold text-red-600">❌</span>
                  </div>
                  <p className="text-xl font-semibold text-gray-800 leading-relaxed">
                    {pain.text}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution Introduction */}
      <section className="py-32 bg-gradient-to-r from-purple-900 to-pink-900">
        <div className="container mx-auto px-4">
          <div className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000">
            <div className="max-w-5xl mx-auto text-center space-y-12">
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight">
                Hower Assistant responde por ti en Instagram, 24/7, para que cierres más ventas sin contratar más personal.
              </h2>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <p className="text-2xl sm:text-3xl lg:text-4xl text-white font-bold leading-relaxed">
                  Usuarios como tú ahorran hasta <span className="text-yellow-400">4 horas al día</span> y aumentan sus ventas un <span className="text-green-400">30%</span> en dos semanas.
                </p>
              </div>

              <Button
                onClick={handleRegister}
                className="bg-white text-purple-900 hover:bg-gray-100 font-bold py-6 px-12 text-2xl rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl"
              >
                Sí, recibo mensajes diarios. Quiero automatizar ya.
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Messaging - 3 pasos */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000">
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-4">
                Automatiza tu Instagram en 3 pasos
              </h2>
              <p className="text-xl text-gray-600 mb-16">
                (solo si ya recibes mensajes diarios)
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {[
                  { number: "1", title: "Seleccionar plantilla", description: "Elige el tipo de respuesta automática que necesitas" },
                  { number: "2", title: "Personalizar mensajes", description: "Adapta las respuestas a tu negocio y estilo" },
                  { number: "3", title: "Activar bot", description: "Tu asistente comienza a trabajar inmediatamente" }
                ].map((step, index) => (
                  <Card key={index} className="p-8 border-0 bg-gradient-to-br from-purple-50 to-pink-50 text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold">
                      {step.number}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">{step.title}</h3>
                    <p className="text-lg text-gray-600">{step.description}</p>
                  </Card>
                ))}
              </div>

              {/* Mini video mostrando los pasos */}
              <div className="relative max-w-2xl mx-auto">
                <div className="rounded-2xl overflow-hidden shadow-2xl bg-black">
                  <div 
                    className="wistia_responsive_padding" 
                    style={{ padding: '56.25% 0 0 0', position: 'relative' }}
                  >
                    <div 
                      className="wistia_responsive_wrapper" 
                      style={{ height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' }}
                    >
                      <div 
                        className="wistia_embed wistia_async_f9mwa4wrl9 videoFoam=true" 
                        style={{ height: '100%', position: 'relative', width: '100%' }}
                      >
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison - 3 Columnas */}
      <section className="py-32 bg-gradient-to-br from-gray-50 via-white to-purple-50">
        <div className="container mx-auto px-4">
          <div className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-4xl lg:text-6xl font-bold text-center mb-16 text-gray-900">
                Comparación Real
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                      <th className="p-6 text-left text-xl font-bold text-gray-800"></th>
                      <th className="p-6 text-center text-xl font-bold text-red-600">
                        <div className="flex flex-col items-center">
                          <span>Responder</span>
                          <span>manualmente</span>
                        </div>
                      </th>
                      <th className="p-6 text-center text-xl font-bold text-orange-600">
                        <img 
                          src="/lovable-uploads/155c9911-22bb-47fc-916f-0f563768a779.png" 
                          alt="Manychat"
                          className="h-8 mx-auto mb-2"
                        />
                        ManyChat
                      </th>
                      <th className="p-6 text-center text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Hower Assistant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-lg">
                    <tr className="border-b border-gray-200">
                      <td className="p-6 font-semibold text-gray-800">Tiempo invertido</td>
                      <td className="p-6 text-center text-red-600 font-bold">4-5 horas/día</td>
                      <td className="p-6 text-center text-orange-600 font-bold">2-3 horas/día</td>
                      <td className="p-6 text-center font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">10 minutos/día</td>
                    </tr>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <td className="p-6 font-semibold text-gray-800">Contactos</td>
                      <td className="p-6 text-center text-red-600">Ilimitados (pero manual)</td>
                      <td className="p-6 text-center text-orange-600">500 por $15/mes</td>
                      <td className="p-6 text-center font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Ilimitados por $13/mes</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="p-6 font-semibold text-gray-800">Dificultad</td>
                      <td className="p-6 text-center text-red-600 font-bold">Alta</td>
                      <td className="p-6 text-center text-orange-600 font-bold">Media-Alta</td>
                      <td className="p-6 text-center font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Muy fácil</td>
                    </tr>
                    <tr>
                      <td className="p-6 font-semibold text-gray-800">Costo al escalar</td>
                      <td className="p-6 text-center text-red-600 font-bold">Tu tiempo</td>
                      <td className="p-6 text-center text-orange-600 font-bold">Más caro por más contactos</td>
                      <td className="p-6 text-center font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Mismo precio siempre</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center mt-12">
                <Card className="p-8 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex space-x-1">
                      {[...Array(3)].map((_, i) => (
                        <X key={i} className="w-6 h-6 text-red-500" />
                      ))}
                    </div>
                    <span className="text-2xl">➡️</span>
                    <div className="flex space-x-1">
                      {[...Array(3)].map((_, i) => (
                        <Check key={i} className="w-6 h-6 text-green-500" />
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof & Trust */}
      <section className="py-32 bg-gradient-to-r from-purple-100 to-pink-100">
        <div className="container mx-auto px-4">
          <div className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold text-center mb-16 text-gray-900">
                Caso Real
              </h2>
              
              <Card className="p-12 border-0 bg-white shadow-2xl mb-12">
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto text-4xl text-white">
                    👩‍💼
                  </div>
                  <blockquote className="text-2xl lg:text-3xl text-gray-800 font-medium leading-relaxed">
                    "Carla, dueña de tienda online, recibía 50 mensajes diarios. Con Hower, ahorra 3 horas al día y duplicó sus ventas en 2 semanas."
                  </blockquote>
                  <div className="text-lg text-purple-600 font-semibold">
                    — Carla Martínez, E-commerce de Moda
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="p-6 bg-white border-2 border-green-200 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Migración gratuita desde ManyChat o Chatfuel</h3>
                  <p className="text-gray-600">Te ayudamos a migrar sin costo adicional</p>
                </Card>
                
                <Card className="p-6 bg-white border-2 border-blue-200 text-center">
                  <Zap className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Prueba gratuita de 7 días</h3>
                  <p className="text-gray-600">Sin tarjeta requerida</p>
                </Card>
                
                <Card className="p-6 bg-white border-2 border-purple-200 text-center">
                  <Target className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Configuración personalizada</h3>
                  <p className="text-gray-600">Adaptamos el sistema a tu negocio</p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Reforzada con Urgencia */}
      <section className="py-32 bg-gradient-to-r from-purple-900 to-pink-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000">
            <div className="max-w-5xl mx-auto text-center space-y-12">
              <div className="bg-red-600 text-white px-6 py-3 rounded-full inline-flex items-center space-x-2 animate-pulse">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold">🚨 Cupos limitados para migración gratuita y configuración personalizada</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight">
                ¿Listo para dejar de perder tiempo y ventas?
              </h2>
              
              <p className="text-xl text-purple-100 mb-8">
                Disponible solo este mes
              </p>

              <div className="flex flex-col space-y-4 max-w-2xl mx-auto">
                <Button
                  onClick={handleRegister}
                  className="w-full bg-white text-purple-900 hover:bg-gray-100 font-bold py-6 px-8 text-xl rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl"
                >
                  Quiero mi bot respondiendo hoy
                </Button>
                
                <Button
                  onClick={handleRegister}
                  className="w-full bg-yellow-400 text-purple-900 hover:bg-yellow-300 font-bold py-6 px-8 text-xl rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl"
                >
                  Quiero ahorrar horas de responder mensajes
                </Button>
              </div>

              <div className="flex justify-center space-x-4 text-purple-200 text-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Prueba gratuita 7 días</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Sin tarjeta requerida</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Configúralo hoy mismo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - Objeciones Clave */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">Preguntas Frecuentes</h2>
              
              <div className="space-y-8">
                {[
                  {
                    question: "¿Funciona si no tengo ManyChat?",
                    answer: "Sí, perfectamente. Hower Assistant funciona desde cero. No necesitas tener experiencia previa con bots o automatización. Te guiamos paso a paso."
                  },
                  {
                    question: "¿Necesito tarjeta para la prueba?",
                    answer: "No. Accedes inmediatamente a los 7 días de prueba gratuita sin proporcionar datos de tarjeta. Solo tu email para crear la cuenta."
                  },
                  {
                    question: "¿Puedo cancelar cuando quiera?",
                    answer: "Sí, en un clic. No hay permanencia ni penalizaciones. Si decides cancelar, lo haces desde tu panel de control inmediatamente."
                  },
                  {
                    question: "¿Realmente funciona las 24 horas?",
                    answer: "Sí. Tu bot trabaja automáticamente sin que tengas que estar presente. Responde a mensajes y comentarios las 24 horas, los 7 días de la semana."
                  }
                ].map((faq, index) => (
                  <Card key={index} className="p-8 border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">{faq.question}</h3>
                    <p className="text-lg text-gray-600 leading-relaxed">{faq.answer}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-purple-50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 text-lg mb-4">
            © 2025 Hower Assistant. La IA será tu mejor aliado en Instagram.
          </p>
          <p className="text-gray-400 text-sm">
            Solo para negocios que reciben mensajes diarios en Instagram
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Beta;
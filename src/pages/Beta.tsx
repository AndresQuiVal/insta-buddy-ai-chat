import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, Users, Brain, TrendingUp, MessageSquare, Zap, RefreshCw, ArrowDown, Search, Target, Copy } from 'lucide-react';
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

  // Problemas de Manychat
  const problems = [
    <>Llegué al límite de contactos... <strong>ahora me toca pagar más.. pff.....!</strong></>,
    <>Tiene muchas cosas que no uso <strong>(y tampoco termino de entenderlas...)</strong></>,
    <>yo lo que quiero es publicar contenido viral... <strong>y que un bot atienda a los leads por mi...</strong></>
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Header fijo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-light text-primary">Hower <span className="font-bold">Assistant</span></h1>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 1: Problemas/Preguntas - Cada pregunta en su propia sección */}
      <section className="pt-20">
        <div className="container mx-auto px-4 text-center">
          <div className="min-h-screen flex items-center justify-center">
            <div className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000">
              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-24 leading-tight">
                Infoproductor ¿usas Manychat? <br />
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  te aseguro que tienes estos problemas...
                </span>
              </h1>
            </div>
          </div>
          
          {problems.map((problem, index) => (
            <div key={index} className="min-h-screen flex items-center justify-center">
              <div 
                className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000 max-w-4xl mx-auto"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="text-3xl lg:text-5xl text-gray-700 font-light leading-relaxed text-center">
                  {problem}
                </p>
              </div>
            </div>
          ))}
          
          {/* Arrow down después de todas las preguntas */}
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-bounce">
              <ArrowDown className="w-12 h-12 text-purple-500 mx-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Sección 2: Presentación con Video primero */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-900 to-pink-900 pb-32">
        <div className="container mx-auto px-4">
          <div className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000">
            <div className="max-w-4xl mx-auto text-center space-y-16">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-white mt-16 mb-12">
                Hower Assistant es para ti
              </h1>
              
              {/* Video explicativo */}
              <div className="relative max-w-2xl mx-auto mb-16">
                <div className="rounded-3xl overflow-hidden shadow-2xl bg-black">
                  <div 
                    className="wistia_responsive_padding" 
                    style={{ padding: '56.25% 0 0 0', position: 'relative' }}
                  >
                    <div 
                      className="wistia_responsive_wrapper" 
                      style={{ height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' }}
                    >
                      <div 
                        className="wistia_embed wistia_async_sxdw3ixmlk videoFoam=true autoPlay=true loop=true" 
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

              <p className="text-2xl text-purple-100 leading-relaxed mb-16">
                Empieza a vender más con Inteligencia Artificial en Instagram
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mt-8 mb-32">
                <Badge variant="outline" className="flex items-center gap-2 text-lg py-2 px-4 bg-white/10 border-white/20 text-white">
                  <MessageSquare className="w-5 h-5" />
                  Autorespondedor Inteligente
                </Badge>
                <Badge variant="outline" className="flex items-center gap-2 text-lg py-2 px-4 bg-white/10 border-white/20 text-white">
                  <Search className="w-5 h-5" />
                  Contenido Viral AI
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 4: Descripción - Funcionalidades */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000">
            <div className="text-center mb-20">
              <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Bienvenido al Autorespondedor...
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
                El autorespondedor es lo que conoces como "automatización", solamente que hasta más "fácil" de entender... no?
              </p>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-8">3 pasos configuras un autorespondedor</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
                {[
                  { number: "1", title: "Selecciona el tipo de autorespondedor", icon: <Target className="w-8 h-8" /> },
                  { number: "2", title: "Configura el autorespondedor", icon: <MessageSquare className="w-8 h-8" /> },
                  { number: "3", title: "Actívalo", icon: <Zap className="w-8 h-8" /> }
                ].map((step, index) => (
                  <Card key={index} className="p-6 border-0 bg-white/80 backdrop-blur-sm text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                      {step.icon}
                    </div>
                    <div className="text-2xl font-bold text-purple-600 mb-2">{step.number}</div>
                    <p className="text-gray-700 font-semibold">{step.title}</p>
                  </Card>
                ))}
              </div>
              
              <p className="text-xl text-gray-600 mb-16">fácil...</p>
            </div>

            {/* Sección Hower Viral AI */}
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-8">
                  y no nada más es eso....
                </h2>
                <p className="text-2xl text-gray-700 mb-8">
                  conoce nuestro buscador de contenidos virales de Instagram llamado{' '}
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                    "Hower Viral AI"
                  </span>
                </p>
              </div>

              <Card className="p-12 border-0 bg-gradient-to-r from-purple-50 to-pink-50 mb-16">
                <div className="text-center space-y-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                    <Search className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-3xl font-bold text-gray-800 mb-6">Con este buscador vas a poder:</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                        1
                      </div>
                      <p className="text-lg text-gray-700 leading-relaxed">
                        Identificar los reels y contenidos MÁS virales que hace tu competencia para ganar más leads
                      </p>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                        2
                      </div>
                      <p className="text-lg text-gray-700 leading-relaxed">
                        Copialos para ser igual (o más) viral!
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-xl text-gray-600 font-semibold">y más cosas...</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Manychat */}
      <section className="py-32 bg-gradient-to-r from-gray-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold text-center mb-16 text-gray-800">
                ¿Qué incluye el Manychat de Hower?
              </h2>
              
              <div className="text-center mb-12 space-y-6">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 text-xl font-bold">
                  CONTACTOS ILIMITADOS
                </Badge>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-lg">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-700 font-semibold">Nada de cobrar por más contactos</span>
                  </div>
                  <div className="flex items-center bg-white rounded-full px-6 py-3 shadow-lg">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-700 font-semibold">Un solo plan</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    icon: MessageSquare,
                    title: "Responder a mensajes directos",
                    description: "Automatiza respuestas a mensajes privados en Instagram"
                  },
                  {
                    icon: CheckCircle,
                    title: "Responder a comentarios",
                    description: 'Responde automáticamente: "Gracias! ya te envié la info al privado"'
                  },
                  {
                    icon: Zap,
                    title: "Envío automático al privado",
                    description: "Enviará la información al privado una vez que comenten el post"
                  },
                  {
                    icon: Users,
                    title: "Organización inteligente con IA",
                    description: "Organiza automáticamente las personas contactadas en Nuevos contactos, Invitados, etc."
                  }
                ].map((feature, index) => (
                  <Card key={index} className="p-8 border-0 bg-white/80 backdrop-blur-sm">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Migración */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000">
            <Card className="max-w-4xl mx-auto p-12 border-0 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                  <RefreshCw className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800">¿Ya tienes Manychat o Chatfuel?</h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Si tienes ya un sistema como <span className="font-semibold">Manychat o Chatfuel</span>, nosotros hacemos la migración de tus respuestas automáticas de estos otros softwares a Hower Assistant (si así lo deseas), en las funcionalidades disponibles dentro de Hower.
                </p>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 text-lg">
                  Migración gratuita incluida
                </Badge>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Sección 5: Call to Action Principal */}
      <section className="py-32 bg-gradient-to-r from-purple-900 to-pink-900">
        <div className="container mx-auto px-4">
          <div className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000">
            <div className="max-w-4xl mx-auto text-center space-y-12">
              <div className="space-y-6">
                <h2 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                  ¿Listo para empezar?
                </h2>
                <p className="text-2xl text-purple-100 leading-relaxed">
                  Accede ahora con tu prueba gratuita de 7 días
                </p>
              </div>

              <Button
                onClick={handleRegister}
                className="bg-white text-purple-900 hover:bg-gray-100 font-bold py-6 px-12 text-2xl rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl"
                size="lg"
              >
                Accede ahora
              </Button>

              <p className="text-purple-200 text-lg">
                Prueba gratuita de 7 días - Sin compromiso
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <div className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">Preguntas Frecuentes</h2>
              
              <div className="space-y-8">
                {[
                  {
                    question: "¿Qué incluye Hower Assistant?",
                    answer: "Acceso completo al Autorespondedor inteligente, Hower Viral AI para contenido viral, gestión de prospectos con IA y métricas en tiempo real."
                  },
                  {
                    question: "¿Cómo funciona la prueba gratuita?",
                    answer: "Obtienes acceso completo a todas las funciones durante 7 días sin costo. No necesitas tarjeta de crédito para empezar."
                  },
                  {
                    question: "¿Es realmente gratis la migración?",
                    answer: "Sí, incluimos la migración gratuita de tus respuestas automáticas desde Manychat o Chatfuel a Hower Assistant."
                  },
                  {
                    question: "¿Hay límite de contactos?",
                    answer: "No, ofrecemos contactos ilimitados. No tienes que preocuparte por pagar más al crecer tu base de contactos."
                  }
                ].map((faq, index) => (
                  <Card key={index} className="p-8 border-0 bg-white/60 backdrop-blur-sm">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">{faq.question}</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">{faq.answer}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 text-lg">
            © 2024 Hower Assistant. La IA será tu mejor aliado en Instagram.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Beta;

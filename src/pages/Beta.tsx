import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, Users, Brain, TrendingUp, MessageSquare, Zap, RefreshCw, ArrowDown, Search, Target, Copy, X, Check, DollarSign } from 'lucide-react';
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
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-24 leading-tight">
                <span className="block mb-4">
                  <span className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mr-2">🎯 Oye Coach,</span>
                  <span className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mr-2">📚 Infoproductor,</span>
                  <span className="inline-block bg-gradient-to-r from-pink-600 to-pink-700 bg-clip-text text-transparent">🚀 Trafficker...</span>
                </span>
                
                <span className="block text-3xl lg:text-5xl mb-6">
                  ¿usas{' '}
                  <img 
                    src="/lovable-uploads/155c9911-22bb-47fc-916f-0f563768a779.png" 
                    alt="Manychat"
                    className="inline-block h-16 lg:h-20 mx-2 transform rotate-3 translate-y-1 drop-shadow-lg rounded-xl"
                  />
                  ?
                </span>
                
                <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-3xl lg:text-5xl">
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

              <p className="text-2xl text-purple-100 leading-relaxed mb-8">
                Empieza a vender más con Inteligencia Artificial en Instagram
              </p>
              
              <Button
                onClick={handleRegister}
                className="bg-white text-purple-900 hover:bg-gray-100 font-semibold py-3 px-8 text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-lg mb-8"
              >
                Acceder a la prueba gratuita
              </Button>
              
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
              
              <p className="text-xl text-gray-600 mb-8">fácil...</p>
              
              <Button
                onClick={handleRegister}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-8 text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-lg mb-16"
              >
                Configurar mi autorespondedor
              </Button>
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
                  
                  <p className="text-xl text-gray-600 font-semibold mb-8">y más cosas...</p>
                  
                  <Button
                    onClick={handleRegister}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-8 text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    Probar ahora gratis
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Comparación */}
      <section className="py-32 bg-gradient-to-br from-gray-50 via-white to-purple-50 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-200 rounded-full opacity-20 blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="scroll-animate opacity-0 translate-y-10 transition-all duration-1000">
            <div className="max-w-6xl mx-auto">
              {/* Header de comparación */}
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-8">
                  ¿Por qué elegir Hower Assistant?
                </h2>
                <div className="flex items-center justify-center gap-8 mb-8">
                  <div className="flex items-center space-x-3 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
                    <img 
                      src="/lovable-uploads/155c9911-22bb-47fc-916f-0f563768a779.png" 
                      alt="Manychat"
                      className="h-12 rounded-lg"
                    />
                  </div>
                  
                  <div className="text-6xl font-black text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text drop-shadow-lg">
                    VS
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-xl">@</span>
                    </div>
                    <div>
                      <span className="text-2xl font-light text-white">Hower</span>
                      <span className="text-2xl font-bold text-white ml-1">Assistant</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparación de características */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                {/* Lado Manychat */}
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-700 mb-2">Manychat</h3>
                    <div className="h-1 w-16 bg-red-400 rounded-full mx-auto"></div>
                  </div>
                  
                  <div className="group flex items-center space-x-4 p-6 bg-white rounded-2xl border-2 border-red-100 hover:border-red-200 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <X className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-800">500 Contactos</p>
                      <p className="text-sm text-red-600 font-medium">Límite restrictivo</p>
                    </div>
                  </div>

                  <div className="group flex items-center space-x-4 p-6 bg-white rounded-2xl border-2 border-red-100 hover:border-red-200 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <X className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-800">Difícil de usar</p>
                      <p className="text-sm text-red-600 font-medium">Interfaz compleja y confusa</p>
                    </div>
                  </div>

                  <div className="group flex items-center space-x-4 p-6 bg-white rounded-2xl border-2 border-red-100 hover:border-red-200 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <X className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-800">Más contactos,</p>
                      <p className="text-xl font-bold text-red-600">MÁS COSTOSO</p>
                    </div>
                  </div>

                  <div className="group flex items-center space-x-4 p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-2xl border-2 border-red-200 transition-all duration-300 shadow-lg">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-800">Post 7 días: $15 USD</p>
                      <p className="text-lg font-bold text-red-700">Después: $25, $50, $100+...</p>
                      <p className="text-sm text-red-600 font-medium">Precio escala con contactos</p>
                    </div>
                  </div>
                </div>

                {/* Lado Hower Assistant */}
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Hower Assistant</h3>
                    <div className="h-1 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto"></div>
                  </div>
                  
                  <div className="group flex items-center space-x-4 p-6 bg-white rounded-2xl border-2 border-green-100 hover:border-green-200 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-800">Contactos</p>
                      <p className="text-xl font-bold text-green-600">ILIMITADOS</p>
                      <p className="text-sm text-green-600 font-medium">Sin restricciones</p>
                    </div>
                  </div>

                  <div className="group flex items-center space-x-4 p-6 bg-white rounded-2xl border-2 border-green-100 hover:border-green-200 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-800">Monta tu flujo</p>
                      <p className="text-xl font-bold text-green-600">en 1 minuto</p>
                      <p className="text-sm text-green-600 font-medium">Súper fácil de usar</p>
                    </div>
                  </div>

                  <div className="group flex items-center space-x-4 p-6 bg-white rounded-2xl border-2 border-green-100 hover:border-green-200 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-800">Buscador de</p>
                      <p className="text-xl font-bold text-purple-600">contenidos virales</p>
                      <p className="text-sm font-bold text-pink-600">con Inteligencia Artificial</p>
                    </div>
                  </div>

                  <div className="group flex items-center space-x-4 p-6 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-2xl border-2 border-purple-200 transition-all duration-300 shadow-xl">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">$13 USD/mes</p>
                      <p className="text-lg font-bold text-gray-800">MISMO PRECIO SIEMPRE</p>
                      <p className="text-sm text-purple-600 font-medium">Sin importar tus contactos</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón CTA mejorado */}
              <div className="text-center">
                <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 max-w-md mx-auto">
                  <Button
                    onClick={handleRegister}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 text-xl rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl mb-4"
                  >
                    🚀 Prueba GRATIS 7 días
                  </Button>
                  
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <div className="w-6 h-6 border-2 border-gray-400 rounded flex items-center justify-center">
                      <span className="text-xs">💳</span>
                    </div>
                    <span className="font-semibold">Sin tarjeta requerida</span>
                  </div>
                </div>
              </div>
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
                <div className="space-y-4">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 text-lg">
                    Migración gratuita incluida
                  </Badge>
                  
                  <Button
                    onClick={handleRegister}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-8 text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    Migrar a Hower gratis
                  </Button>
                </div>
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

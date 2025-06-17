
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, Users, Brain, TrendingUp, MessageSquare, Zap, RefreshCw } from 'lucide-react';

const Beta: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    business: ''
  });

  useEffect(() => {
    // Script principal de Wistia
    const wistiaScript = document.createElement('script');
    wistiaScript.src = 'https://fast.wistia.com/embed/medias/6ux3509b4n.jsonp';
    wistiaScript.async = true;
    document.head.appendChild(wistiaScript);

    // Script del player
    const playerScript = document.createElement('script');
    playerScript.src = 'https://fast.wistia.com/assets/external/E-v1.js';
    playerScript.async = true;
    document.head.appendChild(playerScript);

    return () => {
      // Cleanup
      if (document.head.contains(wistiaScript)) {
        document.head.removeChild(wistiaScript);
      }
      if (document.head.contains(playerScript)) {
        document.head.removeChild(playerScript);
      }
    };
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegister = () => {
    // Redirigir directamente a Stripe
    window.open('https://buy.stripe.com/cNi6oG9gYdRIf1HdFm3wQ0u', '_blank');
  };

  const isFormValid = formData.name.trim() && formData.email.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-light text-primary">Hower <span className="font-bold">Assistant</span></h1>
          </div>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            Beta Exclusiva
          </Badge>
        </div>
      </div>

      {/* Hero Section con Video */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Video Section */}
          <div className="order-2 lg:order-1">
            <div className="relative max-w-xs mx-auto lg:max-w-xs">
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-gray-100">
                <div 
                  className="wistia_responsive_padding" 
                  style={{ padding: '56.25% 0 0 0', position: 'relative' }}
                >
                  <div 
                    className="wistia_responsive_wrapper" 
                    style={{ height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' }}
                  >
                    <div 
                      className="wistia_embed wistia_async_6ux3509b4n videoFoam=true" 
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
                          src="https://fast.wistia.com/embed/medias/6ux3509b4n/swatch" 
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

          {/* Content Section */}
          <div className="order-1 lg:order-2 space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                Únete a la Beta de{' '}
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800 bg-clip-text text-transparent">
                  Hower Assistant
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                4 procesos inteligentes filtrados con IA avanzada. 
                <span className="font-semibold text-purple-700"> La Inteligencia Artificial será tu mejor aliado.</span>
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Beta: 24 de Junio
                </Badge>
                <Badge variant="outline" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Lanzamiento: 1 de Julio
                </Badge>
              </div>
            </div>

            {/* 4 Nuevas Funcionalidades */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-800">IA de Sugerencia de Seguimientos</span>
                  <p className="text-xs text-gray-600">Sistema inteligente que sugiere los mejores perfiles para seguir y optimizar tu crecimiento.</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-800">Prospección Semi-Móvil</span>
                  <p className="text-xs text-gray-600">Gestiona tus prospectos desde cualquier dispositivo con una experiencia optimizada.</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-800">Métricas en Tiempo Real</span>
                  <p className="text-xs text-gray-600">Monitorea el rendimiento de tu cuenta con análisis detallados y reportes automáticos.</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-800">Auto-Respondedor</span>
                  <p className="text-xs text-gray-600">Responde a mensajes como: "comenta la palabra CRUCERO y te mando.." y Hower Assistant responde en automático, creando nuevos leads.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Características del Auto-Respondedor */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">¿Qué incluye el Auto-Respondedor?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-0 bg-white/60 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Responder a mensajes directos</h3>
                  <p className="text-gray-600 text-sm">Automatiza respuestas a mensajes privados en Instagram</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-0 bg-white/60 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-4 h-4 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Responder a comentarios</h3>
                  <p className="text-gray-600 text-sm">Responde automáticamente: "Gracias! ya te envié la info al privado"</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-0 bg-white/60 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Envío automático al privado</h3>
                  <p className="text-gray-600 text-sm">Enviará la información al privado una vez que comenten el post</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-0 bg-white/60 backdrop-blur-sm">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Users className="w-4 h-4 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Saludo a nuevos seguidores</h3>
                  <p className="text-gray-600 text-sm">Bienvenida automática personalizada para cada nuevo seguidor</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Migración desde otros sistemas */}
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto p-8 border-0 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">¿Ya tienes Manychat o Chatfuel?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Si tienes ya un sistema como <span className="font-semibold">Manychat o Chatfuel</span>, nosotros hacemos la migración de tus respuestas automáticas de estos otros softwares a Hower Assistant (si así lo deseas), en las funcionalidades disponibles dentro de Hower.
            </p>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2">
              Migración gratuita incluida
            </Badge>
          </div>
        </Card>
      </div>

      {/* Botón de Registro Simplificado */}
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-lg mx-auto p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-800">Asegura tu acceso a la Beta</h2>
              <p className="text-lg text-gray-600">Únete por solo $1 USD</p>
              <p className="text-sm text-gray-500">
                Acceso completo a los 4 procesos inteligentes desde el 24 de junio
              </p>
            </div>

            <Button
              onClick={handleRegister}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 text-xl"
              size="lg"
            >
              Registrarse por $1 USD
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Al hacer clic serás redirigido a Stripe para completar el pago seguro
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Preguntas Frecuentes</h2>
          
          <div className="space-y-6">
            <Card className="p-6 border-0 bg-white/60 backdrop-blur-sm">
              <h3 className="font-semibold text-lg text-gray-800 mb-2">¿Qué incluye la beta?</h3>
              <p className="text-gray-600">
                Acceso completo a los 4 procesos inteligentes de Hower Assistant: IA de sugerencias de seguimientos, 
                prospección semi-móvil, métricas en tiempo real y auto-respondedor completo.
              </p>
            </Card>

            <Card className="p-6 border-0 bg-white/60 backdrop-blur-sm">
              <h3 className="font-semibold text-lg text-gray-800 mb-2">¿Cuándo empezará la beta?</h3>
              <p className="text-gray-600">
                La beta comenzará el 24 de junio de 2024. Te notificaremos por email con las 
                instrucciones de acceso una vez que esté lista.
              </p>
            </Card>

            <Card className="p-6 border-0 bg-white/60 backdrop-blur-sm">
              <h3 className="font-semibold text-lg text-gray-800 mb-2">¿Por qué $1 USD?</h3>
              <p className="text-gray-600">
                El pago simbólico de $1 nos ayuda a confirmar tu interés real en participar en la beta 
                y garantiza que recibirás todas las actualizaciones importantes.
              </p>
            </Card>

            <Card className="p-6 border-0 bg-white/60 backdrop-blur-sm">
              <h3 className="font-semibold text-lg text-gray-800 mb-2">¿Qué pasa después del lanzamiento oficial?</h3>
              <p className="text-gray-600">
                Los participantes de la beta tendrán acceso a precios especiales y características 
                exclusivas cuando lancemos oficialmente el 1 de julio de 2024.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 py-8 text-center border-t border-gray-200">
        <p className="text-gray-500">
          © 2024 Hower Assistant. La IA será tu mejor aliado en Instagram.
        </p>
      </div>
    </div>
  );
};

export default Beta;

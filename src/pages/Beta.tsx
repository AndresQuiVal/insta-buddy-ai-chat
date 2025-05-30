
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, Users, Smartphone, Brain, Filter, BarChart3 } from 'lucide-react';

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
    // Guardar datos en localStorage para tracking
    if (formData.name || formData.email || formData.business) {
      localStorage.setItem('hower-beta-lead', JSON.stringify({
        ...formData,
        timestamp: new Date().toISOString()
      }));
    }
    
    // Redirigir a Stripe
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
            <div className="relative max-w-lg mx-auto lg:max-w-lg">
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
                  Beta: Mediados de Junio
                </Badge>
                <Badge variant="outline" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Lanzamiento: 1 de Julio
                </Badge>
              </div>
            </div>

            {/* 4 Beneficios Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-800">Prospección en tu celular</span>
                  <p className="text-xs text-gray-600">Automatización móvil 24/7</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <Brain className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-800">Sugerencias con IA</span>
                  <p className="text-xs text-gray-600">Recomendaciones inteligentes</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Filter className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-800">Filtrar procesos con IA</span>
                  <p className="text-xs text-gray-600">Calificación automática</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 backdrop-blur-sm">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-800">Métricas automáticas y sugerencias con IA</span>
                  <p className="text-xs text-gray-600">Análisis predictivo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de Registro */}
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-lg mx-auto p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-800">Asegura tu acceso a la Beta</h2>
              <p className="text-gray-600">Únete por solo $1 USD</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <Input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa/Negocio (opcional)
                </label>
                <Input
                  type="text"
                  placeholder="Nombre de tu empresa o negocio"
                  value={formData.business}
                  onChange={(e) => handleInputChange('business', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <Button
              onClick={handleRegister}
              disabled={!isFormValid}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 text-lg"
            >
              Registrarse por $1 USD
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Al hacer clic serás redirigido a Stripe para completar el pago
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
                Acceso completo a los 4 procesos inteligentes de Hower Assistant: prospección móvil, 
                sugerencias con IA, filtrado de procesos y métricas automáticas con sugerencias.
              </p>
            </Card>

            <Card className="p-6 border-0 bg-white/60 backdrop-blur-sm">
              <h3 className="font-semibold text-lg text-gray-800 mb-2">¿Cuándo empezará la beta?</h3>
              <p className="text-gray-600">
                La beta comenzará a mediados de junio de 2024. Te notificaremos por email con las 
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

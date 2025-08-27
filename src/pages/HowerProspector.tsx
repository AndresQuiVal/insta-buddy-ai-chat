import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Chrome, CheckCircle, Target, MessageSquare, UserCheck, Clock, Shield, Zap, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import howerLogo from '@/assets/hower-logo.png';

const HowerProspector = () => {
  const navigate = useNavigate();

  const handleDownloadExtension = () => {
    window.open('https://chromewebstore.google.com/detail/hower-social-media-assist/fmjcnabglbobncbckgclmhnffljmjppi?authuser=0&hl=es-419&pli=1', '_blank');
  };

  const steps = [
    "Instalar Hower Prospector desde Chrome Store",
    "Buscar perfiles ideales en Instagram",
    "Enviar mensaje personalizado #1",
    "Esperar 24-48 horas para respuesta",
    "Enviar seguimiento si no responde",
    "Calificar lead según interés",
    "Agendar llamada con prospectos calientes",
    "Cerrar venta y conseguir cliente"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-800 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => navigate('/tasks-to-do')}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Tareas
          </Button>
          
          <div className="flex items-center gap-3">
            <img
              src={howerLogo}
              alt="Hower Logo"
              className="w-12 h-12 rounded-2xl object-cover"
            />
            <div>
              <h1 className="text-2xl font-light text-white">
                Hower <span className="font-bold">Prospector</span>
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-light text-white mb-6">
              Hower <span className="font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Prospector</span>
            </h1>
            <p className="text-xl text-white/90 mb-4">
              Prospecta en frío por Instagram
            </p>
            <p className="text-lg text-white/80 mb-8">
              Mira cómo trabaja por ti 👇
            </p>

            {/* Video Container */}
            <div className="w-full max-w-4xl mx-auto mb-12 animate-scale-in">
              <div className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden shadow-2xl">
                <iframe
                  src="https://www.loom.com/embed/1863bb5dd56a4fcb919ece8d74043298?sid=4ed2cc61-1c74-4270-afe8-c7d39b1c55b1"
                  frameBorder="0"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                  title="Hower Prospector Demo"
                ></iframe>
              </div>
            </div>

            {/* CTA Button */}
            <Button 
              onClick={handleDownloadExtension}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 mb-16 flex items-center gap-3 mx-auto"
            >
              <Chrome className="w-6 h-6" />
              Quiero activarlo
            </Button>
          </div>

          {/* What is Hower Prospector */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6">¿Qué es Hower Prospector?</h2>
                <p className="text-white/90 mb-6">
                  Una extensión de Chrome que te permite hacer prospección automatizada en Instagram. 
                  Detecta perfiles ideales, envía mensajes personalizados y califica leads automáticamente.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white/90">Detecta automáticamente perfiles de tu cliente ideal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white/90">Envía mensajes personalizados usando tu embudo probado</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white/90">Califica leads automáticamente según sus respuestas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-white/90">Funciona mientras navegas Instagram normalmente</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Embudo de 8 Pasos */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Target className="w-6 h-6 text-purple-400" />
                  Embudo Probado de 8 Pasos
                </h2>
                <p className="text-white/90 mb-6">
                  Incluimos nuestro sistema de prospección probado que compartimos con todos los nuevos usuarios:
                </p>
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <span className="text-white/90 text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Automatización Inteligente</h3>
                <p className="text-white/90 text-sm">
                  Detecta automáticamente perfiles que coinciden con tu cliente ideal y envía mensajes personalizados
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Mensajes Probados</h3>
                <p className="text-white/90 text-sm">
                  Utiliza nuestro embudo de 8 pasos con mensajes que han generado miles de clientes
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                    <UserCheck className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Calificación Automática</h3>
                <p className="text-white/90 text-sm">
                  Identifica automáticamente leads calientes y los organiza por nivel de interés
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Benefits */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-16">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                ¿Por qué usar Hower Prospector?
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-blue-400" />
                    Ahorra Tiempo
                  </h3>
                  <p className="text-white/90 mb-6">
                    En lugar de buscar manualmente perfiles y escribir mensajes desde cero, 
                    Hower Prospector automatiza todo el proceso de prospección.
                  </p>
                  
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <Shield className="w-6 h-6 text-green-400" />
                    Seguro y Confiable
                  </h3>
                  <p className="text-white/90">
                    Funciona completamente en tu navegador. No almacenamos tus credenciales 
                    ni tenemos acceso a tu cuenta de Instagram.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <Users className="w-6 h-6 text-purple-400" />
                    Más Clientes
                  </h3>
                  <p className="text-white/90 mb-6">
                    Con nuestro embudo probado y la automatización inteligente, 
                    puedes contactar 10x más prospectos en el mismo tiempo.
                  </p>
                  
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <Target className="w-6 h-6 text-pink-400" />
                    Targeting Preciso
                  </h3>
                  <p className="text-white/90">
                    Encuentra exactamente el tipo de cliente que necesitas usando 
                    nuestros algoritmos de detección avanzados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Final CTA */}
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Empieza a conseguir clientes hoy mismo
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Miles de emprendedores ya están usando Hower Prospector para hacer crecer sus negocios
            </p>
            <Button 
              onClick={handleDownloadExtension}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-6 px-12 text-xl rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto"
            >
              <Chrome className="w-7 h-7" />
              ACTIVAR HOWER PROSPECTOR AHORA
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowerProspector;
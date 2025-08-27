import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Chrome, CheckCircle, Target, MessageSquare, UserCheck, Clock, Shield, Zap, Users } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="container mx-auto">
        {/* Header con botón de regreso */}
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => navigate('/tasks-to-do')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-white border-white hover:bg-white hover:text-gray-900"
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

        {/* Contenido principal */}
        <div className="max-w-6xl mx-auto text-center">
          {/* Título principal */}
          <h1 className="text-4xl md:text-6xl font-light text-white mb-6">
            Hower <span className="font-bold text-purple-400">Prospector</span>
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Prospecta en frío por Instagram
          </p>
          <p className="text-lg text-gray-400 mb-8">
            Mira cómo trabaja por ti 👇
          </p>

          {/* Video */}
          <div className="w-full max-w-4xl mx-auto mb-12">
            <div className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden shadow-2xl bg-gray-800">
              <iframe
                src="https://www.loom.com/embed/d6880eba31af4f53ad8158a3b2b9faa5?source=embed_watch_on_loom_cta"
                frameBorder="0"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
                title="Cómo usar Hower | Tutorial (Super) Rápido"
              ></iframe>
            </div>
          </div>

          {/* Botón CTA */}
          <Button 
            onClick={handleDownloadExtension}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 mb-16 flex items-center gap-3 mx-auto"
          >
            <Chrome className="w-6 h-6" />
            Descargar Prospector
          </Button>

          {/* Descripción simplificada */}
          <div className="bg-gray-800 rounded-lg p-8 mb-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">¿Qué es Hower Prospector?</h2>
            <p className="text-gray-300 text-lg mb-8">
              Una extensión de Chrome que prospecta automáticamente en Instagram por ti. 
              Detecta tu cliente ideal, envía mensajes personalizados y se conecta con tu CRM en /tasks-to-do
            </p>
            
            {/* Flujo de integración */}
            <div className="bg-gray-700 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-6">Cómo se integra con tu CRM</h3>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center flex-1">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Chrome className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">1. Prospector encuentra leads</h4>
                  <p className="text-gray-300 text-sm">La extensión detecta y contacta prospectos en Instagram</p>
                </div>
                
                <ArrowRight className="w-8 h-8 text-gray-400 hidden md:block" />
                
                <div className="text-center flex-1">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">2. Aparecen en /tasks-to-do</h4>
                  <p className="text-gray-300 text-sm">Los prospectos interesados se sincronizan automáticamente</p>
                </div>
                
                <ArrowRight className="w-8 h-8 text-gray-400 hidden md:block" />
                
                <div className="text-center flex-1">
                  <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">3. Gestionas y cierras</h4>
                  <p className="text-gray-300 text-sm">Usas el CRM para dar seguimiento y cerrar ventas</p>
                </div>
              </div>
            </div>

            {/* Características */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span className="text-gray-300">Detecta automáticamente tu cliente ideal</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span className="text-gray-300">Envía mensajes con embudo probado</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span className="text-gray-300">Se sincroniza con tu CRM automáticamente</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span className="text-gray-300">Funciona mientras haces otras cosas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowerProspector;
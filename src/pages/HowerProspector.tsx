import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, Chrome, CheckCircle, Target, MessageSquare, UserCheck, Clock, Shield, Zap, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import howerLogo from '@/assets/hower-logo.png';

const HowerProspector = () => {
  const navigate = useNavigate();
  const [showInstallDialog, setShowInstallDialog] = useState(false);

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
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-600 hover:border-gray-500"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al CRM
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
          <p className="text-xl text-gray-300 mb-8">
            Prospecta en frío por Instagram
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
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 mb-4 flex items-center gap-3 mx-auto"
          >
            <Chrome className="w-6 h-6" />
            Descargar Prospector
          </Button>

          {/* Ayuda para instalación */}
          <div className="mb-16">
            <button
              onClick={() => setShowInstallDialog(true)}
              className="text-gray-400 hover:text-purple-400 text-sm underline transition-colors"
            >
              ¿No sabes instalarlo? da click
            </button>
          </div>

          {/* Descripción simplificada */}
          <div className="bg-gray-800 rounded-lg p-8 mb-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">¿Qué es Hower Prospector?</h2>
          <p className="text-gray-300 text-lg mb-8">
            Una extensión de Chrome que prospecta automáticamente en Instagram por ti.
          </p>
          
          {/* Cómo funciona */}
          <div className="bg-gray-700 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-6">Cómo funciona</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Detecta prospectos</h4>
                  <p className="text-gray-300 text-sm">Hower detecta cuentas donde los seguidores son tus prospectos</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Genera mensajes con I.A.</h4>
                  <p className="text-gray-300 text-sm">Hower genera un mensaje 100% personalizado con I.A.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Envío automático</h4>
                  <p className="text-gray-300 text-sm">Hower lo envía en automático, abriendo conversaciones con prospectos de interés</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Control en tu CRM</h4>
                  <p className="text-gray-300 text-sm">Tus prospectos aparecen en tu CRM para que puedas controlar a quienes debes darles seguimiento y agendar llamadas de venta</p>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Embudo de Prospección */}
          <div className="bg-gray-800 rounded-lg p-8 mb-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Embudo de Prospección con Hower</h2>
            <p className="text-gray-300 text-center mb-8">Embudo probado que funciona para agendar llamadas con Hower</p>
            
            <div className="space-y-4">
              {/* Paso 1 */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg p-4 text-white">
                <h3 className="font-bold text-lg mb-2">1. Mensaje corto con pregunta final</h3>
                <p className="text-blue-100 text-sm">(Enviado automáticamente por Hower)</p>
              </div>

              {/* Paso 2 */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg p-4 text-white ml-4">
                <h3 className="font-bold text-lg mb-2">2. Respuesta del prospecto</h3>
                <p className="text-blue-100 text-sm">(Gracias a tu marca personal)</p>
              </div>

              {/* Paso 3 */}
              <div className="bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg p-4 text-white ml-8">
                <h3 className="font-bold text-lg mb-2">3. Audio de presentación + 'Por qué su perfil'</h3>
                <p className="text-blue-100 text-sm">(Storytelling y conexión)</p>
              </div>

              {/* Paso 4 */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-4 text-white ml-12">
                <h3 className="font-bold text-lg mb-2">4. Filtro inicial</h3>
                <p className="text-purple-100 text-sm">(Video o audio breve explicando el proyecto)</p>
              </div>

              {/* Paso 5 */}
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white ml-16">
                <h3 className="font-bold text-lg mb-2">5. Seguimiento al día siguiente</h3>
                <p className="text-purple-100 text-sm">(Recordar video/audio y resolver dudas)</p>
              </div>

              {/* Paso 6 */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-4 text-white ml-20">
                <h3 className="font-bold text-lg mb-2">6. Invitación a Café Virtual (Zoom)</h3>
                <p className="text-purple-100 text-sm">(15-20 min, pedir teléfono y enviar info)</p>
              </div>

              {/* Paso 7 */}
              <div className="bg-gradient-to-r from-purple-700 to-purple-800 rounded-lg p-4 text-white ml-24">
                <h3 className="font-bold text-lg mb-2">7. Presentación of negocio en Zoom</h3>
                <p className="text-purple-100 text-sm">(Explicar proyecto con entusiasmo)</p>
              </div>

              {/* Paso 8 */}
              <div className="bg-gradient-to-r from-purple-800 to-purple-900 rounded-lg p-4 text-white ml-28">
                <h3 className="font-bold text-lg mb-2">8. Cierre post-reunión</h3>
                <p className="text-purple-100 text-sm">siguiente paso es...', seguimiento y material</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog para instalación */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-2">
              Instala Hower Prospector (extensión de Chrome)
            </DialogTitle>
            <p className="text-gray-600 text-center">Solo funciona en computadores</p>
          </DialogHeader>
          <div className="relative" style={{ paddingBottom: '63.64172068355922%', height: 0 }}>
            <iframe
              src="https://www.loom.com/embed/0ecb36895a864814803dcec9ec798f33?sid=290e64f8-995e-4063-80eb-4546faf9e753"
              frameBorder="0"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              title="Cómo instalar Hower Prospector"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HowerProspector;
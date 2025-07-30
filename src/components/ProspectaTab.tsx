import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MessageCircle, Users, Zap, Play, ChevronRight } from 'lucide-react';

const ProspectaTab = () => {
  const handleActivateProspector = () => {
    window.open('https://howerai.com/app', '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* BLOQUE 1 – HERO PRINCIPAL */}
      <div className="text-center bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl p-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Hower Prospector
        </h1>
        <p className="text-xl mb-8 opacity-90">
          prospecta en frío por Instagram
        </p>
        <Button 
          onClick={handleActivateProspector}
          size="lg"
          className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-xl font-semibold"
        >
          Quiero activarlo
        </Button>
      </div>

      {/* BLOQUE 2 – ¿QUÉ ES HOWER PROSPECTOR? */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl text-center text-gray-900">
            ¿Qué es el Hower Prospector?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-gray-700 leading-relaxed">
            Es una herramienta con Inteligencia Artificial que se conecta a tu Instagram y prospecta por ti. 
            Te consigue conversaciones reales, filtra personas interesadas y les habla como si fueras tú. 
            Tú solo eliges a quién contactar… y la I.A. hace el resto.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-800">Detecta perfiles según tus criterios</span>
            </div>
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-800">Envía mensajes cálidos y humanos</span>
            </div>
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-800">Califica prospectos y te avisa</span>
            </div>
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <span className="text-gray-800">Funciona mientras tú haces otras cosas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BLOQUE 3 – VIDEO / DEMO */}
      <Card className="border-0 shadow-lg">
        <CardContent className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            Mira cómo trabaja por ti 👇
          </h2>
          <div className="max-w-2xl mx-auto">
            <iframe 
              src="https://www.loom.com/embed/d6880eba31af4f53ad8158a3b2b9faa5?source=embed_watch_on_loom_cta"
              style={{ width: '100%', height: '400px', borderRadius: '0.5rem' }}
              frameBorder="0"
              allowFullScreen
              title="Cómo usar Hower | Tutorial (Super) Rápido"
            />
          </div>
        </CardContent>
      </Card>

      {/* BLOQUE 4 – TESTIMONIOS */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-gray-900">
            Lo que dicen nuestros usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div>
                  <h4 className="font-semibold">María González</h4>
                  <p className="text-sm text-gray-600">Coach de Ventas</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Ya no tengo que perseguir gente. El 70% de mis socios llegan desde Hower sin que yo escriba nada."
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  C
                </div>
                <div>
                  <h4 className="font-semibold">Carlos Ruiz</h4>
                  <p className="text-sm text-gray-600">Consultor Digital</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Increíble como automatiza todo el proceso. Ahora me enfoco en cerrar, no en buscar."
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BLOQUE 5 – INSTRUCCIONES */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-gray-900">
            ¿Cómo lo activo en mi cuenta?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: 1, text: 'Haz clic en "Quiero activarlo"' },
              { step: 2, text: 'Inicia sesión con Instagram' },
              { step: 3, text: 'Responde 3 preguntas sobre tu cliente ideal' },
              { step: 4, text: 'Activa el Hower Prospector y deja que la magia comience' }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  {item.step}
                </div>
                <p className="text-gray-700">{item.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* BLOQUE 6 – PREGUNTAS FRECUENTES */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-gray-900">
            Preguntas Frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">¿Necesito estar conectado todo el día?</h4>
              <p className="text-gray-700">No. Hower trabaja aunque estés offline.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">¿Funciona si no tengo experiencia en ventas?</h4>
              <p className="text-gray-700">Sí. Está diseñado para personas que solo quieren prospectar de forma inteligente.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">¿Es seguro?</h4>
              <p className="text-gray-700">Sí. Seguimos las políticas de uso de Instagram y no usamos tu cuenta de forma masiva.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BLOQUE 7 – LLAMADO FINAL */}
      <div className="text-center bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl p-12">
        <h2 className="text-3xl font-bold mb-6">
          Estás a 1 clic de dejar de perseguir gente
        </h2>
        <Button 
          onClick={handleActivateProspector}
          size="lg"
          className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-xl font-semibold"
        >
          ACTIVAR HOWER PROSPECTOR AHORA
        </Button>
      </div>
    </div>
  );
};

export default ProspectaTab;
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Users, Search, Gift, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DreamCustomerRadarGuide: React.FC = () => {
  const navigate = useNavigate();

  // SEO
  useEffect(() => {
    document.title = 'Instructivo Dream Customer Radar | Hower Assistant';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Aprende cómo usar el Dream Customer Radar para definir tu Cliente Ideal (ICP) con precisión y obtener palabras de búsqueda para prospectar en Instagram.';
      document.head.appendChild(m);
    } else {
      metaDesc.setAttribute('content', 'Aprende cómo usar el Dream Customer Radar para definir tu Cliente Ideal (ICP) con precisión y obtener palabras de búsqueda para prospectar en Instagram.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/tasks-to-do')} 
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">🧭 Instructivo del Juego Dream Customer Radar</h1>
        </div>

        {/* Objetivo del juego */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Target className="w-6 h-6 text-blue-600" />
              🎯 Objetivo del juego
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 leading-relaxed">
            <p>El juego sirve para que definas con precisión tu Cliente Ideal (ICP).</p>
            <ul className="space-y-2 ml-4">
              <li>• Si lo logras, llegarás al <strong>Bullseye</strong> (el centro del radar).</li>
              <li>• Al hacerlo, el sistema te entregará palabras de búsqueda basadas en los dolores de tu ICP para usarlas directamente en el buscador de Hower.</li>
              <li>• Si tu ICP está mal definido, no podrás obtener esas palabras y el buscador no te funcionará.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Cómo funciona */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              🕹️ Cómo funciona paso a paso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Paso 1 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">1. Escribe tu ICP</h3>
              <p className="text-gray-700 mb-3">Cada persona describe a su cliente ideal respondiendo estas 4 áreas:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <strong className="text-blue-800">WHO (Quién es):</strong>
                  <p className="text-sm text-gray-600">edad, género, situación actual, problema principal.</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <strong className="text-green-800">WHERE (Dónde está):</strong>
                  <p className="text-sm text-gray-600">qué páginas sigue, qué hashtags usa, qué comunidades/podcasts/blogs consume.</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <strong className="text-purple-800">BAIT (Qué lo atrae):</strong>
                  <p className="text-sm text-gray-600">qué hook, historia u oferta irresistible lo engancharía.</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <strong className="text-orange-800">RESULT (Resultado deseado):</strong>
                  <p className="text-sm text-gray-600">qué logro máximo busca, medible y concreto.</p>
                </div>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">2. Evaluación</h3>
              <p className="text-gray-700 mb-3">El sistema evalúa tu descripción:</p>
              <ul className="space-y-2 ml-4 text-gray-700">
                <li>• <strong className="text-green-600">4/4 áreas completas</strong> → Bullseye (ICP claro y usable)</li>
                <li>• <strong className="text-yellow-600">2–3 áreas completas</strong> → Anillo intermedio (todavía general)</li>
                <li>• <strong className="text-red-600">0–1 área completa</strong> → Anillo externo (ICP difuso, no sirve para prospectar)</li>
              </ul>
            </div>

            {/* Paso 3 */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">3. Visualización en el radar</h3>
              <ul className="space-y-2 ml-4 text-gray-700">
                <li>• Tu ICP se representará como un punto dentro de un radar de 3 círculos.</li>
                <li>• Entre más definido esté, más cerca del centro (Bullseye) aparecerá.</li>
              </ul>
            </div>

            {/* Paso 4 */}
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="text-lg font-semibold text-orange-800 mb-2">4. Feedback inmediato</h3>
              <p className="text-gray-700 mb-3">El sistema te mostrará:</p>
              <ul className="space-y-2 ml-4 text-gray-700">
                <li>• Cuáles bloques completaste ✔️</li>
                <li>• Cuáles te faltan ❌</li>
                <li>• Sugerencias claras para mejorarlo</li>
                <li>• <strong>Ejemplo:</strong> "Agrega al menos 2 hashtags y 1 podcast que siga tu cliente ideal."</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Recompensa */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Gift className="w-6 h-6 text-green-600" />
              5. Recompensa del Bullseye: Palabras de búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 leading-relaxed">
            <p><strong>Solo si tu ICP está en el Bullseye</strong> se desbloquea la función de generar palabras de búsqueda.</p>
            <ul className="space-y-2 ml-4">
              <li>• El sistema identifica en tu texto los dolores principales de tu cliente ideal.</li>
              <li>• Resume esos dolores en 3–5 keywords cortas, como si fueran búsquedas de Google.</li>
              <li>• Esas keywords son las que luego usarás en el buscador de cuentas de Hower para encontrar prospectos en Instagram.</li>
            </ul>
            
            <div className="bg-green-50 p-4 rounded-lg mt-4">
              <h4 className="font-semibold text-green-800 mb-2">👉 Ejemplo:</h4>
              <div className="space-y-2 text-sm">
                <p><strong>ICP definido:</strong> "Hombres de 20–30 en México, que entrenan en gym pero están estancados porque no suben músculo."</p>
                <p><strong>Dolores detectados:</strong> estancado, no subir músculo</p>
                <p><strong>Palabras de búsqueda sugeridas:</strong> "estancado gym", "subir músculo", "rutinas fuerza", "ganar masa rápido"</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compartir progreso */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="w-6 h-6 text-blue-600" />
              6. Compartir progreso en grupo (sin leads)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 leading-relaxed">
            <p>En el grupo de WhatsApp cada persona comparte solo su progreso, no las cuentas reales:</p>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-semibold text-blue-800">Ejemplo de mensaje:</p>
              <div className="bg-white p-3 rounded mt-2 border-l-4 border-blue-500">
                "Hoy estoy en el Anillo Intermedio (3/4). Me falta definir mi oferta irresistible. Mañana voy por el Bullseye."
              </div>
            </div>
            
            <p className="italic text-gray-600">Así todos se motivan, pero nadie revela sus cuentas de prospectos.</p>
          </CardContent>
        </Card>

        {/* Dinámica y motivación */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="w-6 h-6 text-yellow-600" />
              🏆 Dinámica y motivación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 leading-relaxed">
            <ul className="space-y-3 ml-4">
              <li>• El objetivo es que todos terminen el reto con su ICP en el Bullseye.</li>
              <li>• Al llegar al centro, cada participante desbloquea sus palabras de búsqueda y ya puede empezar a prospectar con Hower de forma precisa.</li>
              <li>• Puedes premiar con materiales extra o reconocimiento a los que lleguen primero.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Botón para jugar */}
        <div className="text-center">
          <Button 
            onClick={() => navigate('/dream-customer-radar')} 
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            🎯 Jugar Dream Customer Radar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DreamCustomerRadarGuide;
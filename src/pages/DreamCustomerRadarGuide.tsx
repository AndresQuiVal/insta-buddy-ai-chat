import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Users, Gift, Trophy } from 'lucide-react';
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
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header con estilo cuaderno */}
        <div className="relative mb-8">
          <div 
            className="bg-white rounded-2xl shadow-xl border-t-8 border-red-400 p-6 sm:p-8"
            style={{
              backgroundImage: `
                linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                linear-gradient(#f9fafb 0%, #ffffff 100%)
              `,
              backgroundSize: '24px 1px, 100% 100%',
              backgroundPosition: '0 40px, 0 0'
            }}
          >
            {/* Espiral del cuaderno */}
            <div className="absolute left-4 top-0 bottom-0 w-1 flex flex-col justify-evenly">
              {Array.from({length: 12}).map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-red-400 shadow-inner" />
              ))}
            </div>
            
            <div className="ml-4 sm:ml-6">
              <div className="flex items-center gap-4 mb-6">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/tasks-to-do')} 
                  className="p-2 hover:bg-purple-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-purple-600" />
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 font-mono">🧭 Dream Customer Radar</h1>
              </div>
              
              <div className="text-center mb-6">
                <div className="inline-block p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-4 animate-pulse">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-lg text-gray-700 font-mono">
                  El juego que define tu Cliente Ideal con precisión láser 🎯
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Objetivo del juego - Estilo cuaderno */}
        <div 
          className="bg-white rounded-2xl shadow-xl border-l-4 border-green-400 p-6 sm:p-8 mb-8"
          style={{
            backgroundImage: `
              linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
              linear-gradient(#f8fafc 0%, #ffffff 100%)
            `,
            backgroundSize: '24px 1px, 100% 100%',
            backgroundPosition: '0 30px, 0 0'
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full animate-bounce">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 font-mono">🎯 Objetivo del juego</h2>
          </div>
          
          <div className="space-y-4 text-gray-700 leading-relaxed font-mono">
            <p className="text-lg">El juego sirve para que definas con precisión tu Cliente Ideal (ICP).</p>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-l-4 border-green-500">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">🎯</span>
                  <span>Si lo logras, llegarás al <strong className="text-green-700">Bullseye</strong> (el centro del radar)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 text-xl">🔍</span>
                  <span>El sistema te entregará palabras de búsqueda para Hower</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-600 text-xl">⚠️</span>
                  <span>Si tu ICP está mal definido, no obtendrás las palabras clave</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cómo funciona - Estilo cuaderno */}
        <div 
          className="bg-white rounded-2xl shadow-xl border-l-4 border-blue-400 p-6 sm:p-8 mb-8"
          style={{
            backgroundImage: `
              linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
              linear-gradient(#f8fafc 0%, #ffffff 100%)
            `,
            backgroundSize: '24px 1px, 100% 100%',
            backgroundPosition: '0 30px, 0 0'
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full animate-spin">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 font-mono">🕹️ Cómo funciona paso a paso</h2>
          </div>
          
          <div className="space-y-6">
            {/* Paso 1 */}
            <div className="border-l-4 border-blue-500 pl-6 bg-blue-50 p-4 rounded-r-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2 font-mono">1. 📝 Escribe tu ICP</h3>
              <p className="text-gray-700 mb-3">Cada persona describe a su cliente ideal respondiendo estas 4 áreas:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-lg border border-blue-300 shadow-md">
                  <strong className="text-blue-800 text-lg">WHO (Quién es):</strong>
                  <p className="text-sm text-gray-700 mt-1">edad, género, situación actual, problema principal.</p>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-lg border border-green-300 shadow-md">
                  <strong className="text-green-800 text-lg">WHERE (¿Dónde los encuentras online?):</strong>
                  <p className="text-sm text-gray-700 mt-1">qué influencers/cuentas siguen, qué hashtags usan, en qué grupos están, qué podcasts escuchan.</p>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-lg border border-purple-300 shadow-md">
                  <strong className="text-purple-800 text-lg">BAIT (Qué lo atrae):</strong>
                  <p className="text-sm text-gray-700 mt-1">qué hook, historia u oferta irresistible lo engancharía.</p>
                </div>
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-lg border border-orange-300 shadow-md">
                  <strong className="text-orange-800 text-lg">RESULT (Resultado deseado):</strong>
                  <p className="text-sm text-gray-700 mt-1">qué logro máximo busca, medible y concreto.</p>
                </div>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="border-l-4 border-green-500 pl-6 bg-green-50 p-4 rounded-r-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2 font-mono">2. 🤖 Evaluación con IA</h3>
              <p className="text-gray-700 mb-3">El sistema evalúa tu descripción con inteligencia artificial:</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">🎯</span>
                  <span><strong className="text-green-600">4/4 áreas completas</strong> → Bullseye (ICP claro y usable)</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">⚡</span>
                  <span><strong className="text-yellow-600">2–3 áreas completas</strong> → Anillo intermedio (todavía general)</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-red-100 rounded-lg">
                  <span className="text-2xl">❌</span>
                  <span><strong className="text-red-600">0–1 área completa</strong> → Anillo externo (ICP difuso)</span>
                </div>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="border-l-4 border-purple-500 pl-6 bg-purple-50 p-4 rounded-r-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-2 font-mono">3. 📊 Visualización en el radar</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="text-xl">🎯</span>
                      <span>Tu ICP se representará como un punto dentro de un radar de 3 círculos.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-xl">📍</span>
                      <span>Entre más definido esté, más cerca del centro (Bullseye) aparecerá.</span>
                    </li>
                  </ul>
                </div>
                <div className="w-24 h-24 relative">
                  {/* Mini radar visual */}
                  <div className="absolute inset-0 border-4 border-red-300 rounded-full opacity-50"></div>
                  <div className="absolute inset-2 border-4 border-yellow-300 rounded-full opacity-50"></div>
                  <div className="absolute inset-4 border-4 border-green-300 rounded-full opacity-50"></div>
                  <div className="absolute inset-8 w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
                </div>
              </div>
            </div>

            {/* Paso 4 */}
            <div className="border-l-4 border-orange-500 pl-6 bg-orange-50 p-4 rounded-r-lg">
              <h3 className="text-lg font-semibold text-orange-800 mb-2 font-mono">4. 💡 Feedback inmediato</h3>
              <p className="text-gray-700 mb-3">El sistema te mostrará:</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 text-xl">✔️</span>
                    <span className="font-semibold text-green-800">Bloques completos</span>
                  </div>
                  <p className="text-sm text-gray-700">Los que ya tienes bien definidos</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-600 text-xl">❌</span>
                    <span className="font-semibold text-red-800">Bloques faltantes</span>
                  </div>
                  <p className="text-sm text-gray-700">Los que necesitas mejorar</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recompensa - Estilo cuaderno */}
        <div 
          className="bg-white rounded-2xl shadow-xl border-l-4 border-yellow-400 p-6 sm:p-8 mb-8"
          style={{
            backgroundImage: `
              linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
              linear-gradient(#f8fafc 0%, #ffffff 100%)
            `,
            backgroundSize: '24px 1px, 100% 100%',
            backgroundPosition: '0 30px, 0 0'
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
              <Gift className="w-6 h-6 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 font-mono">🏆 Recompensa del Bullseye</h2>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-yellow-300">
            <p className="text-lg font-semibold text-yellow-800 mb-4">
              <strong>Solo si tu ICP está en el Bullseye</strong> se desbloquea la función de generar palabras de búsqueda.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧠</span>
                <span>La IA identifica los dolores principales de tu cliente ideal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🔍</span>
                <span>Los convierte en 3-5 keywords para búsqueda</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <span>Las usas directamente en el buscador de Hower</span>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg mt-4 border-2 border-green-300">
              <h4 className="font-semibold text-green-800 mb-2">👉 Ejemplo real:</h4>
              <div className="space-y-2 text-sm">
                <p><strong>ICP:</strong> "Hombres 20-30 México, entrenan gym, estancados, no suben músculo"</p>
                <p><strong>Dolores detectados:</strong> estancado, no subir músculo</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">"estancado gym"</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">"subir músculo"</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">"rutinas fuerza"</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">"ganar masa"</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compartir progreso - Estilo cuaderno */}
        <div 
          className="bg-white rounded-2xl shadow-xl border-l-4 border-pink-400 p-6 sm:p-8 mb-8"
          style={{
            backgroundImage: `
              linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
              linear-gradient(#f8fafc 0%, #ffffff 100%)
            `,
            backgroundSize: '24px 1px, 100% 100%',
            backgroundPosition: '0 30px, 0 0'
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full">
              <Users className="w-6 h-6 text-pink-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 font-mono">📱 Compartir progreso</h2>
          </div>

          <div className="space-y-4">
            <p className="text-gray-700 text-lg">Comparte solo tu progreso, nunca las cuentas reales:</p>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-800 mb-2">📱 Ejemplo de mensaje para WhatsApp:</p>
              <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                <p className="font-mono text-gray-800">
                  "🎯 Dream Customer Radar actualización:<br/>
                  📊 Estoy en Anillo Intermedio (3/4)<br/>
                  ❌ Me falta: definir mi oferta irresistible<br/>
                  🚀 Mañana voy por el Bullseye!"
                </p>
              </div>
            </div>
            
            <div className="bg-green-100 p-3 rounded-lg border border-green-300">
              <p className="text-green-800 font-semibold flex items-center gap-2">
                <span className="text-xl">🔒</span>
                Así todos se motivan sin revelar sus prospectos secretos
              </p>
            </div>
          </div>
        </div>

        {/* Dinámica final - Estilo cuaderno */}
        <div 
          className="bg-white rounded-2xl shadow-xl border-l-4 border-purple-400 p-6 sm:p-8 mb-8"
          style={{
            backgroundImage: `
              linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
              linear-gradient(#f8fafc 0%, #ffffff 100%)
            `,
            backgroundSize: '24px 1px, 100% 100%',
            backgroundPosition: '0 30px, 0 0'
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full animate-bounce">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 font-mono">🏆 Meta del juego</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <span className="text-2xl">🎯</span>
              <span className="text-lg">Todos terminen con su ICP en el Bullseye</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-2xl">🔓</span>
              <span className="text-lg">Desbloquear palabras de búsqueda precisas</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <span className="text-2xl">🚀</span>
              <span className="text-lg">Empezar a prospectar con Hower de forma láser</span>
            </div>
          </div>
        </div>

        {/* Botón para jugar - Super llamativo */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-lg opacity-75 animate-pulse"></div>
            <Button 
              onClick={() => navigate('/dream-customer-radar')} 
              className="relative bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-12 py-4 text-2xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 rounded-2xl border-2 border-white"
            >
              🎯 JUGAR DREAM CUSTOMER RADAR 🚀
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DreamCustomerRadarGuide;
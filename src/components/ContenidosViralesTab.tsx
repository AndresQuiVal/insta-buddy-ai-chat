import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Search, Eye, Zap, Target, BarChart3 } from 'lucide-react';

const ContenidosViralesTab = () => {
  const handleOpenViralAI = () => {
    window.open('https://www.howersoftware.io/clients/posts-searcher/', '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center bg-gradient-to-br from-pink-600 to-orange-600 text-white rounded-2xl p-12">
        <TrendingUp className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4">
          Hower Viral-AI
        </h1>
        <p className="text-xl opacity-90 mb-8">
          Encuentra los contenidos más virales de la competencia para estudiarlos y replicarlos
        </p>
        <Button 
          onClick={handleOpenViralAI}
          size="lg"
          className="bg-white text-pink-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-xl font-semibold"
        >
          Abrir Hower Viral-AI
        </Button>
      </div>

      {/* ¿Cómo funciona? */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-gray-900">
            ¿Cómo Hower Viral-AI detecta un post o reel viral?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Introduce tu nicho</h3>
                  <p className="text-gray-700">Le dices al buscador exactamente qué tipo de contenido quieres analizar</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Búsqueda inteligente</h3>
                  <p className="text-gray-700">Busca los reels más recientes y con más vistas, comentarios y likes de tu nicho</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Análisis profundo</h3>
                  <p className="text-gray-700">Te permite estudiar sus ganchos, historias y ofertas para no quebrarte la cabeza</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Replicación exitosa</h3>
                  <p className="text-gray-700">Simplemente replica el contenido viral adaptándolo a tu marca</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Beneficios */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-gray-900">
            ¿Qué lograrás con Hower Viral-AI?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-orange-50 rounded-lg">
              <Target className="w-12 h-12 text-pink-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-3">Contenido que funciona</h3>
              <p className="text-gray-700">Ya no tendrás que adivinar qué contenido crear. Solo replica lo que ya está funcionando.</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-orange-50 rounded-lg">
              <Zap className="w-12 h-12 text-pink-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-3">Máquina de contenidos</h3>
              <p className="text-gray-700">Convierte tu Instagram en una máquina de contenidos virales constante.</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-orange-50 rounded-lg">
              <BarChart3 className="w-12 h-12 text-pink-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-3">Leads interminables</h3>
              <p className="text-gray-700">Junto al autorespondedor, tendrás leads interminables. ¡Ya lo hemos probado!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testimonios de resultados */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100">
        <CardContent className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            Resultados comprobados
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            No es broma, ya lo hemos probado con otros creadores, y funciona. 
            La combinación de contenido viral + autorespondedor = éxito garantizado.
          </p>
          <div className="flex items-center justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-pink-600">10x</div>
              <div className="text-sm text-gray-600">Más engagement</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-600">5x</div>
              <div className="text-sm text-gray-600">Más leads</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-600">90%</div>
              <div className="text-sm text-gray-600">Menos tiempo creando</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Final */}
      <div className="text-center bg-gradient-to-br from-pink-600 to-orange-600 text-white rounded-2xl p-12">
        <h2 className="text-3xl font-bold mb-6">
          ¿Listo para crear contenido viral?
        </h2>
        <p className="text-xl opacity-90 mb-8">
          Deja de inventar contenido y empieza a replicar lo que ya funciona
        </p>
        <Button 
          onClick={handleOpenViralAI}
          size="lg"
          className="bg-white text-pink-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-xl font-semibold"
        >
          COMENZAR AHORA CON VIRAL-AI
        </Button>
      </div>
    </div>
  );
};

export default ContenidosViralesTab;
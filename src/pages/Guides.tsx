import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  MessageCircle, 
  Settings, 
  Target, 
  Zap, 
  Users, 
  BarChart3,
  HelpCircle,
  PlayCircle,
  FileText,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Star
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Guides: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <img
                src="https://i.ibb.co/bMLhkc7G/Hower-logo.png"
                alt="Logo Hower"
                className="w-10 h-10 rounded-xl object-cover"
              />
              <div>
                <h1 className="text-3xl font-light bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Guías <span className="font-bold">Detalladas</span>
                </h1>
                <p className="text-gray-600">Todo lo que necesitas saber sobre los autorespondedores</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white rounded-lg p-1 shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Introducción
            </TabsTrigger>
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="keywords" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Palabras Clave
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Mensajes
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Automatización
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Análisis
            </TabsTrigger>
            <TabsTrigger value="best-practices" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Mejores Prácticas
            </TabsTrigger>
          </TabsList>

          {/* Introducción */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6 bg-white/90 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">¿Qué son los Autorespondedores?</h2>
                  <p className="text-gray-600">Fundamentos básicos para entender esta herramienta</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Concepto Básico</h3>
                  <p className="text-gray-700 mb-4">
                    Los autorespondedores de Hower son herramientas automatizadas que responden a los comentarios 
                    en tus posts de Instagram enviando mensajes directos personalizados a los usuarios que interactúan 
                    con tu contenido.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Beneficios Principales
                    </h4>
                    <ul className="space-y-2 text-green-800">
                      <li>• Automatiza la respuesta inicial a prospectos</li>
                      <li>• Aumenta la conversión de comentarios a DMs</li>
                      <li>• Filtra leads de manera automática</li>
                      <li>• Ahorra tiempo en respuestas repetitivas</li>
                      <li>• Mejora la velocidad de respuesta</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      Casos de Uso Comunes
                    </h4>
                    <ul className="space-y-2 text-blue-800">
                      <li>• Promoción de cursos y productos digitales</li>
                      <li>• Generación de leads para servicios</li>
                      <li>• Invitaciones a webinars y eventos</li>
                      <li>• Venta de consultorias y mentorías</li>
                      <li>• Captación para listas de email</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Importante:</strong> Los autorespondedores deben usarse de manera responsable. 
                    Asegúrate de ofrecer valor real y cumplir con las políticas de Instagram.
                  </AlertDescription>
                </Alert>
              </div>
            </Card>
          </TabsContent>

          {/* Configuración */}
          <TabsContent value="setup" className="space-y-6">
            <Card className="p-6 bg-white/90 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Configuración de Autorespondedores</h2>
                  <p className="text-gray-600">Guía paso a paso para configurar tu primer autorespondedor</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Tipos de Autorespondedores</h3>
                  
                  <div className="grid gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">1. Autorespondedor General</h4>
                      <p className="text-gray-700 mb-3">
                        Se aplica automáticamente a todos tus posts nuevos. Ideal para promociones constantes.
                      </p>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-600">
                          <strong>Cuándo usar:</strong> Cuando tienes un producto o servicio que quieres promocionar constantemente.
                        </p>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">2. Autorespondedor por Post</h4>
                      <p className="text-gray-700 mb-3">
                        Se configura específicamente para un post individual. Ideal para promociones específicas.
                      </p>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-600">
                          <strong>Cuándo usar:</strong> Para promociones especiales, lanzamientos o contenido específico.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Campos de Configuración</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 mb-2">Nombre del Autorespondedor</h4>
                      <p className="text-yellow-800 text-sm">
                        Usa nombres descriptivos que te ayuden a identificar el propósito. 
                        Ejemplo: "Leads Curso Marketing Digital" en lugar de "Autorespondedor 1".
                      </p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Mensaje DM</h4>
                      <p className="text-blue-800 text-sm">
                        Este es el mensaje que se enviará automáticamente. Debe ser personalizado, 
                        ofrecer valor y tener una llamada a la acción clara.
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">Palabras Clave (Opcional)</h4>
                      <p className="text-green-800 text-sm">
                        Si las activas, solo responderá a comentarios que contengan estas palabras. 
                        Si no las usas, responderá a TODOS los comentarios.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Palabras Clave */}
          <TabsContent value="keywords" className="space-y-6">
            <Card className="p-6 bg-white/90 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Estrategia de Palabras Clave</h2>
                  <p className="text-gray-600">Optimiza tus autorespondedores con palabras clave inteligentes</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-3">✅ Palabras Clave Efectivas</h4>
                    <ul className="space-y-2 text-green-800 text-sm">
                      <li>• "info" - Muy común y efectiva</li>
                      <li>• "precio" - Indica interés de compra</li>
                      <li>• "más información" - Específica</li>
                      <li>• "curso" - Para productos educativos</li>
                      <li>• "disponible" - Pregunta de disponibilidad</li>
                      <li>• "cómo" - Buscan soluciones</li>
                      <li>• "interesado" - Intención clara</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-3">❌ Evitar Estas Palabras</h4>
                    <ul className="space-y-2 text-red-800 text-sm">
                      <li>• "gracias" - Muy genérico</li>
                      <li>• "hola" - Demasiado común</li>
                      <li>• "wow" - No indica interés</li>
                      <li>• "genial" - Comentario casual</li>
                      <li>• "lindo" - Cumplido sin intención</li>
                      <li>• "❤️" - Solo emoji, no texto</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Estrategias Avanzadas</h3>
                  
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">1. Sin Palabras Clave (Respuesta Total)</h4>
                      <p className="text-gray-700 text-sm mb-2">
                        Responde a TODOS los comentarios. Usar solo en posts muy específicos para evitar spam.
                      </p>
                      <div className="bg-yellow-50 p-3 rounded">
                        <p className="text-yellow-800 text-sm">
                          <strong>Recomendado para:</strong> Posts de lanzamiento, ofertas limitadas, contenido exclusivo.
                        </p>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">2. Palabras Clave Múltiples</h4>
                      <p className="text-gray-700 text-sm mb-2">
                        Usa varias palabras para capturar diferentes tipos de interés.
                      </p>
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-blue-800 text-sm">
                          <strong>Ejemplo:</strong> "info", "precio", "disponible", "interesado", "curso"
                        </p>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">3. Palabras Específicas del Nicho</h4>
                      <p className="text-gray-700 text-sm mb-2">
                        Adapta las palabras a tu industria específica.
                      </p>
                      <div className="bg-purple-50 p-3 rounded">
                        <p className="text-purple-800 text-sm">
                          <strong>Marketing:</strong> "leads", "conversión", "embudo", "ROI"<br/>
                          <strong>Fitness:</strong> "rutina", "dieta", "entrenamiento", "plan"<br/>
                          <strong>Coaching:</strong> "sesión", "consulta", "mentoria", "acompañamiento"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Mensajes */}
          <TabsContent value="messages" className="space-y-6">
            <Card className="p-6 bg-white/90 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Creación de Mensajes Efectivos</h2>
                  <p className="text-gray-600">Aprende a escribir mensajes que conviertan</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Estructura de un Mensaje Efectivo</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">1. Saludo Personalizado</h4>
                      <p className="text-blue-800 text-sm mb-2">Reconoce que viste su comentario y agradece su interés.</p>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm italic">
                          "¡Hola! Vi tu comentario en mi post y me da mucho gusto tu interés..."
                        </p>
                      </div>
                    </div>

                    <div className="bg-green-50 border-l-4 border-green-400 p-4">
                      <h4 className="font-semibold text-green-900 mb-2">2. Propuesta de Valor</h4>
                      <p className="text-green-800 text-sm mb-2">Explica qué valor vas a ofrecer.</p>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm italic">
                          "Te voy a enviar más información sobre [tu producto/servicio] que puede ayudarte a [beneficio específico]..."
                        </p>
                      </div>
                    </div>

                    <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
                      <h4 className="font-semibold text-purple-900 mb-2">3. Llamada a la Acción</h4>
                      <p className="text-purple-800 text-sm mb-2">Indica qué esperras que hagan a continuación.</p>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm italic">
                          "¿Te parece si revisas la información y me dices si tienes alguna pregunta?"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Ejemplos de Mensajes por Industria</h3>
                  
                  <div className="grid gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">📈 Marketing Digital</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        "¡Hola! Vi tu comentario y me da mucho gusto tu interés en el marketing digital. 
                        Te voy a enviar información sobre mi curso donde aprenderás a generar leads 
                        cualificados y aumentar tus ventas online. ¿Te parece si revisas el contenido 
                        y me dices si es lo que estás buscando? 🚀"
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">💪 Fitness/Nutrición</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        "¡Hola! Me encanta ver tu interés en transformar tu físico. Te voy a compartir 
                        información sobre mi plan de entrenamiento personalizado que ha ayudado a más 
                        de 200 personas a alcanzar sus objetivos. ¿Te interesa conocer más detalles? 💪"
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">🎯 Coaching/Consultoría</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        "¡Hola! Vi tu comentario y me da gusto tu interés en crecer profesionalmente. 
                        Te voy a enviar información sobre mis sesiones de coaching donde te ayudo a 
                        definir y alcanzar tus objetivos. ¿Te gustaría agendar una llamada gratuita 
                        para conocer más? 🎯"
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Automatización */}
          <TabsContent value="automation" className="space-y-6">
            <Card className="p-6 bg-white/90 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Automatización Avanzada</h2>
                  <p className="text-gray-600">Configura flujos automatizados inteligentes</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Flujos de Seguimiento</h3>
                  <p className="text-gray-700 mb-4">
                    Los autorespondedores pueden incluir mensajes de seguimiento automáticos para aumentar 
                    la conversión de leads que no responden inicialmente.
                  </p>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Ejemplo de Flujo Automatizado:</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                        <div className="flex-1">
                          <p className="font-medium">Mensaje Inicial</p>
                          <p className="text-sm text-gray-600">Se envía inmediatamente después del comentario</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                        <div className="flex-1">
                          <p className="font-medium">Seguimiento 1 (24 horas)</p>
                          <p className="text-sm text-gray-600">Si no responde, envía recordatorio amigable</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                        <div className="flex-1">
                          <p className="font-medium">Seguimiento Final (72 horas)</p>
                          <p className="text-sm text-gray-600">Último intento con oferta especial</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Configuración de Horarios</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-3">✅ Mejores Horarios</h4>
                      <ul className="space-y-2 text-green-800 text-sm">
                        <li>• <strong>Lunes a Viernes:</strong> 9:00 AM - 6:00 PM</li>
                        <li>• <strong>Fines de semana:</strong> 10:00 AM - 4:00 PM</li>
                        <li>• <strong>Evitar:</strong> Muy temprano (antes 8 AM)</li>
                        <li>• <strong>Evitar:</strong> Muy tarde (después 9 PM)</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-3">🕐 Timing de Seguimientos</h4>
                      <ul className="space-y-2 text-blue-800 text-sm">
                        <li>• <strong>Primer seguimiento:</strong> 24-48 horas</li>
                        <li>• <strong>Segundo seguimiento:</strong> 3-5 días</li>
                        <li>• <strong>Seguimiento final:</strong> 1-2 semanas</li>
                        <li>• <strong>Máximo:</strong> 3-4 seguimientos</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Tip Pro:</strong> Los seguimientos tienen 3x más probabilidad de conversión 
                    que el mensaje inicial. Muchos prospectos necesitan varios toques antes de responder.
                  </AlertDescription>
                </Alert>
              </div>
            </Card>
          </TabsContent>

          {/* Análisis */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="p-6 bg-white/90 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Análisis y Optimización</h2>
                  <p className="text-gray-600">Mide y mejora el rendimiento de tus autorespondedores</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Métricas Clave a Monitorear</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">📊 Métricas de Alcance</h4>
                      <ul className="space-y-1 text-blue-800 text-sm">
                        <li>• <strong>Comentarios totales:</strong> Interacciones generadas</li>
                        <li>• <strong>Mensajes enviados:</strong> Autorespondedores activados</li>
                        <li>• <strong>Tasa de activación:</strong> % comentarios que activan el bot</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">💬 Métricas de Conversación</h4>
                      <ul className="space-y-1 text-green-800 text-sm">
                        <li>• <strong>Respuestas recibidas:</strong> Leads que respondieron</li>
                        <li>• <strong>Tasa de respuesta:</strong> % de DMs que obtienen respuesta</li>
                        <li>• <strong>Tiempo de respuesta:</strong> Velocidad de respuesta del lead</li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-2">🎯 Métricas de Conversión</h4>
                      <ul className="space-y-1 text-purple-800 text-sm">
                        <li>• <strong>Leads calificados:</strong> Prospectos con potencial real</li>
                        <li>• <strong>Citas agendadas:</strong> Calls o reuniones programadas</li>
                        <li>• <strong>Ventas cerradas:</strong> Conversiones finales</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 mb-2">⚡ Métricas de Eficiencia</h4>
                      <ul className="space-y-1 text-yellow-800 text-sm">
                        <li>• <strong>ROI del autorespondedor:</strong> Retorno de inversión</li>
                        <li>• <strong>Costo por lead:</strong> Inversión por prospecto generado</li>
                        <li>• <strong>Tiempo ahorrado:</strong> Horas de respuesta automatizadas</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Benchmarks de la Industria</h3>
                  
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">15-25%</div>
                        <div className="text-sm text-gray-600">Tasa de Respuesta Promedio</div>
                        <div className="text-xs text-gray-500 mt-1">De mensajes DM enviados</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">5-10%</div>
                        <div className="text-sm text-gray-600">Conversión a Lead Calificado</div>
                        <div className="text-xs text-gray-500 mt-1">De respuestas recibidas</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-2">2-5%</div>
                        <div className="text-sm text-gray-600">Conversión a Venta</div>
                        <div className="text-xs text-gray-500 mt-1">De leads calificados</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Estrategias de Optimización</h3>
                  
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">🔄 Pruebas A/B en Mensajes</h4>
                      <p className="text-gray-700 text-sm mb-2">
                        Crea dos versiones de tu mensaje y compara cuál tiene mejor tasa de respuesta.
                      </p>
                      <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                        <strong>Elementos a probar:</strong> Saludo, propuesta de valor, llamada a la acción, emojis
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">🎯 Refinamiento de Palabras Clave</h4>
                      <p className="text-gray-700 text-sm mb-2">
                        Analiza qué palabras clave generan mejores leads y ajusta tu estrategia.
                      </p>
                      <div className="bg-green-50 p-3 rounded text-sm text-green-800">
                        <strong>Indicadores:</strong> Palabras que generan más respuestas de calidad
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">⏰ Optimización de Horarios</h4>
                      <p className="text-gray-700 text-sm mb-2">
                        Identifica los horarios donde tus audiencia es más receptiva.
                      </p>
                      <div className="bg-purple-50 p-3 rounded text-sm text-purple-800">
                        <strong>Datos a revisar:</strong> Horarios con mayor tasa de respuesta por día de la semana
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Mejores Prácticas */}
          <TabsContent value="best-practices" className="space-y-6">
            <Card className="p-6 bg-white/90 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-gold-100 to-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Mejores Prácticas y Consejos Pro</h2>
                  <p className="text-gray-600">Estrategias avanzadas para maximizar resultados</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">🏆 Reglas de Oro</h3>
                  
                  <div className="grid gap-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">1. Siempre Ofrece Valor Primero</h4>
                      <p className="text-green-800 text-sm">
                        No vendas inmediatamente. Ofrece información útil, tips gratuitos o recursos 
                        que realmente ayuden a tu audiencia antes de promocionar tu producto.
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">2. Personaliza Cada Interacción</h4>
                      <p className="text-blue-800 text-sm">
                        Aunque uses autorespondedores, haz que cada mensaje se sienta personal. 
                        Usa el nombre de la persona cuando sea posible y adapta el tono a tu marca.
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-2">3. Cumple las Políticas de Instagram</h4>
                      <p className="text-purple-800 text-sm">
                        Respeta los límites de envío de mensajes, no hagas spam y asegúrate de 
                        que tu contenido cumple con las términos de servicio de Instagram.
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-900 mb-2">4. Mantén una Conversación Natural</h4>
                      <p className="text-orange-800 text-sm">
                        Después del mensaje automático, responde manualmente para crear una 
                        conversación auténtica y construir relación con el prospecto.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">🚀 Estrategias Avanzadas</h3>
                  
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Segmentación por Tipo de Contenido</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Crea diferentes autorespondedores según el tipo de post:
                      </p>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div className="bg-blue-50 p-3 rounded">
                          <strong className="text-blue-900">Posts Educativos:</strong>
                          <br/>Ofrece recursos adicionales, guías, o contenido relacionado
                        </div>
                        <div className="bg-green-50 p-3 rounded">
                          <strong className="text-green-900">Posts de Producto:</strong>
                          <br/>Información de precios, demos, o pruebas gratuitas
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                          <strong className="text-purple-900">Posts Inspiracionales:</strong>
                          <br/>Invitaciones a coaching, mentoría o consultas
                        </div>
                        <div className="bg-yellow-50 p-3 rounded">
                          <strong className="text-yellow-900">Posts de Resultados:</strong>
                          <br/>Case studies, testimonios, o historias de éxito
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Integración con Otras Herramientas</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Conecta tus autorespondedores con tu ecosistema de marketing:
                      </p>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>• <strong>CRM:</strong> Registra automáticamente nuevos leads</li>
                        <li>• <strong>Email Marketing:</strong> Agrega contacts a secuencias de email</li>
                        <li>• <strong>Calendarios:</strong> Incluye links para agendar calls automáticamente</li>
                        <li>• <strong>Landing Pages:</strong> Dirige a páginas específicas según el interés</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">⚠️ Errores Comunes a Evitar</h3>
                  
                  <div className="grid gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">❌ Mensajes Demasiado Promocionales</h4>
                      <p className="text-red-800 text-sm">
                        No empieces vendiendo inmediatamente. Construye rapport primero.
                      </p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">❌ No Responder Manualmente Después</h4>
                      <p className="text-red-800 text-sm">
                        El autorespondedor es solo el inicio. La conversión viene de la interacción humana.
                      </p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">❌ Usar el Mismo Mensaje Para Todo</h4>
                      <p className="text-red-800 text-sm">
                        Personaliza según el tipo de contenido y audiencia específica.
                      </p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">❌ No Monitorear ni Optimizar</h4>
                      <p className="text-red-800 text-sm">
                        Revisa métricas regularmente y ajusta estrategia según resultados.
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Star className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Consejo Final:</strong> Los autorespondedores más exitosos se sienten como 
                    conversaciones auténticas. Invierte tiempo en perfeccionar el tono y mensaje para 
                    que refleje genuinamente tu marca y personalidad.
                  </AlertDescription>
                </Alert>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Guides;
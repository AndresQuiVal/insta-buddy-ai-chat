import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Target, Users, Globe, Star, Sparkles, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ICPData {
  who: string;
  where: string;
  bait: string;
  result: string;
  searchKeywords: string[];
  bullseyeScore: number;
}

const ICPEditor: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [icpData, setIcpData] = useState<ICPData>({
    who: '',
    where: '',
    bait: '',
    result: '',
    searchKeywords: [],
    bullseyeScore: 0
  });

  useEffect(() => {
    loadICP();
    
    // SEO
    document.title = 'Editar Cliente Ideal (ICP) | Hower Assistant';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Edita y mejora la definición de tu cliente ideal para optimizar tus resultados de prospección.';
      document.head.appendChild(m);
    } else {
      metaDesc.setAttribute('content', 'Edita y mejora la definición de tu cliente ideal para optimizar tus resultados de prospección.');
    }
  }, []);

  const loadICP = async () => {
    try {
      setLoading(true);
      
      // Get Instagram user ID
      const instagramUserData = localStorage.getItem('hower-instagram-user');
      if (!instagramUserData) {
        toast({
          title: "Error",
          description: "No se encontró usuario de Instagram",
          variant: "destructive"
        });
        navigate('/tasks-to-do');
        return;
      }
      
      const instagramUser = JSON.parse(instagramUserData);
      const instagramUserId = instagramUser.instagram?.id || instagramUser.facebook?.id;
      
      if (!instagramUserId) {
        toast({
          title: "Error",
          description: "No se encontró ID de Instagram",
          variant: "destructive"
        });
        navigate('/tasks-to-do');
        return;
      }

      // Load ICP from database
      const { data, error } = await supabase
        .from('user_icp')
        .select('*')
        .eq('instagram_user_id', instagramUserId)
        .maybeSingle();

      if (error) {
        console.error('Error loading ICP:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el ICP",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        setIcpData({
          who: data.who_answer || '',
          where: data.where_answer || '',
          bait: data.bait_answer || '',
          result: data.result_answer || '',
          searchKeywords: data.search_keywords || [],
          bullseyeScore: data.bullseye_score || 0
        });
      } else {
        // No ICP found, redirect to onboarding
        toast({
          title: "ICP no encontrado",
          description: "Primero debes completar el onboarding",
          variant: "destructive"
        });
        navigate('/icp-onboarding');
      }

    } catch (error) {
      console.error('Error loading ICP:', error);
      toast({
        title: "Error",
        description: "Error al cargar el ICP",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeICP = async (): Promise<{ score: number; searchKeywords: string[] }> => {
    const fullDescription = `
WHO: ${icpData.who}
WHERE: ${icpData.where}
BAIT: ${icpData.bait}
RESULT: ${icpData.result}
    `.trim();

    try {
      const { data, error } = await supabase.functions.invoke('chatgpt-response', {
        body: {
          prompt: `Analiza esta descripción de cliente ideal y evalúa qué tan completa está según estos 4 bloques:

WHO (¿Quién es?): edad, género, situación actual, problema principal, ubicación geográfica
WHERE (¿Qué recursos digitales consume?): INCLUYE cualquier mención de: influencers/cuentas que siguen (ej: @usuario), hashtags, grupos/comunidades, podcasts, blogs/websites, páginas que consumen, recursos digitales que leen/ven
BAIT (¿Qué los atrae?): qué hook, historia, testimonio u oferta irresistible los engancharía para detenerse y prestar atención  
RESULT (¿Qué resultado buscan?): qué transformación específica y medible quieren lograr. BUSCA frases como "resultado deseado", "objetivo", "meta", "quiere lograr", "busca", "desea", "aspira"

IMPORTANTE PARA RESULT: Si el texto menciona explícitamente "resultado deseado", "El resultado deseado de mi ICP es", "quiere lograr", "objetivo", "meta", etc. entonces RESULT está COMPLETO.

IMPORTANTE: Si mencionan "blogs", "páginas", "cuentas como @...", "consumen", "siguen", etc. CUENTA como WHERE completo.

Descripción a analizar: "${fullDescription}"

Responde en formato JSON exactamente así:
{
  "score": [número del 0-4 según cuántos bloques están completos],
  "completedBlocks": ["WHO", "WHERE", "BAIT", "RESULT"] [solo los que están completos],
  "missingBlocks": ["WHO", "WHERE", "BAIT", "RESULT"] [solo los que faltan],
  "suggestions": ["sugerencia 1", "sugerencia 2"] [IMPORTANTE: Cada sugerencia debe ser SÚPER FÁCIL de entender, como si le explicaras a un niño de 5 años qué debe hacer. Usa palabras simples y da ejemplos concretos. En lugar de decir "Definir ubicación geográfica" di "Escribe en qué ciudad vive tu cliente ideal". En lugar de "Identificar recursos digitales" di "¿Qué páginas de Instagram o YouTube ve tu cliente?". Máximo 3 sugerencias muy simples.],
  "searchKeywords": ["frase1", "frase2", "frase3", "frase4", "frase5"] [solo si score es 4, genera 8-10 frases de 2-4 palabras para buscar en Instagram/Google cuentas que tengan seguidores similares al ICP. Ejemplos: "coaching empresarial", "madre emprendedora", "fitness mujeres", "inversión Bitcoin", "motivación personal"]
}`
        },
      });

      if (error) throw error;

      const response = data?.response;
      let parsedResult;
      
      if (typeof response === 'string') {
        parsedResult = JSON.parse(response);
      } else if (typeof response === 'object') {
        parsedResult = response;
      } else {
        throw new Error('Formato de respuesta inválido');
      }

      return {
        score: parsedResult.score || 0,
        searchKeywords: parsedResult.searchKeywords || []
      };
    } catch (error) {
      console.error('Error analyzing ICP:', error);
      return { score: 0, searchKeywords: [] };
    }
  };

  const handleSaveICP = async () => {
    try {
      setSaving(true);
      
      // Get Instagram user ID
      const instagramUserData = localStorage.getItem('hower-instagram-user');
      if (!instagramUserData) {
        throw new Error('No se encontró usuario de Instagram');
      }
      
      const instagramUser = JSON.parse(instagramUserData);
      const instagramUserId = instagramUser.instagram?.id || instagramUser.facebook?.id;
      
      if (!instagramUserId) {
        throw new Error('No se encontró ID de Instagram');
      }

      // Analyze ICP to get score and keywords
      setAnalyzing(true);
      const { score, searchKeywords } = await analyzeICP();
      setAnalyzing(false);
      
      // Update ICP in database
      const { error } = await supabase
        .from('user_icp')
        .upsert({
          instagram_user_id: instagramUserId,
          who_answer: icpData.who,
          where_answer: icpData.where,
          bait_answer: icpData.bait,
          result_answer: icpData.result,
          search_keywords: searchKeywords,
          bullseye_score: score,
          is_complete: score === 4
        });

      if (error) throw error;

      // Update local state
      setIcpData(prev => ({
        ...prev,
        searchKeywords,
        bullseyeScore: score
      }));

      toast({
        title: score === 4 ? "🎯 ¡BULLSEYE!" : "✅ ICP Actualizado",
        description: score === 4 ? 
          "ICP perfecto. Palabras clave regeneradas." :
          `ICP actualizado (${score}/4). ${score < 4 ? 'Sigue completando para desbloquear palabras clave.' : ''}`
      });
      
    } catch (error) {
      console.error('Error saving ICP:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el ICP. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
      setAnalyzing(false);
    }
  };

  const handleInputChange = (key: keyof Omit<ICPData, 'searchKeywords' | 'bullseyeScore'>, value: string) => {
    setIcpData(prev => ({ ...prev, [key]: value }));
  };

  const getBullseyeStatus = (score: number) => {
    if (score === 4) return { 
      label: '🎯 BULLSEYE', 
      color: 'bg-green-500', 
      description: 'ICP perfectamente definido' 
    };
    if (score >= 2) return { 
      label: '⚡ INTERMEDIO', 
      color: 'bg-yellow-500', 
      description: 'ICP parcialmente definido' 
    };
    return { 
      label: '🔴 BÁSICO', 
      color: 'bg-red-500', 
      description: 'ICP necesita más definición' 
    };
  };

  const questions = [
    {
      id: 'who',
      title: '¿QUIÉN es tu cliente ideal?',
      placeholder: 'Describe edad, género, situación actual, problema principal, ubicación geográfica...',
      icon: Users,
      key: 'who' as keyof Omit<ICPData, 'searchKeywords' | 'bullseyeScore'>
    },
    {
      id: 'where',
      title: '¿DÓNDE consume contenido tu cliente ideal?',
      placeholder: 'Cuentas que sigue (@usuario), hashtags, grupos, podcasts, blogs, páginas...',
      icon: Globe,
      key: 'where' as keyof Omit<ICPData, 'searchKeywords' | 'bullseyeScore'>
    },
    {
      id: 'bait',
      title: '¿QUÉ los atrae y capta su atención?',
      placeholder: 'Hooks, historias, testimonios, ofertas irresistibles...',
      icon: Star,
      key: 'bait' as keyof Omit<ICPData, 'searchKeywords' | 'bullseyeScore'>
    },
    {
      id: 'result',
      title: '¿QUÉ resultado buscan obtener?',
      placeholder: 'Transformación específica y medible que desean lograr. Usa frases como "El resultado deseado es..."',
      icon: Target,
      key: 'result' as keyof Omit<ICPData, 'searchKeywords' | 'bullseyeScore'>
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando ICP...</p>
        </div>
      </div>
    );
  }

  const bullseyeStatus = getBullseyeStatus(icpData.bullseyeScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/tasks-to-do')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Editar Cliente Ideal (ICP)</h1>
              <p className="text-muted-foreground">Mejora tu ICP para obtener mejores resultados</p>
            </div>
          </div>
          
          <div className="text-center">
            <Badge className={`${bullseyeStatus.color} text-white mb-2`}>
              {bullseyeStatus.label}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {bullseyeStatus.description}
            </p>
          </div>
        </div>

        {/* ICP Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card key={question.id} className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {React.createElement(question.icon, { className: "h-5 w-5 text-primary" })}
                  </div>
                  {question.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={question.placeholder}
                  value={icpData[question.key]}
                  onChange={(e) => handleInputChange(question.key, e.target.value)}
                  className="min-h-[120px] text-base"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Keywords */}
        {icpData.searchKeywords.length > 0 && (
          <Card className="shadow-lg mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-green-600" />
                </div>
                Palabras Clave de Búsqueda
              </CardTitle>
              <p className="text-muted-foreground">
                Estas palabras clave se generaron automáticamente para tu ICP
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {icpData.searchKeywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-center mt-8">
          <Button
            onClick={handleSaveICP}
            disabled={saving || analyzing}
            size="lg"
            className="flex items-center gap-2 text-lg px-8"
          >
            {saving || analyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {analyzing ? 'Analizando...' : 'Guardando...'}
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Guardar ICP
              </>
            )}
          </Button>
        </div>

        {/* Info Message */}
        {icpData.bullseyeScore < 4 && (
          <Card className="mt-6 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    ICP Incompleto ({icpData.bullseyeScore}/4)
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Completa las respuestas para alcanzar BULLSEYE y desbloquear las palabras clave de búsqueda automática.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ICPEditor;
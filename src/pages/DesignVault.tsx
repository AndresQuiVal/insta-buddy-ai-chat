import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HowerSimpleDesign } from '@/components/ui/hower-simple-design';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  RefreshCw, 
  Heart, 
  Plus, 
  Download, 
  Eye,
  Code,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DesignVault = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (code: string, componentName: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(componentName);
      toast({
        title: "¡Código copiado!",
        description: `El código de ${componentName} se ha copiado al portapapeles`,
      });
      
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el código",
        variant: "destructive",
      });
    }
  };

  const howerSimpleDesignCode = `import { HowerSimpleDesign } from '@/components/ui/hower-simple-design';
import { Search } from 'lucide-react';

// Uso básico
<HowerSimpleDesign>
  <Search />
</HowerSimpleDesign>

// Con diferentes tamaños y variantes
<HowerSimpleDesign size="sm" variant="outline">
  <Plus />
</HowerSimpleDesign>

<HowerSimpleDesign size="lg" variant="secondary">
  <RefreshCw />
</HowerSimpleDesign>`;

  const designComponents = [
    {
      id: 'hower-simple-design',
      name: 'HowerSimpleDesign',
      description: 'Botón circular con icono, perfecto para acciones principales con estilo minimalista',
      category: 'Buttons',
      tags: ['circular', 'icon', 'primary', 'search'],
      component: (
        <div className="flex items-center gap-3">
          <HowerSimpleDesign size="sm">
            <Search />
          </HowerSimpleDesign>
          <HowerSimpleDesign>
            <Search />
          </HowerSimpleDesign>
          <HowerSimpleDesign size="lg">
            <Search />
          </HowerSimpleDesign>
          <HowerSimpleDesign size="xl" variant="secondary">
            <RefreshCw />
          </HowerSimpleDesign>
        </div>
      ),
      code: howerSimpleDesignCode,
      variants: ['default', 'secondary', 'outline', 'ghost'],
      sizes: ['sm', 'default', 'lg', 'xl']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Baúl de Diseños
          </h1>
          <p className="text-slate-600 text-lg">
            Colección de componentes de diseño reutilizables para Hower
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                  <Code className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{designComponents.length}</p>
                  <p className="text-sm text-slate-600">Componentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Eye className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">1</p>
                  <p className="text-sm text-slate-600">Categorías</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">100%</p>
                  <p className="text-sm text-slate-600">Calidad</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Download className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">∞</p>
                  <p className="text-sm text-slate-600">Usos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Design Components */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="buttons">Botones</TabsTrigger>
            <TabsTrigger value="forms">Formularios</TabsTrigger>
            <TabsTrigger value="navigation">Navegación</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {designComponents.map((component) => (
                <Card key={component.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-800">
                          {component.name}
                        </CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          {component.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {component.category}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-3">
                      {component.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Component Preview */}
                    <div className="bg-slate-50 rounded-lg p-6 flex items-center justify-center min-h-[100px]">
                      {component.component}
                    </div>

                    {/* Variants & Sizes Info */}
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-slate-700 mb-1">Variantes:</p>
                        <div className="flex flex-wrap gap-1">
                          {component.variants.map((variant) => (
                            <Badge key={variant} variant="outline" className="text-xs">
                              {variant}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium text-slate-700 mb-1">Tamaños:</p>
                        <div className="flex flex-wrap gap-1">
                          {component.sizes.map((size) => (
                            <Badge key={size} variant="outline" className="text-xs">
                              {size}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => copyToClipboard(component.code, component.name)}
                      >
                        {copiedCode === component.name ? (
                          <>
                            <Check className="h-3 w-3 mr-2" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-2" />
                            Copiar código
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="buttons">
            <div className="text-center py-12">
              <p className="text-slate-600">Componentes de botones aparecerán aquí</p>
            </div>
          </TabsContent>

          <TabsContent value="forms">
            <div className="text-center py-12">
              <p className="text-slate-600">Componentes de formularios aparecerán aquí</p>
            </div>
          </TabsContent>

          <TabsContent value="navigation">
            <div className="text-center py-12">
              <p className="text-slate-600">Componentes de navegación aparecerán aquí</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DesignVault;
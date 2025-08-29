import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Users, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ open, onOpenChange }) => {
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [format, setFormat] = useState<string>('');
  const [includeNumbers, setIncludeNumbers] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const sections = [
    {
      id: 'new_prospects_posts',
      label: 'Gente que comentó un post',
      icon: MessageCircle,
      description: 'Prospectos de posts con comentarios'
    },
    {
      id: 'new_prospects_accounts',
      label: 'Gente que sigue una cuenta',
      icon: Users,
      description: 'Prospectos de seguidores de cuentas'
    }
  ];

  const formats = [
    { value: 'csv', label: 'CSV (.csv)', description: 'Compatible con Excel y Google Sheets' },
    { value: 'json', label: 'JSON (.json)', description: 'Formato de datos estructurados' }
  ];

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const generateCSV = (data: any[], headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    return csvContent;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (selectedSections.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos una sección para exportar",
        variant: "destructive",
      });
      return;
    }

    if (!format) {
      toast({
        title: "Error",
        description: "Selecciona un formato de archivo",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      let allData: any[] = [];
      let filename = `hower_export_${new Date().toISOString().split('T')[0]}`;

      // Exportar nuevos prospectos (posts)
      if (selectedSections.includes('new_prospects_posts')) {
        const { data: postsData } = await supabase
          .from('prospect_search_results')
          .select('title, description, instagram_url, comments_count, is_recent, created_at')
          .eq('result_type', 'post')
          .order('created_at', { ascending: false });

        if (postsData) {
          const processedData = postsData.map((item: any) => ({
            tipo: 'Comentó un post',
            titulo: item.title,
            descripcion: item.description,
            url_instagram: item.instagram_url,
            comentarios: item.comments_count,
            es_reciente: item.is_recent ? 'Sí' : 'No',
            fecha_creacion: new Date(item.created_at).toLocaleDateString('es-ES'),
            ...(includeNumbers && { contacto: 'Pendiente' })
          }));
          allData.push(...processedData);
        }
      }

      // Exportar nuevos prospectos (accounts)
      if (selectedSections.includes('new_prospects_accounts')) {
        const { data: accountsData } = await supabase
          .from('prospect_search_results')
          .select('title, description, instagram_url, created_at')
          .eq('result_type', 'account')
          .order('created_at', { ascending: false });

        if (accountsData) {
          const processedData = accountsData.map((item: any) => ({
            tipo: 'Sigue una cuenta',
            titulo: item.title,
            descripcion: item.description,
            url_instagram: item.instagram_url,
            comentarios: '',
            es_reciente: '',
            fecha_creacion: new Date(item.created_at).toLocaleDateString('es-ES'),
            ...(includeNumbers && { contacto: 'Pendiente' })
          }));
          allData.push(...processedData);
        }
      }

      if (allData.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay datos para exportar en las secciones seleccionadas",
          variant: "destructive",
        });
        return;
      }

      // Definir headers
      const headers = [
        'tipo',
        'titulo', 
        'descripcion',
        'url_instagram',
        'comentarios',
        'es_reciente',
        'fecha_creacion'
      ];

      if (includeNumbers) {
        headers.push('contacto');
      }

      // Generar archivo según formato
      if (format === 'csv') {
        const csvContent = generateCSV(allData, headers);
        downloadFile(csvContent, `${filename}.csv`, 'text/csv');
      } else if (format === 'json') {
        const jsonContent = JSON.stringify(allData, null, 2);
        downloadFile(jsonContent, `${filename}.json`, 'application/json');
      }

      toast({
        title: "Exportación exitosa",
        description: `Se han exportado ${allData.length} registros`,
      });

      onOpenChange(false);
      setSelectedSections([]);
      setFormat('');
      setIncludeNumbers(false);

    } catch (error) {
      console.error('Error al exportar:', error);
      toast({
        title: "Error",
        description: "Error al exportar los datos",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Datos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selección de secciones */}
          <div>
            <h3 className="text-lg font-semibold mb-3">¿Qué deseas exportar?</h3>
            <div className="space-y-3">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <Card key={section.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSectionToggle(section.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedSections.includes(section.id)}
                          onCheckedChange={() => handleSectionToggle(section.id)}
                        />
                        <Icon className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium">{section.label}</div>
                          <div className="text-sm text-muted-foreground">{section.description}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Selección de formato */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Formato de archivo</h3>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un formato" />
              </SelectTrigger>
              <SelectContent>
                {formats.map((fmt) => (
                  <SelectItem key={fmt.value} value={fmt.value}>
                    <div>
                      <div className="font-medium">{fmt.label}</div>
                      <div className="text-sm text-muted-foreground">{fmt.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opción de incluir números */}
          <div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={includeNumbers}
                onCheckedChange={(checked) => setIncludeNumbers(checked === true)}
              />
              <div>
                <label className="text-sm font-medium">Incluir números de contacto</label>
                <p className="text-xs text-muted-foreground">
                  Incluye números de teléfono disponibles en la exportación
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedSections.length === 0 || !format}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Exportar'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
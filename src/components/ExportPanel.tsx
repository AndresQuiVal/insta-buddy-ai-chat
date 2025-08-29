import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Database, Users, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';

const ExportPanel = () => {
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<string>('');
  const [includeNumbers, setIncludeNumbers] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();

  const availableSections = [
    {
      id: 'new_prospects_posts',
      label: 'Gente que comentó un post',
      description: 'Usuarios que han comentado en posts específicos',
      icon: MessageSquare
    },
    {
      id: 'new_prospects_accounts',
      label: 'Gente que sigue una cuenta',
      description: 'Usuarios que siguen cuentas específicas',
      icon: Users
    }
  ];

  const exportFormats = [
    { value: 'csv', label: 'CSV (.csv)', description: 'Archivo de valores separados por comas' },
    { value: 'xlsx', label: 'Excel (.xlsx)', description: 'Archivo de Microsoft Excel' },
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
      ...data.map(row =>
        headers.map(header =>
          typeof row[header] === 'string' && row[header].includes(',')
            ? `"${row[header].replace(/"/g, '""')}"`
            : row[header] || ''
        ).join(',')
      )
    ].join('\n');
    return csvContent;
  };

  const generateExcel = async (data: any[], headers: string[]) => {
    // For now, we'll use a simple CSV-like format for Excel
    // In a real implementation, you'd use a library like xlsx
    return generateCSV(data, headers);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!selectedSections.length) {
      toast({
        title: "Error",
        description: "Selecciona al menos una sección para exportar.",
        variant: "destructive",
      });
      return;
    }

    if (!exportFormat) {
      toast({
        title: "Error",
        description: "Selecciona un formato de archivo.",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser?.instagram_user_id) {
      toast({
        title: "Error",
        description: "No se encontró usuario de Instagram activo.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      let allData: any[] = [];
      let exportName = '';

      for (const sectionId of selectedSections) {
        let query = supabase
          .from('prospect_search_results')
          .select('*')
          .eq('instagram_user_id', currentUser.instagram_user_id);

        if (sectionId === 'new_prospects_posts') {
          query = query.not('post_url', 'is', null);
          exportName += exportName ? '_posts' : 'posts';
        } else if (sectionId === 'new_prospects_accounts') {
          query = query.is('post_url', null);
          exportName += exportName ? '_accounts' : 'accounts';
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching data:', error);
          continue;
        }

        if (data) {
          allData = [...allData, ...data];
        }
      }

      if (allData.length === 0) {
        toast({
          title: "Sin datos",
          description: "No se encontraron datos para exportar en las secciones seleccionadas.",
          variant: "destructive",
        });
        return;
      }

      // Prepare headers
      const baseHeaders = ['username', 'full_name', 'is_verified', 'follower_count', 'following_count', 'media_count', 'post_url', 'search_type', 'created_at'];
      const headers = includeNumbers ? [...baseHeaders, 'contacto'] : baseHeaders;

      // Add contact column if requested
      if (includeNumbers) {
        allData.forEach(item => {
          item.contacto = 'Pendiente'; // Placeholder for future phone number integration
        });
      }

      // Generate file content based on format
      let content: string;
      let mimeType: string;
      let fileExtension: string;

      switch (exportFormat) {
        case 'csv':
          content = generateCSV(allData, headers);
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;
        case 'xlsx':
          content = await generateExcel(allData, headers);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileExtension = 'xlsx';
          break;
        case 'json':
          const filteredData = allData.map(item => {
            const filtered: any = {};
            headers.forEach(header => {
              filtered[header] = item[header];
            });
            return filtered;
          });
          content = JSON.stringify(filteredData, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
          break;
        default:
          throw new Error('Formato no soportado');
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `prospects_${exportName}_${timestamp}.${fileExtension}`;

      // Download file
      downloadFile(content, filename, mimeType);

      toast({
        title: "Exportación completada",
        description: `Se han exportado ${allData.length} registros en formato ${exportFormat.toUpperCase()}.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error en la exportación",
        description: "Hubo un problema al exportar los datos. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Exportar Datos
        </CardTitle>
        <CardDescription>
          Exporta tus datos de prospección en diferentes formatos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Secciones a exportar */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">¿Qué datos deseas exportar?</h3>
          <div className="grid gap-3">
            {availableSections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={section.id}
                    checked={selectedSections.includes(section.id)}
                    onCheckedChange={() => handleSectionToggle(section.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <label 
                        htmlFor={section.id} 
                        className="font-medium cursor-pointer"
                      >
                        {section.label}
                      </label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {section.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Formato de archivo */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Formato del archivo</h3>
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un formato" />
            </SelectTrigger>
            <SelectContent>
              {exportFormats.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{format.label}</div>
                      <div className="text-sm text-muted-foreground">{format.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Incluir números */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-numbers"
              checked={includeNumbers}
              onCheckedChange={(checked) => setIncludeNumbers(checked === true)}
            />
            <label 
              htmlFor="include-numbers" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Incluir números de contacto
            </label>
          </div>
          <p className="text-sm text-muted-foreground">
            Agrega una columna con los números de teléfono de los prospectos (cuando estén disponibles)
          </p>
        </div>

        {/* Botón de exportar */}
        <Button
          onClick={handleExport}
          disabled={!selectedSections.length || !exportFormat || isExporting}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exportando...' : 'Exportar Datos'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExportPanel;
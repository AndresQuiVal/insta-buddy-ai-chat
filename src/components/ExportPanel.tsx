import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Users, Clock, MessageSquare, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';

const ExportPanel = () => {
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();

  const availableSections = [
    {
      id: 'prospectos_pendientes',
      label: 'Prospectos pendientes',
      description: 'Prospectos esperando respuesta',
      icon: Clock
    },
    {
      id: 'prospectos_seguimiento',
      label: 'Prospectos en seguimiento',
      description: 'Prospectos con seguimientos programados',
      icon: Users
    },
    {
      id: 'nuevos_prospectos_posts',
      label: 'Gente que comentó un post',
      description: 'Nuevos prospectos encontrados en comentarios de posts',
      icon: MessageSquare,
      isSubcategory: true
    },
    {
      id: 'nuevos_prospectos_accounts',
      label: 'Gente que sigue a una cuenta',
      description: 'Nuevos prospectos que siguen cuentas específicas',
      icon: UserPlus,
      isSubcategory: true
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
        description: "Selecciona al menos una categoría para exportar.",
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
        let sectionData: any[] = [];
        
        if (sectionId === 'prospectos_pendientes') {
          try {
            const { data, error } = await supabase
              .from('prospects')
              .select('username, prospect_instagram_id, status, followers_count, biography, created_at')
              .eq('instagram_user_id', currentUser.instagram_user_id)
              .eq('status', 'esperando_respuesta');
            
            if (!error && data) {
              sectionData = data.map(item => ({ ...item, categoria: 'Prospectos Pendientes' }));
              exportName += exportName ? '_pendientes' : 'pendientes';
            }
          } catch (err) {
            console.error('Error fetching pending prospects:', err);
          }
        } 
        else if (sectionId === 'prospectos_seguimiento') {
          try {
            // Buscar followups por instagram_user_id indirectamente
            const { data: prospects } = await supabase
              .from('prospects')
              .select('prospect_instagram_id')
              .eq('instagram_user_id', currentUser.instagram_user_id);
            
            if (prospects && prospects.length > 0) {
              const prospectIds = prospects.map(p => p.prospect_instagram_id);
              
              const { data, error } = await supabase
                .from('autoresponder_followups')
                .select('sender_id, followup_message_text, followup_scheduled_at, is_completed, created_at')
                .in('sender_id', prospectIds)
                .eq('is_completed', false);
              
              if (!error && data) {
                sectionData = data.map(item => ({ ...item, categoria: 'Prospectos en Seguimiento' }));
                exportName += exportName ? '_seguimiento' : 'seguimiento';
              }
            }
          } catch (err) {
            console.error('Error fetching followup prospects:', err);
          }
        }
        else if (sectionId === 'nuevos_prospectos_posts') {
          try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const { data, error } = await supabase
              .from('prospects')
              .select('username, prospect_instagram_id, followers_count, biography, created_at')
              .eq('instagram_user_id', currentUser.instagram_user_id)
              .gte('created_at', thirtyDaysAgo.toISOString())
              .limit(100);
            
            if (!error && data) {
              sectionData = data.map(item => ({ ...item, categoria: 'Nuevos Prospectos - Posts' }));
              exportName += exportName ? '_posts' : 'posts';
            }
          } catch (err) {
            console.error('Error fetching new prospects posts:', err);
          }
        }
        else if (sectionId === 'nuevos_prospectos_accounts') {
          try {
            const { data, error } = await supabase
              .from('prospect_search_results')
              .select('instagram_url, title, description, created_at, search_keywords')
              .eq('instagram_user_id', currentUser.instagram_user_id)
              .eq('result_type', 'account')
              .limit(100);
            
            if (!error && data) {
              sectionData = data.map(item => ({ ...item, categoria: 'Nuevos Prospectos - Accounts' }));
              exportName += exportName ? '_accounts' : 'accounts';
            }
          } catch (err) {
            console.error('Error fetching new prospects accounts:', err);
          }
        }

        if (sectionData.length > 0) {
          allData = [...allData, ...sectionData];
        }
      }

      if (allData.length === 0) {
        toast({
          title: "Sin datos",
          description: "No se encontraron datos para exportar en las categorías seleccionadas.",
          variant: "destructive",
        });
        return;
      }

      // Prepare headers based on data type
      let headers: string[] = [];
      if (allData.length > 0) {
        const firstItem = allData[0];
        headers = Object.keys(firstItem).filter(key => 
          !['id', 'created_at', 'updated_at', 'raw_data', 'analysis_data'].includes(key)
        );
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
      const filename = `prospectos_${exportName}_${timestamp}.${fileExtension}`;

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
        {/* Categorías a exportar */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">¿Qué datos deseas exportar?</h3>
          <div className="space-y-3">
            {/* Prospectos principales */}
            <div className="space-y-3">
              {availableSections.filter(section => !section.isSubcategory).map((section) => {
                const Icon = section.icon;
                return (
                  <div
                    key={section.id}
                    className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
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
            
            {/* Nuevos Prospectos - Subcategorías */}
            <div className="border rounded-lg p-4 bg-muted/20">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Nuevos Prospectos
              </h4>
              <div className="space-y-3 ml-6">
                {availableSections.filter(section => section.isSubcategory).map((section) => {
                  const Icon = section.icon;
                  return (
                    <div
                      key={section.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors bg-white"
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
                            className="font-medium cursor-pointer text-sm"
                          >
                            {section.label}
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
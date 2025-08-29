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
    if (data.length === 0) return '';
    
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          let value;
          
          // Mapear headers a las propiedades correctas del objeto
          switch (header) {
            case 'Usuario':
              value = row.username;
              break;
            case '¿Envié el último mensaje?':
              value = row.envie_ultimo_mensaje;
              break;
            case 'Fecha de último mensaje':
              value = row.fecha_ultimo_mensaje;
              break;
            case 'Categoría':
              value = row.categoria;
              break;
            default:
              value = row[header];
          }
          
          if (value === null || value === undefined) return '';
          
          // Formatear fecha si es necesario
          if (header === 'Fecha de último mensaje' && value) {
            try {
              const date = new Date(value);
              value = date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES');
            } catch (e) {
              // Mantener valor original si no se puede formatear
            }
          }
          
          // Manejar strings con comas
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          
          return value;
        }).join(',')
      )
    ].join('\n');
    return csvContent;
  };

  const generateExcel = async (data: any[], headers: string[]) => {
    // Para Excel usamos el mismo formato CSV optimizado
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
            // Prospectos que están esperando respuesta (estado = esperando_respuesta)
            const { data, error } = await supabase
              .from('prospects')
              .select('username, last_message_from_prospect, last_message_date, status')
              .eq('instagram_user_id', currentUser.instagram_user_id)
              .eq('status', 'esperando_respuesta');
            
            if (!error && data && data.length > 0) {
              sectionData = data.map(item => ({
                username: item.username,
                envie_ultimo_mensaje: item.last_message_from_prospect ? 'No' : 'Sí',
                fecha_ultimo_mensaje: item.last_message_date,
                categoria: 'Prospectos Pendientes'
              }));
              exportName += exportName ? '_pendientes' : 'pendientes';
            }
          } catch (err) {
            console.error('Error fetching pending prospects:', err);
          }
        } 
        else if (sectionId === 'prospectos_seguimiento') {
          try {
            // Primero obtener los followups pendientes
            const { data: followups, error: followupsError } = await supabase
              .from('autoresponder_followups')
              .select('sender_id, followup_scheduled_at, is_completed')
              .eq('is_completed', false);
            
            if (!followupsError && followups && followups.length > 0) {
              const senderIds = followups.map(f => f.sender_id);
              
              // Luego obtener los prospectos correspondientes
              const { data: prospects, error: prospectsError } = await supabase
                .from('prospects')
                .select('username, last_message_from_prospect, last_message_date, prospect_instagram_id')
                .eq('instagram_user_id', currentUser.instagram_user_id)
                .in('prospect_instagram_id', senderIds);
              
              if (!prospectsError && prospects && prospects.length > 0) {
                sectionData = prospects.map(item => ({
                  username: item.username,
                  envie_ultimo_mensaje: item.last_message_from_prospect ? 'No' : 'Sí',
                  fecha_ultimo_mensaje: item.last_message_date,
                  categoria: 'Prospectos en Seguimiento'
                }));
                exportName += exportName ? '_seguimiento' : 'seguimiento';
              }
            }
          } catch (err) {
            console.error('Error fetching followup prospects:', err);
          }
        }
        else if (sectionId === 'nuevos_prospectos_posts') {
          try {
            // Nuevos prospectos de posts (de prospect_search_results)
            const { data, error } = await supabase
              .from('prospect_search_results')
              .select('title, description, instagram_url, created_at')
              .eq('instagram_user_id', currentUser.instagram_user_id)
              .eq('result_type', 'post')
              .limit(100);
            
            if (!error && data && data.length > 0) {
              sectionData = data.map(item => ({
                username: item.title || 'Sin username',
                envie_ultimo_mensaje: 'No',  // Para nuevos prospectos siempre es 'No'
                fecha_ultimo_mensaje: item.created_at,
                categoria: 'Nuevos Prospectos - Posts'
              }));
              exportName += exportName ? '_posts' : 'posts';
            }
          } catch (err) {
            console.error('Error fetching new prospects posts:', err);
          }
        }
        else if (sectionId === 'nuevos_prospectos_accounts') {
          try {
            // Nuevos prospectos de cuentas
            const { data, error } = await supabase
              .from('prospect_search_results')
              .select('title, description, instagram_url, created_at')
              .eq('instagram_user_id', currentUser.instagram_user_id)
              .eq('result_type', 'account')
              .limit(100);
            
            if (!error && data && data.length > 0) {
              sectionData = data.map(item => ({
                username: item.title || 'Sin username',
                envie_ultimo_mensaje: 'No',  // Para nuevos prospectos siempre es 'No'
                fecha_ultimo_mensaje: item.created_at,
                categoria: 'Nuevos Prospectos - Accounts'
              }));
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

      // Headers específicos que solicitas
      const headers = ['Usuario', '¿Envié el último mensaje?', 'Fecha de último mensaje', 'Categoría'];

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
          // Para JSON usar las keys en español directamente
          const jsonData = allData.map(item => ({
            'Usuario': item.username,
            '¿Envié el último mensaje?': item.envie_ultimo_mensaje,
            'Fecha de último mensaje': item.fecha_ultimo_mensaje,
            'Categoría': item.categoria
          }));
          
          content = JSON.stringify(jsonData, null, 2);
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
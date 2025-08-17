import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RefreshCw, User, CheckCircle, Clock } from 'lucide-react';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProspectTask {
  id: string;
  prospect_sender_id: string;
  is_completed: boolean;
  completed_at?: string;
  last_message_type?: string;
  updated_at: string;
  // Datos del prospecto (desde instagram_messages)
  prospect_username?: string;
  last_message_date?: string;
}

const ProspectTaskList = () => {
  const [tasks, setTasks] = useState<ProspectTask[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useInstagramUsers();
  const { toast } = useToast();

  // Cargar tareas de prospectos
  const loadTasks = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      console.log('🔄 Cargando tareas de prospectos...');

      // Consulta optimizada para obtener tareas con información del prospecto
      const { data: tasks, error } = await supabase
        .from('prospect_task_status')
        .select(`
          id,
          prospect_sender_id,
          is_completed,
          completed_at,
          last_message_type,
          updated_at
        `)
        .eq('instagram_user_id', currentUser.instagram_user_id)
        .eq('task_type', 'pending')
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ Error cargando tareas:', error);
        throw error;
      }

      if (!tasks || tasks.length === 0) {
        console.log('ℹ️ No se encontraron tareas');
        setTasks([]);
        return;
      }

      // Obtener información adicional de los prospectos desde instagram_messages
      const prospectIds = tasks.map(t => t.prospect_sender_id);
      const { data: messages, error: messagesError } = await supabase
        .from('instagram_messages')
        .select(`
          sender_id,
          message_text,
          timestamp,
          message_type
        `)
        .in('sender_id', prospectIds)
        .eq('message_type', 'received')
        .order('timestamp', { ascending: false });

      if (messagesError) {
        console.error('❌ Error cargando mensajes:', messagesError);
      }

      // Combinar datos
      const enrichedTasks: ProspectTask[] = tasks.map(task => {
        const latestMessage = messages?.find(m => m.sender_id === task.prospect_sender_id);
        return {
          ...task,
          prospect_username: `user_${task.prospect_sender_id.slice(-8)}`,
          last_message_date: latestMessage?.timestamp,
        };
      });

      setTasks(enrichedTasks);
      console.log('✅ Tareas cargadas:', enrichedTasks.length);

    } catch (error) {
      console.error('💥 Error cargando tareas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas de prospectos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Configurar suscripción en tiempo real
  useEffect(() => {
    if (!currentUser) return;

    loadTasks();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('prospect-task-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'prospect_task_status',
          filter: `instagram_user_id=eq.${currentUser.instagram_user_id}`
        },
        (payload) => {
          console.log('🔄 Cambio detectado en prospect_task_status:', payload);
          
          // Recargar datos cuando hay cambios
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Componente de tarjeta de tarea
  const TaskCard = ({ task }: { task: ProspectTask }) => (
    <Card 
      className={`mb-3 transition-all duration-300 ${
        task.is_completed 
          ? 'opacity-50 line-through bg-gray-50 border-green-200' 
          : 'hover:shadow-md border-l-4 border-l-primary/20'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
              {task.prospect_username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className={`font-semibold text-sm truncate ${task.is_completed ? 'line-through' : ''}`}>
                @{task.prospect_username}
              </h4>
              <div className="flex items-center gap-2">
                {task.is_completed ? (
                  <Badge variant="outline" className="text-xs text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Respondido
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-orange-600">
                    <Clock className="w-3 h-3 mr-1" />
                    Pendiente
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {task.last_message_date 
                ? format(new Date(task.last_message_date), 'dd MMM, HH:mm', { locale: es })
                : format(new Date(task.updated_at), 'dd MMM, HH:mm', { locale: es })
              }
            </div>
            
            {task.last_message_type && (
              <div className="mt-1 text-xs text-gray-400">
                Último: {task.last_message_type === 'sent' ? 'Tú enviaste' : 'Te escribieron'}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!currentUser) {
    return (
      <Card className="p-8 text-center">
        <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No hay usuario de Instagram autenticado</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-6 h-6" />
            Tareas de Prospectos
          </h1>
          <p className="text-gray-600">
            {tasks.length} tareas • @{currentUser.username}
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={loadTasks}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Lista de tareas */}
      <Card className="rounded-xl">
        <CardHeader className="bg-gradient-to-r from-purple-400 to-purple-500 rounded-t-xl">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Clock className="w-5 h-5" />
            Prospectos que Necesitan Respuesta
            <Badge variant="secondary" className="ml-auto bg-white/20 text-white">
              {tasks.filter(t => !t.is_completed).length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Cargando tareas...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">¡Excelente! No hay prospectos pendientes</p>
              <p className="text-xs mt-1">Cuando recibas mensajes aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProspectTaskList;
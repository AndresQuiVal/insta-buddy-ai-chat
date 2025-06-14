
import { useState, useEffect } from 'react';

export interface Prospect {
  id: string;
  name: string;
  username: string;
  lastMessage: string;
  timestamp: string;
  traits: string[];
  matchPoints: number;
  stage: string;
}

export const useProspects = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProspects = () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const storedProspects = localStorage.getItem('hower-prospects');
      
      if (storedProspects) {
        const parsedProspects = JSON.parse(storedProspects);
        
        // Verificar que sea un array válido
        if (Array.isArray(parsedProspects)) {
          // Verificar que cada elemento tenga la estructura esperada
          const validProspects = parsedProspects.filter(prospect => {
            return prospect && 
                   typeof prospect === 'object' && 
                   prospect.id && 
                   typeof prospect.id === 'string';
          });
          
          setProspects(validProspects);
          console.log(`✅ Prospectos cargados: ${validProspects.length}`);
        } else {
          console.log('⚠️ Los datos almacenados no son un array válido');
          setProspects([]);
        }
      } else {
        console.log('ℹ️ No hay prospectos almacenados');
        setProspects([]);
      }
    } catch (error) {
      console.error('❌ Error cargando prospectos:', error);
      setError('Error al cargar los prospectos');
      setProspects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProspect = (prospect: Prospect) => {
    try {
      // Verificar que prospects sea un array
      const currentProspects = Array.isArray(prospects) ? prospects : [];
      
      const existingIndex = currentProspects.findIndex(p => p?.id === prospect.id);
      
      let updatedProspects;
      if (existingIndex >= 0) {
        updatedProspects = [...currentProspects];
        updatedProspects[existingIndex] = prospect;
      } else {
        updatedProspects = [...currentProspects, prospect];
      }
      
      localStorage.setItem('hower-prospects', JSON.stringify(updatedProspects));
      setProspects(updatedProspects);
      
      console.log(`✅ Prospecto guardado: ${prospect.name}`);
    } catch (error) {
      console.error('❌ Error guardando prospecto:', error);
      setError('Error al guardar el prospecto');
    }
  };

  const updateProspectStage = (prospectId: string, newStage: string) => {
    try {
      // Verificar que prospects sea un array
      const currentProspects = Array.isArray(prospects) ? prospects : [];
      
      const updatedProspects = currentProspects.map(prospect => {
        if (prospect?.id === prospectId) {
          return { ...prospect, stage: newStage };
        }
        return prospect;
      });
      
      localStorage.setItem('hower-prospects', JSON.stringify(updatedProspects));
      setProspects(updatedProspects);
      
      console.log(`✅ Etapa actualizada para prospecto ${prospectId}: ${newStage}`);
    } catch (error) {
      console.error('❌ Error actualizando etapa del prospecto:', error);
      setError('Error al actualizar la etapa del prospecto');
    }
  };

  const deleteProspect = (prospectId: string) => {
    try {
      // Verificar que prospects sea un array
      const currentProspects = Array.isArray(prospects) ? prospects : [];
      
      const updatedProspects = currentProspects.filter(prospect => prospect?.id !== prospectId);
      
      localStorage.setItem('hower-prospects', JSON.stringify(updatedProspects));
      setProspects(updatedProspects);
      
      console.log(`✅ Prospecto eliminado: ${prospectId}`);
    } catch (error) {
      console.error('❌ Error eliminando prospecto:', error);
      setError('Error al eliminar el prospecto');
    }
  };

  useEffect(() => {
    loadProspects();
  }, []);

  return {
    prospects: Array.isArray(prospects) ? prospects : [],
    isLoading,
    error,
    loadProspects,
    saveProspect,
    updateProspectStage,
    deleteProspect
  };
};

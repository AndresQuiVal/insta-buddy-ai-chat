import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProspectSearchResult {
  id: string;
  result_type: 'post' | 'account';
  instagram_url: string;
  title: string;
  description: string;
  comments_count: number;
  publish_date: string;
  is_recent: boolean;
  has_keywords: boolean;
  search_keywords: string[];
  created_at: string;
}

interface UseProspectSearchResultsReturn {
  posts: ProspectSearchResult[];
  accounts: ProspectSearchResult[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useProspectSearchResults = (instagramUserId: string | null): UseProspectSearchResultsReturn => {
  const [posts, setPosts] = useState<ProspectSearchResult[]>([]);
  const [accounts, setAccounts] = useState<ProspectSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    if (!instagramUserId) {
      setPosts([]);
      setAccounts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Cargando resultados de búsqueda para usuario:', instagramUserId);

      const { data, error: fetchError } = await supabase
        .from('prospect_search_results')
        .select('*')
        .eq('instagram_user_id', instagramUserId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Error al cargar resultados:', fetchError);
        setError('Error al cargar los resultados de búsqueda');
        return;
      }

      if (!data || data.length === 0) {
        console.log('📭 No hay resultados de búsqueda para este usuario');
        setPosts([]);
        setAccounts([]);
        return;
      }

      // Separar posts y cuentas
      const postsData = data.filter(result => result.result_type === 'post') as ProspectSearchResult[];
      const accountsData = data.filter(result => result.result_type === 'account') as ProspectSearchResult[];

      console.log(`📊 Resultados cargados: ${postsData.length} posts, ${accountsData.length} cuentas`);

      setPosts(postsData);
      setAccounts(accountsData);

    } catch (error) {
      console.error('❌ Error en useProspectSearchResults:', error);
      setError('Error inesperado al cargar los resultados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [instagramUserId]);

  const refresh = async () => {
    await fetchResults();
  };

  return {
    posts,
    accounts,
    isLoading,
    error,
    refresh
  };
};
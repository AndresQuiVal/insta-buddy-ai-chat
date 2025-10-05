import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FACEBOOK_ACCESS_TOKEN = Deno.env.get('FACEBOOK_ACCESS_TOKEN');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchAdsRequest {
  keywords: string[];
  ageFilter: 'antiguo' | 'reciente' | 'nuevo';
  statusFilter: 'activos' | 'inactivos' | 'ambos';
}

function getDateRange(ageFilter: string) {
  const now = new Date();
  const startDate = new Date();
  
  switch (ageFilter) {
    case 'antiguo':
      // 6-12 meses atrás
      startDate.setMonth(now.getMonth() - 12);
      const endDateAntiguo = new Date();
      endDateAntiguo.setMonth(now.getMonth() - 6);
      return { 
        start: startDate.toISOString().split('T')[0],
        end: endDateAntiguo.toISOString().split('T')[0]
      };
    case 'reciente':
      // 1-3 meses atrás
      startDate.setMonth(now.getMonth() - 3);
      const endDateReciente = new Date();
      endDateReciente.setMonth(now.getMonth() - 1);
      return { 
        start: startDate.toISOString().split('T')[0],
        end: endDateReciente.toISOString().split('T')[0]
      };
    case 'nuevo':
      // Últimas 2 semanas
      startDate.setDate(now.getDate() - 14);
      return { 
        start: startDate.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      };
    default:
      startDate.setMonth(now.getMonth() - 3);
      return { 
        start: startDate.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      };
  }
}

async function searchAds(keywords: string[], ageFilter: string, statusFilter: string) {
  if (!FACEBOOK_ACCESS_TOKEN) {
    throw new Error('FACEBOOK_ACCESS_TOKEN no configurado');
  }

  const searchQuery = keywords.join(' OR ');
  const dateRange = getDateRange(ageFilter);
  
  let adActiveStatus = 'ALL';
  if (statusFilter === 'activos') {
    adActiveStatus = 'ACTIVE';
  } else if (statusFilter === 'inactivos') {
    adActiveStatus = 'INACTIVE';
  }

  console.log('🔍 Buscando anuncios:', {
    query: searchQuery,
    dateRange,
    status: adActiveStatus
  });

  const url = new URL('https://graph.facebook.com/v18.0/ads_archive');
  url.searchParams.append('access_token', FACEBOOK_ACCESS_TOKEN);
  url.searchParams.append('search_terms', searchQuery);
  url.searchParams.append('ad_reached_countries', 'MX'); // México por defecto
  url.searchParams.append('ad_active_status', adActiveStatus);
  url.searchParams.append('ad_delivery_date_min', dateRange.start);
  url.searchParams.append('ad_delivery_date_max', dateRange.end);
  url.searchParams.append('limit', '50');
  url.searchParams.append('fields', 'id,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_titles,ad_delivery_start_time,ad_delivery_stop_time,ad_snapshot_url,page_name,impressions');

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Error de Facebook API:', data);
    throw new Error(data.error?.message || 'Error al buscar anuncios');
  }

  console.log(`✅ Encontrados ${data.data?.length || 0} anuncios`);

  // Ordenar por antigüedad (más antiguos primero)
  const sortedAds = (data.data || []).sort((a: any, b: any) => {
    return new Date(a.ad_delivery_start_time).getTime() - new Date(b.ad_delivery_start_time).getTime();
  });

  return sortedAds;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywords, ageFilter, statusFilter }: SearchAdsRequest = await req.json();

    if (!keywords || keywords.length === 0) {
      throw new Error('Se requieren palabras clave para buscar');
    }

    const ads = await searchAds(keywords, ageFilter, statusFilter);

    return new Response(
      JSON.stringify({ ads }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('❌ Error en search-ads:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

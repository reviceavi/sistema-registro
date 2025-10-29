import supabase from './supabaseClient';

// Mapeo de filtros frontend -> columnas supabase (basado en la documentación real de la API)
const columnMap = {
  tipo_victima: 'tipo_victima',
  gap: 'gap',
  nna: 'nna',
  anio: 'anio',
  alcaldia_hecho_victimizante: 'alcaldia_hecho_victimizante',
  search: ['nombre_victima', 'alfanumerica_registro', 'carpeta_investigacion', 'expediente_judicial', 'nombre_recomendacion', 'tipodelito_violaciondh']
};

export async function listVictimas({ page = 1, page_size = 10, excluir_cancelados = true, ...filters } = {}) {
  try {
    // Usar función RPC para bypasear problemas de RLS
    const { data, error } = await supabase.rpc('get_padron_victimas', {
      page_num: page,
      page_size: page_size,
      search_term: filters.search || null,
      tipo_victima_filter: filters.tipo_victima || null,
      alcaldia_filter: filters.alcaldia_hecho_victimizante || null,
      anio_filter: filters.anio ? parseInt(filters.anio) : null,
      gap_filter: filters.gap || null,
      nna_filter: filters.nna || null
    });

    if (error) throw error;

    const results = data || [];
    const count = results.length > 0 ? results[0].total_count : 0;
    
    // Remover total_count de cada registro para no duplicar datos
    const cleanResults = results.map(({ total_count, ...rest }) => rest);

    return {
      count: count || 0,
      results: cleanResults,
      page,
      page_size,
      next: (page * page_size) < (count || 0) ? page + 1 : null,
      previous: page > 1 ? page - 1 : null
    };
  } catch (error) {
    console.error('Error en listVictimas RPC:', error);
    throw error;
  }
}

export async function statsVictimas() {
  try {
    // Usar función RPC para estadísticas
    const { data, error } = await supabase.rpc('get_padron_victimas_stats');
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return {
        total_victimas: 0,
        total_validos: 0,
        totalHombres: 0,
        totalMujeres: 0,
        totalOtros: 0,
        directas: 0,
        indirectas: 0
      };
    }

    const stats = data[0];
    return {
      total_victimas: parseInt(stats.total_victimas) || 0,
      total_validos: parseInt(stats.total_validos) || 0,
      totalHombres: parseInt(stats.total_hombres) || 0,
      totalMujeres: parseInt(stats.total_mujeres) || 0,
      totalOtros: parseInt(stats.total_otros) || 0,
      directas: parseInt(stats.directas) || 0,
      indirectas: parseInt(stats.indirectas) || 0
    };
  } catch (error) {
    console.error('Error en statsVictimas RPC:', error);
    throw error;
  }
}

export default { listVictimas, statsVictimas };
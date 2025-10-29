-- Función RPC para acceso a padron_victimas con SECURITY DEFINER
-- Esto bypasa RLS y permite acceso público controlado

-- Eliminar función existente si existe (para cambiar tipo de retorno)
DROP FUNCTION IF EXISTS public.get_padron_victimas(integer,integer,text,text,text,bigint,text,text);

CREATE OR REPLACE FUNCTION public.get_padron_victimas(
  page_num int DEFAULT 1,
  page_size int DEFAULT 10,
  search_term text DEFAULT null,
  tipo_victima_filter text DEFAULT null,
  alcaldia_filter text DEFAULT null,
  anio_filter bigint DEFAULT null,
  gap_filter text DEFAULT null,
  nna_filter text DEFAULT null
)
RETURNS TABLE(
  id bigint,
  anio bigint,
  numero_registro bigint,
  alfanumerica_registro text,
  nombre_victima text,
  fecha_registro text,
  tipodelito_violaciondh text,
  tipo_victima text,
  expediente_judicial text,
  reconocimiento_calidad_victima text,
  post_mortem text,
  alcaldia_hecho_victimizante text,
  nna text,
  sexo text,
  telefono text,
  email text,
  gap text,
  curp text,
  tiempo_modo_lugar text,
  parentesco text,
  carpeta_investigacion text,
  nombre_recomendacion text,
  derechos_humanos_violados text,
  clave_victima_recomendacion text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val int := (page_num - 1) * page_size;
  where_conditions text := 'TRUE';
  total_rows bigint;
  query_text text;
BEGIN
  -- Construir condiciones WHERE dinámicamente
  IF search_term IS NOT NULL AND length(trim(search_term)) > 0 THEN
    where_conditions := where_conditions || format(' AND (
      nombre_victima ILIKE %L OR
      alfanumerica_registro ILIKE %L OR
      carpeta_investigacion ILIKE %L OR
      expediente_judicial ILIKE %L OR
      nombre_recomendacion ILIKE %L OR
      tipodelito_violaciondh ILIKE %L
    )', '%' || search_term || '%', '%' || search_term || '%', '%' || search_term || '%', 
         '%' || search_term || '%', '%' || search_term || '%', '%' || search_term || '%');
  END IF;
  
  IF tipo_victima_filter IS NOT NULL THEN
    where_conditions := where_conditions || format(' AND tipo_victima = %L', tipo_victima_filter);
  END IF;
  
  IF alcaldia_filter IS NOT NULL THEN
    where_conditions := where_conditions || format(' AND alcaldia_hecho_victimizante = %L', alcaldia_filter);
  END IF;
  
  IF anio_filter IS NOT NULL THEN
    where_conditions := where_conditions || format(' AND anio = %L', anio_filter);
  END IF;
  
  IF gap_filter IS NOT NULL THEN
    where_conditions := where_conditions || format(' AND gap = %L', gap_filter);
  END IF;
  
  IF nna_filter IS NOT NULL THEN
    where_conditions := where_conditions || format(' AND nna = %L', nna_filter);
  END IF;

  -- Obtener total count
  EXECUTE format('SELECT COUNT(*) FROM public.padron_victimas WHERE %s', where_conditions) INTO total_rows;
  
  -- Construir y ejecutar query principal
  query_text := format('
    SELECT 
      pv.*,
      %L::bigint as total_count
    FROM public.padron_victimas pv
    WHERE %s 
    ORDER BY fecha_registro DESC NULLS LAST
    LIMIT %L OFFSET %L', 
    total_rows, where_conditions, page_size, offset_val);
  
  RETURN QUERY EXECUTE query_text;
END;
$$;

-- Función para estadísticas
-- Eliminar función existente si existe
DROP FUNCTION IF EXISTS public.get_padron_victimas_stats();

CREATE OR REPLACE FUNCTION public.get_padron_victimas_stats()
RETURNS TABLE(
  total_victimas bigint,
  total_validos bigint,
  total_hombres bigint,
  total_mujeres bigint,
  total_otros bigint,
  directas bigint,
  indirectas bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_victimas,
    COUNT(*) FILTER (WHERE nombre_victima != 'Cancelado' AND tipo_victima != 'Cancelado') as total_validos,
    COUNT(*) FILTER (WHERE sexo IN ('1', 'M', 'Masculino', 'MASCULINO', 'Hombre', 'HOMBRE')) as total_hombres,
    COUNT(*) FILTER (WHERE sexo IN ('2', 'F', 'Femenino', 'FEMENINO', 'Mujer', 'MUJER')) as total_mujeres,
    COUNT(*) FILTER (WHERE sexo IN ('3', 'Otro', 'OTRO')) as total_otros,
    COUNT(*) FILTER (WHERE tipo_victima IN ('DIRECTA', 'Directa', 'directa')) as directas,
    COUNT(*) FILTER (WHERE tipo_victima IN ('INDIRECTA', 'Indirecta', 'indirecta')) as indirectas
  FROM public.padron_victimas;
END;
$$;

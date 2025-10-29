import { supabase } from './supabaseClient';

// Mapeo de campos del formulario a columnas de Supabase
const mapOficioData = (oficioData) => ({
  año: parseInt(oficioData.anio) || new Date().getFullYear(),
  remitente: oficioData.remitente || '',
  atiende_oficio: oficioData.atiende_oficio || '',
  recepcion_relovi: oficioData.recepcion_relovi || '',
  recepcion_ceavi: oficioData.recepcion_ceavi || '',
  alfanumerica_entrada: oficioData.alfanumerica_entrada || '',
  autoridad_dependencia: oficioData.autoridad_dependencia || '',
  cargo: oficioData.cargo || '',
  asunto: oficioData.asunto || '',
  // Campos adicionales que pueden existir en la tabla pero no en el formulario
  na: '',
  evidencia_respuesta: '',
  ruiz_escamilla: '',
  entrada: '',
  confirmo_asignacion: '',
  notificacion: '',
  '#': '',
  solicitud_registro: '',
  formato: '',
  termino: ''
});

const mapSolicitudData = (solicitudData) => ({
  año: parseInt(solicitudData.anio) || new Date().getFullYear(),
  persona_usuaria: solicitudData.persona_usuaria || '',
  fecha_solicitud: solicitudData.fecha_solicitud || '',
  fecha_resolucion: solicitudData.fecha_resolucion || '',
  fecha_completo: solicitudData.fecha_completo || '',
  solicitante: solicitudData.solicitante || '',
  delito: solicitudData.delito || '',
  recomendacion: solicitudData.recomendacion || '',
  aceptacion: solicitudData.aceptacion || '',
  reconocimiento_victima: solicitudData.reconocimiento_victima || '',
  actas: solicitudData.actas || '',
  fuds: solicitudData.fuds || '',
  curp: solicitudData.curp || '',
  identificaciones: solicitudData.identificaciones || '',
  estatus_solicitud: solicitudData.estatus_solicitud || 'En proceso',
  tiempo_resolucion: solicitudData.tiempo_resolucion || '',
  tipo_resolucion: solicitudData.tipo_resolucion || '',
  // Campos adicionales
  num_solicitud: '',
  entero_solicitud: null
});

const mapVictimaData = (victima, tipoRelacion = 'directa') => ({
  anio: parseInt(victima.anio) || new Date().getFullYear(),
  numero_registro: victima.numero_registro || null,
  alfanumerica_registro: victima.alfanumerica_registro || '',
  nombre_victima: victima.nombre_victima || '',
  fecha_registro: victima.fecha_registro || '',
  tipodelito_violaciondh: victima.tipo_violacion_dh?.startsWith('Recomendación') ? 
    victima.tipo_violacion_dh : 
    (victima.tipo_violacion_dh ? `Recomendación ${victima.tipo_violacion_dh}` : ''),
  tipo_victima: victima.tipo_victima || (tipoRelacion === 'directa' ? 'DIRECTA' : 'INDIRECTA'),
  expediente_judicial: victima.expediente_judicial || '',
  reconocimiento_calidad_victima: victima.reconocimiento_calidad_victima || '',
  post_mortem: victima.post_mortem || '',
  alcaldia_hecho_victimizante: victima.alcaldia_hecho_victimizante || '',
  nna: victima.nna || '',
  sexo: victima.sexo || '',
  telefono: victima.telefono || '',
  email: victima.correo_electronico || '',
  gap: victima.gap || '',
  curp: victima.curp || '',
  tiempo_modo_lugar: victima.tiempo_modo_lugar || '',
  parentesco: victima.parentesco || '',
  carpeta_investigacion: victima.carpeta_investigacion || '',
  nombre_recomendacion: victima.nombre_recomendacion || '',
  derechos_humanos_violados: Array.isArray(victima.derechos_humanos_violados) ? 
    victima.derechos_humanos_violados.join(', ') : 
    (victima.derechos_humanos_violados || ''),
  clave_victima_recomendacion: victima.clave_victima_recomendacion || ''
});

export async function createOficioEntrada(oficioData) {
  try {
    const payload = mapOficioData(oficioData);
    console.log('📤 Creando oficio entrada:', payload);
    
    const { data, error } = await supabase
      .from('oficios_entrada')
      .insert([payload])
      .select();
    
    if (error) throw error;
    
    console.log('✅ Oficio entrada creado:', data);
    return data[0];
  } catch (error) {
    console.error('❌ Error creando oficio entrada:', error);
    throw error;
  }
}

export async function createSolicitud(solicitudData) {
  try {
    const payload = mapSolicitudData(solicitudData);
    console.log('📤 Creando solicitud:', payload);
    
    const { data, error } = await supabase
      .from('solicitudes')
      .insert([payload])
      .select();
    
    if (error) throw error;
    
    console.log('✅ Solicitud creada:', data);
    return data[0];
  } catch (error) {
    console.error('❌ Error creando solicitud:', error);
    throw error;
  }
}

export async function createVictima(victimaData, tipoRelacion = 'directa') {
  try {
    const payload = mapVictimaData(victimaData, tipoRelacion);
    console.log('📤 Creando víctima:', payload);
    
    const { data, error } = await supabase
      .from('temporal_padron')
      .insert([payload])
      .select();
    
    if (error) throw error;
    
    console.log('✅ Víctima creada:', data);
    return data[0];
  } catch (error) {
    console.error('❌ Error creando víctima:', error);
    throw error;
  }
}

export async function createVictimasLote(victimas) {
  try {
    const payloads = victimas.map(v => mapVictimaData(v, v.tipo_relacion || 'directa'));
    console.log('📤 Creando víctimas en lote:', payloads.length);
    
    const { data, error } = await supabase
      .from('temporal_padron')
      .insert(payloads)
      .select();
    
    if (error) throw error;
    
    console.log('✅ Víctimas creadas en lote:', data.length);
    return data;
  } catch (error) {
    console.error('❌ Error creando víctimas en lote:', error);
    throw error;
  }
}

// Función para cargar expedientes (si existe tabla expedientes en Supabase)
export async function fetchExpedientes() {
  try {
    console.log('🔄 Cargando expedientes desde Supabase...');
    
    // Intentar cargar de una tabla de expedientes
    const { data, error } = await supabase
      .from('expedientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Si no existe la tabla expedientes, devolver array vacío
      console.warn('⚠️ Tabla expedientes no encontrada:', error.message);
      return [];
    }

    console.log('📊 Expedientes cargados:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Error cargando expedientes:', error);
    return [];
  }
}

export default {
  createOficioEntrada,
  createSolicitud,
  createVictima,
  createVictimasLote,
  fetchExpedientes
};

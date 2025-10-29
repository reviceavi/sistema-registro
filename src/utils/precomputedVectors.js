// Generador de vectores precompilados para la Ley de Víctimas CDMX
import { VectorStore } from './vectorStore';

// Función para generar y guardar vectores precompilados
export async function generatePrecomputedVectors() {
  try {
    console.log('Iniciando generación de vectores precompilados...');
    
    // Cargar el texto de la ley
    const response = await fetch('/contexto_agente_ia/ley_victimas_cdmx.txt');
    const text = await response.text();
    
    console.log('Texto cargado, longitud:', text.length);
    
    // Crear instancia del vector store
    const vectorStore = new VectorStore();
    
    // Procesar el texto y generar embeddings
    await vectorStore.processText(text);
    
    // Crear el objeto de vectores precompilados
    const precomputedVectors = {
      chunks: vectorStore.chunks,
      embeddings: vectorStore.embeddings,
      metadata: {
        source: 'Ley de Víctimas para la Ciudad de México',
        generated_at: new Date().toISOString(),
        total_chunks: vectorStore.chunks.length
      }
    };
    
    // Guardar en localStorage con clave específica
    localStorage.setItem('ley_victimas_precomputed', JSON.stringify(precomputedVectors));
    
    console.log('Vectores precompilados generados y guardados exitosamente');
    console.log(`Total de fragmentos: ${vectorStore.chunks.length}`);
    
    return precomputedVectors;
  } catch (error) {
    console.error('Error generando vectores precompilados:', error);
    return null;
  }
}

// Función para cargar vectores precompilados
export async function loadPrecomputedVectors() {
  try {
    // Cargar todos los archivos JSON y asociar fuente
    const fuentes = [
      { path: '/contexto_agente_ia/ley_victimas_vectores.json', nombre: 'ley' },
      { path: '/contexto_agente_ia/reglamento_lvcdmx.json', nombre: 'reglamento' },
      { path: '/contexto_agente_ia/estatuto_organico_ceavi.json', nombre: 'estatuto' },
      { path: '/contexto_agente_ia/ley_general_victimas.json', nombre: 'ley_general' },
      { path: '/contexto_agente_ia/reglas_operacion_fondo.json', nombre: 'reglas_faari' },
      { path: '/contexto_agente_ia/manual_administrativo.json', nombre: 'manual_administrativo' }
    ];
    
    let allChunks = [];
    let allEmbeddings = [];
    
    for (const fuente of fuentes) {
      try {
        console.log(`Cargando: ${fuente.path}`);
        const response = await fetch(fuente.path);
        if (response.ok) {
          const data = await response.json();
          if (data && data.chunks && data.embeddings) {
            // Asignar fuente a cada chunk y asegurar que mantenga la fuente original
            const chunksConFuente = data.chunks.map(chunk => ({
              ...chunk,
              fuente: chunk.fuente || fuente.nombre // Usar fuente del chunk o fallback
            }));
            allChunks = allChunks.concat(chunksConFuente);
            allEmbeddings = allEmbeddings.concat(data.embeddings);
            console.log(`✅ Cargado ${fuente.path}: ${data.chunks.length} fragmentos`);
          }
        } else {
          console.warn(`❌ No se pudo cargar: ${fuente.path} (${response.status})`);
        }
      } catch (e) {
        console.warn(`❌ Error cargando ${fuente.path}:`, e);
      }
    }
    
    if (allChunks.length > 0) {
      console.log(`🎉 Total cargado: ${allChunks.length} fragmentos de ${fuentes.length} documentos`);
      return { chunks: allChunks, embeddings: allEmbeddings };
    } else {
      console.error('❌ No se pudieron cargar vectores de ningún archivo');
      return null;
    }
  } catch (error) {
    console.error('❌ Error cargando vectores precompilados:', error);
    return null;
  }
}

export default generatePrecomputedVectors;

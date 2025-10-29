// Utilidad para fragmentar texto y gestionar embeddings
export class VectorStore {
  constructor() {
    this.chunks = [];
    this.embeddings = [];
  }

  // Fragmentar texto en chunks de tamaño específico
  fragmentText(text, chunkSize = 800, overlap = 100) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + chunkSize;
      
      // Si no es el último chunk, buscar el final de una oración
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > start + chunkSize / 2) {
          end = breakPoint + 1;
        }
      }
      
      const chunk = text.substring(start, end).trim();
      if (chunk.length > 50) { // Solo agregar chunks significativos
        chunks.push({
          id: chunks.length,
          text: chunk,
          start,
          end
        });
      }
      
      start = end - overlap;
    }
    
    return chunks;
  }

  // Generar embeddings usando la API de Gemini
  async generateEmbedding(text) {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': 'AIzaSyD_RTvjp7kXBM6vsHejw6CeqBTlqW4Tswo'
        },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: {
            parts: [{ text }]
          }
        })
      });

      const data = await response.json();
      return data.embedding?.values || [];
    } catch (error) {
      console.error('Error generando embedding:', error);
      return [];
    }
  }

  // Procesar todo el texto y generar embeddings
  async processText(text) {
    console.log('Fragmentando texto...');
    this.chunks = this.fragmentText(text);
    
    console.log(`Generando embeddings para ${this.chunks.length} fragmentos...`);
    this.embeddings = [];
    
    for (let i = 0; i < this.chunks.length; i++) {
      const embedding = await this.generateEmbedding(this.chunks[i].text);
      this.embeddings.push(embedding);
      
      // Pequeña pausa para no saturar la API
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if ((i + 1) % 10 === 0) {
        console.log(`Procesados ${i + 1}/${this.chunks.length} fragmentos`);
      }
    }
    
    console.log('Procesamiento completado');
  }

  // Calcular similitud coseno entre dos vectores
  cosineSimilarity(a, b) {
    if (!a || !b || a.length === 0 || b.length === 0) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Buscar fragmentos más relevantes para una consulta
  async findRelevantChunks(query, topK = 3, documentType = null) {
    if (this.embeddings.length === 0) return [];
    
    const queryEmbedding = await this.generateEmbedding(query);
    if (queryEmbedding.length === 0) return [];
    
    // Filtrar chunks por tipo de documento si se especifica
    let filteredIndices = [];
    if (documentType) {
      // Mapear nombres de tipos de documento a fuentes
      const documentSourceMap = {
        'estatuto_organico_ceavi': 'estatuto',
        'ley_general_victimas': 'ley_general',
        'reglas_operacion_fondo': 'reglas_faari',
        'ley_victimas_vectores': 'ley',
        'reglamento_lvcdmx': 'reglamento',
        'manual_administrativo': 'manual_administrativo'
      };
      
      const targetSource = documentSourceMap[documentType];
      if (targetSource) {
        filteredIndices = this.chunks
          .map((chunk, index) => ({ chunk, index }))
          .filter(item => item.chunk.fuente === targetSource)
          .map(item => item.index);
      }
    } else {
      // Si no se especifica tipo, usar todos los índices
      filteredIndices = this.chunks.map((_, index) => index);
    }
    
    const similarities = filteredIndices.map(index => ({
      index,
      similarity: this.cosineSimilarity(queryEmbedding, this.embeddings[index]),
      chunk: this.chunks[index]
    }));
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .filter(item => item.similarity > 0.1); // Filtrar similitudes muy bajas
  }

  // Guardar en localStorage
  save() {
    localStorage.setItem('ley_victimas_chunks', JSON.stringify(this.chunks));
    localStorage.setItem('ley_victimas_embeddings', JSON.stringify(this.embeddings));
  }

  // Cargar desde localStorage
  load() {
    try {
      const chunks = localStorage.getItem('ley_victimas_chunks');
      const embeddings = localStorage.getItem('ley_victimas_embeddings');
      
      if (chunks && embeddings) {
        this.chunks = JSON.parse(chunks);
        this.embeddings = JSON.parse(embeddings);
        return true;
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
    return false;
  }
}

export default VectorStore;

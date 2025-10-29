// Cargador de vectores binarios para el frontend
export class BinaryVectorLoader {
  static async loadVectors(path) {
    try {
      const response = await fetch(path);
      const arrayBuffer = await response.arrayBuffer();
      const dataView = new DataView(arrayBuffer);
      
      let offset = 0;
      
      // Leer header
      const totalChunks = dataView.getUint32(offset, true); offset += 4;
      const embeddingSize = dataView.getUint32(offset, true); offset += 4;
      const version = dataView.getUint32(offset, true); offset += 4;
      offset += 20; // Saltar padding del header
      
      console.log(`Cargando ${totalChunks} chunks con embeddings de ${embeddingSize} dimensiones`);
      
      const chunks = [];
      const embeddings = [];
      
      // Leer cada chunk
      for (let i = 0; i < totalChunks; i++) {
        // Leer longitud del texto
        const textLength = dataView.getUint32(offset, true); offset += 4;
        
        // Leer texto
        const textBytes = new Uint8Array(arrayBuffer, offset, textLength);
        const text = new TextDecoder('utf-8').decode(textBytes);
        offset += textLength;
        
        // Leer ID del chunk
        const id = dataView.getUint32(offset, true); offset += 4;
        
        // Leer embedding
        const embedding = new Float32Array(embeddingSize);
        for (let j = 0; j < embeddingSize; j++) {
          embedding[j] = dataView.getFloat32(offset, true);
          offset += 4;
        }
        
        chunks.push({
          id,
          text,
          start: 0, // No disponible en este formato simplificado
          end: text.length
        });
        
        embeddings.push(Array.from(embedding));
        
        if ((i + 1) % 100 === 0) {
          console.log(`Cargados ${i + 1}/${totalChunks} chunks`);
        }
      }
      
      console.log('Vectores binarios cargados exitosamente');
      return { chunks, embeddings };
      
    } catch (error) {
      console.error('Error cargando vectores binarios:', error);
      return null;
    }
  }
}

export default BinaryVectorLoader;

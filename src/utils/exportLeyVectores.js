// Script para exportar los vectores de la Ley de Víctimas en formato JSON
import { VectorStore } from './vectorStore';

export async function exportLeyVectores() {
  try {
    // Cargar el texto de la ley desde la nueva ubicación
    const response = await fetch('/contexto_agente_ia/ley_victimas_cdmx.txt');
    const text = await response.text();

    // Crear instancia del vector store
    const vectorStore = new VectorStore();
    const chunks = vectorStore.fragmentText(text);
    const result = [];

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await vectorStore.generateEmbedding(chunks[i].text);
      result.push({
        id: chunks[i].id,
        text: chunks[i].text,
        embedding
      });
      // Pausa para no saturar la API
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Descargar el archivo JSON en el navegador
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ley_victimas_vectores.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Exportación de vectores completada');
    return result;
  } catch (error) {
    console.error('Error exportando vectores:', error);
    return null;
  }
}

export default exportLeyVectores;

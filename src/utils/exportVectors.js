// Función para exportar los vectores desde localStorage a un archivo JSON
export function exportVectorsToJSON() {
  try {
    const vectors = localStorage.getItem('ley_victimas_precomputed');
    if (!vectors) {
      console.error('No se encontraron vectores en localStorage');
      return;
    }

    // Crear y descargar el archivo JSON
    const blob = new Blob([vectors], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ley_victimas_vectores.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Vectores exportados exitosamente');
  } catch (error) {
    console.error('Error exportando vectores:', error);
  }
}

// Ejecutar inmediatamente al importar (opcional)
// exportVectorsToJSON();

export default exportVectorsToJSON;

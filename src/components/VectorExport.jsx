import React, { useState } from 'react';
import exportLeyVectores from '../utils/exportLeyVectores';

const VectorExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState('');

  const handleExport = async () => {
    setIsExporting(true);
    setStatus('Iniciando exportación de vectores...');
    
    try {
      const result = await exportLeyVectores();
      if (result) {
        setStatus('✅ Vectores exportados exitosamente');
      } else {
        setStatus('❌ Error en la exportación');
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', margin: '20px', borderRadius: '8px' }}>
      <h3>Exportador de Vectores - Ley de Víctimas</h3>
      <button 
        onClick={handleExport}
        disabled={isExporting}
        style={{
          padding: '10px 20px',
          background: isExporting ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isExporting ? 'not-allowed' : 'pointer'
        }}
      >
        {isExporting ? 'Exportando...' : 'Exportar Vectores a JSON'}
      </button>
      {status && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{status}</p>}
    </div>
  );
};

export default VectorExport;

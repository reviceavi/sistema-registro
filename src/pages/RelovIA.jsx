import React, { useState, useRef, useEffect } from 'react';
import HeaderInstitucional from '../components/HeaderInstitucional';
import Navigation from '../components/Navigation';
import reloviaLogo from '../assets/logos/relovia.png';
import ReactMarkdown from 'react-markdown';
import './RelovIA.css';
import { VectorStore } from '../utils/vectorStore';
import { loadPrecomputedVectors } from '../utils/precomputedVectors';

const RelovIA = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: '¡Hola! Soy RelovIA, tu asistente de Inteligencia Artificial del Registro de Víctimas. Estoy aquí para proporcionarte información técnica y normativa específica sobre la legislación vigente y procedimientos del Registro. Puedo consultar la Ley General de Víctimas, LVCDMX, Estatuto Orgánico de CEAVI, Reglamento, Reglas del FAARI y Manual Administrativo. ¿Qué consulta normativa necesitas realizar?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [vectorStore, setVectorStore] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Función para normalizar texto (insensible a mayúsculas, acentos, etc.)
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos/acentos
      .replace(/[^\w\s]/g, ' ') // Eliminar caracteres especiales
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  };

  // Función para detectar qué documento específico buscar
  const detectDocumentType = (userInput) => {
    const normalizedInput = normalizeText(userInput);
    
    // Patrones para cada documento específico (orden de prioridad)
    const patterns = {
      'manual_administrativo': [
        /\b(manual\s+administrativo|manual\s+de\s+la\s+ceavi|manual\s+ceavi|manual\s+admvo)\b/i
      ],
      'estatuto_organico_ceavi': [
        /\b(estatuto\s+organico|estatuto\s+ceavi|estatuto\s+de\s+la\s+ceavi|estatuto\s+organico\s+ceavi)\b/i,
        /\b(estatuto)\b/i  // Solo "estatuto" sin más contexto
      ],
      'ley_general_victimas': [
        /\b(ley\s+general\s+de\s+victimas|ley\s+general\s+victimas|ley\s+general)\b/i,
        /\b(lgv)\b/i
      ],
      'reglas_operacion_fondo': [
        /\b(reglas\s+de\s+operacion\s+del\s+fondo|reglas\s+de\s+operacion\s+del\s+faari|reglas\s+del\s+fondo|reglas\s+del\s+faari)\b/i,
        /\b(reglas\s+de\s+operacion|fondo\s+faari|faari)\b/i
      ],
      'reglamento_lvcdmx': [
        /\b(reglamento\s+de\s+la\s+ley\s+de\s+victimas|reglamento\s+de\s+la\s+lvcdmx|reglamento\s+lvcdmx|reglamento\s+ley\s+victimas)\b/i,
        /\b(reglamento)\b/i  // Solo "reglamento" sin más contexto
      ],
      'ley_victimas_vectores': [
        /\b(ley\s+de\s+victimas\s+para\s+la\s+cdmx|ley\s+de\s+victimas\s+de\s+la\s+cdmx|ley\s+victimas\s+cdmx|lvcdmx)\b/i,
        /\b(ley\s+de\s+victimas)\b/i  // Solo si no se detectó la Ley General antes
      ]
    };

    // Revisar cada tipo de documento en orden de prioridad
    for (const [docType, patternList] of Object.entries(patterns)) {
      for (const pattern of patternList) {
        if (pattern.test(normalizedInput)) {
          return docType;
        }
      }
    }

    return null; // No se detectó un tipo específico
  };

  // Función para detectar si se busca "toda la normatividad"
  const isAllNormativityQuery = (userInput) => {
    const normalizedInput = normalizeText(userInput);
    
    const allNormativityPatterns = [
      /\b(toda\s+la\s+normatividad|todas\s+las\s+leyes|normatividad|marco\s+normativo|marco\s+juridico)\b/i,
      /\b(toda\s+la\s+legislacion|todas\s+las\s+normas|conjunto\s+normativo|normativa|regulacion)\b/i
    ];

    return allNormativityPatterns.some(pattern => pattern.test(normalizedInput));
  };

  // Inicializar el vector store al cargar el componente
  useEffect(() => {
    const initializeVectorStore = async () => {
      try {
        setIsInitializing(true);
        console.log('Cargando vectores optimizados...');
        
        // Cargar vectores directamente (binario con fallback a JSON)
        const vectorData = await loadPrecomputedVectors();
        
        if (vectorData) {
          const store = new VectorStore();
          store.chunks = vectorData.chunks;
          store.embeddings = vectorData.embeddings;
          setVectorStore(store);
          console.log('Vector store inicializado con', vectorData.chunks.length, 'fragmentos');
        } else {
          console.warn('No se pudieron cargar los vectores');
        }
      } catch (error) {
        console.error('Error inicializando vector store:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeVectorStore();
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // Detectar tipo de consulta
      const specificDocType = detectDocumentType(currentInput);
      const isAllNormQuery = isAllNormativityQuery(currentInput);
      
      let relevantContext = '';
      let contextInfo = '';
      
      if (vectorStore) {
        if (isAllNormQuery) {
          // Buscar en TODOS los documentos para consultas de "toda la normatividad"
          console.log('Búsqueda en toda la normatividad detectada');
          const relevantChunks = await vectorStore.findRelevantChunks(currentInput, 5);
          if (relevantChunks.length > 0) {
            relevantContext = '\n\nContexto de toda la normatividad consultada:\n' + 
              relevantChunks.map((item, index) => `${index + 1}. ${item.chunk.text}`).join('\n\n');
            contextInfo = ' (consultando toda la normatividad disponible)';
          }
        } else if (specificDocType) {
          // Buscar en documento específico
          console.log(`Documento específico detectado: ${specificDocType}`);
          const relevantChunks = await vectorStore.findRelevantChunks(currentInput, 3, specificDocType);
          if (relevantChunks.length > 0) {
            const docNames = {
              'manual_administrativo': 'Manual Administrativo de CEAVI',
              'estatuto_organico_ceavi': 'Estatuto Orgánico de CEAVI',
              'ley_general_victimas': 'Ley General de Víctimas',
              'reglas_operacion_fondo': 'Reglas de Operación del Fondo FAARI',
              'ley_victimas_vectores': 'Ley de Víctimas de la CDMX',
              'reglamento_lvcdmx': 'Reglamento de la Ley de Víctimas CDMX'
            };
            
            relevantContext = `\n\nContexto relevante del ${docNames[specificDocType]}:\n` + 
              relevantChunks.map((item, index) => `${index + 1}. ${item.chunk.text}`).join('\n\n');
            contextInfo = ` (consultando ${docNames[specificDocType]})`;
          }
        } else {
          // Búsqueda general en todos los documentos cuando no se especifica uno
          console.log('Realizando búsqueda general en toda la normatividad disponible');
          const relevantChunks = await vectorStore.findRelevantChunks(currentInput, 3);
          if (relevantChunks.length > 0) {
            relevantContext = '\n\nContexto relevante encontrado:\n' + 
              relevantChunks.map((item, index) => `${index + 1}. ${item.chunk.text}`).join('\n\n');
            contextInfo = ' (búsqueda en normatividad general)';
          }
        }
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': 'AIzaSyD_RTvjp7kXBM6vsHejw6CeqBTlqW4Tswo'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Eres RelovIA, el asistente virtual especializado del Registro de Víctimas de la Ciudad de México. El usuario que interactúa contigo es un funcionario autenticado y autorizado del sistema, por lo que no necesitas solicitar verificación adicional.

TU FUNCIÓN PRINCIPAL:
Proporcionar información técnica y normativa específica para apoyar el trabajo diario de los funcionarios del Registro de Víctimas en sus procedimientos, consultas normativas y aplicación de la legislación vigente.

NORMATIVIDAD DISPONIBLE EN EL SISTEMA:
- Ley General de Víctimas (LGV - México)
- Ley de Víctimas de la Ciudad de México (LVCDMX)
- Estatuto Orgánico de CEAVI
- Reglamento de la Ley de Víctimas CDMX
- Reglas de Operación del Fondo de Ayuda, Asistencia y Reparación Integral (FAARI)
- Manual Administrativo de CEAVI

INSTRUCCIONES ESTRICTAS:
1. EXACTITUD: Solo proporciona información que esté explícitamente contenida en la normatividad consultada
2. CITACIÓN OBLIGATORIA: Siempre especifica la fuente exacta (ley/reglamento, artículo, fracción, inciso, párrafo)
3. LENGUAJE TÉCNICO: Utiliza terminología jurídica precisa y profesional
4. NO INTERPRETAR: No des interpretaciones legales, solo transcribe o parafrasea el contenido normativo
5. TRANSPARENCIA: Si no encuentras información específica, indica claramente que no está disponible en las fuentes consultadas
6. ESTRUCTURA: Organiza las respuestas de manera clara con referencias numeradas

PROHIBIDO:
- Inventar o asumir información no contenida en las fuentes
- Dar consejos o interpretaciones legales personales
- Proporcionar información sin citar la fuente exacta
- Hacer conjeturas o aproximaciones

CONTEXTO CONSULTADO:${relevantContext}

Pregunta del funcionario${contextInfo}: ${currentInput}`
            }]
          }]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${data.error?.message || 'Error desconocido'}`);
      }
      
      if (data.candidates && data.candidates[0]) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.candidates[0].content.parts[0].text,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('No se recibió respuesta válida del modelo');
      }
    } catch (error) {
      console.error('Error al obtener respuesta:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `Lo siento, ocurrió un error al procesar tu mensaje: ${error.message}. Por favor, intenta nuevamente.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: '¡Hola! Soy RelovIA, tu asistente virtual especializado del Registro de Víctimas. Estoy aquí para proporcionarte información técnica y normativa específica sobre la legislación vigente y procedimientos del Registro. Puedo consultar la Ley General de Víctimas, LVCDMX, Estatuto Orgánico de CEAVI, Reglamento, Reglas del FAARI y Manual Administrativo. ¿Qué consulta normativa necesitas realizar?',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #b28e5c 0%, #9d2148 100%)'}}>
      <HeaderInstitucional />
      <Navigation />
      
      <div className="relovia-container">
        <div className="relovia-header">
          <div className="relovia-mascot">
            <img src={reloviaLogo} alt="RelovIA" className="mascot-image" />
          </div>
          <div className="mascot-info">
            <div className="mascot-text">
              <h1>RelovIA</h1>
              <p>Asistente Virtual del Registro de Víctimas</p>
              {isInitializing && (
                <div className="initialization-status">
                  <small>Cargando base de conocimientos...</small>
                </div>
              )}
            </div>
          </div>
          {/* header-actions removed per request */}
        </div>

        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}-message`}>
                {message.type === 'bot' && (
                  <div className="message-avatar">
                    <img src={reloviaLogo} alt="RelovIA" />
                  </div>
                )}
                <div className="message-content">
                  <ReactMarkdown className="markdown-content">
                    {message.content}
                  </ReactMarkdown>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                {message.type === 'user' && (
                  <div className="message-avatar user-avatar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="message bot-message loading">
                <div className="message-avatar">
                  <img src={reloviaLogo} alt="RelovIA" />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <div className="input-wrapper">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta sobre el Registro de Víctimas..."
                className="chat-input"
                rows="1"
                disabled={isLoading || isInitializing}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isLoading || isInitializing}
                className="send-button"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelovIA;

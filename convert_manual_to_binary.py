#!/usr/bin/env python3
"""
Script para convertir manual_administrativo.docx a binario vectorizado
"""
import os
import sys
import json
import pickle
import numpy as np
from pathlib import Path

try:
    from docx import Document
    import requests
    import time
except ImportError:
    print("Instalando dependencias necesarias...")
    os.system("pip install python-docx requests numpy")
    from docx import Document
    import requests
    import time

# Configuración
GEMINI_API_KEY = "AIzaSyD_RTvjp7kXBM6vsHejw6CeqBTlqW4Tswo"
EMBEDDING_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent"

def extract_text_from_docx(docx_path):
    """Extraer texto del archivo DOCX"""
    try:
        doc = Document(docx_path)
        text_content = []
        
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                # Eliminar saltos de línea excesivos y normalizar espacios
                clean_text = ' '.join(paragraph.text.split())
                if clean_text:
                    text_content.append(clean_text)
        
        # Unir todo el texto con espacios simples
        full_text = ' '.join(text_content)
        return full_text
    except Exception as e:
        print(f"Error extrayendo texto: {e}")
        return None

def chunk_text(text, chunk_size=800, overlap=100):
    """Fragmentar texto en chunks"""
    chunks = []
    start = 0
    chunk_id = 0
    
    while start < len(text):
        end = start + chunk_size
        
        # Si no es el último chunk, buscar el final de una oración
        if end < len(text):
            last_period = text.rfind('.', start, end)
            last_space = text.rfind(' ', start, end)
            break_point = max(last_period, last_space)
            
            if break_point > start + chunk_size // 2:
                end = break_point + 1
        
        chunk = text[start:end].strip()
        if len(chunk) > 50:  # Solo chunks significativos
            chunks.append({
                'id': chunk_id,
                'text': chunk,
                'start': start,
                'end': end,
                'fuente': 'manual_administrativo'
            })
            chunk_id += 1
        
        start = end - overlap
    
    return chunks

def generate_embedding(text):
    """Generar embedding usando la API de Gemini"""
    headers = {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
    }
    
    data = {
        'model': 'models/text-embedding-004',
        'content': {
            'parts': [{'text': text}]
        }
    }
    
    try:
        response = requests.post(EMBEDDING_URL, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        
        if 'embedding' in result and 'values' in result['embedding']:
            return result['embedding']['values']
        else:
            print(f"Respuesta inesperada de la API: {result}")
            return None
    except Exception as e:
        print(f"Error generando embedding: {e}")
        return None

def main():
    input_path = "/Users/Guest/Documents/sistema_registro/contexto_agente_ia/manual_administrativo.docx"
    output_path = "/Users/Guest/Documents/sistema_registro/contexto_agente_ia/manual_administrativo.bin"
    
    print("Extrayendo texto del documento Word...")
    text = extract_text_from_docx(input_path)
    
    if not text:
        print("Error: No se pudo extraer texto del documento")
        return
    
    print(f"Texto extraído: {len(text)} caracteres")
    
    print("Fragmentando texto...")
    chunks = chunk_text(text)
    print(f"Generados {len(chunks)} fragmentos")
    
    print("Generando embeddings...")
    embeddings = []
    
    for i, chunk in enumerate(chunks):
        print(f"Procesando fragmento {i+1}/{len(chunks)}")
        embedding = generate_embedding(chunk['text'])
        
        if embedding:
            embeddings.append(embedding)
        else:
            print(f"Error en fragmento {i+1}, saltando...")
            continue
        
        # Pausa para evitar límites de rate
        time.sleep(0.5)
    
    if len(embeddings) != len(chunks):
        print(f"Advertencia: Se generaron {len(embeddings)} embeddings para {len(chunks)} chunks")
        # Ajustar chunks para que coincidan
        chunks = chunks[:len(embeddings)]
    
    # Crear estructura de datos
    vector_data = {
        'chunks': chunks,
        'embeddings': embeddings,
        'metadata': {
            'source': 'Manual Administrativo CEAVI',
            'total_chunks': len(chunks),
            'generated_at': time.strftime('%Y-%m-%d %H:%M:%S')
        }
    }
    
    print(f"Guardando archivo binario en {output_path}")
    with open(output_path, 'wb') as f:
        pickle.dump(vector_data, f)
    
    print("¡Conversión completada exitosamente!")
    print(f"Archivo guardado: {output_path}")
    print(f"Fragmentos procesados: {len(chunks)}")

if __name__ == "__main__":
    main()

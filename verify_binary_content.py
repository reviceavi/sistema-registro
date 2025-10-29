#!/usr/bin/env python3
"""
Script para verificar el contenido de los archivos binarios
y detectar HTML u otros elementos no deseados
"""
import pickle
import os
import re
from pathlib import Path

def check_binary_content(file_path):
    """Verificar el contenido de un archivo binario"""
    try:
        with open(file_path, 'rb') as f:
            data = pickle.load(f)
        
        print(f"\n{'='*60}")
        print(f"ARCHIVO: {os.path.basename(file_path)}")
        print(f"{'='*60}")
        
        if 'chunks' in data:
            chunks = data['chunks']
            print(f"Total de fragmentos: {len(chunks)}")
            
            # Contadores para análisis
            html_found = 0
            suspicious_patterns = 0
            
            # Patrones HTML y sospechosos
            html_patterns = [
                r'<[^>]+>',  # Tags HTML
                r'&[a-zA-Z]+;',  # Entidades HTML
                r'<!DOCTYPE',  # DOCTYPE
                r'<html',  # Tag HTML
                r'</html>',  # Cierre HTML
                r'<body',  # Tag BODY
                r'</body>',  # Cierre BODY
                r'<div',  # DIV
                r'<p\s',  # Párrafos con atributos
                r'<span',  # SPAN
                r'style=',  # Atributos de estilo
                r'class=',  # Atributos de clase
            ]
            
            suspicious_patterns_list = [
                r'font-family:',
                r'margin:',
                r'padding:',
                r'color:#',
                r'background-color:',
                r'text-align:',
                r'font-size:',
                r'line-height:',
            ]
            
            print("\nPrimeros 5 fragmentos:")
            for i, chunk in enumerate(chunks[:5]):
                text = chunk['text']
                print(f"\n--- Fragmento {i+1} ---")
                print(f"Longitud: {len(text)} caracteres")
                print(f"Texto (primeros 200 chars): {text[:200]}...")
                
                # Verificar HTML
                for pattern in html_patterns:
                    matches = re.findall(pattern, text, re.IGNORECASE)
                    if matches:
                        html_found += 1
                        print(f"  ⚠️  HTML encontrado: {matches[:3]}...")
                
                # Verificar patrones sospechosos
                for pattern in suspicious_patterns_list:
                    matches = re.findall(pattern, text, re.IGNORECASE)
                    if matches:
                        suspicious_patterns += 1
                        print(f"  ⚠️  Patrón sospechoso: {pattern} -> {matches[:3]}...")
            
            print(f"\n📊 RESUMEN:")
            print(f"   - Fragmentos con HTML: {html_found}")
            print(f"   - Fragmentos con patrones sospechosos: {suspicious_patterns}")
            
            # Verificar algunos fragmentos aleatorios del medio y final
            if len(chunks) > 10:
                middle_idx = len(chunks) // 2
                end_idx = len(chunks) - 1
                
                print(f"\n--- Fragmento del medio ({middle_idx}) ---")
                middle_text = chunks[middle_idx]['text']
                print(f"Texto (primeros 300 chars): {middle_text[:300]}...")
                
                print(f"\n--- Último fragmento ({end_idx}) ---")
                end_text = chunks[end_idx]['text']
                print(f"Texto (primeros 300 chars): {end_text[:300]}...")
        
        else:
            print("❌ Estructura de datos no reconocida")
            print(f"Claves encontradas: {list(data.keys()) if isinstance(data, dict) else 'No es diccionario'}")
    
    except Exception as e:
        print(f"❌ Error al leer {file_path}: {e}")

def main():
    contexto_dir = "/Users/Guest/Documents/sistema_registro/contexto_agente_ia"
    binary_files = [
        "estatuto_organico_ceavi.bin",
        "ley_general_victimas.bin", 
        "ley_victimas_vectores.bin",
        "manual_administrativo.bin",
        "reglamento_lvcdmx.bin",
        "reglas_operacion_fondo.bin"
    ]
    
    print("🔍 VERIFICACIÓN DE CONTENIDO DE ARCHIVOS BINARIOS")
    print("Buscando HTML, CSS y otros elementos no deseados...")
    
    for filename in binary_files:
        file_path = os.path.join(contexto_dir, filename)
        if os.path.exists(file_path):
            check_binary_content(file_path)
        else:
            print(f"\n❌ Archivo no encontrado: {filename}")
    
    print(f"\n{'='*60}")
    print("✅ VERIFICACIÓN COMPLETADA")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()

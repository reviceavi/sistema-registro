#!/usr/bin/env python3
"""
Script para analizar el formato de los archivos binarios existentes
"""
import os

def analyze_file_format(file_path):
    """Analizar el formato de un archivo"""
    try:
        with open(file_path, 'rb') as f:
            # Leer los primeros bytes para determinar el formato
            first_bytes = f.read(100)
            
        print(f"\n{'='*60}")
        print(f"ARCHIVO: {os.path.basename(file_path)}")
        print(f"{'='*60}")
        print(f"Tamaño: {os.path.getsize(file_path)} bytes")
        print(f"Primeros 20 bytes: {first_bytes[:20]}")
        print(f"Como hex: {first_bytes[:20].hex()}")
        print(f"Como texto (intentando): {first_bytes[:50].decode('utf-8', errors='ignore')}")
        
        # Verificar si es un formato específico
        if first_bytes.startswith(b'\x80\x03'):
            print("🔍 Formato detectado: Pickle protocolo 3")
        elif first_bytes.startswith(b'\x80\x04'):
            print("🔍 Formato detectado: Pickle protocolo 4")
        elif first_bytes.startswith(b'\x80\x05'):
            print("🔍 Formato detectado: Pickle protocolo 5")
        elif first_bytes.startswith(b'PK'):
            print("🔍 Formato detectado: ZIP/Archive")
        elif first_bytes.startswith(b'\x1f\x8b'):
            print("🔍 Formato detectado: GZIP")
        else:
            print("🔍 Formato detectado: Desconocido/Custom")
        
    except Exception as e:
        print(f"❌ Error al analizar {file_path}: {e}")

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
    
    print("🔍 ANÁLISIS DE FORMATO DE ARCHIVOS BINARIOS")
    
    for filename in binary_files:
        file_path = os.path.join(contexto_dir, filename)
        if os.path.exists(file_path):
            analyze_file_format(file_path)
        else:
            print(f"\n❌ Archivo no encontrado: {filename}")

if __name__ == "__main__":
    main()

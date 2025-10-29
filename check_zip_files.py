#!/usr/bin/env python3
"""
Script para verificar y extraer contenido de archivos ZIP
"""
import zipfile
import os
import tempfile

def check_zip_files():
    contexto_dir = "/Users/Guest/Documents/sistema_registro/contexto_agente_ia"
    zip_files = [
        "estatuto_organico_ceavi.bin",
        "ley_general_victimas.bin",
        "reglamento_lvcdmx.bin",
        "reglas_operacion_fondo.bin"
    ]
    
    for filename in zip_files:
        file_path = os.path.join(contexto_dir, filename)
        print(f"\n{'='*60}")
        print(f"ARCHIVO: {filename}")
        print(f"{'='*60}")
        
        try:
            # Intentar abrir como ZIP
            with zipfile.ZipFile(file_path, 'r') as zip_file:
                print("✅ Es un archivo ZIP válido")
                print(f"Archivos dentro: {zip_file.namelist()}")
                
                # Extraer y leer el primer archivo
                if zip_file.namelist():
                    first_file = zip_file.namelist()[0]
                    with zip_file.open(first_file) as f:
                        content = f.read()
                        
                    # Intentar decodificar como texto
                    try:
                        text_content = content.decode('utf-8')
                        print(f"📄 Contenido del archivo {first_file}:")
                        print(f"   Tamaño: {len(text_content)} caracteres")
                        print(f"   Primeros 500 chars:")
                        print(f"   {text_content[:500]}...")
                        
                        # Buscar HTML
                        import re
                        html_patterns = [r'<[^>]+>', r'&[a-zA-Z]+;', r'style=', r'class=']
                        html_found = False
                        for pattern in html_patterns:
                            matches = re.findall(pattern, text_content, re.IGNORECASE)
                            if matches:
                                html_found = True
                                print(f"   ⚠️  HTML detectado ({pattern}): {len(matches)} coincidencias")
                        
                        if not html_found:
                            print("   ✅ No se detectó HTML")
                            
                    except UnicodeDecodeError:
                        print(f"   ❌ No se puede decodificar como texto UTF-8")
                        try:
                            text_content = content.decode('latin-1')
                            print(f"   📄 Decodificado como latin-1:")
                            print(f"   Primeros 500 chars: {text_content[:500]}...")
                        except:
                            print(f"   ❌ No se puede decodificar como texto")
        
        except zipfile.BadZipFile:
            print("❌ No es un archivo ZIP válido")
            # Intentar leer como texto plano
            try:
                with open(file_path, 'rb') as f:
                    content = f.read(1000)  # Primeros 1000 bytes
                
                print(f"Primeros 100 bytes como hex: {content[:100].hex()}")
                try:
                    text_preview = content.decode('utf-8', errors='ignore')
                    print(f"Como texto: {text_preview[:200]}...")
                except:
                    print("No se puede interpretar como texto")
            except Exception as e:
                print(f"Error leyendo archivo: {e}")
        
        except Exception as e:
            print(f"❌ Error procesando archivo: {e}")

if __name__ == "__main__":
    check_zip_files()

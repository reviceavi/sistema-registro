#!/usr/bin/env python3
"""
Script para verificar específicamente el contenido de ley_victimas_vectores.bin
que parece ser texto plano
"""
import re

def check_ley_victimas_content():
    file_path = "/Users/Guest/Documents/sistema_registro/contexto_agente_ia/ley_victimas_vectores.bin"
    
    try:
        with open(file_path, 'rb') as f:
            # Leer todo el contenido como bytes
            content_bytes = f.read()
        
        # Intentar decodificar como texto
        try:
            content_text = content_bytes.decode('utf-8', errors='ignore')
        except:
            content_text = content_bytes.decode('latin-1', errors='ignore')
        
        print(f"📄 CONTENIDO DE ley_victimas_vectores.bin")
        print(f"{'='*60}")
        print(f"Tamaño total: {len(content_text)} caracteres")
        
        # Mostrar primeros 1000 caracteres
        print(f"\n📖 PRIMEROS 1000 CARACTERES:")
        print("-" * 40)
        print(content_text[:1000])
        print("-" * 40)
        
        # Buscar patrones HTML
        html_patterns = [
            r'<[^>]+>',  # Tags HTML
            r'&[a-zA-Z]+;',  # Entidades HTML
            r'<!DOCTYPE',  # DOCTYPE
            r'<html',  # Tag HTML
            r'<body',  # Tag BODY
            r'<div',  # DIV
            r'<p\s',  # Párrafos con atributos
            r'<span',  # SPAN
            r'style=',  # Atributos de estilo
            r'class=',  # Atributos de clase
        ]
        
        print(f"\n🔍 BÚSQUEDA DE HTML:")
        html_found = False
        for pattern in html_patterns:
            matches = re.findall(pattern, content_text, re.IGNORECASE)
            if matches:
                html_found = True
                print(f"  ⚠️  {pattern}: {len(matches)} coincidencias")
                if len(matches) <= 10:
                    print(f"     Ejemplos: {matches}")
                else:
                    print(f"     Primeros 10: {matches[:10]}")
        
        if not html_found:
            print("  ✅ No se encontró HTML")
        
        # Buscar patrones CSS
        css_patterns = [
            r'font-family:',
            r'margin:',
            r'padding:',
            r'color:#',
            r'background-color:',
            r'text-align:',
            r'font-size:',
            r'line-height:',
            r'font-weight:',
        ]
        
        print(f"\n🎨 BÚSQUEDA DE CSS:")
        css_found = False
        for pattern in css_patterns:
            matches = re.findall(pattern, content_text, re.IGNORECASE)
            if matches:
                css_found = True
                print(f"  ⚠️  {pattern}: {len(matches)} coincidencias")
        
        if not css_found:
            print("  ✅ No se encontró CSS")
        
        # Mostrar últimos 500 caracteres
        print(f"\n📖 ÚLTIMOS 500 CARACTERES:")
        print("-" * 40)
        print(content_text[-500:])
        print("-" * 40)
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_ley_victimas_content()

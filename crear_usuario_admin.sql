# Script SQL para crear usuario administrador inicial

# Ejecutar en Supabase SQL Editor:

INSERT INTO users (email, username, password_hash, is_active, created_at) 
VALUES (
    'admin@ceavi.cdmx.gob.mx',
    'admin',
    'YWRtaW4xMjM=',  -- Esto es 'admin123' en base64 (cambiar por hash seguro en producción)
    true,
    NOW()
);

# Credenciales de prueba:
# Email: admin@ceavi.cdmx.gob.mx  
# Contraseña: admin123

# IMPORTANTE: Cambiar estas credenciales en producción

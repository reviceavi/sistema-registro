/**
 * Script para que SOLO los administradores creen usuarios en el sistema CEAVI
 * 
 * INSTRUCCIONES PARA ADMINISTRADORES:
 * 1. Ejecutar: node admin_create_user.js
 * 2. Ingresar datos del nuevo usuario cuando se solicite
 * 
 * IMPORTANTE: Solo ejecutar este script si eres administrador del sistema
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Configuración de Supabase (usar variables de entorno en producción)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
    console.error('❌ Error: Configure VITE_SUPABASE_URL en las variables de entorno');
    process.exit(1);
}

if (!supabaseServiceKey || supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY') {
    console.error('❌ Error: Configure SUPABASE_SERVICE_ROLE_KEY en las variables de entorno');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function createUser() {
    console.log('\n🔐 CREACIÓN DE USUARIO - SISTEMA CEAVI');
    console.log('=====================================');
    console.log('⚠️  SOLO para administradores del sistema\n');

    try {
        const email = await question('📧 Email del usuario: ');
        const username = await question('👤 Nombre de usuario: ');
        const password = await question('🔑 Contraseña: ');

        // Validaciones básicas
        if (!email || !username || !password) {
            console.log('❌ Todos los campos son obligatorios');
            return;
        }

        if (password.length < 8) {
            console.log('❌ La contraseña debe tener al menos 8 caracteres');
            return;
        }

        // Hash simple de la contraseña (mejorar en producción)
        const passwordHash = Buffer.from(password).toString('base64');

        // Insertar usuario en la tabla
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    email: email.toLowerCase().trim(),
                    username: username.trim(),
                    password_hash: passwordHash,
                    is_active: true
                }
            ])
            .select();

        if (error) {
            if (error.code === '23505') {
                console.log('❌ Error: Ya existe un usuario con ese email');
            } else {
                console.log('❌ Error al crear usuario:', error.message);
            }
            return;
        }

        console.log('\n✅ Usuario creado exitosamente:');
        console.log(`   📧 Email: ${email}`);
        console.log(`   👤 Username: ${username}`);
        console.log(`   🆔 ID: ${data[0].id}`);
        console.log('\n🎉 El usuario ya puede iniciar sesión en el sistema');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        rl.close();
    }
}

createUser();

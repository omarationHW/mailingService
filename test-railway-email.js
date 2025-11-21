// Script de prueba para verificar tracking con dominio personalizado
const fetch = require('node-fetch');

const API_URL = 'https://api.campaigns.xy.tech/api';

async function testEmail() {
  console.log('🧪 Probando envío de email con tracking desde Railway...\n');

  try {
    // Primero, necesitas hacer login para obtener un token
    console.log('📝 Por favor, proporciona credenciales de tu plataforma');
    console.log('   (necesitamos hacer login primero)\n');

    // O puedes crear un contacto y campaña manualmente desde tu plataforma web
    console.log('💡 INSTRUCCIONES:');
    console.log('1. Ve a tu plataforma en http://localhost:5173');
    console.log('2. Crea una campaña de prueba');
    console.log('3. Envíala a: omaration.rivera@gmail.com');
    console.log('\n4. Verifica en el email recibido que los links contengan:');
    console.log('   ✅ https://api.campaigns.xy.tech/api/track/open/...');
    console.log('   ✅ https://api.campaigns.xy.tech/api/track/click/...');
    console.log('\n5. ¡Resend ya no mostrará la advertencia de localhost! 🎉');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEmail();

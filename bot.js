// File: bot.js
// Menggunakan Node.js dengan framework Telegraf
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

// Inisialisasi bot dengan token dari .env
const bot = new Telegraf(process.env.BOT_TOKEN);

// Simpan data pengaturan untuk setiap pengguna
const userSettings = {};

// Middleware untuk memfilter pesan hanya dari pengguna yang diizinkan
bot.use(async (ctx, next) => {
  const allowedUsers = process.env.ALLOWED_USERS 
    ? process.env.ALLOWED_USERS.split(',') 
    : [];
  
  if (ctx.message && ctx.message.from && allowedUsers.includes(ctx.message.from.id.toString())) {
    return next();
  } else if (ctx.callbackQuery && ctx.callbackQuery.from && allowedUsers.includes(ctx.callbackQuery.from.id.toString())) {
    return next();
  } else if (ctx.message) {
    ctx.reply('Maaf, Anda tidak memiliki akses ke bot ini.');
  }
});

// Perintah start
bot.start(async (ctx) => {
  const userId = ctx.message.from.id;
  
  // Inisialisasi pengaturan default jika belum ada
  if (!userSettings[userId]) {
    userSettings[userId] = {
      temp_lower: 20,
      temp_upper: 35,
      humidity_lower: 40,
      humidity_upper: 80,
      notif_active: true
    };
  }
  
  await ctx.reply(
    `Selamat datang di Bot Monitoring Kolam Ikan! 🐟\n\n` +
    `Gunakan perintah berikut:\n` +
    `/status - Melihat status terkini\n` +
    `/notifon - Mengaktifkan notifikasi\n` +
    `/notifoff - Mematikan notifikasi\n` +
    `/settings - Menu pengaturan\n` +
    `/help - Bantuan`
  );
  
  // Tampilkan tombol untuk Mini App
  await ctx.reply(
    'Buka Mini App untuk melihat dashboard:',
    Markup.inlineKeyboard([
      Markup.button.webApp('🔍 Buka Dashboard', `https://kolam-monitoring.vercel.app/?start=${encodeSettings(userId)}`)
    ])
  );
});

// Perintah status
bot.command('status', async (ctx) => {
  try {
    const latestData = await fetchLatestData();
    if (latestData && !latestData.error) {
      const temp = parseFloat(latestData.temperature).toFixed(1);
      const humidity = parseFloat(latestData.humidity).toFixed(1);
      const lastUpdate = `${latestData.date} ${latestData.time}`;
      
      // Cek status berdasarkan thresholds
      const userId = ctx.message.from.id;
      const settings = userSettings[userId] || {
        temp_lower: 20,
        temp_upper: 35,
        humidity_lower: 40,
        humidity_upper: 80
      };
      
      let tempStatus = '✅ Normal';
      let humidStatus = '✅ Normal';
      
      if (temp < settings.temp_lower) {
        tempStatus = '❄️ Terlalu rendah!';
      } else if (temp > settings.temp_upper) {
        tempStatus = '🔥 Terlalu tinggi!';
      }
      
      if (humidity < settings.humidity_lower) {
        humidStatus = '🏜️ Terlalu rendah!';
      } else if (humidity > settings.humidity_upper) {
        humidStatus = '💦 Terlalu tinggi!';
      }
      
      await ctx.reply(
        `📊 <b>Status Kolam Ikan</b>\n\n` +
        `🌡️ Suhu: ${temp}°C (${tempStatus})\n` +
        `💧 Kelembapan: ${humidity}% (${humidStatus})\n\n` +
        `⏱️ Pembaruan terakhir: ${lastUpdate}\n\n` +
        `🔔 Notifikasi: ${userSettings[userId]?.notif_active ? 'Aktif ✅' : 'Nonaktif ❌'}\n` +
        `🌡️ Batas Suhu: ${settings.temp_lower} - ${settings.temp_upper}°C\n` +
        `💧 Batas Kelembapan: ${settings.humidity_lower} - ${settings.humidity_upper}%`,
        { parse_mode: 'HTML' }
      );
    } else {
      await ctx.reply('Belum ada data dari sensor. Silakan coba lagi nanti.');
    }
  } catch (error) {
    console.error('Error fetching status:', error);
    await ctx.reply('Terjadi kesalahan saat mengambil status. Silakan coba lagi nanti.');
  }
});

// Perintah notifon
bot.command('notifon', (ctx) => {
  const userId = ctx.message.from.id;
  if (!userSettings[userId]) {
    userSettings[userId] = {
      temp_lower: 20,
      temp_upper: 35,
      humidity_lower: 40,
      humidity_upper: 80,
      notif_active: true
    };
  } else {
    userSettings[userId].notif_active = true;
  }
  
  sendSettingsToESP(userId);
  
  ctx.reply('✅ Notifikasi telah diaktifkan!');
});

// Perintah notifoff
bot.command('notifoff', (ctx) => {
  const userId = ctx.message.from.id;
  if (!userSettings[userId]) {
    userSettings[userId] = {
      temp_lower: 20,
      temp_upper: 35,
      humidity_lower: 40,
      humidity_upper: 80,
      notif_active: false
    };
  } else {
    userSettings[userId].notif_active = false;
  }
  
  sendSettingsToESP(userId);
  
  ctx.reply('❌ Notifikasi telah dinonaktifkan!');
});

// Perintah settings
bot.command('settings', async (ctx) => {
  await ctx.reply(
    'Pilih pengaturan yang ingin diubah:',
    Markup.inlineKeyboard([
      [Markup.button.callback('🌡️ Batas Suhu', 'set_temp')],
      [Markup.button.callback('💧 Batas Kelembapan', 'set_humid')],
      [Markup.button.callback('🔔 Notifikasi', 'set_notif')],
      [Markup.button.webApp('📱 Buka Mini App', `https://your-vercel-app.vercel.app/?start=${encodeSettings(ctx.message.from.id)}`)]
    ])
  );
});

// Perintah help
bot.command('help', (ctx) => {
  ctx.reply(
    `📚 <b>Bantuan Bot Monitoring Kolam</b>\n\n` +
    `Perintah yang tersedia:\n\n` +
    `/status - Melihat status terkini kolam\n` +
    `/notifon - Mengaktifkan notifikasi\n` +
    `/notifoff - Mematikan notifikasi\n` +
    `/settings - Menu pengaturan batas\n` +
    `/settemp [min] [max] - Mengatur batas suhu\n` +
    `/sethumid [min] [max] - Mengatur batas kelembapan\n\n` +
    `Anda juga dapat menggunakan Mini App untuk tampilan dashboard dan pengaturan yang lebih lengkap.`,
    { parse_mode: 'HTML' }
  );
});

// Handler untuk data dari Mini App
bot.on('web_app_data', async (ctx) => {
  const userId = ctx.message.from.id;
  const data = JSON.parse(ctx.webAppData.data);
  
  if (data.action === 'saveSettings') {
    userSettings[userId] = data.settings;
    
    // Kirim pengaturan ke ESP8266
    sendSettingsToESP(userId);
    
    await ctx.reply('✅ Pengaturan telah disimpan!');
  }
});

// Handler untuk settemp
bot.command('settemp', (ctx) => {
  const userId = ctx.message.from.id;
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length !== 2) {
    return ctx.reply('❌ Format salah! Gunakan: /settemp [min] [max]\nContoh: /settemp 20 35');
  }
  
  const minTemp = parseFloat(args[0]);
  const maxTemp = parseFloat(args[1]);
  
  if (isNaN(minTemp) || isNaN(maxTemp)) {
    return ctx.reply('❌ Input harus berupa angka!');
  }
  
  if (minTemp >= maxTemp) {
    return ctx.reply('❌ Nilai minimum harus lebih kecil dari maksimum!');
  }
  
  if (!userSettings[userId]) {
    userSettings[userId] = {
      temp_lower: minTemp,
      temp_upper: maxTemp,
      humidity_lower: 40,
      humidity_upper: 80,
      notif_active: true
    };
  } else {
    userSettings[userId].temp_lower = minTemp;
    userSettings[userId].temp_upper = maxTemp;
  }
  
  sendSettingsToESP(userId);
  
  ctx.reply(`✅ Batas suhu diatur: ${minTemp} - ${maxTemp}°C`);
});

// Handler untuk sethumid
bot.command('sethumid', (ctx) => {
  const userId = ctx.message.from.id;
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length !== 2) {
    return ctx.reply('❌ Format salah! Gunakan: /sethumid [min] [max]\nContoh: /sethumid 40 80');
  }
  
  const minHumid = parseFloat(args[0]);
  const maxHumid = parseFloat(args[1]);
  
  if (isNaN(minHumid) || isNaN(maxHumid)) {
    return ctx.reply('❌ Input harus berupa angka!');
  }
  
  if (minHumid >= maxHumid) {
    return ctx.reply('❌ Nilai minimum harus lebih kecil dari maksimum!');
  }
  
  if (!userSettings[userId]) {
    userSettings[userId] = {
      temp_lower: 20,
      temp_upper: 35,
      humidity_lower: minHumid,
      humidity_upper: maxHumid,
      notif_active: true
    };
  } else {
    userSettings[userId].humidity_lower = minHumid;
    userSettings[userId].humidity_upper = maxHumid;
  }
  
  sendSettingsToESP(userId);
  
  ctx.reply(`✅ Batas kelembapan diatur: ${minHumid} - ${maxHumid}%`);
});

// Handler untuk tombol callback
bot.action('set_temp', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Masukkan batas suhu dengan format: /settemp [min] [max]\nContoh: /settemp 20 35');
});

bot.action('set_humid', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Masukkan batas kelembapan dengan format: /sethumid [min] [max]\nContoh: /sethumid 40 80');
});

bot.action('set_notif', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.callbackQuery.from.id;
  const isActive = userSettings[userId]?.notif_active !== false;
  
  await ctx.reply(
    `Status notifikasi saat ini: ${isActive ? 'Aktif ✅' : 'Nonaktif ❌'}`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Aktifkan', 'notif_on'),
        Markup.button.callback('❌ Nonaktifkan', 'notif_off')
      ]
    ])
  );
});

bot.action('notif_on', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.callbackQuery.from.id;
  
  if (!userSettings[userId]) {
    userSettings[userId] = {
      temp_lower: 20,
      temp_upper: 35,
      humidity_lower: 40,
      humidity_upper: 80,
      notif_active: true
    };
  } else {
    userSettings[userId].notif_active = true;
  }
  
  sendSettingsToESP(userId);
  
  await ctx.editMessageText('✅ Notifikasi telah diaktifkan!');
});

bot.action('notif_off', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.callbackQuery.from.id;
  
  if (!userSettings[userId]) {
    userSettings[userId] = {
      temp_lower: 20,
      temp_upper: 35,
      humidity_lower: 40,
      humidity_upper: 80,
      notif_active: false
    };
  } else {
    userSettings[userId].notif_active = false;
  }
  
  sendSettingsToESP(userId);
  
  await ctx.editMessageText('❌ Notifikasi telah dinonaktifkan!');
});

// Fungsi untuk mengambil data terbaru dari Google Sheets
async function fetchLatestData() {
  try {
    const response = await axios.post(
      'https://script.google.com/macros/s/KODE_DEPLOYMENT_ANDA/exec',
      'action=getLatest',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

// Fungsi untuk mengirim pengaturan ke ESP8266
function sendSettingsToESP(userId) {
  const settings = userSettings[userId];
  if (!settings) return;
  
  try {
    // Siapkan URL untuk ESP8266
    // Ganti dengan URL ESP8266 Anda
    const url = `http://ESP8266_IP_ADDRESS/settings?temp_lower=${settings.temp_lower}&temp_upper=${settings.temp_upper}&humidity_lower=${settings.humidity_lower}&humidity_upper=${settings.humidity_upper}&notif_active=${settings.notif_active ? 1 : 0}`;
    
    // Kirim permintaan ke ESP8266
    axios.get(url)
      .then(() => {
        console.log(`Settings sent to ESP8266 for user ${userId}`);
      })
      .catch((error) => {
        console.error(`Error sending settings to ESP8266: ${error.message}`);
      });
  } catch (error) {
    console.error('Error in sendSettingsToESP:', error);
  }
}

// Fungsi untuk mengkodekan pengaturan untuk URL Mini App
function encodeSettings(userId) {
  const settings = userSettings[userId];
  if (!settings) {
    return '';
  }
  
  return Buffer.from(JSON.stringify(settings)).toString('base64');
}

// Mulai bot
bot.launch().then(() => {
  console.log('Bot telah dijalankan!');
}).catch((err) => {
  console.error('Error saat menjalankan bot:', err);
});

// Tangani shutdown dengan anggun
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

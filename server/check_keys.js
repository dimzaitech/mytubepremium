const axios = require('axios');
require('dotenv').config();

const apiKeys = [
  process.env.YT_KEY_1, process.env.YT_KEY_2, process.env.YT_KEY_3,
  process.env.YT_KEY_4, process.env.YT_KEY_5, process.env.YT_KEY_6,
  process.env.YT_KEY_7, process.env.YT_KEY_8, process.env.YT_KEY_9,
  process.env.YT_KEY_10
].filter(key => key && key.trim() !== '');

console.log(`\n🕵️  MEMULAI PENGECEKAN ${apiKeys.length} API KEY...\n`);

const checkAllKeys = async () => {
  let activeCount = 0;
  let deadCount = 0;

  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[i];
    const maskedKey = key.slice(0, 5) + '...' + key.slice(-4);
    
    try {
      // Test request simple (Cari kata "Test")
      await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: { part: 'snippet', q: 'Test', maxResults: 1, key: key }
      });
      
      console.log(`✅ KEY ${i + 1} (${maskedKey}): AKTIF & AMAN!`);
      activeCount++;
      
    } catch (error) {
      deadCount++;
      const status = error.response ? error.response.status : 'Unknown';
      let msg = '';
      
      if (status === 403) msg = 'KUOTA HABIS / API BELUM DI-ENABLE';
      else if (status === 400) msg = 'KEY TIDAK VALID (Salah Copy?)';
      else msg = error.message;

      console.log(`❌ KEY ${i + 1} (${maskedKey}): MATI (Error ${status} - ${msg})`);
    }
  }

  console.log(`\n📊 LAPORAN AKHIR:`);
  console.log(`   Hidup: ${activeCount}`);
  console.log(`   Mati : ${deadCount}`);
  
  if (deadCount > 0) {
    console.log(`\n⚠️ SARAN: Cek Google Cloud Console untuk Key yang mati. Pastikan "YouTube Data API v3" sudah di-ENABLE.`);
  } else {
    console.log(`\n🚀 MANTAP! Semua Key sehat walafiat. Masalah bukan di Key.`);
  }
};

checkAllKeys();
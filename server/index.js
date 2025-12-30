const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// List API Key (Ganti dengan key lo sendiri atau biarkan ambil dari .env)
const apiKeys = [
  process.env.YT_KEY_1,
  process.env.YT_KEY_2,
  process.env.YT_KEY_3,
  process.env.YT_KEY_4,
  process.env.YT_KEY_5,
  process.env.YT_KEY_6,
  process.env.YT_KEY_7,
  process.env.YT_KEY_8,
  process.env.YT_KEY_9,
  process.env.YT_KEY_10
];

let currentKeyIndex = 0;

// Fungsi untuk mendapatkan Key yang aktif (Rotasi Key)
const getApiKey = () => {
  return apiKeys[currentKeyIndex];
};

// Fungsi untuk ganti ke Key berikutnya kalau limit habis
const rotateKey = () => {
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  console.log(`⚠️ Limit habis! Ganti ke API Key nomor: ${currentKeyIndex + 1}`);
};

app.get('/', (req, res) => {
  res.send('Server MyTube Premium Berjalan!');
});

app.get('/api/videos', async (req, res) => {
  const { q, search } = req.query;
  let query = q || 'trending indonesia';

  if (search) {
    query = search;
  }

  // Coba request pakai Key yang sekarang. Kalau gagal, ganti key dan coba lagi.
  const makeRequest = async (retryCount = 0) => {
    if (retryCount >= apiKeys.length) {
       // Kalau semua key udah dicoba dan gagal semua
       return res.status(429).json({ error: 'Semua API Key limit habis bro! Tunggu besok.' });
    }

    try {
      const apiKey = getApiKey();
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          maxResults: 20, // Hemat kuota
          key: apiKey,
          type: 'video',
          regionCode: 'ID'
        }
      });
      
      // Kirim hasil ke Frontend
      res.json(response.data.items.map(item => ({
        id: item.id.videoId,
        snippet: item.snippet,
        // Kita tambahin data dummy untuk durasi/views karena endpoint 'search' ga ngasih data detail
        // Ini biar hemat kuota (daripada nembak API 'videos' lagi)
        statistics: { viewCount: Math.floor(Math.random() * 1000000) },
        durationFormatted: "Video", 
        isLive: item.snippet.liveBroadcastContent === 'live'
      })));

    } catch (error) {
      // Cek kalau errornya 403 (Quota Exceeded)
      if (error.response && error.response.status === 403) {
        rotateKey(); // Ganti key
        return makeRequest(retryCount + 1); // Coba lagi (rekursif)
      } else {
        console.error("Error YouTube API:", error.message);
        res.status(500).json({ error: 'Gagal mengambil data dari YouTube' });
      }
    }
  };

  makeRequest();
});

// === KONFIGURASI SERVERLESS (VERCEL) ===
// Export app supaya Vercel bisa handle traffic-nya
module.exports = app;

// Hanya jalankan app.listen kalau di Local (Laptop)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
  });
}
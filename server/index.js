const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// === DATABASE CACHE ===
const cache = {}; 
const CACHE_DURATION = 1000 * 60 * 60; // 1 Jam

// === LIST API KEY ===
const apiKeys = [
  process.env.YT_KEY_1, process.env.YT_KEY_2, process.env.YT_KEY_3,
  process.env.YT_KEY_4, process.env.YT_KEY_5, process.env.YT_KEY_6,
  process.env.YT_KEY_7, process.env.YT_KEY_8, process.env.YT_KEY_9,
  process.env.YT_KEY_10
];

// === SYSTEM TRACKING KUOTA ASLI ===
let keyUsage = new Array(apiKeys.length).fill(0);
const DAILY_LIMIT = 10000; 

let currentKeyIndex = 0;
const getApiKey = () => apiKeys[currentKeyIndex];

const rotateKey = () => {
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  console.log(`⚠️ SYSTEM: Limit Habis / Error 403. Auto-Switch ke Key ${currentKeyIndex + 1}`);
};

const isLongVideo = (item) => {
  const duration = item.contentDetails?.duration;
  if (!duration) return false;
  if (duration === 'P0D') return true; 
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return false;
  const h = parseInt((match[1] || '').replace('H', '')) || 0;
  const m = parseInt((match[2] || '').replace('M', '')) || 0;
  const s = parseInt((match[3] || '').replace('S', '')) || 0;
  return ((h * 3600) + (m * 60) + s) >= 60;
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

app.get('/', (req, res) => res.send('Server MyTube Premium Ready 🚀'));

// === ENDPOINT SUGGESTIONS ===
app.get('/api/suggestions', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const response = await axios.get(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    res.json(response.data[1] || []);
  } catch (error) { res.json([]); }
});

// === ENDPOINT TOP CHANNELS (HEMAT KUOTA) ===
app.get('/api/top-channels', async (req, res) => {
  // Cek Cache khusus Channel
  if (cache['TOP_CHANNELS'] && (Date.now() - cache['TOP_CHANNELS'].timestamp < CACHE_DURATION)) {
    return res.json(cache['TOP_CHANNELS'].data);
  }

  const makeRequest = async (retryCount = 0) => {
    if (retryCount >= apiKeys.length) return res.status(429).json({ error: 'Limit Habis' });
    if (keyUsage[currentKeyIndex] >= DAILY_LIMIT) { rotateKey(); return makeRequest(retryCount); }

    try {
      const apiKey = getApiKey();
      
      // 1. Ambil Video Trending dulu (Biaya: 1 Unit)
      const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: { part: 'snippet', chart: 'mostPopular', regionCode: 'ID', maxResults: 50, key: apiKey }
      });
      keyUsage[currentKeyIndex] += 1;

      // 2. Ambil Channel ID yang unik dari video trending
      const channelIds = [...new Set(videoRes.data.items.map(item => item.snippet.channelId))].slice(0, 10).join(',');

      // 3. Ambil Detail Channel (Subscribers) (Biaya: 1 Unit)
      const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: { part: 'snippet,statistics', id: channelIds, key: apiKey }
      });
      keyUsage[currentKeyIndex] += 1;

      const channels = channelRes.data.items;
      
      // Simpan Cache
      cache['TOP_CHANNELS'] = { data: channels, timestamp: Date.now() };
      res.json(channels);

    } catch (error) {
      if (error.response && error.response.status === 403) { rotateKey(); return makeRequest(retryCount + 1); }
      else { res.status(500).json({ error: 'Error Fetching Channels' }); }
    }
  };
  makeRequest();
});

app.get('/api/quota', (req, res) => {
  const status = apiKeys.map((key, index) => ({
    keyName: `Key ${index + 1}`, used: keyUsage[index], limit: DAILY_LIMIT, isActive: index === currentKeyIndex,
    percentage: Math.round((keyUsage[index] / DAILY_LIMIT) * 100)
  }));
  res.json({ activeKeyIndex: currentKeyIndex, usage: status });
});

app.post('/api/set-key', (req, res) => {
  const { index } = req.body;
  if (typeof index === 'number' && index >= 0 && index < apiKeys.length) {
    currentKeyIndex = index;
    res.json({ success: true });
  } else { res.status(400).json({ error: 'Invalid' }); }
});

app.get('/api/videos', async (req, res) => {
  const { q, search, rand } = req.query;
  let query = q || 'trending indonesia';
  if (search) query = search;

  const isHomeRequest = (!q || q.toLowerCase() === 'beranda' || q === 'trending indonesia') && !search;
  const cacheKey = isHomeRequest ? 'HOME_VIP' : (q || search);

  if (!rand && cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_DURATION)) {
    return res.json(cache[cacheKey].data);
  }

  const makeRequest = async (retryCount = 0) => {
    if (retryCount >= apiKeys.length) return res.status(429).json({ error: 'Semua Limit Habis' });
    if (keyUsage[currentKeyIndex] >= DAILY_LIMIT) { rotateKey(); return makeRequest(retryCount); }

    try {
      const apiKey = getApiKey();
      let rawVideos = [];

      if (isHomeRequest) {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { part: 'snippet,contentDetails,statistics', chart: 'mostPopular', regionCode: 'ID', maxResults: 50, key: apiKey }
        });
        rawVideos = response.data.items;
        keyUsage[currentKeyIndex] += 1; 
      } else {
        const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: { part: 'snippet', q: q || search, maxResults: 50, key: apiKey, type: 'video', regionCode: 'ID' }
        });
        keyUsage[currentKeyIndex] += 100; 
        const searchItems = searchResponse.data.items;
        if (!searchItems || searchItems.length === 0) return res.json([]);
        const videoIds = searchItems.map(item => item.id.videoId).join(',');
        const detailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { part: 'snippet,contentDetails,statistics', id: videoIds, key: apiKey }
        });
        keyUsage[currentKeyIndex] += 1; 
        rawVideos = detailsResponse.data.items;
      }

      let longVideosOnly = rawVideos.filter(video => {
        if (!isLongVideo(video)) return false;
        if (video.snippet.title.toLowerCase().includes("#shorts")) return false;
        return true;
      });

      if (rand) { longVideosOnly = shuffleArray(longVideosOnly); }
      const finalData = longVideosOnly.slice(0, 12);
      if (!rand && finalData.length > 0) { cache[cacheKey] = { data: finalData, timestamp: Date.now() }; }
      res.json(finalData);

    } catch (error) {
      if (error.response && error.response.status === 403) { rotateKey(); return makeRequest(retryCount + 1); }
      else { res.status(500).json({ error: 'Error Fetching Data' }); }
    }
  };
  makeRequest();
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
}
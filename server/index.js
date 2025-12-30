const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

// === LOAD 10 API KEYS ===
const apiKeys = [
  process.env.YT_KEY_1, process.env.YT_KEY_2, process.env.YT_KEY_3,
  process.env.YT_KEY_4, process.env.YT_KEY_5, process.env.YT_KEY_6,
  process.env.YT_KEY_7, process.env.YT_KEY_8, process.env.YT_KEY_9,
  process.env.YT_KEY_10
].filter(key => key && key.trim() !== '');

let activeKeyIndex = 0;
console.log(`🚀 Backend siap! Memuat ${apiKeys.length} API Key.`);

// === CRON JOB: RESET SETIAP JAM 15:00 WIB (SESUAI RESET GOOGLE) ===
// Google reset jam 00:00 PT = Jam 15:00 WIB
cron.schedule('0 15 * * *', () => {
  console.log('🕒 SUDAH JAM 3 SORE! KUOTA GOOGLE SUDAH FRESH. RESET KEY PRIORITY...');
  activeKeyIndex = 0;
}, { scheduled: true, timezone: "Asia/Jakarta" });

// === HELPER FORMAT DURASI ===
const convertDuration = (isoDuration) => {
  if (!isoDuration) return "00:00";
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getDurationInSeconds = (isoDuration) => {
  if (!isoDuration) return 0;
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);
  return (hours * 3600) + (minutes * 60) + seconds;
};

// === HELPER FETCH ROTASI ===
const fetchWithRotation = async (endpoint, params) => {
  let lastError = null;
  const totalKeys = apiKeys.length;
  if (totalKeys === 0) throw new Error("Tidak ada API Key valid!");

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const currentIndex = (activeKeyIndex + attempt) % totalKeys;
    const currentKey = apiKeys[currentIndex];
    try {
      const response = await axios.get(endpoint, { params: { ...params, key: currentKey } });
      activeKeyIndex = currentIndex;
      return response;
    } catch (error) {
      lastError = error;
      const status = error.response ? error.response.status : 500;
      if (status === 403 || status === 429) {
        console.warn(`⚠️ Key-${currentIndex + 1} Limit. Next...`);
        continue; 
      } else { throw error; }
    }
  }
  console.error("❌ SEMUA KEY MATI.");
  throw lastError;
};

app.get('/api/videos', async (req, res) => {
  try {
    const category = req.query.q || 'Beranda';
    const userSearch = req.query.search;

    // ==========================================
    // 🔍 MODE PENCARIAN
    // ==========================================
    if (userSearch && userSearch.trim() !== '') {
      console.log(`🔍 Searching: "${userSearch}" di Navbar "${category}"`);
      
      let finalQuery = userSearch;
      
      let searchParams = {
        part: 'snippet',
        type: 'video',
        maxResults: 20, 
        regionCode: 'ID', 
        relevanceLanguage: 'id'
      };

      switch (category) {
        case 'Beranda':
          delete searchParams.regionCode;
          delete searchParams.relevanceLanguage;
          finalQuery = userSearch; 
          break;
        case 'Musik':
          finalQuery = `${userSearch} music video official audio`;
          break;
        case 'Karaoke':
          finalQuery = `${userSearch} karaoke no vocal lirik`;
          break;
        case 'Berita':
          finalQuery = `${userSearch} news berita terkini`;
          break;
        case 'Live TV':
          finalQuery = `${userSearch} live streaming tv`;
          searchParams.eventType = 'live'; 
          break;
        case 'Film':
          delete searchParams.regionCode;
          delete searchParams.relevanceLanguage;
          finalQuery = `${userSearch} full movie`;
          searchParams.videoDuration = 'long';
          break;
        case 'Horror':
          finalQuery = `${userSearch} horror ghost penampakan`;
          break;
        case 'Kuliner':
          finalQuery = `${userSearch} food kuliner resep`;
          break;
        case 'Hobby':
          finalQuery = `${userSearch} hobby tutorial cara`;
          break;
        default:
          finalQuery = userSearch;
      }

      const response = await fetchWithRotation('https://www.googleapis.com/youtube/v3/search', {
        ...searchParams,
        q: finalQuery,
      });

      const videoIds = response.data.items.map(item => item.id.videoId).join(',');
      if (!videoIds) return res.json([]);

      const detailsResponse = await fetchWithRotation('https://www.googleapis.com/youtube/v3/videos', {
        part: 'snippet,statistics,contentDetails',
        id: videoIds
      });

      const validVideos = detailsResponse.data.items.filter(item => {
        if (category === 'Live TV') return true; 
        if (category === 'Film') return item.contentDetails.duration.includes('H');
        return getDurationInSeconds(item.contentDetails.duration) >= 60;
      });

      const finalData = validVideos.slice(0, 12).map(item => ({
        id: item.id,
        snippet: item.snippet,
        statistics: item.statistics,
        durationFormatted: category === 'Live TV' ? "LIVE" : convertDuration(item.contentDetails.duration),
        isLive: category === 'Live TV'
      }));

      return res.json(finalData);
    }

    // ==========================================
    // 🏠 MODE NORMAL
    // ==========================================
    console.log(`📥 Request Menu: ${category}`);

    if (category === 'Beranda') {
      const mixedQuery = 'Berita Indonesia|Musik Indonesia|Kuliner Indonesia|Gadget Indonesia|Vlog Indonesia|Horror Indonesia';
      const [responseNew, responseViral] = await Promise.all([
        fetchWithRotation('https://www.googleapis.com/youtube/v3/search', {
          part: 'snippet', q: mixedQuery, order: 'date', type: 'video', regionCode: 'ID', relevanceLanguage: 'id', maxResults: 25
        }),
        fetchWithRotation('https://www.googleapis.com/youtube/v3/videos', {
          part: 'snippet,statistics,contentDetails', chart: 'mostPopular', regionCode: 'ID', maxResults: 25
        })
      ]);
      const newIds = responseNew.data.items.map(item => item.id.videoId).join(',');
      let validNewVideos = [];
      if (newIds) {
        const detailsNew = await fetchWithRotation('https://www.googleapis.com/youtube/v3/videos', { part: 'snippet,statistics,contentDetails', id: newIds });
        validNewVideos = detailsNew.data.items.filter(item => getDurationInSeconds(item.contentDetails.duration) >= 60);
      }
      const validViralVideos = responseViral.data.items.filter(item => getDurationInSeconds(item.contentDetails.duration) >= 60);
      const combined = [];
      const maxLength = Math.max(validNewVideos.length, validViralVideos.length);
      for (let i = 0; i < maxLength; i++) {
        if (validViralVideos[i]) combined.push(validViralVideos[i]);
        if (validNewVideos[i]) combined.push(validNewVideos[i]);
      }
      const finalData = combined.slice(0, 12).map(item => ({ id: item.id, snippet: item.snippet, statistics: item.statistics, durationFormatted: convertDuration(item.contentDetails.duration), isLive: false }));
      res.json(finalData);
    } 
    else if (category === 'Horror') {
      const queryHorror = 'Penampakan Hantu Nyata Indonesia|Ekspedisi Horror Indonesia|Uji Nyali Indonesia|Ghost Hunting Indonesia -film -movie -trailer -sinopsis';
      const response = await fetchWithRotation('https://www.googleapis.com/youtube/v3/search', { part: 'snippet', q: queryHorror, type: 'video', regionCode: 'ID', relevanceLanguage: 'id', maxResults: 50 });
      const videoIds = response.data.items.map(item => item.id.videoId).join(',');
      if (!videoIds) return res.json([]);
      const detailsResponse = await fetchWithRotation('https://www.googleapis.com/youtube/v3/videos', { part: 'snippet,statistics,contentDetails', id: videoIds });
      const longVideos = detailsResponse.data.items.filter(item => getDurationInSeconds(item.contentDetails.duration) >= 60);
      const finalData = longVideos.slice(0, 12).map(item => ({ id: item.id, snippet: item.snippet, statistics: item.statistics, durationFormatted: convertDuration(item.contentDetails.duration), isLive: false }));
      res.json(finalData);
    }
    else if (category.startsWith('Film')) {
      const genre = category.replace('Film', '').trim() || 'Bioskop'; 
      const queryFilm = `Film ${genre} Indonesia Full Movie -alur -cerita -review -recap -trailer -cuplikan -spoiler -short`;
      const searchResponse = await fetchWithRotation('https://www.googleapis.com/youtube/v3/search', { part: 'id', q: queryFilm, type: 'video', videoDuration: 'long', regionCode: 'ID', relevanceLanguage: 'id', maxResults: 50 });
      const videoIds = searchResponse.data.items.map(item => item.id.videoId).join(',');
      if (!videoIds) return res.json([]);
      const detailsResponse = await fetchWithRotation('https://www.googleapis.com/youtube/v3/videos', { part: 'snippet,statistics,contentDetails', id: videoIds });
      const realMovies = detailsResponse.data.items.filter(video => video.contentDetails.duration.includes('H'));
      const finalData = realMovies.slice(0, 12).map(item => ({ id: item.id, snippet: item.snippet, statistics: item.statistics, durationFormatted: convertDuration(item.contentDetails.duration), isLive: false }));
      res.json(finalData);
    }
    else if (category === 'Explorasi') {
      const response = await fetchWithRotation('https://www.googleapis.com/youtube/v3/videos', { part: 'snippet,statistics,contentDetails', chart: 'mostPopular', regionCode: 'ID', maxResults: 50 });
      const longVideos = response.data.items.filter(item => getDurationInSeconds(item.contentDetails.duration) >= 60);
      const finalData = longVideos.slice(0, 12).map(item => ({ ...item, durationFormatted: convertDuration(item.contentDetails.duration), isLive: false }));
      res.json(finalData);
    }
    else if (category === 'Shorts') {
      const response = await fetchWithRotation('https://www.googleapis.com/youtube/v3/search', { part: 'snippet', q: 'Shorts Indonesia Lucu', type: 'video', videoDuration: 'short', regionCode: 'ID', relevanceLanguage: 'id', maxResults: 12 });
      const videoIds = response.data.items.map(item => item.id.videoId).join(',');
      if (!videoIds) return res.json([]);
      const detailsResponse = await fetchWithRotation('https://www.googleapis.com/youtube/v3/videos', { part: 'snippet,statistics,contentDetails', id: videoIds });
      const finalData = detailsResponse.data.items.map(item => ({ id: item.id, snippet: item.snippet, statistics: item.statistics, durationFormatted: convertDuration(item.contentDetails.duration), isLive: false }));
      res.json(finalData);
    }
    else if (category === 'Live TV') {
      const response = await fetchWithRotation('https://www.googleapis.com/youtube/v3/search', { part: 'snippet', q: 'TV Indonesia Live Streaming Berita', type: 'video', eventType: 'live', regionCode: 'ID', relevanceLanguage: 'id', maxResults: 12 });
      const formattedItems = response.data.items.map(item => ({ ...item, id: item.id.videoId, statistics: { viewCount: 'Live' }, durationFormatted: "LIVE", isLive: true }));
      res.json(formattedItems);
    }
    else {
      const searchQuery = category + ' Indonesia'; 
      const searchResponse = await fetchWithRotation('https://www.googleapis.com/youtube/v3/search', { part: 'id', q: searchQuery, type: 'video', regionCode: 'ID', relevanceLanguage: 'id', maxResults: 50 });
      const videoIds = searchResponse.data.items.map(item => item.id.videoId).join(',');
      if (videoIds) {
        const detailsResponse = await fetchWithRotation('https://www.googleapis.com/youtube/v3/videos', { part: 'snippet,statistics,contentDetails', id: videoIds });
        const longVideos = detailsResponse.data.items.filter(item => getDurationInSeconds(item.contentDetails.duration) >= 60);
        const finalData = longVideos.slice(0, 12).map(item => ({ id: item.id, snippet: item.snippet, statistics: item.statistics, durationFormatted: convertDuration(item.contentDetails.duration), isLive: false }));
        res.json(finalData);
      } else { res.json([]); }
    }

  } catch (error) {
    console.error('❌ ERROR HANDLER:', error.message);
    res.status(500).json({ error: 'Server gagal mengambil data.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server Backend berjalan di http://localhost:${PORT}`);
});
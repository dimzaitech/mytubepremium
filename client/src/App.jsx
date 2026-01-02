import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  FaBars, FaYoutube, FaSearch, FaUserCircle, FaTimes, FaArrowLeft, 
  FaHome, FaPlayCircle, FaHistory, 
  FaMusic, FaMicrophone, FaNewspaper, FaBroadcastTower, FaFilm, 
  FaUtensils, FaPlane, FaGamepad, FaSpinner, FaRedo, FaCog, FaCheckCircle, 
  FaLock, FaSave, FaClosedCaptioning, FaUsers, FaBookmark
} from 'react-icons/fa';

// === CONFIG ===
const isProduction = window.location.hostname !== 'localhost';
const BACKEND_URL = isProduction ? "" : "http://localhost:3000";
const DEFAULT_PIN = "1945";

const ICON_MAP = {
  "Beranda": <FaHome />,
  "Langganan": <FaBookmark />, 
  "History": <FaHistory />,
  "Musik": <FaMusic />,
  "Karaoke": <FaMicrophone />,
  "Berita": <FaNewspaper />,
  "Live TV": <FaBroadcastTower />,
  "Film": <FaFilm />,
  "Kuliner": <FaUtensils />,
  "Travelling": <FaPlane />
};

const SECTION_CONFIG = {
  "Musik": [
    { title: "Lagu Hits Indonesia 2025", query: "Lagu Pop Indonesia Terbaru 2025" },
    { title: "Top Chart Global", query: "Top Hits Spotify Global" },
    { title: "Dangdut Koplo Viral", query: "Dangdut Koplo Terbaru" },
    { title: "Cover Akustik Santuy", query: "Acoustic Cover Indonesia" },
    { title: "Rock Barat 90an", query: "Best Rock Songs 90s" }
  ],
  "Film": [
    { title: "Hollywood Action Blockbuster", query: "Best Action Movie Full Movie Sub Indo Box Office" },
    { title: "Horor Dunia (Barat/Asia)", query: "Best Horror Movie Full Movie Sub Indo Seram" },
    { title: "Film Korea Populer", query: "Korean Movie Full Movie Sub Indo Terbaik" },
    { title: "Komedi Internasional", query: "Best Comedy Movie Full Movie Sub Indo Funny" },
    { title: "Mandarin & Kung Fu", query: "Best Kung Fu Action Movie Mandarin Sub Indo" },
    { title: "Thriller & Misteri Global", query: "Best Thriller Mystery Movie Full Movie Sub Indo" },
    { title: "Sci-Fi & Fantasi Terbaik", query: "Sci-Fi Fantasy Movie Full Movie Sub Indo" },
    { title: "Film India / Bollywood", query: "Bollywood Movie Full Movie Sub Indo Action Love" }
  ],
  "Berita": [
    { title: "Top Stories", query: "Berita Terkini TV One Kompas TV" },
    { title: "Politik & Hukum", query: "Berita Politik Indonesia Terbaru" },
    { title: "Dunia", query: "Berita Internasional Terkini" },
    { title: "Olahraga", query: "Berita Bola Timnas Indonesia" },
    { title: "Teknologi", query: "Berita Teknologi Gadget Terbaru" }
  ],
  "Live TV": [
    { title: "TV Nasional (RCTI, SCTV, Indosiar)", query: "Live Streaming RCTI SCTV Indosiar Trans7 MNCTV GTV Indonesia" },
    { title: "Berita 24 Jam (TVOne, Kompas)", query: "Live Streaming TVOne Kompas TV CNN Indonesia Metro TV Berita Terkini" },
    { title: "Live Musik Indonesia", query: "Live Music Performance Indonesia Cafe" } 
  ]
};

const SkeletonCard = () => (
  <div className="flex flex-col gap-2 animate-pulse">
    <div className="aspect-video bg-[#272727] rounded-xl w-full"></div>
    <div className="flex gap-3">
      <div className="w-9 h-9 bg-[#272727] rounded-full flex-shrink-0"></div>
      <div className="flex flex-col gap-2 w-full">
        <div className="h-4 bg-[#272727] rounded w-3/4"></div>
        <div className="h-3 bg-[#272727] rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

const TopChannels = () => {
  const [channels, setChannels] = useState([]);
  
  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/top-channels`)
      .then(res => setChannels(res.data))
      .catch(err => console.error(err));
  }, []);

  const formatSubs = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num;
  };

  if (channels.length === 0) return null;

  return (
    <div className="mt-2 mb-8 border-b border-[#272727] pb-8">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 px-1 text-gray-200">
        <FaUsers className="text-red-500" /> Top Trending Channels
      </h3>
      <div className="flex gap-6 overflow-x-auto pb-4 px-1 scrollbar-hide">
        {channels.map(channel => (
          <div key={channel.id} className="flex flex-col items-center min-w-[90px] cursor-pointer group">
            <div className="relative w-16 h-16 mb-2">
              <img src={channel.snippet.thumbnails.medium.url} className="w-full h-full rounded-full object-cover border-2 border-transparent group-hover:border-red-600 transition-all shadow-lg" />
            </div>
            <h4 className="text-xs font-bold text-center line-clamp-1 group-hover:text-white text-gray-400 w-full overflow-hidden">
              {channel.snippet.title}
            </h4>
            <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
              {formatSubs(channel.statistics.subscriberCount)} • <FaCheckCircle className="text-[8px] text-gray-600" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuotaModal = ({ onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [isPinSaved, setIsPinSaved] = useState(false);

  const fetchQuota = () => {
    setLoading(true);
    axios.get(`${BACKEND_URL}/api/quota`)
      .then(res => { setStats(res.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchQuota(); }, []);

  const handleSwitchKey = (index) => {
    if (confirm(`Yakin mau paksa pindah ke Key ${index + 1}?`)) {
      setSwitching(true);
      axios.post(`${BACKEND_URL}/api/set-key`, { index })
        .then(() => { fetchQuota(); setSwitching(false); })
        .catch(() => setSwitching(false));
    }
  };

  const handleSavePin = (e) => {
    e.preventDefault();
    if (newPin.length < 4) { alert("PIN minimal 4 karakter!"); return; }
    localStorage.setItem('mytube_app_pin', newPin);
    setIsPinSaved(true);
    setNewPin("");
    setTimeout(() => setIsPinSaved(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#1f1f1f] w-full max-w-md rounded-2xl p-6 border border-[#333] shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 bg-[#2a2a2a] rounded-full"><FaTimes /></button>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><FaCog className="text-blue-500" /> Pengaturan Admin</h2>
        
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-[#333] pb-2">Status API Key</h3>
          {loading || switching ? (
            <div className="flex justify-center py-4 flex-col items-center gap-2">
               <FaSpinner className="animate-spin text-2xl text-blue-500" />
               <span className="text-xs text-gray-400">{switching ? "Mengganti Key..." : "Memuat Data..."}</span>
            </div>
          ) : stats ? (
            <div className="flex flex-col gap-3">
              {stats.usage.map((key, idx) => (
                <div key={idx} className={`p-3 rounded-xl border transition-all ${key.isActive ? 'border-green-500 bg-[#1a2e1a]' : 'border-[#333] bg-[#121212]'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${key.isActive ? 'text-white' : 'text-gray-400'}`}>{key.keyName}</span>
                      {key.isActive ? (
                        <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><FaCheckCircle/> AKTIF</span>
                      ) : (
                        <button onClick={() => handleSwitchKey(idx)} className="text-[10px] bg-[#333] hover:bg-blue-600 text-white px-3 py-1 rounded-full font-bold transition-colors border border-gray-600">Gunakan</button>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{key.used} / {key.limit} Unit</span>
                  </div>
                  <div className="w-full h-2 bg-[#333] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${key.percentage > 90 ? 'bg-red-500' : key.percentage > 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${key.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (<p className="text-red-500 text-center">Gagal memuat data.</p>)}
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-300 mb-3 border-b border-[#333] pb-2">Keamanan</h3>
          <form onSubmit={handleSavePin} className="bg-[#121212] p-4 rounded-xl border border-[#333]">
            <label className="text-xs text-gray-400 mb-2 block">Ganti PIN Akses Admin (Default: 1945)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FaLock className="absolute left-3 top-3 text-gray-500 text-sm" />
                <input type="number" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="PIN Baru..." className="w-full bg-[#222] text-white pl-9 pr-4 py-2 rounded-lg text-sm outline-none focus:border-blue-500 border border-[#333]"/>
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"><FaSave /> Simpan</button>
            </div>
            {isPinSaved && <p className="text-green-500 text-xs mt-2 flex items-center gap-1 animate-pulse"><FaCheckCircle/> PIN Berhasil Disimpan!</p>}
          </form>
        </div>
        <div className="mt-2 text-center pt-2"><p className="text-[10px] text-gray-600">MyTube Premium v2.0 - Private Build</p></div>
      </div>
    </div>
  );
};

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false); 
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('mytube_admin_token') === 'true');
  const [logoClicks, setLogoClicks] = useState(0); 
  
  const [videos, setVideos] = useState([]); 
  const [sectionData, setSectionData] = useState({}); 
  const [heroVideo, setHeroVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]); 
  
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false); 
  
  const [selectedCategory, setSelectedCategory] = useState("Beranda");
  const [searchTerm, setSearchTerm] = useState(""); 
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  const [forceGridMode, setForceGridMode] = useState(false); 
  const [suggestions, setSuggestions] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false); 
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const skipSuggestionFetch = useRef(false);
  // REF BARU: UNTUK BLOKIR SARAN TOTAL
  const blockSuggestionsRef = useRef(false);
  
  const preventResetRef = useRef(false);

  const [historyVideos, setHistoryVideos] = useState(() => JSON.parse(localStorage.getItem('mytube_history')) || []);
  
  const [savedChannels, setSavedChannels] = useState(() => JSON.parse(localStorage.getItem('mytube_saved_channels')) || []);

  const categories = ["Beranda", "Musik", "Karaoke", "Berita", "Live TV", "Film", "Kuliner", "Travelling"];
  const allSidebarItems = ["Beranda", "Langganan", "History", ...categories.slice(1)]; 

  const toggleSaveChannel = (video) => {
    const channelId = video.snippet.channelId;
    const channelTitle = video.snippet.channelTitle;
    const exists = savedChannels.find(c => c.id === channelId);
    let newSaved;
    if (exists) {
      newSaved = savedChannels.filter(c => c.id !== channelId);
    } else {
      newSaved = [...savedChannels, { id: channelId, title: channelTitle }];
    }
    setSavedChannels(newSaved);
    localStorage.setItem('mytube_saved_channels', JSON.stringify(newSaved));
  };

  const isChannelSaved = (channelId) => {
    return savedChannels.some(c => c.id === channelId);
  };

  useEffect(() => {
    // 1. CEK APAKAH DIBLOKIR TOTAL? (Gara-gara klik channel)
    if (blockSuggestionsRef.current) {
       // Jangan reset block di sini, resetnya pas user ngetik manual di onChange
       setSuggestions([]);
       setShowSuggestions(false);
       return;
    }

    if (skipSuggestionFetch.current) { skipSuggestionFetch.current = false; return; }
    if (!searchTerm) { setSuggestions([]); setShowSuggestions(false); setSelectedIndex(-1); return; }
    
    const delayDebounceFn = setTimeout(() => {
      axios.get(`${BACKEND_URL}/api/suggestions?q=${encodeURIComponent(searchTerm)}`)
        .then(res => { setSuggestions(res.data); setShowSuggestions(true); setSelectedIndex(-1); })
        .catch(err => console.error("Error saran:", err));
    }, 300); 
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSuggestionClick = (suggestedText) => {
    skipSuggestionFetch.current = true;
    setSearchTerm(suggestedText);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setSectionData({}); 
    setForceGridMode(true); 
    fetchGridVideos(suggestedText);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1)); }
    else if (e.key === "Enter") {
      if (selectedIndex >= 0) { e.preventDefault(); handleSuggestionClick(suggestions[selectedIndex]); }
      else { setShowSuggestions(false); }
    } else if (e.key === "Escape") { setShowSuggestions(false); }
  };

  const observer = useRef();
  const lastVideoElementRef = useCallback(node => {
    if (loading || isLoadingMore || selectedCategory === "Beranda" || selectedCategory === "Travelling") return; 
    if (SECTION_CONFIG[selectedCategory] && !forceGridMode) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        const query = searchTerm || (forceGridMode ? selectedCategory : selectedCategory); 
        if (!selectedVideo) { fetchGridVideos(query, true); }
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, isLoadingMore, selectedCategory, searchTerm, selectedVideo, forceGridMode]);

  const isLongVideo = (video) => {
    if (video.snippet.title.toLowerCase().includes("#shorts")) return false;
    const duration = video.contentDetails?.duration;
    if (duration === 'P0D') return true; 
    if (!duration) return false; 
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return false;
    const h = parseInt((match[1] || '').replace('H', '')) || 0;
    const m = parseInt((match[2] || '').replace('M', '')) || 0;
    const s = parseInt((match[3] || '').replace('S', '')) || 0;
    return ((h * 3600) + (m * 60) + s) >= 60;
  };

  const formatDuration = (video) => {
    const isoDuration = video.contentDetails?.duration;
    if (isoDuration === 'P0D') return "LIVE";
    if (!isoDuration) return ""; 
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return "";
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    if (hours) return `${hours}:${(minutes || "0").padStart(2, '0')}:${(seconds || "0").padStart(2, '0')}`;
    return `${minutes || "0"}:${(seconds || "0").padStart(2, '0')}`;
  };

  const fetchGridVideos = async (query, isLoadMore = false) => {
    if (isLoadMore) setIsLoadingMore(true);
    else { setLoading(true); if(!isLoadMore) setVideos([]); }
    try {
      let queryToSend = query;
      if (query === 'Travelling') queryToSend = 'Wisata Indonesia Vlog Jalan Jalan';
      let url = `${BACKEND_URL}/api/videos?q=${encodeURIComponent(queryToSend)}`;
      if (isLoadMore) url += `&rand=${Math.random()}`;
      const res = await axios.get(url);
      const newVideos = res.data.filter(isLongVideo); 
      if (isLoadMore) {
        setVideos(prev => {
           const combined = [...prev, ...newVideos];
           return combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        });
      } else {
        setVideos(newVideos);
        if (newVideos.length > 0) setHeroVideo(newVideos[0]); 
      }
    } catch (err) { console.error(err); } finally { setLoading(false); setIsLoadingMore(false); }
  };

  const handleManualLoadMore = () => {
    const query = searchTerm || (forceGridMode ? selectedCategory : selectedCategory);
    fetchGridVideos(query, true);
  };

  const handleSeeAll = (sectionQuery) => {
    setForceGridMode(true);
    fetchGridVideos(sectionQuery);
    window.scrollTo(0, 0);
  };

  const fetchSections = async (category) => {
    setLoading(true);
    setSectionData({}); 
    setHeroVideo(null);
    const sections = SECTION_CONFIG[category];
    const newSectionData = {};
    try {
      const heroUrl = `${BACKEND_URL}/api/videos?q=${encodeURIComponent(sections[0].query)}`;
      const heroRes = await axios.get(heroUrl);
      const validHero = heroRes.data.filter(isLongVideo);
      if(validHero.length > 0) setHeroVideo(validHero[0]);
      await Promise.all(sections.map(async (sec) => {
        const url = `${BACKEND_URL}/api/videos?q=${encodeURIComponent(sec.query)}`;
        const res = await axios.get(url);
        const validVideos = res.data.filter(isLongVideo);
        if (validVideos.length > 0) newSectionData[sec.title] = validVideos;
      }));
      setSectionData(newSectionData);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (preventResetRef.current) {
      preventResetRef.current = false; 
      return; 
    }

    setSelectedVideo(null);
    setSearchTerm("");
    setForceGridMode(false); 
    setSuggestions([]);
    setShowSuggestions(false);
    
    if (selectedCategory === "Langganan") return;

    if (SECTION_CONFIG[selectedCategory]) {
      fetchSections(selectedCategory);
    } else {
      fetchGridVideos(selectedCategory);
    }
  }, [selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    if(!searchTerm.trim()) return;
    skipSuggestionFetch.current = true;
    setSectionData({}); 
    setForceGridMode(true); 
    setShowSuggestions(false);
    fetchGridVideos(searchTerm);
    setShowMobileSearch(false);
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setRelatedVideos([]);
    const newHist = [video, ...historyVideos.filter(v => v.id !== video.id)].slice(0, 20);
    setHistoryVideos(newHist);
    localStorage.setItem('mytube_history', JSON.stringify(newHist));
    window.scrollTo(0, 0);
    axios.get(`${BACKEND_URL}/api/videos?q=${encodeURIComponent(video.snippet.channelTitle)}`)
      .then(res => {
         const validRelated = res.data.filter(v => v.id !== video.id).filter(isLongVideo);
         setRelatedVideos(validRelated);
      });
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 768) setIsMobileMenuOpen(!isMobileMenuOpen);
    else setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSecretLogoClick = () => {
    if (isAdmin) return; 
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    if (newCount >= 5) {
      const savedPin = localStorage.getItem('mytube_app_pin') || DEFAULT_PIN;
      const inputPin = prompt("🔐 Masukkan PIN Admin:");
      if (inputPin === savedPin) {
        localStorage.setItem('mytube_admin_token', 'true');
        setIsAdmin(true);
        alert("✅ Akses Admin Diberikan! Tombol Pengaturan Aktif.");
      } else { alert("❌ PIN Salah!"); }
      setLogoClicks(0); 
    }
  };

  const handleSavedChannelClick = (channelTitle) => {
    preventResetRef.current = true;
    // AKTIFKAN BLOKIR SARAN
    blockSuggestionsRef.current = true;
    
    setSelectedCategory("Beranda");
    setSearchTerm(channelTitle); 
    setForceGridMode(true);
    setVideos([]); 
    fetchGridVideos(channelTitle); 
    
    // Pastikan saran hilang
    setShowSuggestions(false);
    
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (selectedVideo && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: selectedVideo.snippet.title,
        artist: selectedVideo.snippet.channelTitle,
        album: 'MyTube Premium',
        artwork: [{ src: selectedVideo.snippet.thumbnails.medium.url, sizes: '320x180', type: 'image/jpeg' }]
      });
      navigator.mediaSession.playbackState = "playing";
      navigator.mediaSession.setActionHandler('play', () => {});
      navigator.mediaSession.setActionHandler('pause', () => {});
    }
  }, [selectedVideo]);

  const isSectionMode = !selectedVideo && !searchTerm && SECTION_CONFIG[selectedCategory] && !forceGridMode && selectedCategory !== "Langganan";
  const isHistory = selectedCategory === "History";
  const isLangganan = selectedCategory === "Langganan";
  const isManualLoadMode = (selectedCategory === "Beranda" || selectedCategory === "Travelling") || searchTerm || forceGridMode;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col font-sans overflow-x-hidden">
      {showSettings && <QuotaModal onClose={() => setShowSettings(false)} />}

      <header className="sticky top-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-sm flex items-center justify-between px-4 h-14 border-b border-[#272727]">
        {showMobileSearch ? (
           <form onSubmit={handleSearch} className="flex w-full gap-2 relative">
             <div className="relative flex-1 flex items-center">
               <input 
                 autoFocus 
                 className="w-full bg-[#222] rounded-full px-4 pr-10 py-1 outline-none" 
                 value={searchTerm} 
                 onChange={e=> {
                   setSearchTerm(e.target.value);
                   // KALAU USER NGETIK, BUKA BLOKIR SARAN
                   if (blockSuggestionsRef.current) blockSuggestionsRef.current = false;
                 }}
                 onKeyDown={handleKeyDown} 
                 placeholder="Cari..." 
               />
               {searchTerm && ( <FaTimes className="absolute right-3 text-gray-400 cursor-pointer hover:text-white" onClick={() => { setSearchTerm(""); setSuggestions([]); }} /> )}
             </div>
             {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute top-10 left-0 w-full bg-[#222] border border-[#333] rounded-xl shadow-2xl z-[60] overflow-hidden">
                  {suggestions.map((sug, idx) => (
                    <li key={idx} onClick={() => handleSuggestionClick(sug)} className={`px-4 py-3 cursor-pointer text-sm font-bold flex items-center gap-3 border-b border-[#333] last:border-0 ${idx === selectedIndex ? 'bg-[#333] text-white' : 'hover:bg-[#2a2a2a] text-gray-300'}`}>
                      <FaSearch className={idx === selectedIndex ? 'text-white' : 'text-gray-500'} /> {sug}
                    </li>
                  ))}
                </ul>
             )}
             <button type="button" onClick={()=>setShowMobileSearch(false)} className="p-2"><FaTimes/></button>
           </form>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <button onClick={toggleSidebar} className="p-2 hover:bg-[#272727] rounded-full active:scale-95 transition-all"><FaBars className="text-xl" /></button>
              <div className="flex items-center gap-1 text-xl font-bold tracking-tighter cursor-pointer select-none" onClick={() => { setSelectedCategory("Beranda"); handleSecretLogoClick(); }} title="Klik 5x untuk Mode Admin">
                <FaYoutube className="text-red-600 text-3xl" /> MYTUBE
              </div>
            </div>
            <div className="hidden sm:flex flex-1 max-w-[600px] ml-10 h-10 relative">
               <form onSubmit={handleSearch} className="relative flex-1 flex items-center">
                 <input 
                    className="w-full h-full bg-[#121212] border border-[#303030] border-r-0 rounded-l-full px-4 pr-10 outline-none focus:border-blue-500" 
                    placeholder="Telusuri..." 
                    value={searchTerm} 
                    onChange={e=> {
                      setSearchTerm(e.target.value);
                      // KALAU USER NGETIK, BUKA BLOKIR SARAN
                      if (blockSuggestionsRef.current) blockSuggestionsRef.current = false;
                    }}
                    onKeyDown={handleKeyDown} 
                 />
                 {searchTerm && ( <FaTimes className="absolute right-3 text-gray-400 cursor-pointer hover:text-white" onClick={() => { setSearchTerm(""); setSuggestions([]); }} /> )}
               </form>
               <button onClick={handleSearch} className="bg-[#222] px-6 rounded-r-full border border-[#303030] hover:bg-[#3f3f3f]"><FaSearch/></button>
               {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute top-11 left-0 w-[calc(100%-60px)] bg-[#222] border border-[#333] rounded-xl shadow-2xl z-[60] overflow-hidden">
                    {suggestions.map((sug, idx) => (
                      <li key={idx} onClick={() => handleSuggestionClick(sug)} className={`px-4 py-2 cursor-pointer text-sm font-bold flex items-center gap-3 ${idx === selectedIndex ? 'bg-[#333] text-white' : 'hover:bg-[#2a2a2a] text-gray-300'}`}>
                        <FaSearch className={idx === selectedIndex ? 'text-white' : 'text-gray-500'} /> {sug}
                      </li>
                    ))}
                  </ul>
               )}
            </div>
            <div className="flex gap-3 items-center">
               <button onClick={()=>setShowMobileSearch(true)} className="sm:hidden p-2 hover:bg-[#272727] rounded-full"><FaSearch className="text-xl" /></button>
               {isAdmin && ( <button onClick={()=>setShowSettings(true)} className="p-2 hover:bg-[#272727] rounded-full text-gray-300 hover:text-white transition-all animate-fadeIn"><FaCog className="text-xl" /></button> )}
               <FaUserCircle className="text-3xl text-blue-500 cursor-pointer" />
            </div>
          </>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {!selectedVideo && (
          <aside className={`hidden md:flex flex-col overflow-y-auto sticky top-14 h-[calc(100vh-56px)] transition-all ${isSidebarOpen ? 'w-60 px-2' : 'w-[72px] items-center'}`}>
             {allSidebarItems.map(cat => (
               <div key={cat} onClick={()=>setSelectedCategory(cat)} className={`flex items-center gap-4 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#272727] ${selectedCategory===cat ? 'bg-[#272727] font-bold':''}`} title={cat}>
                  <span className="text-xl">{ICON_MAP[cat] || <FaHome />}</span>
                  <span className={!isSidebarOpen ? 'hidden' : 'truncate'}>{cat}</span>
               </div>
             ))}
             {isSidebarOpen && ( <div className="mt-auto pt-10 pb-6 text-center select-none"><p className="text-xs font-bold text-gray-300 tracking-wider">Created by. Dimz M01 Web Development</p></div> )}
          </aside>
        )}

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[60] flex md:hidden">
            <div className="absolute inset-0 bg-black bg-opacity-70" onClick={() => setIsMobileMenuOpen(false)}></div>
            <aside className="relative bg-[#0f0f0f] w-64 h-full shadow-2xl overflow-y-auto p-4 flex flex-col animate-slideInLeft">
              <div className="flex items-center mb-2">
                 <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-[#272727] rounded-full mr-4"><FaBars className="text-xl text-white" /></button>
                 <span className="font-bold text-xl">Menu</span>
              </div>
              {allSidebarItems.map(cat => (
                 <div key={cat} onClick={() => { setSelectedCategory(cat); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-[#272727] mb-1 cursor-pointer">
                    <span className="text-xl">{ICON_MAP[cat] || <FaHome />}</span><span>{cat}</span>
                 </div>
              ))}
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-[#0f0f0f] w-full p-4">
          {selectedVideo ? (
             <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto">
               <div className="flex-1">
                 <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative group">
                    <button onClick={()=>setSelectedVideo(null)} className="lg:hidden absolute top-4 left-4 z-10 bg-black/50 p-2 rounded-full"><FaArrowLeft /></button>
                    <iframe src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&cc_load_policy=1&cc_lang_pref=id&hl=id`} className="w-full h-full" frameBorder="0" allowFullScreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>
                 </div>
                 <div className="flex flex-col md:flex-row items-start justify-between mt-4 gap-4">
                   <div>
                     <h1 className="text-xl font-bold">{selectedVideo.snippet.title}</h1>
                     <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                       <span className="font-bold text-white text-base">{selectedVideo.snippet.channelTitle}</span>
                       <span className="flex items-center gap-1 bg-[#272727] px-2 py-0.5 rounded text-xs text-white"><FaClosedCaptioning /> CC</span>
                     </div>
                   </div>
                   <button onClick={() => toggleSaveChannel(selectedVideo)} className={`px-6 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all flex items-center gap-2 ${isChannelSaved(selectedVideo.snippet.channelId) ? 'bg-[#272727] text-white hover:bg-[#3f3f3f]' : 'bg-white text-black hover:bg-gray-200'}`}>
                     {isChannelSaved(selectedVideo.snippet.channelId) ? ( <> <FaCheckCircle className="text-green-500" /> TERDAFTAR </> ) : ( "LANGGANAN" )}
                   </button>
                 </div>
                 <button onClick={()=>setSelectedVideo(null)} className="mt-6 bg-[#272727] px-4 py-2 rounded-full font-bold text-sm hover:bg-[#3f3f3f]">Kembali</button>
               </div>
               <div className="w-full lg:w-[350px] flex flex-col gap-2">
                 {relatedVideos.map(v => (
                   <div key={v.id} onClick={()=>handleVideoClick(v)} className="flex gap-2 cursor-pointer hover:bg-[#1f1f1f] p-1 rounded-lg">
                      <div className="relative min-w-[160px] w-[160px] h-[90px]">
                        <img src={v.snippet.thumbnails.medium.url} className="w-full h-full rounded-lg object-cover" />
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1 rounded">{formatDuration(v)}</span>
                      </div>
                      <div className="text-sm font-bold line-clamp-2">{v.snippet.title}</div>
                   </div>
                 ))}
               </div>
             </div>
          ) : (
            <>
              {selectedCategory === "Beranda" && !searchTerm && !forceGridMode && ( <TopChannels /> )}

              {!isLangganan && (
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                   {categories.map(cat => (
                     <button key={cat} onClick={()=>setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory===cat ? 'bg-white text-black':'bg-[#272727] hover:bg-[#3f3f3f]'}`}>{cat}</button>
                   ))}
                </div>
              )}

              {loading && !isLoadingMore ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : (
                <>
                  {isLangganan ? (
                    <div>
                      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><FaBookmark className="text-blue-500" /> Channel Langganan</h2>
                      {savedChannels.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                          <FaUserCircle className="text-6xl mx-auto mb-4 opacity-20" />
                          <p>Belum ada channel yang disimpan.</p>
                          <p className="text-sm mt-2">Buka video dan klik tombol "LANGGANAN".</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {savedChannels.map(channel => (
                            <div 
                              key={channel.id} 
                              onClick={() => handleSavedChannelClick(channel.title)}
                              className="bg-[#1f1f1f] p-4 rounded-xl flex flex-col items-center gap-3 cursor-pointer hover:bg-[#2f2f2f] transition-all group"
                            >
                              <div className="w-20 h-20 rounded-full bg-[#333] flex items-center justify-center text-4xl text-gray-500 group-hover:text-white group-hover:scale-110 transition-transform">
                                <FaUserCircle />
                              </div>
                              <h3 className="font-bold text-center text-sm line-clamp-2">{channel.title}</h3>
                              <span className="text-xs text-blue-400">Lihat Video</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : isSectionMode ? (
                    <div className="flex flex-col gap-10 pb-20">
                      {heroVideo && (
                        <div className="relative w-full h-[40vh] md:h-[50vh] rounded-2xl overflow-hidden cursor-pointer group shadow-2xl ring-1 ring-[#333]" onClick={()=>handleVideoClick(heroVideo)}>
                           <img src={heroVideo.snippet.thumbnails.high?.url || heroVideo.snippet.thumbnails.medium.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60 group-hover:opacity-80" />
                           <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent"></div>
                           <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full md:w-2/3">
                              <p className="text-red-500 font-bold tracking-widest text-sm mb-2 uppercase">FEATURED • {selectedCategory}</p>
                              <h2 className="text-2xl md:text-5xl font-extrabold mb-4 leading-tight drop-shadow-lg">{heroVideo.snippet.title}</h2>
                              <button className="bg-white text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors"><FaPlayCircle className="text-xl" /> PUTAR SEKARANG</button>
                           </div>
                        </div>
                      )}
                      {Object.keys(sectionData).map((sectionTitle) => {
                        const sectionConfig = SECTION_CONFIG[selectedCategory].find(s => s.title === sectionTitle);
                        return (
                          <div key={sectionTitle} className="flex flex-col gap-4">
                             <div className="flex justify-between items-end px-2">
                                <div><h3 className="text-2xl font-bold">{sectionTitle}</h3><p className="text-gray-400 text-sm">Rekomendasi terbaik untukmu</p></div>
                                <button onClick={() => handleSeeAll(sectionConfig?.query)} className="text-sm font-bold text-gray-400 hover:text-white border border-[#333] px-3 py-1 rounded-full active:scale-95 transition-transform">Lihat Semua</button>
                             </div>
                             <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-2 scrollbar-hide snap-x">
                                {sectionData[sectionTitle].map((video) => (
                                  <div key={video.id} onClick={()=>handleVideoClick(video)} className="min-w-[280px] w-[280px] md:min-w-[320px] cursor-pointer group snap-start focus:outline-none" tabIndex="0">
                                     <div className="relative aspect-video rounded-xl overflow-hidden mb-3 ring-0 group-hover:ring-2 group-focus:ring-4 ring-white transition-all">
                                        <img src={video.snippet.thumbnails.medium.url} className="w-full h-full object-cover" />
                                        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-1.5 py-0.5 rounded">{formatDuration(video)}</span>
                                     </div>
                                     <h4 className="font-bold leading-tight line-clamp-2 group-hover:text-blue-400">{video.snippet.title}</h4>
                                     <p className="text-sm text-gray-400 mt-1">{video.snippet.channelTitle}</p>
                                  </div>
                                ))}
                             </div>
                             <hr className="border-[#202020] mt-2" />
                          </div>
                        );
                      })}
                    </div>

                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                         {(isHistory ? historyVideos : videos).map((video, index) => {
                            const isLast = (videos.length === index + 1) && !isHistory && !isManualLoadMode;
                            return (
                              <div ref={isLast ? lastVideoElementRef : null} key={video.id} onClick={()=>handleVideoClick(video)} className="cursor-pointer group">
                               <div className="aspect-video rounded-xl overflow-hidden mb-3 relative">
                                  <img src={video.snippet.thumbnails.medium.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-bold px-1.5 py-0.5 rounded">{formatDuration(video)}</span>
                               </div>
                               <div className="flex gap-3">
                                  <FaUserCircle className="text-3xl text-gray-400" />
                                  <div>
                                     <h3 className="font-bold text-sm line-clamp-2 leading-tight mb-1">{video.snippet.title}</h3>
                                     <p className="text-xs text-gray-400">{video.snippet.channelTitle}</p>
                                  </div>
                               </div>
                            </div>
                           );
                         })}
                      </div>

                      {isManualLoadMode && !isHistory && (
                        <div className="w-full flex justify-center py-10">
                           <button onClick={handleManualLoadMore} disabled={isLoadingMore} className="flex items-center gap-2 px-8 py-3 bg-[#272727] hover:bg-[#3f3f3f] rounded-full font-bold text-sm transition-all border border-[#444] active:scale-95">
                              {isLoadingMore ? <FaSpinner className="animate-spin" /> : <FaRedo />}
                              {isLoadingMore ? "Memuat..." : "LOAD MORE"}
                           </button>
                        </div>
                      )}

                      {isLoadingMore && !isManualLoadMode && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                           {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
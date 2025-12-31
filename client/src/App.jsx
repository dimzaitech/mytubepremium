import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBars, FaYoutube, FaSearch, FaMicrophone, FaUserCircle, FaBell, FaVideo, FaHome, FaCompass, FaPlayCircle, FaHistory, FaBroadcastTower, FaBookmark, FaRegBookmark, FaExclamationCircle, FaTimes, FaArrowLeft, FaThumbsUp, FaThumbsDown, FaShare, FaExpand, FaCompress } from 'react-icons/fa';

// === LOGIKA URL UNTUK VERCEL & LOCAL ===
const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.startsWith('192') && !window.location.hostname.startsWith('172');
const BACKEND_URL = isProduction ? "" : "http://localhost:3000";
// =======================================

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [videos, setVideos] = useState([]); 
  const [relatedVideos, setRelatedVideos] = useState([]); 
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(""); 

  const [selectedCategory, setSelectedCategory] = useState("Beranda");
  const [selectedFilmGenre, setSelectedFilmGenre] = useState("Semua"); 
  const [searchTerm, setSearchTerm] = useState(""); 
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(true); 

  const [savedVideos, setSavedVideos] = useState(() => {
    const saved = localStorage.getItem('mytube_saved');
    return saved ? JSON.parse(saved) : [];
  });
  const [historyVideos, setHistoryVideos] = useState(() => {
    const history = localStorage.getItem('mytube_history');
    return history ? JSON.parse(history) : [];
  });

  const categories = ["Beranda", "Musik", "Karaoke", "Berita", "Live TV", "Film", "Horror", "Kuliner", "Hobby"];
  const filmGenres = ["Semua", "Action", "Horror Movie", "Komedi", "Drama", "Romantis"];

  // === FETCH VIDEO UTAMA ===
  const fetchVideos = async (isSearch = false) => {
    if (!isSearch && (selectedCategory === 'Saved' || selectedCategory === 'History')) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    
    if (isSearch) {
      setVideos([]); 
      setIsSearchActive(true);
      setSelectedVideo(null);
      setIsCinemaMode(false);
    } else {
      setIsSearchActive(false);
    }

    try {
      let url = `${BACKEND_URL}/api/videos?q=${encodeURIComponent(selectedCategory)}`;

      if (isSearch && searchTerm.trim() !== "") {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      } 
      else if (selectedCategory === 'Film') {
         if (selectedFilmGenre !== 'Semua') {
           url = `${BACKEND_URL}/api/videos?q=${encodeURIComponent(`Film ${selectedFilmGenre}`)}`; 
         }
      }

      const response = await axios.get(url);
      setVideos(response.data);
    } catch (error) {
      console.error("Gagal mengambil video:", error);
      setErrorMsg("Gagal memuat video. Pastikan Server Backend sudah jalan.");
    } finally {
      setLoading(false);
    }
  };

  // === FETCH VIDEO REKOMENDASI ===
  const fetchRelatedVideos = async (video) => {
    try {
      let query = "";
      const titleKeywords = video.snippet.title.split(" ").slice(0, 3).join(" "); 

      if (selectedCategory !== "Beranda" && selectedCategory !== "Explorasi" && selectedCategory !== "Saved" && selectedCategory !== "History") {
         if (selectedCategory === "Film") {
            query = `Film ${selectedFilmGenre} ${titleKeywords}`;
         } else {
            query = `${titleKeywords} ${selectedCategory}`; 
         }
      } 
      else {
         query = `${titleKeywords} ${video.snippet.channelTitle}`;
      }
      
      const url = `${BACKEND_URL}/api/videos?q=${encodeURIComponent(query)}`;
      const response = await axios.get(url);
      const filtered = response.data.filter(v => v.id !== video.id);
      setRelatedVideos(filtered);
    } catch (error) {
      console.error("Gagal mengambil related videos:", error);
    }
  };

  useEffect(() => {
    setSearchTerm(""); 
    setIsSearchActive(false);
    setErrorMsg("");
    setShowMobileSearch(false);
    setSelectedVideo(null);
    setIsCinemaMode(false);
    fetchVideos(false);
  }, [selectedCategory, selectedFilmGenre]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchVideos(true);
      setShowMobileSearch(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    setIsCinemaMode(false);
    setRelatedVideos([]); 
    
    const filteredHistory = historyVideos.filter(v => v.id !== video.id);
    const newHistory = [video, ...filteredHistory].slice(0, 20);
    setHistoryVideos(newHistory);
    localStorage.setItem('mytube_history', JSON.stringify(newHistory));

    window.scrollTo(0, 0);
    fetchRelatedVideos(video);
  };

  const closePlayer = () => {
    setSelectedVideo(null);
    setIsCinemaMode(false);
  };

  const toggleSaveVideo = (e, video) => {
    e.stopPropagation();
    const isSaved = savedVideos.some(v => v.id === video.id);
    let newSaved;
    if (isSaved) newSaved = savedVideos.filter(v => v.id !== video.id);
    else newSaved = [video, ...savedVideos];
    setSavedVideos(newSaved);
    localStorage.setItem('mytube_saved', JSON.stringify(newSaved));
  };

  const formatViews = (num) => {
    if (num === 'Live') return 'Live';
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'Jt';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'rb';
    return num;
  };

  const calculateTime = (publishedAt) => {
    const date = new Date(publishedAt);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if(diffDays > 365) return "1 thn lalu";
    if(diffDays > 30) return "1 bln lalu";
    if(diffDays > 7) return "1 mg lalu";
    return `${diffDays} hari lalu`;
  };

  const toggleHandler = () => {
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  let displayVideos = videos;
  if (selectedCategory === 'Saved' && !isSearchActive) displayVideos = savedVideos;
  if (selectedCategory === 'History' && !isSearchActive) displayVideos = historyVideos;

  return (
    <div className="min-h-screen bg-yt-base text-yt-text flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-yt-base flex items-center justify-between px-4 h-14 w-full border-b border-[#272727] sm:border-none">
        {showMobileSearch ? (
          <div className="flex w-full items-center gap-2 animate-fadeIn">
            <button onClick={() => setShowMobileSearch(false)} className="p-2 text-white hover:bg-[#272727] rounded-full">
              <FaArrowLeft />
            </button>
            <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center bg-[#121212] border border-[#303030] rounded-full overflow-hidden h-9">
              <input type="text" placeholder="Telusuri..." className="w-full bg-transparent px-4 text-white outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
              {searchTerm && <button type="button" onClick={clearSearch} className="mr-3 text-gray-400"><FaTimes /></button>}
            </form>
            <button className="p-2 bg-[#181818] rounded-full"><FaMicrophone /></button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <button onClick={toggleHandler} className="p-2 hover:bg-yt-secondary rounded-full active:scale-95 transition-transform"><FaBars className="text-xl" /></button>
              <div className="flex items-center gap-1 cursor-pointer" onClick={() => {setSelectedCategory("Beranda"); setSelectedVideo(null);}}>
                <FaYoutube className="text-yt-red text-3xl" />
                <span className="text-xl font-bold tracking-tighter">MYTUBE PREMIUM</span>
              </div>
            </div>
            <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center flex-1 max-w-[600px] ml-10">
              <div className="flex flex-1 items-center bg-[#121212] border border-[#303030] rounded-l-full overflow-hidden">
                <input type="text" placeholder={`Telusuri di ${selectedCategory}...`} className="w-full bg-transparent px-4 py-2 text-white outline-none focus:border-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                {searchTerm && <button type="button" onClick={clearSearch} className="mr-3 text-gray-400 hover:text-white cursor-pointer"><FaTimes /></button>}
              </div>
              <button type="submit" className="bg-yt-secondary px-5 py-2 border border-[#303030] border-l-0 rounded-r-full hover:bg-yt-hover"><FaSearch /></button>
              <button type="button" className="ml-4 p-2 bg-[#181818] hover:bg-yt-hover rounded-full"><FaMicrophone /></button>
            </form>
            <div className="flex items-center gap-3 sm:gap-4">
              <button onClick={() => setShowMobileSearch(true)} className="sm:hidden p-2 hover:bg-[#272727] rounded-full"><FaSearch className="text-xl" /></button>
              <FaVideo className="hidden sm:block text-xl cursor-pointer" />
              <FaBell className="text-xl cursor-pointer" />
              <FaUserCircle className="text-3xl text-blue-500 cursor-pointer" />
            </div>
          </>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* === SIDEBAR DESKTOP === */}
        {!selectedVideo && (
          <aside className={`hidden md:flex flex-col h-[calc(100vh-56px)] overflow-y-auto sticky top-14 px-2 scrollbar-thin hover:overflow-y-scroll transition-all duration-200 ease-in-out ${isSidebarOpen ? 'w-60' : 'w-[72px]'}`}>
            <div onClick={() => setSelectedCategory("Beranda")}><SidebarItem icon={<FaHome />} text="Beranda" isOpen={isSidebarOpen} active={selectedCategory === "Beranda"} /></div>
            <div onClick={() => setSelectedCategory("Explorasi")}><SidebarItem icon={<FaCompass />} text="Explorasi" isOpen={isSidebarOpen} active={selectedCategory === "Explorasi"} /></div>
            <div onClick={() => setSelectedCategory("Shorts")}><SidebarItem icon={<FaPlayCircle />} text="Shorts" isOpen={isSidebarOpen} active={selectedCategory === "Shorts"} /></div>
            <div onClick={() => setSelectedCategory("History")}><SidebarItem icon={<FaHistory />} text="History" isOpen={isSidebarOpen} active={selectedCategory === "History"} /></div>
            <hr className="border-yt-secondary my-2 mx-2" />
            <div onClick={() => setSelectedCategory("Saved")}><SidebarItem icon={<FaBookmark />} text="Saved" isOpen={isSidebarOpen} active={selectedCategory === "Saved"} /></div>

            {/* === CREDIT DESKTOP === */}
            {isSidebarOpen && (
              <div className="mt-auto pt-10 pb-6 text-center select-none opacity-60 hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-gray-500 mb-1">Created with ❤️ by.</p>
                <div className="bg-[#222] py-1 px-2 rounded-lg inline-block border border-[#333]">
                  <p className="text-[11px] font-bold text-white tracking-wide">
                    DimzM01 <span className="text-yt-red">Web Development</span>
                  </p>
                </div>
              </div>
            )}
            
          </aside>
        )}

        {/* === SIDEBAR MOBILE (YANG TADI KURANG LENGKAP) === */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[60] flex md:hidden">
            <div className="absolute inset-0 bg-black bg-opacity-70 transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
            <aside className="relative bg-[#0f0f0f] w-64 h-full shadow-2xl overflow-y-auto p-4 flex flex-col transform transition-transform duration-300">
               <div className="flex items-center gap-4 mb-6 px-2">
                <button onClick={() => setIsMobileMenuOpen(false)}><FaBars className="text-xl text-white" /></button>
                <div className="flex items-center gap-1"><FaYoutube className="text-yt-red text-3xl" /><span className="text-xl font-bold tracking-tighter">Premium</span></div>
              </div>
              
              {/* == MENU LENGKAP MOBILE SEKARANG == */}
              <div onClick={() => { setSelectedCategory("Beranda"); setIsMobileMenuOpen(false); }}><SidebarItem icon={<FaHome />} text="Beranda" isOpen={true} active={selectedCategory === "Beranda"} /></div>
              <div onClick={() => { setSelectedCategory("Explorasi"); setIsMobileMenuOpen(false); }}><SidebarItem icon={<FaCompass />} text="Explorasi" isOpen={true} active={selectedCategory === "Explorasi"} /></div>
              <div onClick={() => { setSelectedCategory("Shorts"); setIsMobileMenuOpen(false); }}><SidebarItem icon={<FaPlayCircle />} text="Shorts" isOpen={true} active={selectedCategory === "Shorts"} /></div>
              <div onClick={() => { setSelectedCategory("History"); setIsMobileMenuOpen(false); }}><SidebarItem icon={<FaHistory />} text="History" isOpen={true} active={selectedCategory === "History"} /></div>
              
              <hr className="border-[#272727] my-2" />
              
              <div onClick={() => { setSelectedCategory("Saved"); setIsMobileMenuOpen(false); }}><SidebarItem icon={<FaBookmark />} text="Saved" isOpen={true} active={selectedCategory === "Saved"} /></div>
              
              {/* CREDIT MOBILE */}
              <div className="mt-auto pt-10 pb-4 text-center select-none opacity-60">
                <p className="text-[10px] text-gray-500 mb-1">Created with ❤️ by.</p>
                <div className="bg-[#222] py-1 px-2 rounded-lg inline-block border border-[#333]">
                  <p className="text-[11px] font-bold text-white tracking-wide">
                    DimzM01 <span className="text-yt-red">Web Development</span>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* === MAIN CONTENT === */}
        <main className={`flex-1 overflow-y-auto bg-yt-base w-full ${selectedVideo && isCinemaMode ? 'bg-black' : ''}`}>
          
          {selectedVideo ? (
            <div className={`flex flex-col ${isCinemaMode ? '' : 'lg:flex-row'} gap-6 p-4 ${isCinemaMode ? 'w-full px-0 pt-0' : 'max-w-[1600px] mx-auto'}`}>
              
              {/* KOLOM KIRI (PLAYER) */}
              <div className={`flex-1 transition-all duration-300 ${isCinemaMode ? 'w-full' : ''}`}>
                <div className={`w-full bg-black relative shadow-2xl ${isCinemaMode ? 'h-[80vh]' : 'aspect-video rounded-xl overflow-hidden'}`}>
                   <button onClick={closePlayer} className="lg:hidden absolute top-4 left-4 z-10 bg-black bg-opacity-50 p-2 rounded-full text-white">
                      <FaArrowLeft />
                   </button>
                   <iframe 
                      src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&controls=1&rel=0&modestbranding=1&showinfo=0`}
                      title="YouTube video player"
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                   ></iframe>
                </div>

                <div className={`${isCinemaMode ? 'max-w-[1600px] mx-auto px-4 mt-4' : 'mt-4'}`}>
                    <h1 className="text-xl font-bold text-white mb-2 line-clamp-2">{selectedVideo.snippet.title}</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#303030] pb-4">
                       <div className="flex items-center gap-3">
                          <FaUserCircle className="text-4xl text-gray-400" />
                          <div>
                             <h3 className="font-bold text-white">{selectedVideo.snippet.channelTitle}</h3>
                             <span className="text-xs text-gray-400">500rb subscriber</span>
                          </div>
                          <button className="ml-4 bg-white text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-200">Subscribe</button>
                       </div>
                       
                       <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                          <button onClick={() => setIsCinemaMode(!isCinemaMode)} className={`flex items-center gap-2 px-4 py-2 rounded-full hover:bg-[#333] border border-[#303030] ${isCinemaMode ? 'bg-[#333] text-blue-400' : 'bg-[#222]'}`}>
                             {isCinemaMode ? <><FaCompress /> Normal</> : <><FaExpand /> Bioskop</>}
                          </button>
                          <div className="flex items-center bg-[#222] rounded-full px-4 py-2 gap-2">
                             <button className="flex items-center gap-2 hover:bg-[#333] rounded-l-full pr-2 border-r border-[#444]"><FaThumbsUp /> Like</button>
                             <button className="hover:bg-[#333] pl-2"><FaThumbsDown /></button>
                          </div>
                          <button className="flex items-center gap-2 bg-[#222] px-4 py-2 rounded-full hover:bg-[#333]"><FaShare /> Bagikan</button>
                          <button onClick={(e) => toggleSaveVideo(e, selectedVideo)} className="flex items-center gap-2 bg-[#222] px-4 py-2 rounded-full hover:bg-[#333]">
                             {savedVideos.some(v => v.id === selectedVideo.id) ? <><FaBookmark /> Disimpan</> : <><FaRegBookmark /> Simpan</>}
                          </button>
                       </div>
                    </div>
                    <div className="mt-4 bg-[#222] p-3 rounded-xl text-sm text-white whitespace-pre-line cursor-pointer hover:bg-[#333] transition-colors">
                       <p className="font-bold mb-1">{formatViews(selectedVideo.statistics?.viewCount)} x ditonton • {calculateTime(selectedVideo.snippet.publishedAt)}</p>
                       <p className="line-clamp-3 text-gray-300">{selectedVideo.snippet.description || "Tidak ada deskripsi."}</p>
                    </div>
                </div>
              </div>

              {/* KOLOM KANAN (SIDEBAR & AUTO NEXT) */}
              <div className={`${isCinemaMode ? 'w-full max-w-[1600px] mx-auto px-4' : 'w-full lg:w-[400px]'} flex flex-col gap-3 transition-all duration-300`}>
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold">Video Lainnya</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-xs text-gray-400 font-bold uppercase">Auto Putar</span>
                       <div 
                         onClick={() => setIsAutoPlay(!isAutoPlay)}
                         className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${isAutoPlay ? 'bg-blue-600' : 'bg-gray-600'}`}
                       >
                         <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${isAutoPlay ? 'left-5' : 'left-0.5'}`}></div>
                       </div>
                       <button onClick={closePlayer} className="hidden lg:block text-sm border border-gray-600 px-3 py-1 rounded-full hover:bg-white hover:text-black transition-all ml-2">Kembali</button>
                    </div>
                 </div>
                 
                 {relatedVideos.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 animate-pulse">
                        Mencari video {selectedCategory === 'Beranda' ? 'Terkait' : selectedCategory} lainnya...
                    </div>
                 ) : (
                    relatedVideos.map((video) => (
                      <div key={video.id} onClick={() => handleVideoClick(video)} className="flex gap-2 cursor-pointer group">
                         <div className="relative w-[168px] h-[94px] flex-shrink-0 rounded-lg overflow-hidden">
                            <img src={video.snippet.thumbnails.medium.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded">{video.durationFormatted}</span>
                         </div>
                         <div className="flex flex-col gap-1 flex-1">
                            <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight group-hover:text-blue-400">{video.snippet.title}</h4>
                            <p className="text-xs text-gray-400">{video.snippet.channelTitle}</p>
                            <p className="text-xs text-gray-400">{formatViews(video.statistics?.viewCount)} ditonton</p>
                         </div>
                      </div>
                    ))
                 )}
              </div>

            </div>
          ) : (
            // B. TAMPILAN GRID BIASA
            <div className="p-4">
              {!["Saved", "History", "Shorts"].includes(selectedCategory) && (
                <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map((cat, idx) => (
                    <button key={idx} onClick={() => { setSelectedCategory(cat); setSelectedFilmGenre("Semua"); }} className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-white text-black' : 'bg-yt-secondary hover:bg-yt-hover text-white'}`}>{cat}</button>
                  ))}
                </div>
              )}
              {selectedCategory === "Film" && (
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide border-b border-[#272727]">
                  {filmGenres.map((genre, idx) => (
                    <button key={idx} onClick={() => setSelectedFilmGenre(genre)} className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border border-[#303030] ${selectedFilmGenre === genre ? 'bg-blue-600 text-white border-blue-600' : 'bg-[#121212] hover:bg-[#202020] text-gray-300'}`}>{genre === "Semua" ? "Semua Film" : genre}</button>
                  ))}
                </div>
              )}
              
              {(selectedCategory === "Saved" || selectedCategory === "History") && !isSearchActive && <h2 className="text-2xl font-bold mb-6 px-2">{selectedCategory === "Saved" ? "Video Disimpan" : "History Tontonan"}</h2>}
              {isSearchActive && searchTerm && !loading && <div className="px-2 mb-4 text-gray-400 text-sm">Hasil pencarian: <span className="text-white font-bold">"{searchTerm}"</span> di <span className="text-yt-red">{selectedCategory}</span></div>}

              {loading ? (
                <div className="text-center py-20 text-gray-500 animate-pulse">{isSearchActive ? `Mencari "${searchTerm}"...` : `Sedang memuat ${selectedCategory}...`}</div>
              ) : errorMsg ? (
                <div className="text-center py-20 text-red-500 flex flex-col items-center gap-2"><FaExclamationCircle className="text-4xl" /><p>{errorMsg}</p></div>
              ) : (
                <>
                  {displayVideos.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">Tidak ada video ditemukan.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-4">
                      {displayVideos.map((video) => (
                        <div key={video.id} onClick={() => handleVideoClick(video)} className="cursor-pointer group flex flex-col">
                          <div className="relative overflow-hidden rounded-xl aspect-video mb-3">
                            <img src={video.snippet.thumbnails.medium.url} alt={video.snippet.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                            {video.isLive ? <span className="absolute bottom-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1 font-bold animate-pulse"><FaBroadcastTower className="text-[10px]" /> LIVE</span> : <span className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded font-medium">{video.durationFormatted}</span>}
                            <button onClick={(e) => toggleSaveVideo(e, video)} className="absolute top-2 right-2 bg-black bg-opacity-60 p-2 rounded-full text-white hover:bg-yt-red transition-colors opacity-0 group-hover:opacity-100" title="Simpan Video">{savedVideos.some(v => v.id === video.id) ? <FaBookmark /> : <FaRegBookmark />}</button>
                          </div>
                          <div className="flex gap-3">
                            <FaUserCircle className="text-3xl min-w-[36px] text-gray-400 mt-1" />
                            <div className="flex flex-col">
                              <h3 className="font-bold text-base line-clamp-2 leading-tight mb-1 text-white group-hover:text-blue-400 transition-colors">{video.snippet.title}</h3>
                              <div className="text-sm text-gray-400">
                                <p>{video.snippet.channelTitle}</p>
                                {video.isLive ? <p className="text-red-500 font-semibold">Sedang berlangsung</p> : <p>{formatViews(video.statistics?.viewCount)} x ditonton • {calculateTime(video.snippet.publishedAt)}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              
              {!["Saved", "History"].includes(selectedCategory) && !isSearchActive && !loading && !errorMsg && !selectedVideo && (
                <div className="w-full flex justify-center py-10">
                  <button className="px-6 py-2 border border-[#303030] bg-yt-secondary text-sm font-medium rounded-full hover:bg-[#3f3f3f] hover:border-gray-500 transition-all">LOADER</button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, text, isOpen, active }) {
  return (
    <div className={`flex items-center gap-4 px-3 py-2 rounded-lg cursor-pointer ${active ? 'bg-yt-secondary font-bold' : 'hover:bg-yt-secondary'} ${!isOpen ? 'justify-center' : ''}`}>
      <span className="text-xl">{icon}</span>
      <span className={`text-sm overflow-hidden whitespace-nowrap text-ellipsis ${isOpen ? 'block' : 'hidden'}`}>{text}</span>
    </div>
  );
}

export default App;
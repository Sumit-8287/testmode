import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesAPI, newsAPI, categoriesAPI, bannersAPI, testsAPI, testSeriesAPI, liveVideosAPI, quickLinksAPI } from '../src/services/apiClient';
import StudentSidebar from '../components/StudentSidebar';
import { useAuthStore } from '../store/authStore';


interface NewsItem {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  showAsModal?: boolean;
  priority?: string;
  isActive?: boolean;
}

interface Banner {
  _id?: string;
  id?: string;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  isActive?: boolean;
  order?: number;
}

const categoryIcons: Record<string, string> = {
  'NEET': 'biotech',
  'IIT-JEE': 'calculate',
  'Nursing CET': 'health_and_safety',
  'General Studies': 'menu_book',
  'NDA': 'military_tech',
  'XI': 'school',
  'XII': 'workspace_premium',
};

const categoryGradients: string[] = [
  'from-[#1A237E] to-[#303F9F]',
  'from-[#C62828] to-[#D32F2F]',
  'from-[#00695C] to-[#00897B]',
  'from-[#4A148C] to-[#7B1FA2]',
  'from-[#E65100] to-[#F57C00]',
  'from-[#1565C0] to-[#1E88E5]',
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { student, isAuthenticated } = useAuthStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [newsModal, setNewsModal] = useState<NewsItem | null>(null);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [testSeries, setTestSeries] = useState<any[]>([]);
  const [examDocs, setExamDocs] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [quickLinks, setQuickLinks] = useState<any[]>([]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    // Filter categories based on search query
    if (!searchQuery.trim()) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(cat =>
        cat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [categories, searchQuery]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await coursesAPI.getAll();
        setCourses(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch from MongoDB:', error);
      }
    };

    const fetchCategories = async () => {
      try {
        const data = await categoriesAPI.getAll();
        const active = (Array.isArray(data) ? data : []).filter((c: any) => c.isActive);
        setCategories(active);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    const fetchBanners = async () => {
      try {
        const data = await bannersAPI.getAll();
        const activeBanners = (Array.isArray(data) ? data : []).filter((b: any) => b.isActive !== false && b.active !== false);
        if (activeBanners.length > 0) {
          activeBanners.sort((a: Banner, b: Banner) => (a.order || 0) - (b.order || 0));
          setBanners(activeBanners);
        } else {
          setBanners([{ imageUrl: '/attached_assets/download_1770552281686.png', title: 'Aone Target Institute' }]);
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error);
        setBanners([{ imageUrl: '/attached_assets/download_1770552281686.png', title: 'Aone Target Institute' }]);
      }
    };

    const fetchNews = async () => {
      try {
        const newsData = await newsAPI.getAll();
        const activeNews = (Array.isArray(newsData) ? newsData : []).filter((n: any) =>
          (n.isActive !== false && n.status !== 'draft') || n.status === 'published'
        );

        const modalNews = activeNews.find((n: any) => n.showAsModal);
        if (modalNews) {
          const dismissedNews = localStorage.getItem('dismissedNews');
          const dismissed = dismissedNews ? JSON.parse(dismissedNews) : [];
          if (!dismissed.includes(modalNews.id)) {
            setNewsModal({
              ...modalNews,
              message: modalNews.message || modalNews.content || ''
            });
            setShowNewsModal(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch news:', error);
      }
    };

    const fetchLiveClasses = async () => {
      try {
        const data = await liveVideosAPI.getAll();
        setLiveClasses(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch live classes:', error);
      }
    };

    const fetchTestSeries = async () => {
      try {
        const data = await testSeriesAPI.getAll();
        setTestSeries(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch test series:', error);
      }
    };

    const fetchExamDocs = async () => {
      try {
        const response = await fetch('/api/exam-documents');
        const data = await response.json();
        const active = (Array.isArray(data) ? data : []).filter((d: any) => d.status === 'active');
        setExamDocs(active);
      } catch (error) {
        console.error('Failed to fetch exam docs:', error);
      }
    };

    const fetchQuickLinks = async () => {
      try {
        const data = await quickLinksAPI.getAll();
        setQuickLinks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch quick links:', error);
      }
    };

    const fetchAll = () => {
      fetchCourses();
      fetchCategories();
      fetchBanners();
      fetchLiveClasses();
      fetchTestSeries();
      fetchExamDocs();
      fetchQuickLinks();
    };

    fetchAll();
    fetchNews();

    return () => { };
  }, []);

  const dismissNewsModal = () => {
    if (newsModal) {
      const dismissedNews = localStorage.getItem('dismissedNews');
      const dismissed = dismissedNews ? JSON.parse(dismissedNews) : [];
      dismissed.push(newsModal.id);
      localStorage.setItem('dismissedNews', JSON.stringify(dismissed));
    }
    setShowNewsModal(false);
    setNewsModal(null);
  };

  const handleDownloadAPK = async () => {
    // Try to download latest APK from backend, fallback to direct link
    const apkUrl = '/api/download/apk';
    try {
      const response = await fetch(apkUrl, { method: 'HEAD' });
      if (response.ok) {
        const link = document.createElement('a');
        link.href = apkUrl;
        link.setAttribute('download', 'AoneTarget_Latest.apk');
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      } else {
        // Fallback: open Play Store or show toast
        alert('APK download will be available soon! Please check back later or contact support.');
      }
    } catch {
      alert('APK download will be available soon! Please check back later or contact support.');
    }
  };

  const handleShare = (linkObj: any) => {
    if (linkObj && linkObj.url) {
      window.open(linkObj.url, '_blank');
      return;
    }
  };

  const handleHardcodedShare = (platform: string) => {
    let url = "";
    switch (platform) {
      case 'fb': url = `https://www.facebook.com/aonetargetinstitute`; break;
      case 'ig': url = `https://www.instagram.com/aonetargetinstitute`; break;
      case 'yt': url = `https://www.youtube.com/@AONETARGETINSTITUTE`; break;
      case 'wa': url = `https://api.whatsapp.com/send/?phone=919009008148`; break;
      case 'tg': url = `https://t.me/share/url?url=https://aonetarget.com&text=Check out Aone Target Institute!`; break;
    }
    window.open(url, '_blank');
  };

  const chipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chipRef.current;
    if (!container) return;

    let animationId: number;
    let scrollPos = 0;
    let isInteracting = false;

    const scroll = () => {
      if (!isInteracting && container) {
        scrollPos += 0.5; // Slow, smooth speed
        // If we've reached the end of the first set of items, reset to start seamlessly
        if (scrollPos >= container.scrollWidth / 2) {
          scrollPos = 0;
        }
        container.scrollLeft = scrollPos;
      }
      animationId = requestAnimationFrame(scroll);
    };

    const handleInteractionStart = () => { isInteracting = true; };
    const handleInteractionEnd = () => {
      isInteracting = false;
      // sync scrollPos with current scrollLeft when user releases
      scrollPos = container.scrollLeft;
    };

    animationId = requestAnimationFrame(scroll);

    container.addEventListener('mousedown', handleInteractionStart);
    container.addEventListener('touchstart', handleInteractionStart);
    window.addEventListener('mouseup', handleInteractionEnd);
    window.addEventListener('touchend', handleInteractionEnd);

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('mousedown', handleInteractionStart);
      container.removeEventListener('touchstart', handleInteractionStart);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchend', handleInteractionEnd);
    };
  }, []);

  return (
    <div className="flex flex-col bg-surface-100 min-h-screen pb-4 animate-fade-in">
      <header className="sticky top-0 z-40 shadow-lg" style={{ background: '#283593' }}>
        <div className="px-4 py-2 flex items-center justify-between gap-3 min-h-[68px]">
          {isSearching ? (
            <div className="flex-1 flex items-center gap-3 animate-slide-in-left">
              <div className="flex-1 relative">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-white/50 pl-4 pr-4 py-2 rounded-xl border border-white/20 focus:bg-white/20 focus:border-white/40 transition-all outline-none text-[13px]"
                  placeholder="Search for courses..."
                />
              </div>

              <button
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery('');
                }}
                className="px-3 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95 shrink-0 flex items-center justify-center text-white text-[11px] font-medium uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-[42px] h-[42px] rounded-[14px] bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95 shrink-0 flex items-center justify-center"
              >
                <span className="material-symbols-rounded text-white text-[26px]">menu</span>
              </button>

              <div className="flex-1 flex justify-center items-center">
                <div className="bg-white rounded-[20px] px-4 py-1 shadow-md flex items-center justify-center h-[54px] w-[230px] overflow-hidden mix-blend-normal">
                  <img
                    src="/attached_assets/alonelogo_1770810181717.jpg"
                    alt="Aone Target"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setIsSearching(true)}
                  className="w-[42px] h-[42px] rounded-[14px] bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95 flex items-center justify-center"
                >
                  <span className="material-symbols-rounded text-white text-[22px] font-medium">search</span>
                </button>
                <button
                  onClick={() => navigate('/notifications')}
                  className="w-[42px] h-[42px] rounded-[14px] bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95 relative flex items-center justify-center"
                >
                  <span className="material-symbols-rounded text-white text-[22px] font-medium">notifications</span>
                  <span className="absolute top-[10px] right-[10px] w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#283593] animate-pulse"></span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="px-4 py-3 space-y-4">
        <div
          ref={chipRef}
          className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4 select-none touch-pan-x"
        >
          {(() => {
            const chips = [
              { label: 'All Courses', icon: 'school', color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/explore' },
              { label: 'Live Classes', icon: 'sensors', color: 'text-rose-600', bg: 'bg-rose-50', path: '/live-classes' },
              { label: 'Test', icon: 'quiz', color: 'text-amber-600', bg: 'bg-amber-50', path: '/mock-tests' },
              { label: 'Free Content', icon: 'auto_awesome', color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/free-content' },
            ];
            // Duplicate chips for seamless infinite loop
            return [...chips, ...chips].map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-[18px] border border-[#283593]/30 shrink-0 active:scale-95 transition-all shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_20px_-5px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 group"
              >
                <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  <span className="material-symbols-rounded text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                </div>
                <div className="pr-1 text-left">
                  <span className="text-[13px] font-medium text-gray-800 tracking-tight leading-none group-hover:text-primary transition-colors block whitespace-nowrap">{item.label}</span>
                </div>
              </button>
            ));
          })()}
        </div>

        {banners.length > 0 ? (
          <div className="relative w-full overflow-hidden rounded-3xl shadow-elevated aspect-[2/1] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex transition-transform duration-700 ease-in-out h-full" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {banners.map((banner, index) => (
                <div key={banner._id || banner.id || index} className="w-full flex-shrink-0 h-full bg-gradient-to-br from-primary-800 to-primary-600 flex items-center justify-center">
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || `Banner ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      onClick={() => banner.linkUrl && navigate(banner.linkUrl)}
                      style={{ cursor: banner.linkUrl ? 'pointer' : 'default' }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-primary-800 to-primary-600 flex items-center justify-center p-4">
                      <div className="text-center text-white">
                        <h3 className="text-xl font-medium">{banner.title}</h3>
                        {banner.subtitle && <p className="text-sm opacity-80 mt-1">{banner.subtitle}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {banners.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-white w-7 shadow-lg' : 'bg-white/50 w-2'}`}
                  ></button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full aspect-[2/1] rounded-3xl bg-gray-50"></div>
        )}

        <section className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-6 bg-gradient-to-b from-accent to-primary rounded-full"></div>
              <div>
                <h2 className="section-title">Our Courses</h2>
                <p className="section-subtitle">Explore top categories</p>
              </div>
            </div>
            <button onClick={() => navigate('/explore')} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1 hover:gap-2 transition-all duration-200 active:scale-[0.97]">
              View All
              <span className="material-symbols-rounded text-sm">arrow_forward</span>
            </button>
          </div>
          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {filteredCategories.map((cat, i) => (
                <div
                  key={cat._id || cat.id || i}
                  onClick={() => {
                    if (cat.id === 'mock-test' || (cat.title && cat.title.toLowerCase().includes('mock test'))) {
                      navigate('/mock-tests');
                    } else {
                      navigate(`/explore/${cat.id}`);
                    }
                  }}
                  className={`relative p-3.5 rounded-3xl h-40 flex flex-col justify-between text-white bg-gradient-to-br ${cat.gradient || categoryGradients[i % categoryGradients.length]} overflow-hidden cursor-pointer active:scale-[0.97] transition-all duration-200 shadow-elevated hover:shadow-card-hover hover:-translate-y-0.5 group`}
                >
                  {cat.imageUrl && (
                    <img src={cat.imageUrl} alt={cat.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  {cat.imageUrl && <div className="absolute inset-0 bg-black/40"></div>}
                  <div className="relative z-10 flex justify-between items-start">
                    <span className="glass bg-white/20 text-[8px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {cat.tag || 'COURSE'}
                    </span>
                    <div className="w-10 h-10 glass bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
                      <span className="material-symbols-rounded text-white text-xl">{cat.icon || categoryIcons[cat.title] || 'auto_stories'}</span>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-medium text-lg leading-tight">{cat.title}</h3>
                    <span className="text-[10px] opacity-80 font-medium">{cat.subtitle}</span>
                  </div>
                  <div className="absolute bottom-3 right-3 h-9 w-9 glass bg-white/25 rounded-full flex items-center justify-center border border-white/30 z-10 group-hover:bg-white/40 group-hover:scale-110 transition-all duration-200">
                    <span className="material-symbols-rounded text-white text-lg">arrow_forward</span>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
              <span className="material-symbols-rounded text-6xl text-gray-300">search_off</span>
              <p className="text-sm text-gray-400 mt-4">No results found</p>
              <p className="text-[10px] text-gray-300 mt-1">Try searching with different keywords</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 opacity-0">
              {[0, 1].map(i => <div key={i} className="h-36" />)}
            </div>
          )}
        </section>

        {liveClasses.length > 0 && (
          <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-6 bg-gradient-to-b from-accent to-primary rounded-full"></div>
                <div>
                  <h2 className="section-title">Live Classes</h2>
                  <p className="section-subtitle">Join upcoming sessions</p>
                </div>
              </div>
              <button onClick={() => navigate('/live-classes')} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1 hover:gap-2 transition-all duration-200 active:scale-[0.97]">
                View All
                <span className="material-symbols-rounded text-sm">arrow_forward</span>
              </button>
            </div>
            <div className="space-y-2.5">
              {liveClasses.slice(0, 4).map((lc: any, i: number) => (
                <div key={lc._id || lc.id || i} className="card-premium p-3 rounded-2xl border border-gray-100/50 flex gap-3 items-center hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent-600 rounded-2xl flex items-center justify-center shrink-0 relative shadow-button">
                    <span className="material-symbols-rounded text-white text-2xl">sensors</span>
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-800 truncate">{lc.title || lc.name || 'Live Class'}</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <span className="material-symbols-rounded text-[12px]">person</span>
                        {lc.teacherName || lc.instructor || 'Instructor'}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <span className="material-symbols-rounded text-[12px]">schedule</span>
                        {(() => {
                          if (lc.scheduledTime && lc.scheduledDate) {
                            try {
                              const dtStr = `${lc.scheduledDate}T${lc.scheduledTime}:00`;
                              const dt = new Date(dtStr);
                              if (!isNaN(dt.getTime())) {
                                return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              }
                            } catch (e) { }
                          }
                          return lc.scheduledTime || lc.time || 'Upcoming';
                        })()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/live-classes'); }}
                    className="btn-accent text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 active:scale-[0.97] transition-all duration-200 shrink-0"
                  >
                    <span className="material-symbols-rounded text-[14px]">videocam</span>
                    Join
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {testSeries.length > 0 && (
          <section className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-6 bg-gradient-to-b from-primary-600 to-primary rounded-full"></div>
                <div>
                  <h2 className="section-title">Popular Test Series</h2>
                  <p className="section-subtitle">Practice & improve your score</p>
                </div>
              </div>
              <button onClick={() => navigate('/mock-tests')} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1 hover:gap-2 transition-all duration-200 active:scale-[0.97]">
                View All
                <span className="material-symbols-rounded text-sm">arrow_forward</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {testSeries.slice(0, 4).map((ts: any, i: number) => (
                <div
                  key={ts._id || ts.id || i}
                  onClick={() => navigate('/mock-tests')}
                  className="card-premium p-3 rounded-2xl border border-gray-100/50 cursor-pointer hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mb-3 group-hover:from-primary-200 group-hover:to-primary-300 transition-all duration-200">
                    <span className="material-symbols-rounded text-primary text-xl">quiz</span>
                  </div>
                  <h4 className="font-medium text-sm text-gray-800 leading-tight line-clamp-2">{ts.title || ts.name || 'Test Series'}</h4>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="material-symbols-rounded text-[12px] text-gray-400">subject</span>
                    <span className="text-[11px] text-gray-400">{ts.subject || ts.category || 'General'}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100/80">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <span className="material-symbols-rounded text-[12px]">description</span>
                      {ts.totalTests || ts.tests?.length || 0} Tests
                    </span>
                    {(ts.price !== undefined && ts.price !== null) && (
                      <span className="text-xs font-medium text-primary bg-primary-50 px-2.5 py-0.5 rounded-full">
                        {ts.price === 0 ? 'Free' : `₹${ts.price}`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {examDocs.length > 0 && (
          <section className="animate-fade-in-up" style={{ animationDelay: '0.28s' }}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-teal-700 rounded-full"></div>
                <div>
                  <h2 className="section-title text-sm">Exam Documents</h2>
                  <p className="section-subtitle">Important PDFs & Materials</p>
                </div>
              </div>
              <button onClick={() => navigate('/ebook-notes')} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1 hover:gap-2 transition-all duration-200 active:scale-[0.97] bg-teal-600 border-teal-500">
                View All
                <span className="material-symbols-rounded text-sm">arrow_forward</span>
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {examDocs.slice(0, 5).map((doc: any, i: number) => (
                <div
                  key={doc._id || doc.id || i}
                  onClick={() => doc.fileUrl && window.open(doc.fileUrl, '_blank')}
                  className="w-36 flex-shrink-0 card-premium p-2.5 rounded-2xl border border-gray-100/50 cursor-pointer hover:shadow-lg transition-all"
                >
                  <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center mb-2.5">
                    <span className="material-symbols-rounded text-teal-600 text-lg">description</span>
                  </div>
                  <h4 className="font-medium text-[11px] text-navy line-clamp-2 h-7">{doc.title}</h4>
                  <p className="text-[8px] text-gray-400 mt-1.5 uppercase font-semibold tracking-wider">{doc.exam || 'General'}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {courses.length > 0 && (
          <section className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary-600 rounded-full"></div>
                <div>
                  <h2 className="section-title">Featured Batches</h2>
                  <p className="section-subtitle">Enroll in top batches</p>
                </div>
              </div>
              <button onClick={() => navigate('/explore')} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1 hover:gap-2 transition-all duration-200 active:scale-[0.97]">
                View All
                <span className="material-symbols-rounded text-sm">arrow_forward</span>
              </button>
            </div>
            <div className="space-y-2.5">
              {courses.slice(0, 4).map((course: any, i: number) => (
                <div
                  key={course._id || course.id || i}
                  onClick={() => navigate(`/course/${course._id || course.id}`)}
                  className="card-premium rounded-3xl border border-gray-100/50 overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-all duration-200 group flex h-24"
                >
                  <div className={`w-24 h-24 bg-gradient-to-br ${categoryGradients[i % categoryGradients.length]} flex items-center justify-center shrink-0`}>
                    {course.imageUrl || course.thumbnail ? (
                      <img src={course.imageUrl || course.thumbnail} alt={course.title} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-rounded text-white text-3xl">school</span>
                    )}
                  </div>
                  <div className="flex-1 p-3 min-w-0 flex flex-col justify-center">
                    <h4 className="font-medium text-[14px] text-gray-800 truncate">{course.title || course.name}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{(course.description || course.subtitle || '').replace(/<[^>]+>/g, '')}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <span className="material-symbols-rounded text-[13px]">group</span>
                        {course.enrollmentCount || course.students || 0} enrolled
                      </span>
                      {(course.price !== undefined && course.price !== null) && (
                        <span className="text-[11px] font-medium text-accent bg-accent-50 px-2.5 py-0.5 rounded-full">
                          {course.price === 0 ? 'Free' : `₹${course.price}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center pr-3">
                    <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center group-hover:bg-primary transition-all duration-200">
                      <span className="material-symbols-rounded text-primary text-[14px] group-hover:text-white transition-all duration-200">arrow_forward</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(() => {
          const [allNews, setAllNews] = useState<any[]>([]);
          useEffect(() => {
            newsAPI.getAll().then(data => {
              const active = (Array.isArray(data) ? data : []).filter((n: any) =>
                (n.isActive !== false && n.status !== 'draft') || n.status === 'published'
              );
              setAllNews(active.filter((n: any) => !n.showAsModal).slice(0, 3));
            }).catch(() => { });
          }, []);

          if (allNews.length === 0) return null;

          return (
            <section className="animate-fade-in-up" style={{ animationDelay: '0.32s' }}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-1 h-7 bg-gradient-to-b from-orange-500 to-red-600 rounded-full"></div>
                <div>
                  <h2 className="section-title">Latest Updates</h2>
                  <p className="section-subtitle">Stay informed with institute news</p>
                </div>
              </div>
              <div className="space-y-3">
                {allNews.map((news: any, i: number) => (
                  <div key={news.id || i} className="bg-white rounded-2xl p-4 shadow-sm border border-orange-50 flex gap-4 items-start">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-rounded text-orange-600 text-xl">campaign</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-navy">{news.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{news.message || news.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">{news.category || 'Update'}</span>
                        <span className="text-[10px] text-gray-300">{news.createdDate?.split('T')[0] || 'Recently'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })()}
      </main>

      <div className="px-4 space-y-3 mb-6 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
        <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Join our Community</p>
            <div className="h-1 w-8 bg-[#3DDC84] rounded-full opacity-30"></div>
          </div>

          <div className="flex flex-wrap justify-center w-full gap-4 pb-2">
            {quickLinks.length > 0 ? (
              quickLinks.sort((a, b) => b.sortBy - a.sortBy).map((link, i) => (
                <button
                  key={link.id || i}
                  onClick={() => handleShare(link)}
                  className="w-14 h-14 rounded-[20px] flex items-center justify-center shadow-lg active:scale-90 transition-all duration-300 hover:scale-110 relative group shrink-0"
                  style={{
                    background: link.bgColor || '#f8fafc',
                    border: link.bgColor ? 'none' : '1px solid #e2e8f0'
                  }}
                >
                  <img
                    src={link.imageUrl || 'https://cdn-icons-png.flaticon.com/512/1243/1243420.png'}
                    alt={link.title}
                    className="w-8 h-8 object-contain"
                    onError={(e) => (e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/1243/1243420.png')}
                  />
                  <div className="absolute inset-0 rounded-[20px] bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                </button>
              ))
            ) : (
              [
                { platform: 'fb', bg: '#0866FF', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" /></svg> },
                { platform: 'ig', bg: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg> },
                { platform: 'yt', bg: '#FF0000', icon: <svg className="w-7 h-7" viewBox="0 0 24 24" fill="white"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg> },
                { platform: 'wa', bg: '#25D366', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg> },
                { platform: 'tg', bg: '#24A1DE', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white" style={{ marginLeft: '-2px' }}><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.26.26-.544.26l.195-2.756 5.01-4.526c.218-.194-.048-.3-.333-.112l-6.195 3.903-2.67-.835c-.58-.182-.59-.58.12-.857l10.435-4.022c.483-.182.906.108.736.966z" /></svg> },
              ].map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleHardcodedShare(s.platform)}
                  className="w-14 h-14 rounded-[20px] flex items-center justify-center shadow-lg active:scale-90 transition-all duration-300 hover:scale-110 relative group shrink-0"
                  style={{ background: s.bg }}
                >
                  <div className="absolute inset-0 rounded-[20px] bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  {s.icon}
                </button>
              ))
            )}
          </div>
        </div>

        <button
          onClick={handleDownloadAPK}
          className="w-full bg-[#F3F6F3] rounded-[32px] p-6 flex items-center justify-between active:scale-[0.98] transition-all duration-300 border border-white group overflow-hidden relative shadow-sm"
        >
          {/* Material You blur effects */}
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#3DDC84]/15 rounded-full blur-2xl group-hover:bg-[#3DDC84]/25 transition-all duration-500"></div>
          <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-[#1A237E]/5 rounded-full blur-2xl"></div>

          <div className="flex items-center gap-5 relative z-10">
            {/* Premium Icon Container */}
            <div className="w-16 h-16 bg-white/80 backdrop-blur-md rounded-[24px] flex items-center justify-center shrink-0 shadow-sm border border-white/50 group-hover:scale-105 transition-transform duration-500">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#3DDC84">
                <path d="M17.523 15.3414C17.0232 15.3414 16.6179 14.9362 16.6179 14.4363C16.6179 13.9365 17.0232 13.5312 17.523 13.5312C18.0229 13.5312 18.4281 13.9365 18.4281 14.4363C18.4281 14.9362 18.0229 15.3414 17.523 15.3414ZM6.47702 15.3414C5.9772 15.3414 5.57195 14.9362 5.57195 14.4363C5.57195 13.9365 5.9772 13.5312 6.47702 13.5312C6.97684 13.5312 7.38209 13.9365 7.38209 14.4363C7.38209 14.9362 6.97684 15.3414 6.47702 15.3414ZM17.9616 10.0571L19.7289 7.00041C19.8217 6.83979 19.7663 6.6353 19.6057 6.54252C19.445 6.44975 19.2405 6.50518 19.1478 6.6658L17.3468 9.77884C15.8239 9.08889 14.0734 8.71875 12.2039 8.71875C10.3344 8.71875 8.58394 9.08889 7.06105 9.77884L5.26006 6.6658C5.16728 6.50518 4.96279 6.44975 4.80217 6.54252C4.64155 6.6353 4.58612 6.83979 4.6789 7.00041L6.44621 10.0571C3.12004 11.8385 0.887207 15.1438 0.887207 19.0062H23.5206C23.5206 15.1438 21.2878 11.8385 17.9616 10.0571Z" />
              </svg>
            </div>

            <div className="text-left">
              <h4 className="text-[19px] font-semibold text-gray-900 tracking-tight leading-none mb-1.5 flex items-center gap-2">
                Get Android App
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3DDC84] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3DDC84]"></span>
                </span>
              </h4>
              <p className="text-[12px] text-gray-500 font-medium">Compatible with Android 8.0+</p>
            </div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <span className="bg-white/80 backdrop-blur-sm py-1.5 px-3 rounded-full text-[10px] font-bold text-[#2E7D32] border border-[#3DDC84]/20 shadow-sm uppercase tracking-wider hidden sm:block">
              Free
            </span>
            <div className="w-14 h-14 bg-gray-900 text-white rounded-[20px] flex items-center justify-center shadow-lg group-hover:bg-[#3DDC84] group-hover:shadow-[#3DDC84]/30 transition-all duration-500 group-hover:translate-x-1">
              <span className="material-symbols-rounded text-[28px]">download_for_offline</span>
            </div>
          </div>
        </button>
      </div>

      <StudentSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        student={student}
      />

      {showNewsModal && newsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl transform animate-scale-in">
            {newsModal.imageUrl && (
              <div className="relative">
                <img
                  src={newsModal.imageUrl}
                  alt={newsModal.title}
                  className="w-full h-48 object-cover"
                />
                {newsModal.priority === 'high' && (
                  <div className="absolute top-3 left-3 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-button">
                    <span className="material-symbols-rounded text-sm">priority_high</span>
                    Urgent
                  </div>
                )}
              </div>
            )}
            <div className="p-6">
              {!newsModal.imageUrl && newsModal.priority === 'high' && (
                <div className="inline-block bg-accent-50 text-accent text-xs font-bold px-3 py-1 rounded-full mb-3">
                  <span className="material-symbols-rounded text-sm align-middle mr-1">priority_high</span>
                  Urgent Notice
                </div>
              )}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-600 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-button">
                  <span className="material-symbols-rounded text-xl">campaign</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{newsModal.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">Aone Target Institute</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">{newsModal.message}</p>
              <button
                onClick={dismissNewsModal}
                className="w-full btn-primary py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-200"
              >
                <span className="material-symbols-rounded text-sm">check_circle</span>
                Got it, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

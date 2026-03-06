import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DemoContent: React.FC = () => {
    const navigate = useNavigate();
    const [activeSubject, setActiveSubject] = useState('All Subjects');

    const [selectedVideo, setSelectedVideo] = useState<any>(null);
    const [showVideoPlayer, setShowVideoPlayer] = useState(false);
    const [videoOrientation, setVideoOrientation] = useState<'landscape' | 'portrait'>('landscape');

    const getYouTubeVideoId = (url: string): string => {
        if (!url) return '';
        let videoId = '';
        if (url.includes('youtube.com/watch')) {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            videoId = urlParams.get('v') || '';
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0] || '';
        } else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('youtube.com/embed/')[1]?.split(/[?#]/)[0] || '';
        }
        return videoId;
    };

    const getYouTubeEmbedUrl = (url: string): string => {
        if (!url) return '';
        const videoId = getYouTubeVideoId(url);
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url;
    };

    const demoClasses = [
        {
            id: 1,
            title: "Mastering Physics: Mechanics",
            instructor: "Er. Anil Sharma",
            duration: "45 mins",
            thumbnail: "https://images.unsplash.com/photo-1636466484547-0683059f77f9?auto=format&fit=crop&q=80&w=800",
            category: "IIT-JEE/NEET",
            subject: "Physics",
            views: "1.2k",
            students: "850+",
            youtubeUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
        },
        {
            id: 2,
            title: "Cell Biology Breakdown",
            instructor: "Dr. S. Mukherjee",
            duration: "38 mins",
            thumbnail: "https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&q=80&w=800",
            category: "NEET Special",
            subject: "Biology",
            views: "956",
            students: "420+",
            youtubeUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
        },
        {
            id: 3,
            title: "Organic Chemistry: Basics",
            instructor: "Prof. Rajesh Singh",
            duration: "52 mins",
            thumbnail: "https://images.unsplash.com/photo-1532187875462-be93d5e4933a?auto=format&fit=crop&q=80&w=800",
            category: "Class 12th",
            subject: "Chemistry",
            views: "2.1k",
            students: "1.5k+",
            youtubeUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
        }
    ];

    const subjects = ['All Subjects', 'Physics', 'Chemistry', 'Biology'];
    const filteredClasses = activeSubject === 'All Subjects'
        ? demoClasses
        : demoClasses.filter(c => c.subject === activeSubject);

    return (
        <div className="flex flex-col min-h-screen bg-[#F8F9FE] pb-24">
            {/* Integrated Header */}
            <div className="bg-[#1A237E] pt-8 pb-10 px-6 rounded-b-[40px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/20 rounded-full -ml-8 -mb-8 blur-2xl"></div>

                <div className="relative z-10 flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 text-white backdrop-blur-md border border-white/10 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-rounded text-xl">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[9px] font-black text-white uppercase tracking-wider">Live Classes</span>
                    </div>
                </div>

                <div className="relative z-10">
                    <h1 className="text-2xl font-black text-white leading-tight">Demo Lessons</h1>
                    <p className="text-blue-100/60 text-[11px] font-medium mt-1">Free high-quality trial lectures by top faculty</p>
                </div>
            </div>

            <main className="px-5 -mt-6 space-y-6 relative z-20">
                {/* Categories Pills */}
                <div className="flex gap-2.5 overflow-x-auto hide-scrollbar -mx-5 px-5">
                    {subjects.map((subject, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveSubject(subject)}
                            className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubject === subject
                                ? 'bg-navy text-white shadow-lg shadow-navy/20 active:scale-95'
                                : 'bg-white text-gray-400 border border-gray-100 hover:border-navy/20 active:scale-95'
                                }`}
                        >
                            {subject}
                        </button>
                    ))}
                </div>

                {/* Demo List - Horizontal Style like Courses */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1 mb-1">
                        <h3 className="text-[10px] font-black text-navy uppercase tracking-[0.2em] opacity-50">Free Sessions</h3>
                        <span className="text-[9px] font-bold text-gray-400">{filteredClasses.length} Available</span>
                    </div>

                    <div className="space-y-3">
                        {filteredClasses.length > 0 ? (
                            filteredClasses.map((demo) => (
                                <div
                                    key={demo.id}
                                    onClick={() => {
                                        if (demo.youtubeUrl) {
                                            setSelectedVideo(demo);
                                            setShowVideoPlayer(true);
                                        }
                                    }}
                                    className="card-premium bg-white rounded-[24px] border border-gray-100/50 overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-all duration-300 group flex items-stretch h-32"
                                >
                                    {/* Image Section */}
                                    <div className="w-32 relative shrink-0">
                                        <img src={demo.thumbnail} alt={demo.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                            <div className="w-10 h-10 rounded-full glass bg-white/20 flex items-center justify-center border border-white/30 group-hover:scale-110 transition-all duration-300 shadow-lg">
                                                <span className="material-symbols-rounded text-white text-xl">play_arrow</span>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                                            <span className="bg-black/60 text-[8px] text-white px-1.5 py-0.5 rounded-md font-black backdrop-blur-md uppercase tracking-tighter">Free</span>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="flex-1 p-3.5 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-1 text-[9px] font-black text-brandBlue/60 uppercase tracking-wider">
                                                <span>{demo.category}</span>
                                            </div>
                                            <h4 className="font-black text-sm text-navy leading-tight line-clamp-2 group-hover:text-brandBlue transition-colors">{demo.title}</h4>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto pt-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-navy/5 flex items-center justify-center border border-gray-100 shrink-0">
                                                    <span className="material-symbols-rounded text-navy text-[14px]">person</span>
                                                </div>
                                                <p className="text-[10px] font-black text-navy leading-none truncate">{demo.instructor}</p>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-400 shrink-0 ml-2">
                                                <span className="material-symbols-rounded text-[14px]">schedule</span>
                                                <span className="text-[9px] font-bold">{demo.duration}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrow Section */}
                                    <div className="flex items-center pr-3 shrink-0">
                                        <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-brandBlue group-hover:text-white transition-all duration-300">
                                            <span className="material-symbols-rounded text-sm">chevron_right</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100 flex flex-col items-center">
                                <span className="material-symbols-rounded text-6xl text-gray-200 block mb-4">video_library</span>
                                <h3 className="font-black text-gray-800">No {activeSubject} Demos</h3>
                                <p className="text-gray-400 text-xs mt-2 max-w-[200px]">Check back soon for new high-quality lessons!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upgrade Banner */}
                <div className="mt-4 p-8 rounded-[40px] bg-gradient-to-br from-[#1A237E] to-[#283593] text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Access Pro Batches</h3>
                        <p className="text-blue-100/60 text-[10px] font-medium mt-2 leading-relaxed px-2">Ready to take the next step? Enroll in our premium full-length courses today.</p>
                        <button
                            onClick={() => navigate('/explore')}
                            className="mt-6 w-full py-4 bg-white text-navy font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-[0.98] transition-all hover:bg-accent hover:text-white"
                        >
                            Explore All Batches
                        </button>
                    </div>
                </div>
            </main>

            {/* Video Player Modal */}
            {showVideoPlayer && selectedVideo && (
                <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-fade-in">
                    <div className="flex items-center justify-between p-4 text-white">
                        <button onClick={() => setShowVideoPlayer(false)} className="flex items-center gap-2 active:scale-[0.97] transition-all">
                            <span className="material-symbols-rounded">arrow_back</span>
                            <span className="font-medium text-sm">Back</span>
                        </button>
                        <h3 className="text-sm font-bold truncate max-w-[200px]">{selectedVideo.title}</h3>
                        <button
                            onClick={() => setVideoOrientation(prev => prev === 'landscape' ? 'portrait' : 'landscape')}
                            className="bg-white/10 p-2 rounded-lg"
                        >
                            <span className="material-symbols-rounded text-lg">screen_rotation</span>
                        </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center bg-black/95">
                        <div
                            className="w-full bg-black relative shadow-2xl transition-all duration-500"
                            style={{
                                aspectRatio: videoOrientation === 'landscape' ? '16/9' : '9/16',
                                maxHeight: '80vh',
                                maxWidth: videoOrientation === 'landscape' ? '100%' : '400px'
                            }}
                        >
                            <iframe
                                src={getYouTubeEmbedUrl(selectedVideo.videoUrl || selectedVideo.youtubeUrl || '')}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                allowFullScreen
                                title={selectedVideo.title}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DemoContent;

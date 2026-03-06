import React, { useState, useEffect, useMemo, useRef } from 'react';
import { videosAPI, pdfsAPI, testsAPI, coursesAPI, liveVideosAPI } from '../../src/services/apiClient';

interface ContentItem {
    id: string;
    _id?: string;
    title: string;
    courseId: string;
    courseName?: string;
    type: string;
    createdAt: string;
    duration?: string;
    raw?: any;
}

const ContentManager: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [courseFilter, setCourseFilter] = useState('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [content, setContent] = useState<ContentItem[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showQuestionsModal, setShowQuestionsModal] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const filterDropdownRef = useRef<HTMLDivElement>(null);
    const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        setIsPlaying(false);
        setVideoError(null);
        if (selectedItem) {
            console.log('--- CONTENT DEBUG ---');
            console.log('Item:', selectedItem.title);
            console.log('Type:', selectedItem.type);
            console.log('Raw Data:', selectedItem.raw);
            console.log('---------------------');
        }
    }, [selectedItem]);

    useEffect(() => {
        const init = async () => {
            await fetchCourses();
            await fetchData();
        };
        init();
    }, []);

    const fetchCourses = async () => {
        try {
            const data = await coursesAPI.getAll();
            setCourses(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [videosData, pdfsData, testsData, coursesData, liveVideosData] = await Promise.all([
                videosAPI.getAll(),
                pdfsAPI.getAll(),
                testsAPI.getAll(),
                coursesAPI.getAll(),
                liveVideosAPI.getAll()
            ]);

            const flatContent: ContentItem[] = [];

            // Helper to get course name
            const getCourseName = (courseId: string) => {
                const course = coursesData.find((c: any) => (c.id === courseId || c._id === courseId));
                return course?.name || course?.title || 'General';
            };

            // Process Videos
            if (Array.isArray(videosData)) {
                videosData.forEach((v: any) => {
                    flatContent.push({
                        id: v.id || v._id || 'V' + Math.random().toString(36).substr(2, 5).toUpperCase(),
                        title: v.title || v.name || 'Untitled Video',
                        courseId: v.courseId || '',
                        courseName: getCourseName(v.courseId),
                        type: 'Recorded',
                        createdAt: v.createdAt || new Date().toISOString(),
                        duration: v.duration ? (v.duration + ' mins') : undefined,
                        raw: v
                    });
                });
            }

            // Process Live Videos
            if (Array.isArray(liveVideosData)) {
                liveVideosData.forEach((lv: any) => {
                    flatContent.push({
                        id: lv.id || lv._id || 'L' + Math.random().toString(36).substr(2, 5).toUpperCase(),
                        title: lv.title || lv.name || 'Live Session',
                        courseId: lv.courseId || '',
                        courseName: getCourseName(lv.courseId),
                        type: 'Live',
                        createdAt: lv.createdAt || new Date().toISOString(),
                        duration: 'Live Now',
                        raw: lv
                    });
                });
            }

            // Process PDFs
            if (Array.isArray(pdfsData)) {
                pdfsData.forEach((p: any) => {
                    flatContent.push({
                        id: p.id || p._id || 'P' + Math.random().toString(36).substr(2, 5).toUpperCase(),
                        title: p.title || p.name || 'Untitled Document',
                        courseId: p.courseId || '',
                        courseName: getCourseName(p.courseId),
                        type: 'PDF',
                        createdAt: p.createdAt || new Date().toISOString(),
                        duration: p.pages ? (p.pages + ' pages') : undefined,
                        raw: p
                    });
                });
            }

            // Process Tests
            if (Array.isArray(testsData)) {
                testsData.forEach((t: any) => {
                    flatContent.push({
                        id: t.id || t._id || 'T' + Math.random().toString(36).substr(2, 5).toUpperCase(),
                        title: t.title || t.name || 'Untitled Test',
                        courseId: t.courseId || '',
                        courseName: getCourseName(t.courseId),
                        type: 'Test',
                        createdAt: t.createdAt || new Date().toISOString(),
                        duration: t.duration ? (t.duration + ' mins') : (t.questions?.length ? (t.questions.length + ' Qs') : undefined),
                        raw: t
                    });
                });
            }

            // Sort by date descending
            flatContent.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setContent(flatContent);
        } catch (error) {
            console.error('Failed to fetch content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteItem = async (item: ContentItem) => {
        if (!confirm(`Are you sure you want to delete "${item.title}"? This cannot be undone.`)) return;
        setActionLoading(item.id);
        try {
            if (item.type === 'PDF') await pdfsAPI.delete(item.id);
            else if (item.type === 'Test') await testsAPI.delete(item.id);
            else if (item.type === 'Live') await liveVideosAPI.delete(item.id);
            else await videosAPI.delete(item.id);
            setContent(prev => prev.filter(c => c.id !== item.id));
        } catch (error) {
            alert('Failed to delete item. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleEditSave = async () => {
        if (!editingItem) return;
        setActionLoading(editingItem.id);
        try {
            const updated = { ...editingItem.raw, title: editTitle };
            if (editingItem.type === 'PDF') await pdfsAPI.update(editingItem.id, updated);
            else if (editingItem.type === 'Test') await testsAPI.update(editingItem.id, updated);
            else if (editingItem.type === 'Live') await liveVideosAPI.update(editingItem.id, updated);
            else await videosAPI.update(editingItem.id, updated);
            setContent(prev => prev.map(c => c.id === editingItem.id ? { ...c, title: editTitle } : c));
            setEditingItem(null);
        } catch (error) {
            alert('Failed to update item. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const filteredContent = useMemo(() => {
        return content.filter(item => {
            const matchesSearch = !searchTerm ||
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toString().toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType = typeFilter === 'all' || item.type === typeFilter;

            const matchesCourse = courseFilter === 'all' ||
                item.courseId === courseFilter ||
                item.courseName === courseFilter;

            return matchesSearch && matchesType && matchesCourse;
        });
    }, [searchTerm, typeFilter, courseFilter, content]);

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).replace(',', ' at');
        } catch (e) {
            return dateStr;
        }
    };

    if (selectedItem) {
        return (
            <div className="bg-[#fafafa] min-h-screen animate-fade-in">
                <div className="pt-0 px-6 pb-6 space-y-5">
                    {/* BACK NAV */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="w-10 h-10 flex items-center justify-center bg-white border border-[#e5e7eb] rounded-xl text-gray-400 hover:text-gray-900 transition-all shadow-sm active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        </button>
                        <div>
                            <h2 className="text-[20px] font-bold text-[#111827] leading-none mb-1">{selectedItem.title}</h2>
                            <p className="text-[12px] font-medium text-gray-500 uppercase tracking-widest">{selectedItem.type} Details</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* TOP SECTION: CORE INFO & METADATA */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                            {/* CORE INFORMATION */}
                            <div className="lg:col-span-2 bg-white rounded-[24px] border border-[#f3f4f6] shadow-sm p-8 space-y-8">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-[0.15em]">Core Information</h3>
                                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${selectedItem.type === 'PDF' ? 'bg-blue-50 text-blue-500' :
                                        selectedItem.type === 'Test' ? 'bg-orange-50 text-orange-500' :
                                            'bg-green-50 text-green-500'
                                        }`}>
                                        {selectedItem.type}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Title</p>
                                        <p className="text-[15px] font-bold text-[#111827]">{selectedItem.title}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Internal ID</p>
                                        <p className="text-[15px] font-medium text-gray-600 font-mono uppercase">{selectedItem.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Linked Product/Course</p>
                                        <p className="text-[15px] font-bold text-indigo-600">{selectedItem.courseName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Created On</p>
                                        <p className="text-[15px] font-medium text-gray-600">{formatDate(selectedItem.createdAt)}</p>
                                    </div>
                                    {selectedItem.duration && (
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                                {selectedItem.type === 'PDF' ? 'Content Length' : 'Time Duration'}
                                            </p>
                                            <p className="text-[15px] font-bold text-[#111827]">{selectedItem.duration}</p>
                                        </div>
                                    )}
                                    {selectedItem.type === 'Test' && (
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Questions Count</p>
                                            <p className="text-[15px] font-bold text-orange-600">
                                                {Array.isArray(selectedItem.raw?.questions) ? selectedItem.raw.questions.length : (selectedItem.raw?.questions || '0')} Questions
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {(selectedItem.raw?.description || selectedItem.raw?.about) && (
                                    <div className="pt-4 border-t border-gray-50">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Description</p>
                                        <p className="text-[14px] leading-relaxed text-gray-600 bg-gray-50/50 p-4 rounded-xl italic">
                                            "{selectedItem.raw.description || selectedItem.raw.about}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* SIDEBAR METADATA */}
                            <div className="bg-white rounded-[24px] border border-[#f3f4f6] shadow-sm overflow-hidden flex flex-col">
                                <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-400">info</span>
                                    <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest">Metadata</h3>
                                </div>
                                <div className="p-8 space-y-7 flex-1 flex flex-col justify-center">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-tight">Status</span>
                                        <span className="flex items-center gap-1.5 text-green-500 text-[13px] font-bold">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            Active
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-tight">Visibility</span>
                                        <span className="text-[13px] font-bold text-[#111827]">{selectedItem.raw?.isFree ? 'Free Preview' : 'Paid Only'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-tight">Downloads</span>
                                        <span className="text-[13px] font-bold text-[#111827]">{selectedItem.raw?.allowDownload ? 'Enabled' : 'Disabled'}</span>
                                    </div>
                                    <div className="h-[1px] bg-gray-50"></div>
                                    <div className="pt-2">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Resource Link</p>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group cursor-pointer hover:bg-white hover:border-indigo-200 transition-all"
                                            onClick={() => {
                                                const url = selectedItem.raw?.url || selectedItem.raw?.fileUrl || '#';
                                                if (url !== '#') window.open(url, '_blank');
                                            }}
                                        >
                                            <span className="text-[12px] font-mono text-indigo-600 truncate mr-4">
                                                {selectedItem.raw?.url || selectedItem.raw?.fileUrl || 'No external link'}
                                            </span>
                                            <span className="material-symbols-outlined text-[16px] text-gray-300 group-hover:text-indigo-400">open_in_new</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM SECTION: PREVIEW CARD (WIDER) */}
                        <div className="bg-white rounded-[24px] border border-[#f3f4f6] shadow-sm p-8">
                            <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[15px] font-bold text-gray-900 uppercase tracking-widest">Preview Content</h3>
                                        <div className="h-4 w-[1px] bg-gray-200 mx-2"></div>
                                        <span className="text-[12px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{selectedItem.courseName}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-medium">Viewing: <span className="text-gray-600 font-bold">{selectedItem.title}</span></p>
                                </div>
                                {(selectedItem.type === 'Recorded' || selectedItem.type === 'Live' || selectedItem.type?.toLowerCase().includes('video')) && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">{selectedItem.type === 'Live' ? 'Live Stream Active' : 'Optimized for Stream'}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8">
                                {(selectedItem.type === 'Recorded' || selectedItem.type === 'Live' || selectedItem.type?.toLowerCase().includes('video')) ? (
                                    <div
                                        className="w-full max-w-3xl mx-auto relative bg-[#0f172a] rounded-[14px] overflow-hidden shadow-lg border border-gray-100 transition-all duration-500"
                                        style={{ aspectRatio: '16/9', minHeight: '260px' }}
                                    >
                                        {isPlaying ? (
                                            <div className="w-full h-full bg-black animate-fade-in flex flex-col items-center justify-center relative group">
                                                {videoError ? (
                                                    <div className="flex flex-col items-center justify-center w-full h-full gap-4 text-white/50 p-8 text-center bg-[#0f172a]">
                                                        <span className="material-symbols-outlined text-[64px] text-red-400">report</span>
                                                        <div className="space-y-1">
                                                            <p className="text-[14px] font-black uppercase tracking-widest text-white">Playback Error</p>
                                                            <p className="text-[11px] opacity-70">The source URL could not be played. It might be invalid or protected.</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => window.open(videoError, '_blank')}
                                                                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[11px] font-bold transition-all border border-white/10"
                                                            >
                                                                Open Original Link
                                                            </button>
                                                            <button
                                                                onClick={() => setVideoError(null)}
                                                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-[11px] font-bold transition-all text-white"
                                                            >
                                                                Retry
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (() => {
                                                    const raw = selectedItem.raw || {};
                                                    // Exhaustive field check for diverse API response patterns
                                                    const videoUrl = raw.videoUrl || raw.fileUrl || raw.url || raw.link || raw.src ||
                                                        raw.secure_url || raw.playbackUrl || raw.file || raw.path ||
                                                        raw.video || raw.data?.url || raw.data?.link || raw.linkUrl;

                                                    let resolvedUrl = videoUrl;
                                                    if (videoUrl && typeof videoUrl === 'string' && !videoUrl.startsWith('http') && !videoUrl.startsWith('blob') && !videoUrl.startsWith('data:')) {
                                                        resolvedUrl = videoUrl.startsWith('/') ? videoUrl : `/api/uploads/${videoUrl}`;
                                                    }

                                                    // Enhanced Platform Detection (YouTube live, shorts, embed etc)
                                                    const isYouTube = resolvedUrl?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/);
                                                    const isVimeo = resolvedUrl?.includes('vimeo.com');
                                                    const isGDrive = resolvedUrl?.includes('drive.google.com');

                                                    if (isYouTube && isYouTube[2].length === 11) {
                                                        return (
                                                            <iframe
                                                                src={`https://www.youtube.com/embed/${isYouTube[2]}?autoplay=1&rel=0&modestbranding=1`}
                                                                className="w-full h-full"
                                                                frameBorder="0"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                            ></iframe>
                                                        );
                                                    }

                                                    if (isVimeo) {
                                                        const vimeoId = resolvedUrl.split('/').pop()?.split('?')[0];
                                                        return (
                                                            <iframe
                                                                src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
                                                                className="w-full h-full"
                                                                frameBorder="0"
                                                                allow="autoplay; fullscreen; picture-in-picture"
                                                                allowFullScreen
                                                            ></iframe>
                                                        );
                                                    }

                                                    if (isGDrive) {
                                                        const driveId = resolvedUrl.match(/\/d\/(.+)\//)?.[1] || resolvedUrl.split('id=')[1];
                                                        return (
                                                            <iframe
                                                                src={`https://drive.google.com/file/d/${driveId}/preview`}
                                                                className="w-full h-full"
                                                                frameBorder="0"
                                                                allow="autoplay"
                                                            ></iframe>
                                                        );
                                                    }

                                                    return (
                                                        <div className="relative w-full h-full group/player overflow-hidden">
                                                            <video
                                                                src={resolvedUrl}
                                                                poster={raw.thumbnail || raw.thumbnailUrl || raw.poster || raw.image}
                                                                className="w-full h-full object-contain"
                                                                controls
                                                                autoPlay
                                                                muted
                                                                playsInline
                                                                onError={() => setVideoError(resolvedUrl || 'Unknown Source')}
                                                            />

                                                            {/* Source Debug Overlay - Visible on Hover */}
                                                            <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-md p-3 translate-y-full group-hover/player:translate-y-0 transition-transform duration-300 z-50">
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <div className="flex-1 overflow-hidden">
                                                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Detected Source URL</p>
                                                                        <p className="text-[11px] font-mono text-indigo-300 truncate">{resolvedUrl || 'NULL'}</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => window.open(resolvedUrl, '_blank')}
                                                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all whitespace-nowrap"
                                                                    >
                                                                        Open In New Tab
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="absolute top-4 right-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg">
                                                                    <span className="text-[10px] text-white/90 font-bold tracking-widest uppercase">Direct Player</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        ) : (
                                            <div className="relative w-full h-full group flex items-center justify-center">
                                                {/* Thumbnail Layer */}
                                                {selectedItem.raw?.thumbnail ? (
                                                    <img
                                                        src={selectedItem.raw.thumbnail}
                                                        alt="preview"
                                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] to-[#0f172a] flex flex-col items-center justify-center">
                                                        <span className="material-symbols-outlined text-white/5 text-[140px] absolute">videocam</span>
                                                        <div className="relative z-10 px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                                                            <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em]">Internal Player Ready</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Dark Contrast Overlay */}
                                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300"></div>

                                                {/* Premium Play Button */}
                                                <div className="relative z-20 flex items-center justify-center">
                                                    <button
                                                        onClick={() => setIsPlaying(true)}
                                                        className="w-[68px] h-[68px] bg-white/95 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-[1.08] hover:bg-white active:scale-95 group/btn"
                                                    >
                                                        <span className="material-symbols-outlined text-[#111827] text-[36px] font-bold fill-current translate-x-0.5 group-hover/btn:text-indigo-600 transition-colors">play_arrow</span>
                                                    </button>
                                                </div>

                                                {/* Bottom Info Label */}
                                                <div className="absolute bottom-6 left-6 flex items-center gap-3">
                                                    <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-white/90 uppercase tracking-widest leading-none">AONE STREAMING ENGINE</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) :
                                    selectedItem.type === 'PDF' ? (
                                        <div className="flex flex-col md:flex-row items-center gap-8 bg-blue-50/30 p-8 rounded-[24px] border border-blue-50">
                                            <div className="w-28 h-36 bg-white rounded-xl shadow-md border border-gray-100 flex items-center justify-center relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-10 h-10 bg-red-500 rounded-bl-xl flex items-center justify-center">
                                                    <span className="text-white text-[12px] font-black">PDF</span>
                                                </div>
                                                <span className="material-symbols-outlined text-[64px] text-gray-200">description</span>
                                            </div>
                                            <div className="flex-1 space-y-4 text-center md:text-left">
                                                <div>
                                                    <h4 className="text-[22px] font-bold text-[#111827]">{selectedItem.title}</h4>
                                                    <p className="text-[14px] font-medium text-gray-500 mt-1">{selectedItem.duration || 'Multiple Pages'}</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const url = selectedItem.raw?.fileUrl || selectedItem.raw?.url;
                                                        if (url) window.open(url, '_blank');
                                                    }}
                                                    className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-[14px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 mx-auto md:mx-0"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                    View PDF
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-orange-50/30 p-8 rounded-[24px] border border-orange-50 flex flex-col items-center text-center gap-6">
                                            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center">
                                                <span className="material-symbols-outlined text-orange-500 text-[40px]">quiz</span>
                                            </div>
                                            <div className="max-w-md">
                                                <h4 className="text-[22px] font-bold text-[#111827]">{selectedItem.title}</h4>
                                                <p className="text-[15px] font-medium text-gray-600 mt-3 leading-relaxed">
                                                    This test contains <span className="text-orange-600 font-bold">{Array.isArray(selectedItem.raw?.questions) ? selectedItem.raw.questions.length : (selectedItem.raw?.questions || 'multiple')}</span> interactive questions with a duration of <span className="text-gray-900 font-bold">{selectedItem.duration || 'unspecified'}</span>.
                                                </p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setShowQuestionsModal(true)}
                                                    className="px-10 py-4 bg-white border-2 border-orange-100 text-orange-600 rounded-2xl text-[14px] font-black uppercase tracking-widest hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm active:scale-95"
                                                >
                                                    View Questions
                                                </button>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>


                    {/* QUESTIONS MODAL */}
                    {showQuestionsModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-zoom-in">
                                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                                            <span className="material-symbols-outlined">quiz</span>
                                        </div>
                                        <div>
                                            <h3 className="text-[16px] font-black text-gray-900">Questions List</h3>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{selectedItem.title}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowQuestionsModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all text-gray-500">
                                        <span className="material-symbols-outlined text-[20px]">close</span>
                                    </button>
                                </div>

                                <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
                                    {Array.isArray(selectedItem.raw?.questions) ? (
                                        selectedItem.raw.questions.map((q: any, idx: number) => (
                                            <div key={idx} className="p-5 border border-gray-100 rounded-2xl hover:border-orange-200 transition-colors">
                                                <div className="flex gap-4">
                                                    <span className="text-[13px] font-black text-orange-500">Q{idx + 1}.</span>
                                                    <div className="flex-1">
                                                        <p className="text-[14px] font-bold text-gray-800 leading-relaxed mb-3">{q.question || q.title || 'Untitled Question'}</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {q.options?.map((opt: string, oIdx: number) => (
                                                                <div key={oIdx} className="px-3 py-2 bg-gray-50 rounded-lg text-[12px] font-medium text-gray-600">
                                                                    {String.fromCharCode(65 + oIdx)}. {opt}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center">
                                            <span className="material-symbols-outlined text-[48px] text-gray-200 mb-4">description</span>
                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[12px]">No question details found in raw data</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return (
        <div className="bg-[#fafafa] min-h-screen">
            <div className="pt-0 px-6 pb-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                    <h1 className="text-[24px] font-bold text-[#111827] tracking-tight">Content Explorer</h1>

                    <div className="flex items-center gap-3">
                        <div className="relative group flex-1 md:flex-none">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] group-focus-within:text-navy transition-colors">search</span>
                            <input
                                type="text"
                                placeholder="Search title or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full md:w-[280px] pl-12 pr-4 py-3 bg-white border border-[#e5e7eb] rounded-2xl text-[14px] font-bold outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 transition-all shadow-sm placeholder:text-gray-400"
                            />
                        </div>

                        <div className="relative" ref={filterDropdownRef}>
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-6 py-3 border rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${isFilterOpen || typeFilter !== 'all' || courseFilter !== 'all' ? 'bg-navy text-white border-navy shadow-lg shadow-navy/20' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">tune</span>
                                Advanced Filters
                                {(typeFilter !== 'all' || courseFilter !== 'all') && (
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                )}
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[200] p-6 animate-in fade-in zoom-in duration-200 origin-top-right">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Filter Content</h4>
                                        <button
                                            onClick={() => { setTypeFilter('all'); setCourseFilter('all'); }}
                                            className="text-[10px] font-bold text-blue-600 hover:underline"
                                        >
                                            Reset All
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Content Type</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['all', 'Recorded', 'Live', 'PDF', 'Test'].map((type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setTypeFilter(type)}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${typeFilter === type ? 'bg-navy text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">By Product / Course</label>
                                            <select
                                                value={courseFilter}
                                                onChange={(e) => setCourseFilter(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[12px] font-bold text-gray-700 outline-none focus:bg-white focus:border-navy transition-all appearance-none cursor-pointer mt-2"
                                            >
                                                <option value="all">All Available Products</option>
                                                {courses.map(course => (
                                                    <option key={course.id || course._id} value={course.id || course._id}>
                                                        {course.name || course.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-gray-50">
                                        <button onClick={() => setIsFilterOpen(false)} className="w-full py-3 bg-gray-50 text-navy text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-gray-100 transition-all">
                                            Show {filteredContent.length} Results
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* TABLE CONTAINER */}
                <div className="bg-white rounded-[16px] border border-[#f3f4f6] shadow-[0_4px_25px_rgba(0,0,0,0.03)] overflow-hidden">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
                            <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">Loading content...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#f9fafb] border-b border-[#f1f2f4]">
                                    <th className="px-6 py-4 text-[11px] font-black text-[#9ca3af] uppercase tracking-[0.12em] whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            ID <span className="material-symbols-outlined text-[14px]">unfold_more</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#9ca3af] uppercase tracking-[0.12em] whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            TITLE <span className="material-symbols-outlined text-[14px]">unfold_more</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#9ca3af] uppercase tracking-[0.12em] whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            PRODUCT <span className="material-symbols-outlined text-[14px]">unfold_more</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#9ca3af] uppercase tracking-[0.12em] whitespace-nowrap">DATE</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#9ca3af] uppercase tracking-[0.12em] whitespace-nowrap">VIEW</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#9ca3af] uppercase tracking-[0.12em] whitespace-nowrap text-right pr-6">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContent.length > 0 ? (
                                    filteredContent.map((item, idx) => (
                                        <tr key={item.id} className="border-b border-[#f9fafb] last:border-0 hover:bg-[#fafafa] transition-colors group">
                                            <td className="px-6 py-5 text-[14px] font-medium text-[#6b7280]">
                                                {item.id.toString().length > 6 ? item.id.toString().slice(-6).toUpperCase() : item.id}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-[14px] font-bold text-[#111827]">{item.title}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[14px] font-medium text-[#6b7280]">{item.courseName}</span>
                                                    <span className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.type === 'PDF' ? 'bg-blue-50 text-blue-500' :
                                                        item.type === 'Test' ? 'bg-orange-50 text-orange-500' :
                                                            'bg-green-50 text-green-500'
                                                        }`}>
                                                        {item.type}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-[14px] font-medium text-[#6b7280] whitespace-nowrap">
                                                {formatDate(item.createdAt)}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col items-start">
                                                    <button
                                                        onClick={() => setSelectedItem(item)}
                                                        className="text-indigo-600 hover:text-indigo-800 text-[14px] font-bold mb-1 transition-colors"
                                                    >
                                                        View
                                                    </button>
                                                    {item.duration && (
                                                        <div className="flex items-center gap-1 text-[#9ca3af] text-[11px] font-medium">
                                                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                            {item.duration}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* ✏️ Edit */}
                                                    <button
                                                        title="Edit"
                                                        onClick={() => { setEditingItem(item); setEditTitle(item.title); }}
                                                        disabled={!!actionLoading}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all active:scale-90 disabled:opacity-50"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                    </button>
                                                    {/* 🗑️ Delete */}
                                                    <button
                                                        title="Delete"
                                                        onClick={() => handleDeleteItem(item)}
                                                        disabled={actionLoading === item.id}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all active:scale-90 disabled:opacity-50"
                                                    >
                                                        {actionLoading === item.id
                                                            ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                                                            : <span className="material-symbols-outlined text-[18px]">delete</span>}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-7 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <span className="material-symbols-outlined text-[48px] text-[#f3f4f6]">folder_open</span>
                                                <p className="text-[14px] font-bold text-gray-400">No content items found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ✏️ Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setEditingItem(null)}>
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-br from-gray-900 to-gray-700 px-8 py-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-[18px] font-black text-white">Edit Content</h3>
                                <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest mt-0.5">{editingItem.type}</p>
                            </div>
                            <button onClick={() => setEditingItem(null)} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[18px]">close</span>
                            </button>
                        </div>
                        <div className="p-8 space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Title</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-bold text-gray-800 outline-none focus:border-indigo-400 transition-all"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setEditingItem(null)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-[13px] hover:bg-gray-200 transition-all">Cancel</button>
                                <button
                                    onClick={handleEditSave}
                                    disabled={!editTitle.trim() || actionLoading === editingItem.id}
                                    className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-bold text-[13px] hover:bg-gray-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {actionLoading === editingItem.id && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24;
                }

                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }

                .animate-slide-in-right {
                    animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div >
    );
};

export default ContentManager;

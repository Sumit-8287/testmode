import React, { useState, useRef, useEffect } from 'react';
import { couponsAPI, coursesAPI } from '../../src/services/apiClient';
import RichTextEditor from '../shared/RichTextEditor';

interface Props {
    onClose: () => void;
}

const AddCourse: React.FC<Props> = ({ onClose }) => {
    const [activeStep, setActiveStep] = useState(1);
    const [validityTab, setValidityTab] = useState<'set' | 'end' | 'lifetime'>('set');
    const [isFeatured, setIsFeatured] = useState(false);
    const [showCategories, setShowCategories] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [validityUnit, setValidityUnit] = useState('Months');
    const [showValidityUnit, setShowValidityUnit] = useState(false);
    const [endDay, setEndDay] = useState('');
    const [endMonth, setEndMonth] = useState('');
    const [endYear, setEndYear] = useState('');
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [demoVideo, setDemoVideo] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [originalPrice, setOriginalPrice] = useState('');
    const [description, setDescription] = useState('');
    const [showAdditionalSettings, setShowAdditionalSettings] = useState(false);
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loadingCoupons, setLoadingCoupons] = useState(false);
    const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
    const [showCouponList, setShowCouponList] = useState(false);
    const [couponSearch, setCouponSearch] = useState('');

    // Advanced Settings States
    const [easyEmi, setEasyEmi] = useState(false);
    const [isCombo, setIsCombo] = useState(false);
    const [intlUptick, setIntlUptick] = useState(false);
    const [allowUpgrade, setAllowUpgrade] = useState(false);

    // Step 3: Content States
    const [selectedTestSeries, setSelectedTestSeries] = useState<string[]>([]);
    const [showTestSeriesList, setShowTestSeriesList] = useState(false);
    const [testSeriesSearch, setTestSeriesSearch] = useState('');
    const [selectedBook, setSelectedBook] = useState('');
    const [showBookList, setShowBookList] = useState(false);
    const [upsellCourses, setUpsellCourses] = useState(false);
    const [selectedUpsellCourses, setSelectedUpsellCourses] = useState<string[]>([]);
    const [showUpsellList, setShowUpsellList] = useState(false);
    const [upsellSearch, setUpsellSearch] = useState('');
    const [allCourses, setAllCourses] = useState<any[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);

    // Step 4: Additional Settings States
    const [sortingOrder, setSortingOrder] = useState('');
    const [customBadge, setCustomBadge] = useState('');
    const [showTabs, setShowTabs] = useState(false);
    const [markNewBatch, setMarkNewBatch] = useState(false);
    const [enableDownloads, setEnableDownloads] = useState(false);
    const [disableCoupon, setDisableCoupon] = useState(false);
    const [disableInvoice, setDisableInvoice] = useState(false);
    const [enableTelegram, setEnableTelegram] = useState(false);
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [enableRichSnippets, setEnableRichSnippets] = useState(false);
    const [courseLanguage, setCourseLanguage] = useState('English');
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const testSeriesList = [
        "SSC Special Test Series",
        "Advance Batch Saturday Tests",
        "AFCAT",
        "Air Force Saturday Tests",
        "AIR FORCE X GROUP",
        "Banking Reasoning Topic Wise Tests",
        "Biology Chapterwise Tests",
        "Chemistry Chapterwise Tests",
        "English General Mock Tests"
    ];

    const booksList = [
        "Competitive English Grammar Rule And Exercise Book",
        "English Grammar Noun Book",
        "English grammar HSSC CET Book",
        "SSC Math Book Part- 1",
        "General Science Objective Book",
        "Reasoning Verbal and Non-Verbal Book"
    ];

    const editorRef = useRef<any>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setCoverImage(URL.createObjectURL(file));
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setDemoVideo(URL.createObjectURL(file));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingCoupons(true);
                setLoadingCourses(true);

                // Fetch coupons and courses in parallel
                const [couponsData, coursesData] = await Promise.all([
                    couponsAPI.getAll().catch(() => []),
                    coursesAPI.getAll().catch(() => [])
                ]);

                if (Array.isArray(couponsData)) {
                    setCoupons(couponsData.filter((c: any) => c.status === 'active'));
                }

                if (Array.isArray(coursesData)) {
                    // Filter out current course (if editing) or just set all
                    setAllCourses(coursesData);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
                // Demo fallbacks
                setCoupons([
                    { code: 'SAVE30', type: 'percentage', value: 30, status: 'active' },
                    { code: 'SAVE50', type: 'percentage', value: 50, status: 'active' },
                    { code: 'WELCOME10', type: 'percentage', value: 10, status: 'active' }
                ]);
                setAllCourses([
                    { title: 'Complete Web Development' },
                    { title: 'Advanced React Patterns' },
                    { title: 'Backend Engineering with Node.js' }
                ]);
            } finally {
                setLoadingCoupons(false);
                setLoadingCourses(false);
            }
        };
        fetchData();
    }, []);

    const handlePublish = async () => {
        if (!title.trim()) {
            alert("Please enter a course title.");
            return;
        }

        setIsPublishing(true);

        try {
            const courseData = {
                title,
                description,
                price,
                originalPrice,
                categories: selectedCategories,
                validity: {
                    tab: validityTab,
                    unit: validityUnit,
                    endDate: validityTab === 'end' ? `${endDay}-${endMonth}-${endYear}` : null
                },
                images: { cover: coverImage },
                videos: { demo: demoVideo },
                settings: {
                    isFeatured,
                    easyEmi,
                    isCombo,
                    intlUptick,
                    allowUpgrade,
                    sortingOrder,
                    customBadge,
                    markNewBatch,
                    enableDownloads,
                    disableCoupon,
                    disableInvoice,
                    enableTelegram,
                    metaTitle,
                    metaDescription,
                    courseLanguage
                },
                content: {
                    testSeries: selectedTestSeries,
                    book: selectedBook,
                    upsell: {
                        enabled: upsellCourses,
                        courses: selectedUpsellCourses
                    }
                }
            };

            console.log("Publishing Course Data:", courseData);

            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            alert("Course Published Successfully!");
            onClose();
        } catch (error) {
            console.error("Publish Error:", error);
            alert("Failed to publish course. Please try again.");
        } finally {
            setIsPublishing(false);
        }
    };

    const steps = [
        { id: 1, label: 'Basic Course Information' },
        { id: 2, label: 'Pricing' },
        { id: 3, label: 'Content' },
        { id: 4, label: 'Additional Settings' },
    ];

    return (
        <div className="min-h-screen bg-[#f8f9fa] animate-in fade-in duration-300">
            {/* TinyMCE toolbar cursor + style fix */}
            <style>{`
                .tox-toolbar__group .tox-tbtn:not(.tox-tbtn--disabled) { cursor: pointer !important; }
                .tox-toolbar__group .tox-tbtn:not(.tox-tbtn--disabled):hover { background: #e0e0e0 !important; }
                .tox-split-button:not(.tox-tbtn--disabled) .tox-tbtn { cursor: pointer !important; }
                .tox-split-button:not(.tox-tbtn--disabled) .tox-tbtn:hover { background: #e0e0e0 !important; }
                .tox-tbtn--disabled, .tox-tbtn--disabled:hover { cursor: not-allowed !important; opacity: 0.45 !important; }
                .tox .tox-selectfield select { cursor: pointer !important; }
                .tox .tox-toolbar-overlord .tox-toolbar__primary { background: #f3f3f3 !important; }
                .tox-toolbar__group { gap: 1px !important; }
                /* Force hide vertical lines in editor */
                blockquote, .tox-edit-area iframe { border: none !important; }
            `}</style>
            {/* Top Header */}

            <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between z-[110]">
                <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">Add New Course</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        Close
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className={`px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-md flex items-center gap-2 group ${isPublishing ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
                    >
                        {isPublishing ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <span className="material-symbols-outlined text-[18px] group-hover:-translate-y-0.5 transition-transform">publish</span>
                        )}
                        {isPublishing ? 'Publishing...' : 'Publish Course'}
                    </button>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-8 py-8">
                {/* Stepper */}
                <div className="flex items-center justify-center mb-12">
                    <div className="flex items-center w-full max-w-[900px]">
                        {steps.map((step, idx) => (
                            <React.Fragment key={step.id}>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold transition-all duration-500 ${activeStep === step.id ? 'bg-black text-white shadow-lg shadow-black/20 scale-105' : activeStep > step.id ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-white border-2 border-gray-300 text-gray-500'}`}>
                                        {activeStep > step.id ? (
                                            <span className="material-symbols-outlined text-[18px] font-black animate-in zoom-in duration-300">check</span>
                                        ) : (
                                            step.id
                                        )}
                                    </div>
                                    <span className={`text-[14px] font-bold whitespace-nowrap transition-colors duration-300 ${activeStep === step.id ? 'text-black underline underline-offset-8 decoration-2 decoration-blue-500' : activeStep > step.id ? 'text-blue-600' : 'text-gray-500'}`}>
                                        {step.label}
                                    </span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className={`h-[3px] flex-1 mx-4 rounded-full transition-all duration-700 ${activeStep > step.id ? 'bg-blue-600 shadow-sm' : 'bg-gray-200'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Left Form Card */}
                    <div className="flex-1 bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
                        {/* Step 1: Basic Course Information */}
                        {activeStep === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                {/* Title field */}
                                <div className="space-y-3 mb-8">
                                    <label className="text-[14px] font-bold text-gray-700 ml-1">Title*</label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors">description</span>
                                        <input
                                            type="text"
                                            placeholder="Course Name"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full bg-white border border-gray-300 pl-11 pr-4 py-3.5 rounded-xl text-[14px] font-medium outline-none focus:border-gray-900 transition-all placeholder:text-gray-500"
                                        />
                                    </div>
                                </div>

                                {/* Description — Premium RichTextEditor */}
                                <div className="space-y-4 mb-10">
                                    <label className="text-[14px] font-bold text-gray-700 ml-1">Description</label>
                                    <RichTextEditor
                                        content={description}
                                        onChange={(html) => setDescription(html)}
                                        height="420px"
                                    />
                                </div>

                                {/* Media and Settings Row */}
                                <div className="grid grid-cols-2 gap-8 mb-10">
                                    <div className="space-y-3">
                                        <label className="text-[14px] font-bold text-gray-700 ml-1">Cover Image</label>
                                        <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                        <div onClick={() => imageInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-3xl p-8 flex flex-col items-center justify-center bg-gray-50/20 hover:bg-gray-50/50 hover:border-gray-400 transition-all cursor-pointer group min-h-[160px] relative overflow-hidden">
                                            {coverImage ? <img src={coverImage} className="absolute inset-0 w-full h-full object-cover" alt="Preview" /> : (
                                                <>
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3 group-hover:scale-105 transition-transform duration-300 border border-gray-50">
                                                        <span className="material-symbols-outlined text-gray-200 text-[28px]">image</span>
                                                    </div>
                                                    <p className="text-[13px] font-bold text-gray-500">No Image</p>
                                                    <p className="text-[11px] text-gray-400 mt-1">Click to upload cover image</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[14px] font-bold text-gray-700 ml-1">Demo Video</label>
                                        <input type="file" ref={videoInputRef} onChange={handleVideoUpload} accept="video/*" className="hidden" />
                                        <div onClick={() => videoInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-3xl p-8 flex flex-col items-center justify-center bg-gray-50/20 hover:bg-gray-50/50 hover:border-gray-400 transition-all cursor-pointer group min-h-[160px] relative overflow-hidden">
                                            {demoVideo ? (
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="material-symbols-outlined text-blue-500 text-[44px]">check_circle</span>
                                                    <p className="text-[13px] font-bold text-gray-600 mt-2">Video Selected</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3 group-hover:scale-105 transition-transform duration-300 border border-gray-50">
                                                        <span className="material-symbols-outlined text-gray-200 text-[28px]">videocam</span>
                                                    </div>
                                                    <p className="text-[13px] font-bold text-gray-500">No Video</p>
                                                    <p className="text-[11px] text-gray-400 mt-1">Click to upload demo video</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Featured and Categories */}
                                <div className="grid grid-cols-2 gap-8 mb-10">
                                    <div className="space-y-3">
                                        <label className="text-[14px] font-bold text-gray-700 ml-1">Categories</label>
                                        <div className="relative">
                                            <div onMouseDown={(e) => { e.preventDefault(); setShowCategories(!showCategories); }} className="w-full bg-white border border-gray-300 px-4 py-3.5 rounded-xl text-[14px] font-medium transition-all cursor-pointer flex items-center justify-between hover:border-gray-400">
                                                <span className={selectedCategories.length ? 'text-gray-900 font-bold' : 'text-gray-500'}>{selectedCategories.length ? selectedCategories.join(', ') : 'Select Categories'}</span>
                                                <span className={`material-symbols-outlined text-gray-400 transition-transform ${showCategories ? 'rotate-180' : ''}`}>expand_more</span>
                                            </div>
                                            {showCategories && (
                                                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] py-3 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="px-5 pb-2 mb-2 border-b border-gray-50 flex justify-between items-center">
                                                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Select Categories</span>
                                                        <button
                                                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowCategories(false); }}
                                                            className="text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                                                        {['Class 10th', 'Class 11th', 'Class 12th', 'NEET Special', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Science'].map((cat) => (
                                                            <div key={cat} onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                const newCats = selectedCategories.includes(cat) ? selectedCategories.filter(c => c !== cat) : [...selectedCategories, cat];
                                                                setSelectedCategories(newCats);
                                                                setShowCategories(false);
                                                            }} className={`px-6 py-2.5 text-[14px] font-medium cursor-pointer transition-colors flex items-center justify-between hover:bg-gray-50 ${selectedCategories.includes(cat) ? 'text-blue-600 bg-blue-50/30' : 'text-gray-600'}`}>
                                                                {cat} {selectedCategories.includes(cat) && <span className="material-symbols-outlined text-[18px] text-blue-500">check</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="px-3 pt-2 mt-2 border-t border-gray-50">
                                                        <button
                                                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowCategories(false); }}
                                                            className="w-full py-2 bg-gray-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                                                        >
                                                            Done
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-end pb-3.5">
                                        <div className="flex items-center gap-3 ml-1">
                                            <button onClick={() => setIsFeatured(!isFeatured)} className={`w-10 h-6 rounded-full relative transition-all duration-300 ${isFeatured ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                                <div className={`absolute top-[4px] transition-all duration-300 w-4 h-4 bg-white rounded-full shadow-sm ${isFeatured ? 'left-[20px]' : 'left-[4px]'}`} />
                                            </button>
                                            <span className="text-[14px] font-bold text-gray-500">Featured Course</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Validity */}
                                <div className="space-y-4 mb-4 mt-8">
                                    <label className="text-[14px] font-bold text-gray-700 ml-1">Validity*</label>
                                    <div className="bg-gray-50 shadow-inner p-1.5 rounded-2xl flex gap-1 border border-gray-100/50">
                                        {(['set', 'end', 'lifetime'] as const).map((tab) => (
                                            <button key={tab} type="button" onClick={() => setValidityTab(tab)}
                                                className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl transition-all ${validityTab === tab ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                                                {tab === 'set' ? 'Set Validity' : tab === 'end' ? 'End Date' : 'Lifetime Access'}
                                            </button>
                                        ))}
                                    </div>

                                    {validityTab === 'set' && (
                                        <div className="p-6 bg-gray-50/30 rounded-[24px] border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <p className="text-[13px] font-bold text-gray-500 uppercase tracking-wide">Duration</p>
                                            <div className="flex gap-3 items-center">
                                                <div className="flex-1 relative">
                                                    <div
                                                        onMouseDown={(e) => { e.preventDefault(); setShowValidityUnit(!showValidityUnit); }}
                                                        className="w-full bg-white border border-gray-300 px-4 py-3.5 rounded-xl text-[14px] font-bold text-gray-700 cursor-pointer flex items-center justify-between hover:border-gray-400 transition-all select-none"
                                                    >
                                                        <span>{validityUnit}</span>
                                                        <span className={`material-symbols-outlined text-gray-400 transition-transform duration-200 ${showValidityUnit ? 'rotate-180' : ''}`}>expand_more</span>
                                                    </div>
                                                    {showValidityUnit && (
                                                        <>
                                                            <div className="fixed inset-0 z-[90]" onClick={() => setShowValidityUnit(false)} />
                                                            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-[100] py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                                                {['Days', 'Weeks', 'Months', 'Years'].map((unit) => (
                                                                    <div key={unit}
                                                                        onMouseDown={(e) => { e.preventDefault(); setValidityUnit(unit); setShowValidityUnit(false); }}
                                                                        className={`px-4 py-2.5 text-[13px] font-bold cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors ${validityUnit === unit ? 'text-blue-600' : 'text-gray-500'}`}
                                                                    >
                                                                        {unit}
                                                                        {validityUnit === unit && <span className="material-symbols-outlined text-[16px] text-blue-500">check</span>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="w-28">
                                                    <input type="number" min={1} defaultValue={6}
                                                        className="w-full bg-white border border-gray-200 px-4 py-3.5 rounded-xl text-[14px] font-bold text-center outline-none focus:border-gray-900 hover:border-gray-400 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {validityTab === 'end' && (
                                        <div className="p-6 bg-gray-50/30 rounded-[24px] border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <p className="text-[13px] font-bold text-gray-500 uppercase tracking-wide">Select End Date</p>
                                            <div className="flex gap-3">
                                                <div className="w-24">
                                                    <select value={endDay} onChange={(e) => setEndDay(e.target.value)}
                                                        className="w-full bg-white border border-gray-200 px-3 py-3.5 rounded-xl text-[14px] font-bold text-gray-700 outline-none focus:border-gray-900 hover:border-gray-400 transition-all cursor-pointer appearance-none text-center">
                                                        <option value="">Day</option>
                                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <select value={endMonth} onChange={(e) => setEndMonth(e.target.value)}
                                                        className="w-full bg-white border border-gray-200 px-3 py-3.5 rounded-xl text-[14px] font-bold text-gray-700 outline-none focus:border-gray-900 hover:border-gray-400 transition-all cursor-pointer appearance-none text-center">
                                                        <option value="">Month</option>
                                                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                                                            <option key={m} value={i + 1}>{m}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-28">
                                                    <select value={endYear} onChange={(e) => setEndYear(e.target.value)}
                                                        className="w-full bg-white border border-gray-200 px-3 py-3.5 rounded-xl text-[14px] font-bold text-gray-700 outline-none focus:border-gray-900 hover:border-gray-400 transition-all cursor-pointer appearance-none text-center">
                                                        <option value="">Year</option>
                                                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(y => <option key={y} value={y}>{y}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            {endDay && endMonth && endYear && (
                                                <p className="text-[13px] font-bold text-blue-600 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[16px]">event</span>
                                                    Access ends on: {endDay} {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(endMonth) - 1]} {endYear}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {validityTab === 'lifetime' && (
                                        <div className="p-6 bg-green-50/40 rounded-[24px] border border-green-100 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-green-600 text-[24px]">all_inclusive</span>
                                                </div>
                                                <div>
                                                    <p className="text-[14px] font-bold text-gray-800">Lifetime Access Enabled</p>
                                                    <p className="text-[12px] text-gray-500 mt-0.5">Students will have permanent access with no expiry date.</p>
                                                </div>
                                                <div className="ml-auto">
                                                    <span className="bg-green-500 text-white text-[11px] font-bold px-3 py-1 rounded-full">Active</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Pricing */}
                        {activeStep === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                                <div className="grid grid-cols-1 gap-8">
                                    {/* MRP Field */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-900 uppercase tracking-tight ml-1">MRP</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                                <span className="text-gray-500 text-[16px] font-medium">?</span>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="-1"
                                                value={originalPrice}
                                                onChange={(e) => setOriginalPrice(e.target.value)}
                                                className="w-full bg-white border border-gray-300 pl-10 pr-4 py-4 rounded-2xl text-[14px] font-medium outline-none focus:border-gray-400 transition-all placeholder:text-gray-500 shadow-sm"
                                            />
                                        </div>
                                        <p className="text-[12px] text-gray-500 font-medium ml-1">Display the maximum price at which the course could be sold, without any discount.</p>
                                    </div>

                                    {/* Selling Price Field */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[13px] font-bold text-gray-900 uppercase tracking-tight ml-1">Selling Price*</label>
                                            {originalPrice && price && parseFloat(originalPrice) > parseFloat(price) && parseFloat(originalPrice) > 0 && (
                                                <span className="text-[11px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100 animate-in slide-in-from-right-4">
                                                    {Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100)}% DISCOUNT APPLIED
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                                <span className="text-gray-500 text-[16px] font-medium">?</span>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Enter Price"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                className="w-full bg-white border border-gray-300 pl-10 pr-4 py-4 rounded-2xl text-[14px] font-medium outline-none focus:border-gray-400 transition-all placeholder:text-gray-500 shadow-sm"
                                            />
                                        </div>
                                        <p className="text-[12px] text-gray-500 font-medium ml-1">This is the final price student will pay after all internal discounts.</p>
                                    </div>

                                    {/* Discount Codes Field */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-900 uppercase tracking-tight ml-1">Select Discount Codes</label>
                                        <div className="relative group p-1 min-h-[56px] bg-white border border-gray-300 rounded-2xl shadow-sm transition-all focus-within:border-gray-400 focus-within:ring-4 focus-within:ring-gray-900/5" onClick={() => setShowCouponList(true)}>
                                            <div className="flex flex-wrap gap-2 p-2 px-3">
                                                {selectedCoupons.map(code => (
                                                    <div key={code} className="bg-blue-600 text-white pl-3 pr-1.5 py-1.5 rounded-xl flex items-center gap-1.5 animate-in scale-90 fade-in duration-200 shadow-sm border border-blue-700">
                                                        <span className="text-[12px] font-black tracking-wider">{code}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedCoupons(selectedCoupons.filter(c => c !== code)); }}
                                                            className="w-5 h-5 rounded-lg bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors border border-white/10"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                                        </button>
                                                    </div>
                                                ))}
                                                <input
                                                    type="text"
                                                    placeholder={selectedCoupons.length === 0 ? "Search or select coupons" : ""}
                                                    onFocus={() => setShowCouponList(true)}
                                                    value={couponSearch}
                                                    onChange={(e) => setCouponSearch(e.target.value)}
                                                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none py-2 text-[14px] font-extrabold text-gray-800 placeholder:text-gray-400 placeholder:font-medium"
                                                />
                                            </div>

                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                {selectedCoupons.length > 0 && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedCoupons([]); setCouponSearch(''); }}
                                                        className="text-[10px] font-black text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 px-2 py-1 rounded-lg border border-gray-100 hover:border-red-100 transition-all uppercase tracking-tighter"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${showCouponList ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`} onClick={(e) => { e.stopPropagation(); setShowCouponList(!showCouponList); }}>
                                                    <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${showCouponList ? 'rotate-180' : ''}`}>expand_more</span>
                                                </div>
                                            </div>

                                            {showCouponList && (
                                                <>
                                                    <div className="fixed inset-0 z-[120]" onClick={() => setShowCouponList(false)} />
                                                    <div className="absolute bottom-[calc(100%+12px)] left-0 w-full bg-white border border-gray-100 rounded-3xl shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.15)] z-[130] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                                                        <div className="p-4 bg-gray-50/50 border-b border-gray-50 flex items-center justify-between">
                                                            <div>
                                                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">Available Coupons</h4>
                                                                <p className="text-[10px] text-gray-400 mt-1">Select one or more codes</p>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setShowCouponList(false); }}
                                                                    className="text-[11px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setShowCouponList(false); }}
                                                                    className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black hover:border-gray-300 transition-all shadow-sm active:scale-95"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">done_all</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="max-h-[250px] overflow-y-auto custom-scrollbar bg-white">
                                                            {loadingCoupons ? (
                                                                <div className="p-10 text-center">
                                                                    <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin mx-auto mb-3" />
                                                                    <p className="text-[12px] font-bold text-gray-400">Loading your coupons...</p>
                                                                </div>
                                                            ) : coupons.filter(c => c.code.toLowerCase().includes(couponSearch.toLowerCase())).length === 0 ? (
                                                                <div className="p-10 text-center">
                                                                    <span className="material-symbols-outlined text-[40px] text-gray-100 mb-2">search_off</span>
                                                                    <p className="text-[12px] font-bold text-gray-400">No coupons match your search</p>
                                                                </div>
                                                            ) : coupons.filter(c => c.code.toLowerCase().includes(couponSearch.toLowerCase())).map(coupon => (
                                                                <div
                                                                    key={coupon.code}
                                                                    onClick={() => {
                                                                        const newSelected = selectedCoupons.includes(coupon.code)
                                                                            ? selectedCoupons.filter(c => c !== coupon.code)
                                                                            : [...selectedCoupons, coupon.code];
                                                                        setSelectedCoupons(newSelected);
                                                                        setShowCouponList(false);
                                                                    }}
                                                                    className={`px-5 py-4 cursor-pointer flex items-center justify-between group transition-all duration-300 border-b border-gray-50/50 last:border-0 ${selectedCoupons.includes(coupon.code) ? 'bg-blue-50/20' : 'hover:bg-gray-50'}`}
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${selectedCoupons.includes(coupon.code) ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:shadow-soft'}`}>
                                                                            <span className="material-symbols-outlined text-[20px]">{selectedCoupons.includes(coupon.code) ? 'check' : 'confirmation_number'}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className={`text-[15px] font-black block tracking-tight ${selectedCoupons.includes(coupon.code) ? 'text-blue-700' : 'text-gray-800 group-hover:text-black'}`}>
                                                                                {coupon.code}
                                                                            </span>
                                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                                                {coupon.type === 'percentage' ? `${coupon.value || 0}% OFF` : `?${coupon.value || 0} OFF`}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center shrink-0 ${selectedCoupons.includes(coupon.code) ? 'bg-blue-600 border-blue-600' : 'border-gray-200 group-hover:border-gray-300'}`}>
                                                                        {selectedCoupons.includes(coupon.code) && <span className="material-symbols-outlined text-white text-[14px] font-black">check</span>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {coupons.length > 0 && (
                                                            <div className="p-3 bg-gray-50/50 border-t border-gray-50">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setShowCouponList(false); }}
                                                                    className="w-full bg-white border border-gray-200 hover:border-black text-black py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-[0.98]"
                                                                >
                                                                    Confirm Selection
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-[12px] text-gray-400 font-medium ml-1 mt-2 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px] text-gray-300">info</span>
                                            Selected codes will be available for checkout discount.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Content */}
                        {activeStep === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
                                {/* Attach Test Series */}
                                <div className="space-y-4">
                                    <label className="text-[14px] font-bold text-gray-700 ml-1">Attach Test Series</label>
                                    <div className="relative">
                                        <div
                                            onClick={() => setShowTestSeriesList(!showTestSeriesList)}
                                            className="w-full bg-white border border-gray-300 px-5 py-3.5 rounded-xl text-[14px] font-medium transition-all cursor-pointer flex items-center justify-between hover:border-gray-400 shadow-sm"
                                        >
                                            <span className={selectedTestSeries.length ? 'text-gray-900 font-bold' : 'text-gray-500'}>
                                                {selectedTestSeries.length ? `${selectedTestSeries.length} of ${testSeriesList.length} selected` : 'Search'}
                                            </span>
                                            <span className={`material-symbols-outlined text-gray-400 transition-transform ${showTestSeriesList ? 'rotate-180' : ''}`}>expand_more</span>
                                        </div>

                                        {showTestSeriesList && (
                                            <>
                                                <div className="fixed inset-0 z-[90]" onClick={() => setShowTestSeriesList(false)} />
                                                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.12)] z-[100] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="px-5 py-3.5 border-b border-gray-50">
                                                        <input
                                                            type="text"
                                                            placeholder="Search"
                                                            value={testSeriesSearch}
                                                            onChange={(e) => setTestSeriesSearch(e.target.value)}
                                                            className="w-full bg-gray-50 border-none px-4 py-2 rounded-lg text-[13px] outline-none placeholder:text-gray-400"
                                                        />
                                                    </div>
                                                    <div className="px-5 py-2.5 flex justify-between items-center border-b border-gray-50">
                                                        <div className="flex gap-4">
                                                            <button
                                                                onClick={() => setSelectedTestSeries([...testSeriesList])}
                                                                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                                                            >
                                                                SELECT ALL
                                                            </button>
                                                            <button
                                                                onClick={() => { setSelectedTestSeries([]); }}
                                                                className="text-[11px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider"
                                                            >
                                                                CLEAR
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setShowTestSeriesList(false); }}
                                                            className="text-[11px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                                        {testSeriesList.filter(ts => ts.toLowerCase().includes(testSeriesSearch.toLowerCase())).map((ts) => (
                                                            <div
                                                                key={ts}
                                                                onClick={() => {
                                                                    const newSelected = selectedTestSeries.includes(ts)
                                                                        ? selectedTestSeries.filter(t => t !== ts)
                                                                        : [...selectedTestSeries, ts];
                                                                    setSelectedTestSeries(newSelected);
                                                                    setShowTestSeriesList(false);
                                                                }}
                                                                className="px-5 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 group transition-colors"
                                                            >
                                                                <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selectedTestSeries.includes(ts) ? 'bg-blue-600 border-blue-600' : 'border-gray-200 group-hover:border-gray-300'}`}>
                                                                    {selectedTestSeries.includes(ts) && <span className="material-symbols-outlined text-white text-[14px] font-black">check</span>}
                                                                </div>
                                                                <span className={`text-[13px] font-bold ${selectedTestSeries.includes(ts) ? 'text-gray-900' : 'text-gray-500'}`}>{ts}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-[12px] text-gray-500 font-medium ml-1">Students who purchase the course can access them for free</p>
                                </div>

                                {/* Attach Book */}
                                <div className="space-y-4">
                                    <label className="text-[14px] font-bold text-gray-700 ml-1">Attach Book</label>
                                    <div className="relative">
                                        <div
                                            onClick={() => setShowBookList(!showBookList)}
                                            className="w-full bg-white border border-gray-300 px-5 py-3.5 rounded-xl text-[14px] font-medium transition-all cursor-pointer flex items-center justify-between hover:border-gray-400 shadow-sm"
                                        >
                                            <span className={selectedBook ? 'text-gray-900 font-bold' : 'text-gray-500'}>
                                                {selectedBook || 'Select Book'}
                                            </span>
                                            <span className={`material-symbols-outlined text-gray-400 transition-transform ${showBookList ? 'rotate-180' : ''}`}>expand_more</span>
                                        </div>

                                        {showBookList && (
                                            <>
                                                <div className="fixed inset-0 z-[90]" onClick={() => setShowBookList(false)} />
                                                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.12)] z-[100] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="px-6 py-2.5 border-b border-gray-50 flex justify-between items-center">
                                                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Select Book</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setShowBookList(false); }}
                                                            className="text-[11px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                                        <div
                                                            onClick={() => { setSelectedBook(''); setShowBookList(false); }}
                                                            className="px-6 py-3.5 text-[14px] font-bold text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors"
                                                        >
                                                            None (Clear Selection)
                                                        </div>
                                                        {booksList.map((book) => (
                                                            <div
                                                                key={book}
                                                                onClick={() => { setSelectedBook(book); setShowBookList(false); }}
                                                                className={`px-6 py-3.5 text-[14px] font-bold cursor-pointer transition-colors hover:bg-gray-50 ${selectedBook === book ? 'text-blue-600 bg-blue-50/30' : 'text-gray-600'}`}
                                                            >
                                                                {book}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-[12px] text-gray-500 font-medium ml-1">Students will be charged the price of the book along with the course fee</p>
                                </div>

                                {/* Upsell Courses */}
                                <div className="space-y-6 pt-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${upsellCourses ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
                                                <span className="material-symbols-outlined text-[20px]">trending_up</span>
                                            </div>
                                            <div>
                                                <h4 className="text-[14px] font-bold text-gray-900">Upsell Courses</h4>
                                                <p className="text-[12px] text-gray-500 font-medium">Recommend other courses to students who purchase this one</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setUpsellCourses(!upsellCourses)}
                                            className={`w-10 h-6 rounded-full relative transition-all duration-300 ${upsellCourses ? 'bg-blue-600' : 'bg-gray-200'}`}
                                        >
                                            <div className={`absolute top-[4px] transition-all duration-300 w-4 h-4 bg-white rounded-full shadow-sm ${upsellCourses ? 'left-[20px]' : 'left-[4px]'}`} />
                                        </button>
                                    </div>

                                    {upsellCourses && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <label className="text-[13px] font-bold text-gray-900 uppercase tracking-tight ml-1">Select Upsell Courses</label>
                                            <div className="relative group p-1 min-h-[56px] bg-white border border-gray-100 rounded-2xl shadow-sm transition-all focus-within:border-gray-300 focus-within:shadow-md">
                                                <div className="flex flex-wrap gap-2 p-2 px-3">
                                                    {selectedUpsellCourses.map(courseTitle => (
                                                        <div key={courseTitle} className="bg-blue-600 text-white pl-3 pr-1.5 py-1.5 rounded-xl flex items-center gap-1.5 animate-in scale-90 fade-in duration-200 shadow-sm border border-blue-700">
                                                            <span className="text-[12px] font-black tracking-wider line-clamp-1 max-w-[150px]">{courseTitle}</span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedUpsellCourses(selectedUpsellCourses.filter(c => c !== courseTitle)); }}
                                                                className="w-5 h-5 rounded-lg bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors border border-white/10"
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">close</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <input
                                                        type="text"
                                                        placeholder={selectedUpsellCourses.length === 0 ? "Search for courses to upsell..." : ""}
                                                        onFocus={() => setShowUpsellList(true)}
                                                        value={upsellSearch}
                                                        onChange={(e) => setUpsellSearch(e.target.value)}
                                                        className="flex-1 min-w-[200px] bg-transparent border-none outline-none ring-0 focus:ring-0 focus:outline-none py-2 text-[14px] font-extrabold text-gray-800 placeholder:text-gray-400 placeholder:font-medium"
                                                    />
                                                </div>

                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer ${showUpsellList ? 'bg-gray-900 text-white rotate-180' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`} onClick={(e) => { e.stopPropagation(); setShowUpsellList(!showUpsellList); }}>
                                                        <span className="material-symbols-outlined text-[18px]">expand_more</span>
                                                    </div>
                                                </div>

                                                {showUpsellList && (
                                                    <>
                                                        <div className="fixed inset-0 z-[120]" onClick={() => setShowUpsellList(false)} />
                                                        <div className="absolute bottom-[calc(100%+12px)] left-0 w-full bg-white border border-gray-100 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] z-[130] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                                                            <div className="p-4 px-5 bg-gray-50/50 border-b border-gray-50 flex justify-between items-center">
                                                                <div>
                                                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">Available Courses</h4>
                                                                    <p className="text-[10px] text-gray-400 mt-1">Recommend these courses at checkout</p>
                                                                </div>
                                                                <div className="flex gap-4 items-center">
                                                                    <button
                                                                        onClick={() => { setSelectedUpsellCourses([]); }}
                                                                        className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-wider transition-colors"
                                                                    >
                                                                        CLEAR ALL
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setShowUpsellList(false); }}
                                                                        className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-wider transition-colors"
                                                                    >
                                                                        CANCEL
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="max-h-[250px] overflow-y-auto custom-scrollbar bg-white">
                                                                {loadingCourses ? (
                                                                    <div className="p-10 text-center">
                                                                        <div className="w-10 h-10 border-4 border-gray-100 border-t-black rounded-full animate-spin mx-auto mb-3" />
                                                                        <p className="text-[12px] font-bold text-gray-400">Loading courses...</p>
                                                                    </div>
                                                                ) : allCourses.filter(c => (c.title || c.name || "").toLowerCase().includes(upsellSearch.toLowerCase())).length === 0 ? (
                                                                    <div className="p-10 text-center">
                                                                        <span className="material-symbols-outlined text-[40px] text-gray-100 mb-2">search_off</span>
                                                                        <p className="text-[12px] font-bold text-gray-400">No courses found</p>
                                                                    </div>
                                                                ) : allCourses.filter(c => (c.title || c.name || "").toLowerCase().includes(upsellSearch.toLowerCase())).map(course => {
                                                                    const courseTitle = course.title || course.name;
                                                                    return (
                                                                        <div
                                                                            key={courseTitle}
                                                                            onClick={() => {
                                                                                const newSelected = selectedUpsellCourses.includes(courseTitle)
                                                                                    ? selectedUpsellCourses.filter(c => c !== courseTitle)
                                                                                    : [...selectedUpsellCourses, courseTitle];
                                                                                setSelectedUpsellCourses(newSelected);
                                                                                setShowUpsellList(false);
                                                                            }}
                                                                            className={`px-5 py-4 cursor-pointer flex items-center justify-between group transition-all duration-300 border-b border-gray-50/50 last:border-0 ${selectedUpsellCourses.includes(courseTitle) ? 'bg-blue-50/20' : 'hover:bg-gray-50'}`}
                                                                        >
                                                                            <div className="flex items-center gap-4">
                                                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${selectedUpsellCourses.includes(courseTitle) ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:shadow-soft'}`}>
                                                                                    <span className="material-symbols-outlined text-[20px]">{selectedUpsellCourses.includes(courseTitle) ? 'check' : 'school'}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <span className={`text-[15px] font-black block tracking-tight ${selectedUpsellCourses.includes(courseTitle) ? 'text-blue-700' : 'text-gray-800 group-hover:text-black'}`}>
                                                                                        {courseTitle}
                                                                                    </span>
                                                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                                                        {course.price ? `?${course.price}` : 'Free Course'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center shrink-0 ${selectedUpsellCourses.includes(courseTitle) ? 'bg-blue-600 border-blue-600' : 'border-gray-200 group-hover:border-gray-300'}`}>
                                                                                {selectedUpsellCourses.includes(courseTitle) && <span className="material-symbols-outlined text-white text-[14px] font-black">check</span>}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            <div className="p-3 bg-gray-50/50 border-t border-gray-50">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setShowUpsellList(false); }}
                                                                    className="w-full bg-white border border-gray-200 hover:border-black text-black py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-[0.98]"
                                                                >
                                                                    Done selecting
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Additional Settings */}
                        {activeStep === 4 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-7">
                                {/* Top Inputs: Sorting & Badge */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2.5">
                                        <label className="text-[13px] font-bold text-gray-700 ml-0.5">Sorting Order</label>
                                        <input
                                            type="text"
                                            placeholder="0.00"
                                            value={sortingOrder}
                                            onChange={(e) => setSortingOrder(e.target.value)}
                                            className="w-full bg-white border border-gray-300 px-4 py-3 rounded-xl text-[14px] font-medium outline-none focus:border-gray-400 transition-all placeholder:text-gray-500"
                                        />
                                        <p className="text-[11px] text-gray-400 font-medium ml-0.5">Assign a number to sort this course in listing page</p>
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[13px] font-bold text-gray-700 ml-0.5">Display Custom Badge</label>
                                        <input
                                            type="text"
                                            placeholder="Enter Custom Badge"
                                            value={customBadge}
                                            onChange={(e) => setCustomBadge(e.target.value)}
                                            className="w-full bg-white border border-gray-300 px-4 py-3 rounded-xl text-[14px] font-medium outline-none focus:border-gray-400 transition-all placeholder:text-gray-500"
                                        />
                                    </div>
                                </div>

                                <div className="h-[1px] bg-gray-50/80 w-full my-2" />

                                {/* Toggle Sections */}
                                <div className="space-y-6">
                                    {[
                                        { title: 'Choose Tabs to Show on Course Page', desc: 'Enable tabs to show on your Course Page (Ex: Doubts, Discussions etc..)', state: showTabs, setState: setShowTabs },
                                        { title: 'Mark As New Batch', desc: 'Switch ON to display a badge indicating that the course consists of a new batch', state: markNewBatch, setState: setMarkNewBatch },
                                        { title: 'Enable Downloads', desc: 'Switch on if you want to download course video', state: enableDownloads, setState: setEnableDownloads },
                                        { title: 'Disable Discount Coupon', desc: 'Switch on if you want to disable coupon for this course', state: disableCoupon, setState: setDisableCoupon },
                                        { title: 'Disable Invoice', desc: 'Switch on if you want to disable invoice for this course', state: disableInvoice, setState: setDisableInvoice },
                                        { title: 'Enable Telegram Integration', desc: 'Give your community access to an exclusive Telegram channel. Detailed setup instructions will appear once you create the course.', state: enableTelegram, setState: setEnableTelegram },
                                    ].map((row, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-4 cursor-pointer group/row"
                                            onClick={() => row.setState(!row.state)}
                                        >
                                            <div
                                                className={`w-9 h-5 rounded-full relative transition-all duration-300 shrink-0 mt-1 ${row.state ? 'bg-[#5e5adb]' : 'bg-gray-200'}`}
                                            >
                                                <div className={`absolute top-[3px] transition-all duration-300 w-3.5 h-3.5 bg-white rounded-full shadow-sm ${row.state ? 'left-[17px]' : 'left-[3px]'}`} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h4 className="text-[13.5px] font-bold text-[#444] leading-tight group-hover/row:text-[#5e5adb] transition-colors">{row.title}</h4>
                                                <p className="text-[11.5px] text-gray-400 font-medium leading-relaxed">{row.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* SEO Settings */}
                                <div className="space-y-5 pt-4">
                                    <h3 className="text-[14px] font-bold text-gray-800">SEO Settings</h3>

                                    <div className="space-y-6">
                                        <div className="space-y-2.5">
                                            <label className="text-[13px] font-bold text-gray-700 ml-0.5">Meta Title</label>
                                            <input
                                                type="text"
                                                value={metaTitle}
                                                onChange={(e) => setMetaTitle(e.target.value)}
                                                className="w-full bg-white border border-gray-300 px-4 py-3 rounded-xl text-[14px] font-medium outline-none focus:border-gray-400 transition-all shadow-sm"
                                            />
                                        </div>

                                        <div className="space-y-2.5">
                                            <label className="text-[13px] font-bold text-gray-700 ml-0.5">Meta Description</label>
                                            <textarea
                                                placeholder="Enter Meta Description"
                                                value={metaDescription}
                                                onChange={(e) => setMetaDescription(e.target.value)}
                                                rows={2}
                                                className="w-full bg-white border border-gray-300 px-4 py-3 rounded-xl text-[14px] font-medium outline-none focus:border-gray-400 transition-all shadow-sm resize-none placeholder:text-gray-500"
                                            />
                                        </div>

                                        <div
                                            className="flex items-start gap-4 cursor-pointer group/row"
                                            onClick={() => setEnableRichSnippets(!enableRichSnippets)}
                                        >
                                            <div
                                                className={`w-9 h-5 rounded-full relative transition-all duration-300 shrink-0 mt-1 ${enableRichSnippets ? 'bg-[#5e5adb]' : 'bg-gray-200'}`}
                                            >
                                                <div className={`absolute top-[3px] transition-all duration-300 w-3.5 h-3.5 bg-white rounded-full shadow-sm ${enableRichSnippets ? 'left-[17px]' : 'left-[3px]'}`} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h4 className="text-[13.5px] font-bold text-[#444] leading-tight group-hover/row:text-[#5e5adb] transition-colors">Enable Rich Snippets</h4>
                                                <p className="text-[11.5px] text-gray-400 font-medium leading-relaxed">Enable to boost search result visibility with rich snippets</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* More Options Expandable */}
                                <div className="pt-2">
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setShowMoreOptions(!showMoreOptions)}
                                            className="flex items-center gap-1.5 text-[#5e5adb] text-[13px] font-bold hover:opacity-80 transition-all"
                                        >
                                            <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${showMoreOptions ? 'rotate-180' : ''}`}>expand_more</span>
                                            {showMoreOptions ? 'Hide More Options' : 'More Options'}
                                        </button>
                                    </div>

                                    {showMoreOptions && (
                                        <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2.5">
                                                <label className="text-[13px] font-bold text-gray-700 ml-0.5">Language</label>
                                                <div className="relative">
                                                    <select
                                                        value={courseLanguage}
                                                        onChange={(e) => setCourseLanguage(e.target.value)}
                                                        className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl text-[14px] font-medium outline-none focus:border-gray-300 transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="English">English</option>
                                                        <option value="Hindi">Hindi</option>
                                                    </select>
                                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2.5">
                                                <label className="text-[13px] font-bold text-gray-700 ml-0.5">Terms & Conditions</label>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept=".pdf"
                                                    onChange={(e) => setUploadedPdf(e.target.files?.[0] || null)}
                                                />
                                                <div className="flex gap-4">
                                                    <div className={`w-24 h-28 ${uploadedPdf ? 'bg-red-50 border-red-100' : 'bg-[#eeeeee] border-gray-100'} rounded-xl flex flex-col items-center justify-center gap-3 border shrink-0 transition-colors`}>
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${uploadedPdf ? 'bg-red-200/50' : 'bg-gray-400/20'}`}>
                                                            <span className={`material-symbols-outlined ${uploadedPdf ? 'text-red-500' : 'text-gray-500'} text-[20px]`}>{uploadedPdf ? 'picture_as_pdf' : 'help'}</span>
                                                        </div>
                                                        <span className={`text-[11px] font-bold ${uploadedPdf ? 'text-red-600' : 'text-gray-500'} uppercase tracking-wider text-center px-2 line-clamp-1`}>
                                                            {uploadedPdf ? uploadedPdf.name : 'No PDF'}
                                                        </span>
                                                    </div>
                                                    <div
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="flex-1 border-2 border-dashed border-gray-300 rounded-24px p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/20 transition-all group/upload"
                                                    >
                                                        <h4 className="text-[16px] font-bold text-gray-400 group-hover/upload:text-blue-600 transition-colors mb-1">Upload PDF</h4>
                                                        <p className="text-[12px] text-gray-400 font-medium">{uploadedPdf ? 'Click to change file' : 'Click or Drag & Drop your file here.'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className={`flex items-center pt-10 ${activeStep > 1 ? 'justify-between' : 'justify-end'}`}>
                            {activeStep > 1 && (
                                <button
                                    onClick={() => setActiveStep(prev => Math.max(prev - 1, 1))}
                                    className="flex items-center gap-2 px-9 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold text-[13px] hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[20px]">keyboard_backspace</span>
                                    Back
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    // Step 1 Validation
                                    if (activeStep === 1) {
                                        if (!title.trim()) {
                                            alert('Please enter a course title.');
                                            return;
                                        }
                                        if (!description || description.replace(/<[^>]*>/g, '').length < 20) {
                                            alert('Please enter a descriptive course summary (min 20 characters).');
                                            return;
                                        }
                                        if (selectedCategories.length === 0) {
                                            alert('Please select at least one category.');
                                            return;
                                        }
                                    }

                                    // Step 2 Validation
                                    if (activeStep === 2) {
                                        if (!price || parseFloat(price) <= 0) {
                                            alert('Please enter a valid course price.');
                                            return;
                                        }
                                    }

                                    if (activeStep < 4) {
                                        setActiveStep(prev => prev + 1);
                                    } else {
                                        // Handle Publish
                                        const courseData = {
                                            title,
                                            price,
                                            originalPrice,
                                            description,
                                            selectedCategories,
                                            isFeatured,
                                            coverImage,
                                            additionalSettings: {
                                                easyEmi,
                                                isCombo,
                                                intlUptick,
                                                allowUpgrade,
                                                sortingOrder,
                                                customBadge,
                                                showTabs,
                                                markNewBatch,
                                                enableDownloads,
                                                disableCoupon,
                                                disableInvoice,
                                                enableTelegram,
                                                metaTitle,
                                                metaDescription,
                                                enableRichSnippets,
                                                courseLanguage,
                                                termsAndConditions: uploadedPdf?.name
                                            }
                                        };
                                        console.log('Publishing Course Data:', courseData);
                                        alert('Course Published Successfully!');
                                        onClose();
                                    }
                                }}
                                className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-xl font-bold text-[14px] hover:bg-gray-800 transition-all shadow-md active:scale-95 group"
                            >
                                {activeStep === 4 ? (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">publish</span>
                                        Publish
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Preview Panel */}
                    <div className="w-[420px] sticky top-8 h-fit">
                        <div>
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1">LIVE PREVIEW</p>
                            <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden">
                                <div className="aspect-[16/10] bg-gray-50 flex items-center justify-center border-b border-gray-50 group overflow-hidden relative">
                                    {coverImage ? (
                                        <img src={coverImage} className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-500" alt="Preview" />
                                    ) : demoVideo ? (
                                        <div className="w-full h-full bg-black flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white text-[48px]">play_circle</span>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100/50">
                                            <span className="material-symbols-outlined text-[56px] text-gray-200">image_not_supported</span>
                                        </div>
                                    )}

                                    {isFeatured && (
                                        <div className="absolute top-4 left-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm animate-in zoom-in duration-300 z-10">
                                            <span className="material-symbols-outlined text-[12px] fill-1">star</span>
                                            Featured
                                        </div>
                                    )}

                                    <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
                                        {markNewBatch && (
                                            <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm animate-in slide-in-from-right-2 duration-300">
                                                NEW BATCH
                                            </div>
                                        )}
                                        {customBadge && (
                                            <div className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm animate-in slide-in-from-right-2 duration-300">
                                                {customBadge.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex gap-1.5 ">
                                                {selectedCategories.slice(0, 2).map(cat => (
                                                    <span key={cat} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase">{cat}</span>
                                                ))}
                                                {selectedCategories.length === 0 && <div className="h-4 bg-gray-100 rounded-full w-[80px]" />}
                                            </div>
                                            <div className="flex gap-1.5">
                                                {courseLanguage && (
                                                    <span className="text-[9px] font-black text-gray-400 border border-gray-100 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">language</span>
                                                        {courseLanguage}
                                                    </span>
                                                )}
                                                {easyEmi && (
                                                    <span className="text-[9px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">payments</span>
                                                        EMI
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <h3 className={`text-[18px] font-extrabold text-gray-900 leading-tight min-h-[1.5em] ${!title && 'text-gray-200'}`}>
                                            {title || 'Course Title Will Appear Here'}
                                        </h3>
                                    </div>

                                    <div className="space-y-2">
                                        <div className={`text-[13px] text-gray-500 leading-relaxed line-clamp-3 min-h-[4.5em] ${!description && 'text-gray-200'}`}>
                                            {(() => {
                                                if (!description) return 'Your Description will be summarized here automatically as you type...';

                                                // Create a temporary div to decode HTML entities like &nbsp;
                                                const temp = document.createElement('div');
                                                temp.innerHTML = description;
                                                const decodedText = temp.textContent || temp.innerText || "";

                                                return decodedText;
                                            })()}
                                        </div>
                                    </div>

                                    <div className="pt-6 flex items-center justify-between border-t border-gray-100">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.05em]">Investment</span>
                                                {originalPrice && price && parseFloat(originalPrice) > parseFloat(price) && parseFloat(originalPrice) > 0 && (
                                                    <div className="flex items-center gap-1 bg-red-50 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full animate-in zoom-in duration-500 border border-red-100/50">
                                                        <span className="material-symbols-outlined text-[12px]">local_fire_department</span>
                                                        {Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100)}% OFF
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-baseline gap-2.5">
                                                <div className="flex items-baseline text-gray-900">
                                                    <span className="text-[18px] font-bold mr-0.5 mt-1">?</span>
                                                    <span className="text-[32px] font-black tracking-tight">{price || '0'}</span>
                                                </div>
                                                {originalPrice && parseFloat(originalPrice) > 0 && (
                                                    <div className="flex items-baseline text-gray-400/80 line-through decoration-[1.5px] decoration-gray-300">
                                                        <span className="text-[14px] font-bold mr-0.5">?</span>
                                                        <span className="text-[18px] font-bold">{originalPrice}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-2 ${validityTab === 'lifetime' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}`}>
                                            <span className="material-symbols-outlined text-[16px]">
                                                {validityTab === 'lifetime' ? 'all_inclusive' : 'event_available'}
                                            </span>
                                            {validityTab === 'lifetime' ? 'Lifetime' : `${validityUnit}`}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddCourse;


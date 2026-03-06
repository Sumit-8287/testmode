import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AddFolderDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    onUploadImage: (file: File) => Promise<string>;
    editingFolder?: any;
}

const AddFolderDrawer: React.FC<AddFolderDrawerProps> = ({
    isOpen,
    onClose,
    onSubmit,
    onUploadImage,
    editingFolder
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        thumbnail: '',
        status: 'Paid',
        sortingOrder: '0.00'
    });

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            // Disable page scroll
            document.body.style.overflow = 'hidden';

            if (editingFolder) {
                setFormData({
                    name: editingFolder.title || '',
                    description: editingFolder.description || '',
                    thumbnail: editingFolder.thumbnail || '',
                    status: editingFolder.isFree ? 'Free' : 'Paid',
                    sortingOrder: editingFolder.sortingOrder || '0.00'
                });
            } else {
                setFormData({
                    name: '',
                    description: '',
                    thumbnail: '',
                    status: 'Paid',
                    sortingOrder: '0.00'
                });
            }
        } else {
            // Re-enable page scroll
            document.body.style.overflow = 'unset';
            setTimeout(() => setIsAnimating(false), 250);
        }

        // ESC key listener
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, editingFolder, onClose]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await uploadFile(file);
        }
    };

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        try {
            const url = await onUploadImage(file);
            setFormData(prev => ({ ...prev, thumbnail: url }));
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            await uploadFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    if (!isOpen && !isAnimating) return null;

    const drawerContent = (
        <>
            {/* DrawerOverlay */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[99999] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* AddFolderDrawer Main Container */}
            <div
                className={`fixed right-0 top-0 h-full max-h-screen bg-white z-[99999] shadow-2xl flex flex-col transition-transform duration-[250ms] ease-out w-full sm:w-[460px] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-4.5 border-b border-gray-100 shrink-0">
                    <div className="flex flex-col">
                        <h2 className="text-[18px] font-bold text-[#1e1e1e]">Add Folder</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">close</span>
                    </button>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7 custom-scrollbar pb-8">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-700">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Title"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full h-[46px] px-4 border border-gray-200 rounded-xl text-[14px] font-medium outline-none focus:border-blue-500 transition-all placeholder:text-gray-300 shadow-sm"
                        />
                    </div>

                    {/* Description Field */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-700">Description</label>
                        <textarea
                            placeholder="Enter Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full h-[120px] px-4 py-3 border border-gray-200 rounded-xl text-[14px] font-medium outline-none focus:border-blue-500 transition-all resize-none placeholder:text-gray-300 shadow-sm"
                        />
                    </div>

                    {/* Image Section */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-700">Image</label>
                        <div className="flex gap-4">
                            {/* LEFT BOX: Preview Area */}
                            <div className="w-[170px] h-[110px] bg-[#f2f2f2] rounded-[22px] flex flex-col items-center justify-center gap-1 border border-gray-100 overflow-hidden shrink-0">
                                {isUploading ? (
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : formData.thumbnail ? (
                                    <img src={formData.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[32px] text-[#8e8e8e]">image</span>
                                        <span className="text-[13px] font-bold text-[#8e8e8e]">No Image</span>
                                    </>
                                )}
                            </div>

                            {/* RIGHT BOX: Upload Area */}
                            <div
                                className="flex-1 border-2 border-dashed border-[#e0e0e0] rounded-[22px] flex flex-col items-center justify-center p-3 text-center bg-[#fcfcfc] hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer group relative"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <span className="material-symbols-outlined text-[28px] text-[#9a9a9a] group-hover:text-gray-600 transition-colors">touch_app</span>
                                <p className="text-[14px] font-bold text-[#9a9a9a] mt-1 group-hover:text-gray-700 uppercase tracking-tight">Upload Image</p>
                                <p className="text-[11px] font-medium text-[#c0c0c0] leading-tight">Click or Drag & Drop your file here.</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status Switch (Segmented Toggle) */}
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-gray-700">Status</label>
                        <div className="flex bg-[#f8fafc] p-1.5 rounded-[18px] w-full border border-gray-100">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, status: 'Free' })}
                                className={`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all ${formData.status === 'Free' ? 'bg-white text-gray-900 shadow-sm border border-gray-100/50' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Free
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, status: 'Paid' })}
                                className={`flex-1 py-3 text-[13px] font-bold rounded-xl transition-all ${formData.status === 'Paid' ? 'bg-white text-gray-900 shadow-sm border border-gray-100/50' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Paid
                            </button>
                        </div>
                    </div>

                    {/* Advanced Settings Toggle */}
                    <div className="pt-2">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-1.5 text-[#6366f1] text-[13px] font-bold hover:text-[#4f46e5] transition-all"
                        >
                            <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${showAdvanced ? 'rotate-90' : ''}`}>arrow_right</span>
                            Advanced Settings
                        </button>

                        {/* Advanced Settings Section */}
                        {showAdvanced && (
                            <div className="mt-5 space-y-6 animate-in slide-in-from-top-3 duration-300">
                                <div className="border-t border-gray-50 pt-5">
                                    <h4 className="text-[15px] font-bold text-gray-800 mb-5">Settings</h4>

                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-gray-700">Sorting Order</label>
                                        <input
                                            type="text"
                                            placeholder="0.00"
                                            value={formData.sortingOrder}
                                            onChange={(e) => setFormData({ ...formData, sortingOrder: e.target.value })}
                                            className="w-full h-[46px] px-4 border border-gray-200 rounded-xl text-[14px] font-medium outline-none focus:border-blue-500 transition-all placeholder:text-gray-300 shadow-sm"
                                        />
                                        <p className="text-[11px] font-medium text-gray-400 italic">Assign a number to sort this course in listing page.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit Button (Inside Scrollable Area) */}
                    <div className="pt-8 border-t border-gray-100">
                        <button
                            onClick={() => onSubmit(formData)}
                            className="w-full py-4 bg-[#121826] text-white text-[13px] font-black tracking-[0.1em] uppercase hover:bg-black transition-all flex items-center justify-center rounded-full shadow-xl shadow-gray-300/40 active:scale-[0.99]"
                        >
                            SUBMIT
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(drawerContent, document.body);
};

export default AddFolderDrawer;

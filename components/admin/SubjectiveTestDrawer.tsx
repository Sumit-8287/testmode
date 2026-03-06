import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * SubjectiveTestDrawer Component
 * A pixel-perfect clone of the "Add Subjective Test(s)" drawer.
 */

interface Test {
    id: string;
    title: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onAddTests: (tests: Test[]) => void;
    courseId?: string;
}

// Sub-component: DrawerOverlay
const DrawerOverlay: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[99998] animate-in fade-in duration-300"
        onClick={onClick}
    />
);

// Sub-component: SearchSelectInput
interface SearchSelectInputProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onSearch: (term: string) => void;
    onAdd: () => void;
    isSearching: boolean;
    availableTests: Test[];
    showDropdown: boolean;
    onSelectTest: (test: Test) => void;
    helperText: string;
}

const SearchSelectInput: React.FC<SearchSelectInputProps> = ({
    searchTerm,
    setSearchTerm,
    onSearch,
    onAdd,
    isSearching,
    availableTests,
    showDropdown,
    onSelectTest,
    helperText
}) => {
    return (
        <div className="space-y-2">
            <label className="block text-[13px] font-bold text-gray-500 mb-1 ml-0.5">Select Test</label>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            onSearch(e.target.value);
                        }}
                        placeholder="Select Test"
                        className="w-full h-[48px] px-4 border border-gray-200 rounded-xl text-[14px] font-medium outline-none focus:border-blue-400 transition-all bg-white"
                    />

                    {/* Autocomplete Dropdown */}
                    {showDropdown && (
                        <div className="absolute top-[54px] left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-[100000] overflow-hidden py-1 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {isSearching ? (
                                <div className="px-4 py-3 text-center text-gray-400 text-[13px]">Searching...</div>
                            ) : availableTests.length > 0 ? (
                                availableTests.map((test) => (
                                    <button
                                        key={test.id}
                                        type="button"
                                        onClick={() => onSelectTest(test)}
                                        className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 group border-b border-gray-50 last:border-none"
                                    >
                                        <span className="material-symbols-outlined text-gray-400 text-[20px] group-hover:text-blue-500">rule</span>
                                        <span className="text-[14px] font-medium text-gray-700">{test.title}</span>
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-center text-gray-400 text-[13px]">No tests found</div>
                            )}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onAdd}
                    disabled={!searchTerm}
                    className="w-[48px] h-[48px] flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-400 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-95 disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-[24px]">add</span>
                </button>
            </div>
            {/* Helper Text shown only when exactly 1 character is entered */}
            {searchTerm.length === 1 && (
                <p className="text-[12px] font-medium text-[#991b1b] ml-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    {helperText}
                </p>
            )}
        </div>
    );
};

// Sub-component: SelectedTestList
const SelectedTestList: React.FC<{ selectedTests: Test[]; onRemove: (id: string) => void }> = ({ selectedTests, onRemove }) => {
    return (
        <div className="space-y-3 pt-2">
            {selectedTests.map((test) => (
                <div
                    key={test.id}
                    className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300 group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-500 text-[20px]">rule</span>
                        </div>
                        <span className="text-[14px] font-bold text-gray-900">{test.title}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => onRemove(test.id)}
                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            ))}
        </div>
    );
};

// Sub-component: SubmitBar
const SubmitBar: React.FC<{ onSubmit: () => void }> = ({ onSubmit }) => (
    <div className="mt-8 border-t border-gray-50 pt-8 pb-4">
        <button
            type="button"
            onClick={onSubmit}
            className="w-full py-5 bg-gradient-to-b from-[#1a1c1e] to-[#000000] text-white text-[15px] font-black hover:from-[#000] hover:to-[#000] transition-all flex items-center justify-center tracking-[0.15em] uppercase shadow-lg active:scale-[0.99] rounded-2xl"
        >
            Submit
        </button>
    </div>
);

const SubjectiveTestDrawer: React.FC<Props> = ({ isOpen, onClose, onAddTests, courseId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [availableTests, setAvailableTests] = useState<Test[]>([]);
    const [selectedTests, setSelectedTests] = useState<Test[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Lock scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const fetchTests = async (query: string) => {
        if (query.length < 2) {
            setAvailableTests([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        setShowDropdown(true);

        try {
            // Simulated course-specific API call
            await new Promise(resolve => setTimeout(resolve, 600));
            // In real app: fetch(`/api/subjective-tests?search=${query}&courseId=${courseId}`)
            const mockData: Test[] = [
                { id: `t1-${courseId}`, title: 'Mathematics Subjective Test' },
                { id: `t2-${courseId}`, title: 'English Grammar & Essay' },
                { id: `t3-${courseId}`, title: 'Physics Numerical Analysis' },
                { id: `t4-${courseId}`, title: 'History Descriptive Quiz' },
                { id: `t5-${courseId}`, title: 'Computer Science Theory' },
            ];
            const filtered = mockData.filter(t => t.title.toLowerCase().includes(query.toLowerCase()));
            setAvailableTests(filtered);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectTest = (test: Test) => {
        if (!selectedTests.find(t => t.id === test.id)) {
            setSelectedTests(prev => [...prev, test]);
        }
        setSearchTerm('');
        setShowDropdown(false);
    };

    const handleAddManual = () => {
        if (!searchTerm) return;
        // If there's a match in available tests, add the first one
        if (availableTests.length > 0) {
            handleSelectTest(availableTests[0]);
        } else {
            // Otherwise add current input as a new item
            const newTest = { id: `manual-${Date.now()}`, title: searchTerm };
            handleSelectTest(newTest);
        }
    };

    const handleRemoveTest = (id: string) => {
        setSelectedTests(prev => prev.filter(t => t.id !== id));
    };

    const handleSubmit = () => {
        onAddTests(selectedTests);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99997] overflow-hidden">
            <DrawerOverlay onClick={onClose} />

            <div
                className="fixed right-0 top-0 h-full w-[460px] bg-white shadow-[-10px_0_50px_rgba(0,0,0,0.1)] z-[99999] flex flex-col transition-all ease-out"
                style={{
                    animation: 'slideInRight 250ms ease-out forwards',
                    transform: 'translateX(100%)'
                }}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 shrink-0 bg-white">
                    <div>
                        <h3 className="text-[19px] font-bold text-[#1e1e1e] tracking-tight">Add Subjective Test(s)</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-full transition-all"
                    >
                        <span className="material-symbols-outlined text-[24px]">close</span>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 hide-scrollbar">
                    {/* Search and Input Component */}
                    <SearchSelectInput
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        onSearch={fetchTests}
                        onAdd={handleAddManual}
                        isSearching={isSearching}
                        availableTests={availableTests}
                        showDropdown={showDropdown}
                        onSelectTest={handleSelectTest}
                        helperText="Please enter 2 or more characters"
                    />

                    {/* List area for selected tests */}
                    {selectedTests.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Selected Tests</h4>
                            <SelectedTestList
                                selectedTests={selectedTests}
                                onRemove={handleRemoveTest}
                            />
                        </div>
                    )}

                    {/* Non-sticky SubmitBar */}
                    <SubmitBar onSubmit={handleSubmit} />
                </div>
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #ddd;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #ccc;
                }
            `}</style>
        </div>,
        document.body
    );
};

export default SubjectiveTestDrawer;

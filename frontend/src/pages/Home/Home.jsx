import React, { useEffect, useState, useMemo } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import NoteCard from '../../components/Cards/NoteCard'
import { MdAdd, MdOutlineFolder, MdOutlineStar, MdOutlineArchive, MdOutlinePushPin, MdClose, MdDelete, MdChevronLeft, MdChevronRight } from 'react-icons/md'
import { HiOutlineSparkles, HiChevronDown } from 'react-icons/hi'
import AddEditNotes from './AddEditNotes'
import ProfileModal from '../../components/Profile/ProfileModal'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import Modal from 'react-modal'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../utils/axiosInstance'
import EmptyCard from '../../components/EmptyCard/EmptyCard'
import Loader from '../../components/Loader/Loader'
import moment from 'moment'
import { DEFAULT_CATEGORIES, removeUserCustomCategory, syncUserCustomCategories, getSortedCustomCategories } from '../../utils/constants'
import { broadcastRealtimeUpdate, subscribeToRealtimeUpdates } from '../../utils/realtimeSync'

const Home = () => {
    const [openAddEditModal, setOpenAddEditModal] = useState({
        isShown: false,
        type: "add",
        data: null,
    });

    const [openProfileModal, setOpenProfileModal] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isShown: false, note: null });

    const [allNotes, setAllNotes] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearch, setIsSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all"); // 'all' | 'pinned' | 'favorites' | 'archive'
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const navigate = useNavigate();

    const userKey = userInfo?._id || userInfo?.email || "current_user";

    const handleEdit = (noteDetails) => {
        setOpenAddEditModal({ isShown: true, type: "edit", data: noteDetails });
    }

    // Get User Info
    const getUserInfo = async () => {
        try {
            const response = await axiosInstance.get("/get-user");
            if(response.data && response.data.user) {
                setUserInfo(response.data.user);
            }
        } catch (error) {
            if(error.response?.status === 401 || error.response?.status === 403) {
                const theme = localStorage.getItem('theme');
                localStorage.clear();
                if (theme) localStorage.setItem('theme', theme);
                navigate("/", { replace: true });
            }
        }
    }

    // Get All Notes 
    const getAllNotes = async (silent = false) => {
        try {
            if (!silent && allNotes.length === 0) {
                setIsLoading(true);
            }
            const response = await axiosInstance.get("/get-all-notes");
            if(response.data && response.data.notes) {
                setAllNotes(response.data.notes);
            }
        } catch (error) {
            if (!silent && import.meta.env.DEV) {
                console.error("Failed to load notes:", error);
            }
        } finally {
            setIsLoading(false);
        }
    }

    // Delete Note
    const deleteNote = async (noteData) => {
        const noteId = noteData._id;
        try {
            const response = await axiosInstance.delete("/delete-note/" + noteId);

            if(response.data && !response.data.error) {
                // If the deleted note used a custom category, check if any remaining notes still use it
                const noteCat = noteData?.category?.trim();
                if (noteCat && !DEFAULT_CATEGORIES.some(dc => dc.toLowerCase() === noteCat.toLowerCase())) {
                    const remainingNotes = allNotes.filter(n => n._id !== noteId);
                    const stillUsed = remainingNotes.some(
                        n => (n.category || '').trim().toLowerCase() === noteCat.toLowerCase()
                    );
                    if (!stillUsed) {
                        removeUserCustomCategory(userKey, noteCat);
                        if (selectedCategory.toLowerCase() === noteCat.toLowerCase()) {
                            setSelectedCategory("All");
                        }
                    }
                }
                getAllNotes();
                broadcastRealtimeUpdate('NOTES_CHANGED');
            }
        } catch (error) {
            if (import.meta.env.DEV) console.error("Error deleting note:", error);
        }
    }

    // Search for a Note
    const onSearchNote = async (query) => {
        try {
            const response = await axiosInstance.get("/search-notes", {
                params: { query },
            });
            if(response.data && response.data.notes) {
                setIsSearch(true);
                setSearchQuery(query);
                setAllNotes(response.data.notes);
            }
        } catch (error) {
            if (import.meta.env.DEV) console.error("Error searching notes:", error);
        }
    }

    // Toggle Pin Status
    const updateIsPinned = async (noteData) => {
        const noteId = noteData._id;

        try {
            const response = await axiosInstance.put("/update-isPinned/" + noteId, {
                "isPinned": !noteData.isPinned,
            })

            if(response.data && response.data.note) {
                setAllNotes(prev => prev.map(note =>
                    note._id === noteId ? { ...note, isPinned: !note.isPinned } : note
                ));
                broadcastRealtimeUpdate('NOTES_CHANGED');
            }
        } catch (error) {
            if (import.meta.env.DEV) console.error("Error pinning note:", error);
        }
    }

    // Toggle Favorite Status
    const updateIsFavorite = async (noteData) => {
        const noteId = noteData._id;

        try {
            const response = await axiosInstance.put("/update-isFavorite/" + noteId, {
                "isFavorite": !noteData.isFavorite,
            });

            if(response.data && response.data.note) {
                setAllNotes(prev => prev.map(note =>
                    note._id === noteId ? { ...note, isFavorite: !note.isFavorite } : note
                ));
                broadcastRealtimeUpdate('NOTES_CHANGED');
            }
        } catch (error) {
            if (import.meta.env.DEV) console.error("Error updating favorite status:", error);
        }
    }

    // Toggle Archive Status
    const updateIsArchived = async (noteData) => {
        const noteId = noteData._id;

        try {
            const response = await axiosInstance.put("/update-isArchived/" + noteId, {
                "isArchived": !noteData.isArchived,
            });

            if(response.data && response.data.note) {
                setAllNotes(prev => prev.map(note =>
                    note._id === noteId ? { ...note, isArchived: !note.isArchived } : note
                ));
                broadcastRealtimeUpdate('NOTES_CHANGED');
            }
        } catch (error) {
            if (import.meta.env.DEV) console.error("Error archiving note:", error);
        }
    }

    const handleClearSearch = () => {
        setIsSearch(false);
        setSearchQuery("");
        getAllNotes();
    }

    // Real-Time Monitoring & Auto-Fetch across all panels and before page refresh
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/", { replace: true });
            return;
        }

        // Initial fetch
        getAllNotes();
        getUserInfo();

        // 1. Cross-tab & Cross-panel Real-Time Broadcast Listener
        const unsubscribe = subscribeToRealtimeUpdates((event) => {
            if (event.type === 'USER_DELETED') {
                const currentUserId = userInfo?._id;
                if (event.payload?.deletedUserId && currentUserId && event.payload.deletedUserId.toString() === currentUserId.toString()) {
                    const theme = localStorage.getItem('theme');
                    localStorage.clear();
                    if (theme) localStorage.setItem('theme', theme);
                    navigate('/', { replace: true });
                    return;
                }
            }
            if (!isSearch) {
                getAllNotes(true);
            }
            getUserInfo();
        });

        // 2. Tab focus & visibility change listener (instantly fetches before refreshing)
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                if (!isSearch) {
                    getAllNotes(true);
                }
                getUserInfo();
            }
        };

        const handleFocus = () => {
            if (!isSearch) {
                getAllNotes(true);
            }
            getUserInfo();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleFocus);

        // 3. Periodic Background Fallback Auto-Fetch (Every 15 seconds in active tab)
        const pollTimer = setInterval(() => {
            if (document.visibilityState === "visible" && !isSearch) {
                getAllNotes(true);
            }
        }, 15000);

        return () => {
            unsubscribe();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleFocus);
            clearInterval(pollTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSearch]);

    // Filter Notes based on Active Tab, Category, and Search
    const displayedNotes = allNotes.filter((note) => {
        // Tab filtering
        if (activeTab === "all") {
            if (note.isArchived) return false;
        } else if (activeTab === "pinned") {
            if (!note.isPinned || note.isArchived) return false;
        } else if (activeTab === "favorites") {
            if (!note.isFavorite || note.isArchived) return false;
        } else if (activeTab === "archive") {
            if (!note.isArchived) return false;
        }

        // Category filtering
        if (selectedCategory !== "All") {
            if ((note.category || "General") !== selectedCategory) return false;
        }

        return true;
    }).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    // Custom categories strictly exist only if at least one note uses them.
    // Ordered chronologically based on event/time (first added comes first after predefined categories)
    const userCustomCategories = useMemo(() => {
        const sortedCustom = getSortedCustomCategories(allNotes);
        if (userKey) {
            syncUserCustomCategories(userKey, allNotes);
        }
        return sortedCustom;
    }, [allNotes, userKey]);

    const categoryList = useMemo(() => {
        return ["All", ...DEFAULT_CATEGORIES, ...userCustomCategories];
    }, [userCustomCategories]);

    // If selectedCategory is a custom category that was auto-removed (because its notes were deleted), auto-reset filter to "All"
    useEffect(() => {
        if (selectedCategory !== "All" && !categoryList.some(c => c.toLowerCase() === selectedCategory.toLowerCase())) {
            setSelectedCategory("All");
        }
    }, [categoryList, selectedCategory]);

    // Counts
    const activeNotesCount = allNotes.filter(n => !n.isArchived).length;
    const pinnedCount = allNotes.filter(n => n.isPinned && !n.isArchived).length;
    const favCount = allNotes.filter(n => n.isFavorite && !n.isArchived).length;
    const archCount = allNotes.filter(n => n.isArchived).length;

    // Track responsive window size for exact Notes pagination rules:
    // Mobile (< 768px): max 10
    // Tablet (768px - 1279px): 2 cards in a row * 6 rows max = 12
    // Laptop & above (>= 1280px): 3 cards in a row * 6 rows max = 18
    useEffect(() => {
        let timer = null;
        const handleResize = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                setWindowWidth(window.innerWidth);
            }, 100);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const notesPerPage = useMemo(() => {
        if (windowWidth < 768) {
            return 10;
        } else if (windowWidth < 1279) {
            return 12;
        } else {
            return 18;
        }
    }, [windowWidth]);

    // Reset pagination to first page when filtering or searching changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, selectedCategory, isSearch, searchQuery]);

    // Pagination calculations
    const totalPages = Math.ceil(displayedNotes.length / notesPerPage) || 1;
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (safeCurrentPage - 1) * notesPerPage;
    const endIndex = Math.min(startIndex + notesPerPage, displayedNotes.length);
    const paginatedNotes = displayedNotes.slice(startIndex, endIndex);

    const getPageNumbers = (current, total) => {
        if (total <= 5) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }
        if (current <= 3) {
            return [1, 2, 3, 4, '...', total];
        }
        if (current >= total - 2) {
            return [1, '...', total - 3, total - 2, total - 1, total];
        }
        return [1, '...', current - 1, current, current + 1, '...', total];
    };

    return (
        <div className='h-screen max-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50/15 dark:from-[#0b0f19] dark:via-slate-950 dark:to-teal-950/20 transition-colors'>
            <Navbar 
                userInfo={userInfo} 
                onSearchNote={onSearchNote} 
                handleClearSearch={handleClearSearch} 
                onOpenProfile={() => setOpenProfileModal(true)}
            /> 

            <div className='shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-2.5 min-[360px]:px-3.5 min-[420px]:px-4 sm:px-8 py-1.5 min-[360px]:py-2 min-[420px]:py-2.5 z-10'>
                <div className='max-w-7xl mx-auto'>
                    {/* Mobile (< sm): Subnav displayed with both View and Cat in ONE SINGLE ROW */}
                    <div className='flex items-center gap-1.5 min-[380px]:gap-2 sm:hidden w-full'>
                        {/* 1. View Dropdown */}
                        <div className='flex items-center gap-1 min-[360px]:gap-1.5 flex-1 min-w-0'>
                            <label htmlFor='mobile-tab-select' className='text-[9.5px] min-[360px]:text-[10.5px] min-[400px]:text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 uppercase tracking-wider'>
                                View:
                            </label>
                            <div className='relative w-full min-w-0'>
                                <select
                                    id='mobile-tab-select'
                                    value={activeTab}
                                    onChange={(e) => setActiveTab(e.target.value)}
                                    className='w-full text-[10px] min-[360px]:text-[11px] min-[400px]:text-xs py-1.5 pl-1.5 min-[360px]:pl-2 pr-4 min-[360px]:pr-5 rounded-lg min-[380px]:rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 focus:outline-none focus:ring-1.5 focus:ring-teal-500 font-semibold cursor-pointer shadow-2xs appearance-none transition-all truncate'
                                >
                                    <option value='all'>All ({activeNotesCount})</option>
                                    <option value='pinned'>📌 Pinned ({pinnedCount})</option>
                                    <option value='favorites'>⭐ Fav ({favCount})</option>
                                    <option value='archive'>📦 Archive ({archCount})</option>
                                </select>
                                <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-slate-400 dark:text-slate-500'>
                                    <svg className='w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5' viewBox='0 0 20 20' fill='currentColor'>
                                        <path fillRule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clipRule='evenodd' />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* 2. Category Dropdown */}
                        <div className='flex items-center gap-1 min-[360px]:gap-1.5 flex-1 min-w-0'>
                            <label htmlFor='mobile-category-select' className='text-[9.5px] min-[360px]:text-[10.5px] min-[400px]:text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 uppercase tracking-wider'>
                                Cat:
                            </label>
                            <div className='relative w-full min-w-0'>
                                <select
                                    id='mobile-category-select'
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className='w-full text-[10px] min-[360px]:text-[11px] min-[400px]:text-xs py-1.5 pl-1.5 min-[360px]:pl-2 pr-4 min-[360px]:pr-5 rounded-lg min-[380px]:rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 focus:outline-none focus:ring-1.5 focus:ring-teal-500 font-semibold cursor-pointer shadow-2xs appearance-none transition-all truncate'
                                >
                                    {categoryList.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat === "All" ? "All Categories" : cat}
                                        </option>
                                    ))}
                                </select>
                                <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-slate-400 dark:text-slate-500'>
                                    <svg className='w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5' viewBox='0 0 20 20' fill='currentColor'>
                                        <path fillRule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clipRule='evenodd' />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* 3. Search Filter Clear Button */}
                        {isSearch && (
                            <button
                                onClick={handleClearSearch}
                                className='text-[9.5px] min-[360px]:text-[10px] font-bold text-slate-600 dark:text-slate-300 px-1.5 min-[360px]:px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition shrink-0 uppercase tracking-wider'
                                title="Clear search"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Tablet & Desktop (>= sm): Subnav assigned each side with space between */}
                    <div className='hidden sm:flex items-center justify-between gap-4 w-full'>
                        {/* Left Side: Pinned, All, Fav, Archive */}
                        <div className='flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shrink-0'>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-[13px] transition ${
                                    activeTab === 'all'
                                        ? 'bg-white dark:bg-slate-900 text-teal-900 dark:text-teal-300 font-bold shadow-2xs'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
                                }`}
                            >
                                All ({activeNotesCount})
                            </button>

                            <button
                                onClick={() => setActiveTab('pinned')}
                                className={`inline-flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-[13px] transition ${
                                    activeTab === 'pinned'
                                        ? 'bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 font-bold shadow-2xs'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
                                }`}
                            >
                                <MdOutlinePushPin className='text-sm' />
                                <span>Pinned ({pinnedCount})</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('favorites')}
                                className={`inline-flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-[13px] transition ${
                                    activeTab === 'favorites'
                                        ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 font-bold shadow-2xs'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
                                }`}
                            >
                                <MdOutlineStar className='text-sm' />
                                <span>Favorites ({favCount})</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('archive')}
                                className={`inline-flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-[13px] transition ${
                                    activeTab === 'archive'
                                        ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
                                }`}
                            >
                                <MdOutlineArchive className='text-sm' />
                                <span>Archive ({archCount})</span>
                            </button>
                        </div>

                        {/* Right Side: Categories (Pills if <= 5, Dropdown if > 5) & Clear Filter */}
                        <div className='flex items-center gap-2 overflow-x-auto no-scrollbar justify-end'>
                            {categoryList.length <= 5 ? (
                                <div className='flex items-center gap-1.5 overflow-x-auto no-scrollbar'>
                                    <span className='hidden lg:inline text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-0.5 shrink-0'>
                                        Category:
                                    </span>
                                    {categoryList.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-3 py-1 rounded-full text-xs sm:text-[12.5px] shrink-0 transition ${
                                                selectedCategory === cat
                                                    ? 'bg-teal-700 text-white shadow-2xs font-bold'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 font-semibold border border-slate-200/60 dark:border-slate-700/60'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className='flex items-center gap-2 shrink-0'>
                                    <label htmlFor='desktop-category-select' className='text-xs sm:text-[13px] font-bold text-slate-500 dark:text-slate-400 shrink-0 uppercase tracking-wider'>
                                        Category:
                                    </label>
                                    <div className='relative'>
                                        <select
                                            id='desktop-category-select'
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className='text-xs sm:text-[13px] py-1.5 sm:py-2 pl-3.5 pr-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 focus:outline-none focus:ring-1.5 focus:ring-teal-500 font-semibold cursor-pointer shadow-2xs appearance-none transition-all'
                                        >
                                            {categoryList.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat === "All" ? "All Categories" : cat}
                                                </option>
                                            ))}
                                        </select>
                                        <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 dark:text-slate-500'>
                                            <svg className='w-4 h-4' viewBox='0 0 20 20' fill='currentColor'>
                                                <path fillRule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clipRule='evenodd' />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isSearch && (
                                <button
                                    onClick={handleClearSearch}
                                    className='text-xs sm:text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition shrink-0'
                                >
                                    Clear Filter
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <main className='flex-1 overflow-y-auto px-4 sm:px-8 py-5'>
                <div className='max-w-7xl mx-auto h-full flex flex-col'>
                    {isLoading ? (
                        <Loader message="Loading your notes..." />
                    ) : displayedNotes.length > 0 ? (
                        <>
                            <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 ${totalPages > 1 ? 'pb-6' : 'pb-24'}`}>
                                {paginatedNotes.map((note) => (
                                    <NoteCard
                                        key={note._id}
                                        title={note.title}
                                        date={note.createdAt}
                                        content={note.content}
                                        tags={note.tags}
                                        category={note.category}
                                        isPinned={note.isPinned}
                                        isFavorite={note.isFavorite}
                                        isArchived={note.isArchived}
                                        onEdit={() => handleEdit(note)}
                                        onDelete={() => setDeleteModal({ isShown: true, note })}
                                        onPinNote={() => updateIsPinned(note)} 
                                        onFavoriteNote={() => updateIsFavorite(note)}
                                        onArchiveNote={() => updateIsArchived(note)}
                                        onView={() => setSelectedNote(note)}
                                    />
                                ))}
                            </div>  

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className='mt-auto pt-5 pb-24 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400'>
                                    {/* Left Info: Showing items and page */}
                                    <div className='flex items-center gap-1.5 flex-wrap justify-center sm:justify-start'>
                                        <span>Showing</span>
                                        <span className='font-bold text-slate-800 dark:text-slate-100'>{startIndex + 1}–{endIndex}</span>
                                        <span>of</span>
                                        <span className='font-bold text-slate-800 dark:text-slate-100'>{displayedNotes.length}</span>
                                        <span>notes</span>
                                        <span className='hidden sm:inline text-slate-300 dark:text-slate-700 mx-1'>•</span>
                                        <span className='inline-flex items-center gap-1'>
                                            Page <strong className='text-teal-600 dark:text-teal-400 font-bold'>{safeCurrentPage}</strong> of <span className='font-semibold text-slate-700 dark:text-slate-300'>{totalPages}</span>
                                        </span>
                                    </div>

                                    {/* Right Pagination Buttons */}
                                    <div className='flex items-center gap-1.5'>
                                        <button
                                            onClick={() => {
                                                setCurrentPage(prev => Math.max(prev - 1, 1));
                                                document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            disabled={safeCurrentPage === 1}
                                            className='inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/70 disabled:opacity-35 disabled:cursor-not-allowed transition text-xs shadow-2xs cursor-pointer'
                                            aria-label="Previous page"
                                        >
                                            <MdChevronLeft className='text-base' />
                                            <span className='hidden sm:inline'>Previous</span>
                                        </button>

                                        <div className='flex items-center gap-1'>
                                            {getPageNumbers(safeCurrentPage, totalPages).map((p, idx) => (
                                                p === '...' ? (
                                                    <span key={`ellipsis-${idx}`} className='w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 select-none'>
                                                        …
                                                    </span>
                                                ) : (
                                                    <button
                                                        key={p}
                                                        onClick={() => {
                                                            setCurrentPage(p);
                                                            document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                                                            safeCurrentPage === p
                                                                ? 'bg-teal-600 text-white shadow-xs'
                                                                : 'bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                                                        }`}
                                                        aria-label={`Go to page ${p}`}
                                                        aria-current={safeCurrentPage === p ? 'page' : undefined}
                                                    >
                                                        {p}
                                                    </button>
                                                )
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => {
                                                setCurrentPage(prev => Math.min(prev + 1, totalPages));
                                                document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            disabled={safeCurrentPage === totalPages}
                                            className='inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/70 disabled:opacity-35 disabled:cursor-not-allowed transition text-xs shadow-2xs cursor-pointer'
                                            aria-label="Next page"
                                        >
                                            <span className='hidden sm:inline'>Next</span>
                                            <MdChevronRight className='text-base' />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>  
                    ) : (
                        <EmptyCard 
                            isSearch={isSearch || activeTab !== "all" || selectedCategory !== "All"}
                            onAddNew={() => setOpenAddEditModal({ isShown: true, type: "add", data: null })}
                            message={
                                isSearch 
                                    ? `Oops! No notes matched "${searchQuery}".` 
                                    : activeTab === "favorites"
                                    ? "No favorite notes yet. Click the star icon on any note to add it here!"
                                    : activeTab === "archive"
                                    ? "No archived notes. Keep your active workspace clean by archiving finished notes."
                                    : activeTab === "pinned"
                                    ? "No pinned notes. Pin important notes to keep them right at the top."
                                    : selectedCategory !== "All"
                                    ? `No notes in the "${selectedCategory}" category yet.`
                                    : `Your Notiva workspace is clean and ready. Capture your thoughts, reminders, and daily inspirations.`
                            } 
                        />
                    )}
                </div>
            </main>

            <button 
                className='w-14 h-14 flex items-center justify-center rounded-2xl bg-teal-600 hover:bg-teal-700 fixed right-6 bottom-6 sm:right-8 sm:bottom-8 shadow-lg shadow-teal-600/25 transition-transform hover:scale-105 active:scale-95 z-30 text-white'
                onClick={() => {
                    setOpenAddEditModal({ isShown: true, type: "add", data: null });
                }}
                aria-label="Add Note"
            >
                <MdAdd className='text-3xl' />
            </button>

            <Modal
                isOpen={openAddEditModal.isShown}
                onRequestClose={() => {
                    setOpenAddEditModal({ isShown: false, type: "add", data: null });
                }}
                ariaHideApp={false}
                style={{
                    overlay: {
                        backgroundColor: "rgba(15, 23, 42, 0.6)",
                        backdropFilter: "blur(4px)",
                        zIndex: 50,
                    },
                }}
                contentLabel="Add or Edit Note in Notiva"
                className="w-[92%] sm:w-[80%] md:w-[60%] lg:w-[46%] max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl mt-8 sm:mt-10 p-5 sm:p-7 overflow-y-auto mx-auto shadow-2xl border border-slate-200/80 dark:border-slate-800 outline-none"
            >
                <AddEditNotes 
                    type={openAddEditModal.type}
                    noteData={openAddEditModal.data}
                    onClose={() => {
                        setOpenAddEditModal({ isShown: false, type: "add", data: null });
                    }}
                    getAllNotes={getAllNotes}
                    userInfo={userInfo}
                    allNotes={allNotes}
                /> 
            </Modal>

            {/* View Note Modal */}
            <Modal
                isOpen={Boolean(selectedNote)}
                onRequestClose={() => setSelectedNote(null)}
                ariaHideApp={false}
                style={{
                    overlay: {
                        backgroundColor: "rgba(15, 23, 42, 0.6)",
                        backdropFilter: "blur(4px)",
                        zIndex: 50,
                    },
                }}
                contentLabel="View Note"
                className="w-[94%] sm:w-[82%] md:w-[64%] lg:w-[48%] max-h-[88vh] bg-white dark:bg-slate-900 rounded-3xl mt-8 sm:mt-10 p-6 sm:p-7 overflow-y-auto mx-auto shadow-2xl border border-slate-200/80 dark:border-slate-800 outline-none"
            >
                {selectedNote && (
                    <div className='space-y-4'>
                        <div className='flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800'>
                            <div className='flex flex-col gap-1.5 min-w-0'>
                                <div className='flex items-center gap-2 flex-wrap'>
                                    <span className='inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60'>
                                        {selectedNote.category || "General"}
                                    </span>
                                    {selectedNote.isPinned && (
                                        <span className='inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'>
                                            <MdOutlinePushPin className='text-xs' />
                                            <span>Pinned</span>
                                        </span>
                                    )}
                                    {selectedNote.isFavorite && (
                                        <span className='inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'>
                                            <MdOutlineStar className='text-xs' />
                                            <span>Favorite</span>
                                        </span>
                                    )}
                                    {selectedNote.isArchived && (
                                        <span className='inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'>
                                            <MdOutlineArchive className='text-xs' />
                                            <span>Archived</span>
                                        </span>
                                    )}
                                </div>
                                <h2 className='font-display text-lg sm:text-xl font-semibold text-slate-900 dark:text-white tracking-tight break-words'>
                                    {selectedNote.title}
                                </h2>
                                <p className='font-sans text-xs text-slate-400 dark:text-slate-500'>
                                    Created on {moment(selectedNote.createdAt).format("DD MMMM, YYYY [at] hh:mm A")}
                                </p>
                            </div>

                            <button
                                onClick={() => setSelectedNote(null)}
                                className='w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0'
                                aria-label="Close"
                            >
                                <MdClose className='text-xl' />
                            </button>
                        </div>

                        {/* Full Note Content with relaxed line height & pre-wrap */}
                        <div className='font-sans py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words max-h-[50vh] overflow-y-auto pr-1'>
                            {selectedNote.content}
                        </div>

                        {/* Tags */}
                        {selectedNote.tags && selectedNote.tags.length > 0 && (
                            <div className='pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap'>
                                <span className='font-sans text-xs text-slate-400 dark:text-slate-500 font-medium mr-1'>
                                    Tags:
                                </span>
                                {selectedNote.tags.map((t, idx) => (
                                    <span key={idx} className='font-sans text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 shadow-2xs'>
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className='flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800'>
                            <button
                                onClick={() => {
                                    const noteToDelete = selectedNote;
                                    setSelectedNote(null);
                                    setDeleteModal({ isShown: true, note: noteToDelete });
                                }}
                                className='px-3.5 sm:px-4 py-2 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 dark:text-red-300 hover:text-white dark:bg-red-950/60 dark:hover:bg-red-600 border border-red-200/80 dark:border-red-800/80 text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-md hover:shadow-red-600/20 active:scale-[0.98] transition-all inline-flex items-center gap-1.5'
                            >
                                <MdDelete className='text-base' />
                                <span>Delete Note</span>
                            </button>

                            <div className='flex items-center gap-2'>
                                <button
                                    onClick={() => {
                                        const noteToEdit = selectedNote;
                                        setSelectedNote(null);
                                        handleEdit(noteToEdit);
                                    }}
                                    className='px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition'
                                >
                                    Edit Note
                                </button>
                                <button
                                    onClick={() => setSelectedNote(null)}
                                    className='px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-medium transition'
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <ProfileModal
                isOpen={openProfileModal}
                onClose={() => setOpenProfileModal(false)}
                userInfo={userInfo}
                setUserInfo={setUserInfo}
                allNotes={allNotes}
            />

            <ConfirmModal
                isOpen={deleteModal.isShown}
                onClose={() => setDeleteModal({ isShown: false, note: null })}
                onConfirm={() => {
                    if (deleteModal.note) {
                        deleteNote(deleteModal.note);
                    }
                    setDeleteModal({ isShown: false, note: null });
                }}
                title="Delete Note"
                message="Are you sure you want to permanently delete this note? This action cannot be undone."
                itemTitle={deleteModal.note?.title}
                confirmText="Delete Note"
                type="delete"
            />

        </div>
    )
}

export default Home

import React, { useEffect, useRef, useState } from 'react'
import ProfileInfo from '../Cards/ProfileInfo'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import SearchBar from '../SearchBar/SearchBar';
import { HiOutlineMenu, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import { MdOutlineStickyNote2, MdOutlineSettings, MdOutlineShield } from 'react-icons/md';
import { useTheme } from '../../utils/theme';
import { getInitials } from '../../utils/helper';

const Navbar = ({ userInfo, onSearchNote, handleClearSearch, onOpenProfile }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const menuRef = useRef(null);

    const onLogOut = () => {
        const theme = localStorage.getItem('theme');
        localStorage.clear();
        if (theme) localStorage.setItem('theme', theme);
        navigate('/', { replace: true });
        setMenuOpen(false);
    }

    const handleSearch = () => {
        if (searchQuery && onSearchNote) {
            onSearchNote(searchQuery);
        }
    }

    const onClearSearch = () => {
        setSearchQuery("");
        if (handleClearSearch) {
            handleClearSearch();
        }
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Check if user is logged in
    const isLoggedIn = Boolean(userInfo);
    const isAdmin = userInfo?.role === "admin";

    return (
        <header className='w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 dark:border-slate-800 shadow-xs transition-colors'>
            <div className='max-w-7xl mx-auto flex items-center justify-between px-2.5 min-[380px]:px-3 sm:px-8 py-2 min-[380px]:py-2.5 sm:py-3 gap-1.5 min-[380px]:gap-2 sm:gap-3'>
                <Link to={isLoggedIn ? "/dashboard" : "/"} className='flex items-center gap-1.5 min-[380px]:gap-2 group shrink-0' title='Notiva Home'>
                    <div className='w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform'>
                        <MdOutlineStickyNote2 className='text-lg sm:text-xl' />
                    </div>
                    <span className='hidden min-[360px]:inline-block text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors whitespace-nowrap'>
                        Notiva<span className='text-teal-600 dark:text-teal-400'>.</span>
                    </span>
                </Link>
                
                {isLoggedIn && onSearchNote && (
                    <div className='flex-1 max-w-full sm:max-w-xs md:max-w-sm mx-1 min-[360px]:mx-2 sm:mx-3 min-w-0'>
                        <SearchBar 
                            value={searchQuery} 
                            onChange={({ target }) => setSearchQuery(target.value)}
                            handleSearch={handleSearch}
                            onClearSearch={onClearSearch} 
                        />
                    </div>
                )}

                <div className='flex items-center gap-1 min-[360px]:gap-1.5 sm:gap-3 shrink-0'>
                    <button
                        onClick={toggleTheme}
                        className='p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all shrink-0'
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        aria-label="Toggle theme"
                    >
                        {isDark ? (
                            <HiOutlineSun className='text-xl text-amber-400 transform hover:rotate-45 transition-transform' />
                        ) : (
                            <HiOutlineMoon className='text-xl text-slate-600 transform hover:-rotate-12 transition-transform' />
                        )}
                    </button>

                    {isLoggedIn ? (
                        <>
                            <div className='hidden sm:flex items-center'>
                                <ProfileInfo 
                                    userInfo={userInfo} 
                                    onLogOut={onLogOut} 
                                    onOpenProfile={onOpenProfile} 
                                />
                            </div>

                            <div className='sm:hidden flex items-center relative' ref={menuRef}>
                                <button 
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    className='p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
                                    aria-label="Toggle profile menu"
                                >
                                    <HiOutlineMenu className='text-2xl' />
                                </button>

                                {menuOpen && (
                                    <div className='absolute right-0 top-full mt-2 w-48 min-[360px]:w-56 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl flex flex-col py-2.5 min-[360px]:py-3 z-50'>
                                        <div className='flex items-center gap-2.5 min-[360px]:gap-3 px-3 min-[360px]:px-4 py-2 border-b border-slate-100 dark:border-slate-800'>
                                            <div className="w-8 h-8 min-[360px]:w-9 min-[360px]:h-9 flex items-center justify-center rounded-full text-teal-700 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-800 shrink-0 text-xs">
                                                {getInitials(userInfo?.fullName)}
                                            </div>
                                            <div className='min-w-0 flex-1'>
                                                <p className='text-xs min-[360px]:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate'>{userInfo?.fullName}</p>
                                                <p className='text-[10.5px] min-[360px]:text-xs text-slate-400 dark:text-slate-500 truncate'>{userInfo?.email}</p>
                                            </div>
                                        </div>

                                        {isAdmin && (
                                            <Link
                                                to="/admin"
                                                onClick={() => setMenuOpen(false)}
                                                className='flex items-center gap-2.5 px-3 min-[360px]:px-4 py-2 min-[360px]:py-2.5 text-xs min-[360px]:text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50/70 dark:hover:bg-slate-800 rounded-xl mx-1.5 transition-colors group'
                                            >
                                                <MdOutlineShield className='text-base min-[360px]:text-lg text-teal-600 dark:text-teal-400 shrink-0' />
                                                <span>Admin Panel</span>
                                            </Link>
                                        )}

                                        {onOpenProfile && (
                                            <button
                                                onClick={() => { onOpenProfile(); setMenuOpen(false); }}
                                                className='flex items-center gap-2.5 px-3 min-[360px]:px-4 py-2 min-[360px]:py-2.5 text-xs min-[360px]:text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50/70 dark:hover:bg-slate-800 rounded-xl mx-1.5 transition-colors text-left group'
                                            >
                                                <MdOutlineSettings className='text-base min-[360px]:text-lg text-teal-600 dark:text-teal-400 shrink-0' />
                                                <span>Profile & Settings</span>
                                            </button>
                                        )}
                                        
                                        <button
                                            className='mx-2.5 min-[360px]:mx-3 mt-2 px-3 min-[360px]:px-4 py-1.5 min-[360px]:py-2 text-xs min-[360px]:text-[13px] font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition shadow-sm'
                                            onClick={onLogOut}>
                                            Log Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className='flex items-center gap-2 sm:gap-3'>
                            {location.pathname !== '/login' && (
                                <Link 
                                    to="/login" 
                                    className='text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-all'
                                >
                                    Log In
                                </Link>
                            )}
                            {location.pathname !== '/signup' && (
                                <Link 
                                    to="/signup" 
                                    className='text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-sm hover:shadow-md hover:shadow-teal-600/20 transition-all'
                                >
                                    Sign Up
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Navbar

import React from 'react';
import { Link } from 'react-router-dom';
import { 
    MdOutlineStickyNote2, 
    MdSearchOff,
    MdOutlineSearchOff 
} from 'react-icons/md';
import { HiOutlineSparkles, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import { useTheme } from '../../utils/theme';

const NotFound = () => {
    const { isDark, toggleTheme } = useTheme();
    const isLoggedIn = Boolean(localStorage.getItem('token'));

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/15 dark:from-[#0b0f19] dark:via-slate-950 dark:to-teal-950/20 flex flex-col justify-between text-slate-800 dark:text-slate-100 transition-colors select-none'>
            {/* Top Brand & Theme Bar (Clean, no login/register buttons) */}
            <header className='w-full px-4 sm:px-8 py-3.5 flex items-center justify-between max-w-7xl mx-auto'>
                <Link 
                    to={isLoggedIn ? "/dashboard" : "/"} 
                    className='flex items-center gap-2 group shrink-0'
                    title={isLoggedIn ? "Go to Notes" : "Notiva Home"}
                >
                    <div className='w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform'>
                        <MdOutlineStickyNote2 className='text-lg sm:text-xl' />
                    </div>
                    <span className='text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors whitespace-nowrap'>
                        Notiva<span className='text-teal-600 dark:text-teal-400'>.</span>
                    </span>
                </Link>

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
            </header>

            {/* Central Stage: Consistent Notiva Card with Animated Illustration */}
            <main className='flex-1 flex items-center justify-center px-4 sm:px-6 py-8 relative'>
                {/* Ambient Glows */}
                <div className='absolute -top-16 left-1/4 w-80 h-80 rounded-full bg-teal-500/10 dark:bg-teal-500/15 blur-3xl pointer-events-none animate-pulse' />
                <div className='absolute -bottom-16 right-1/4 w-80 h-80 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl pointer-events-none animate-pulse delay-1000' />

                <div className='w-full max-w-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-teal-950/5 text-center relative z-10'>
                    {/* Custom Animated 404 Illustration (Not a note-card) */}
                    <div className='relative w-44 h-44 sm:w-52 sm:h-52 mx-auto mb-6 flex items-center justify-center'>
                        {/* Glowing radial backdrop */}
                        <div className='absolute inset-2 rounded-full bg-gradient-to-tr from-teal-500/20 via-emerald-500/10 to-transparent blur-2xl animate-pulse' />

                        {/* Outer rotating dashed orbit ring */}
                        <div className='absolute inset-1 sm:inset-2 rounded-full border-2 border-dashed border-teal-500/25 dark:border-teal-400/20 animate-[spin_25s_linear_infinite]' />

                        {/* Middle counter-rotating dotted ring */}
                        <div className='absolute inset-6 sm:inset-8 rounded-full border border-dotted border-emerald-500/30 dark:border-emerald-400/20 animate-[spin_18s_linear_infinite_reverse]' />

                        {/* Animated Floating Paper Sheet with Engraved 404 */}
                        <div className='relative z-10 w-24 h-32 sm:w-28 sm:h-36 rounded-2xl bg-white dark:bg-slate-800 border-2 border-teal-500/30 dark:border-teal-400/30 shadow-2xl shadow-teal-600/20 flex flex-col p-3 animate-[bounce_4s_ease-in-out_infinite]'>
                            {/* Paper Fold Corner */}
                            <div className='absolute top-0 right-0 w-6 h-6 bg-gradient-to-bl from-teal-100 to-teal-50 dark:from-teal-900/60 dark:to-slate-800 rounded-bl-xl border-b border-l border-teal-200/60 dark:border-teal-700/60' />

                            {/* Header ping indicator */}
                            <div className='flex items-center gap-1.5 mb-2'>
                                <div className='w-2 h-2 rounded-full bg-teal-500 animate-ping' />
                                <div className='w-8 h-1.5 rounded-full bg-teal-200 dark:bg-teal-900/80' />
                            </div>

                            {/* Stylized 404 engraved on the page */}
                            <div className='flex-1 flex flex-col items-center justify-center my-auto'>
                                <span className='text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 bg-clip-text text-transparent'>
                                    404
                                </span>
                                <span className='text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5'>
                                    Missing
                                </span>
                            </div>

                            {/* Subtle document line skeletons */}
                            <div className='space-y-1.5 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700/60'>
                                <div className='w-full h-1 rounded-full bg-slate-200/80 dark:bg-slate-700/60' />
                                <div className='w-3/4 h-1 rounded-full bg-slate-200/80 dark:bg-slate-700/60' />
                            </div>
                        </div>

                        {/* Floating Magnifying Glass Scanner */}
                        <div className='absolute -right-1 sm:right-2 top-6 sm:top-8 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-teal-600/30 animate-[pulse_2.5s_ease-in-out_infinite] transform -rotate-12 hover:rotate-0 transition-transform'>
                            <MdSearchOff />
                        </div>

                        {/* Floating Sparkles & Accents */}
                        <div className='absolute left-2 sm:left-4 top-8 text-amber-400 text-lg animate-pulse'>
                            <HiOutlineSparkles />
                        </div>
                        <div className='absolute right-6 bottom-3 text-teal-400 text-xs animate-pulse'>
                            ✦
                        </div>
                        <div className='absolute left-6 bottom-5 w-2 h-2 rounded-full bg-teal-400/70 animate-ping' />
                    </div>

                    {/* Status Badge */}
                    <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold tracking-wider uppercase mb-3 shadow-2xs'>
                        <MdOutlineSearchOff className='text-sm' />
                        <span>Page Not Found</span>
                    </div>

                    <h1 className='text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2'>
                        Lost Between Pages?
                    </h1>

                    <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto mb-6'>
                        The page or note you are looking for doesn't exist, was moved, or the link may have expired.
                    </p>

                    {/* Single Navigation Button */}
                    <div className='flex items-center justify-center w-full'>
                        <Link
                            to={isLoggedIn ? "/dashboard" : "/"}
                            className='inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 active:scale-[0.98] transition-all'
                        >
                            <MdOutlineStickyNote2 className='text-base' />
                            <span>{isLoggedIn ? "Back to Notes" : "Back to Home"}</span>
                        </Link>
                    </div>
                </div>
            </main>

            {/* Bottom Footer */}
            <footer className='py-4 text-center text-[11px] text-slate-400 dark:text-slate-500'>
                <span>© 2026 Notiva. All rights reserved.</span>
            </footer>
        </div>
    );
};

export default NotFound;

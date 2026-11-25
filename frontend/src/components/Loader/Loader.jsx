import React from 'react';
import { MdOutlineStickyNote2 } from 'react-icons/md';

/**
 * Animated Notiva Loader Component
 * Renders an animated loader when isLoading is true; otherwise does not show.
 */
const Loader = ({ isLoading = true, fullScreen = false, message = "Loading..." }) => {
    // Only show when loading, otherwise do not show
    if (!isLoading) return null;

    const loaderContent = (
        <div className='flex flex-col items-center justify-center gap-4 p-6 text-center select-none animate-in fade-in duration-300'>
            {/* Animated multi-ring glowing illustration */}
            <div className='relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20'>
                {/* Ambient glowing radial backdrop */}
                <div className='absolute inset-0 rounded-3xl bg-gradient-to-tr from-teal-500/25 via-emerald-500/15 to-transparent blur-xl animate-pulse pointer-events-none' />

                {/* Outer rotating dashed gradient ring */}
                <div className='absolute inset-0 rounded-2xl sm:rounded-3xl border-2 border-dashed border-teal-500/40 dark:border-teal-400/30 animate-[spin_7s_linear_infinite]' />

                {/* Inner fast-spinning accent ring */}
                <div className='absolute inset-1.5 rounded-xl sm:rounded-2xl border-2 border-transparent border-t-teal-600 dark:border-t-teal-400 border-r-emerald-500 animate-[spin_1.3s_linear_infinite]' />

                {/* Center brand container with floating pulse */}
                <div className='relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-teal-600 dark:text-teal-400 flex items-center justify-center text-lg sm:text-xl shadow-md shadow-teal-950/5 dark:shadow-black/40'>
                    <MdOutlineStickyNote2 className='animate-pulse' />
                </div>
            </div>

            {/* Structured Loading Text with animated bouncing dots */}
            {message && (
                <div className='flex items-center gap-1.5'>
                    <p className='text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-300 tracking-tight'>
                        {message}
                    </p>
                    <div className='flex items-center gap-1 pt-0.5'>
                        <span className='w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 animate-bounce' style={{ animationDelay: '0ms' }} />
                        <span className='w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 animate-bounce' style={{ animationDelay: '150ms' }} />
                        <span className='w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 animate-bounce' style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-md transition-all duration-300'>
                {loaderContent}
            </div>
        );
    }

    return (
        <div className='w-full py-16 flex items-center justify-center'>
            {loaderContent}
        </div>
    );
};

export default Loader;

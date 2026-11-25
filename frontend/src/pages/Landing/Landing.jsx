import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import { 
    MdOutlineStickyNote2, 
    MdOutlinePushPin, 
    MdCreate, 
    MdDelete, 
    MdSearch, 
} from 'react-icons/md'
import { HiSparkles, HiArrowRight, HiCheck } from 'react-icons/hi'

const Landing = () => {
    // If user is already logged in, redirect to appropriate inner page
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token) {
        return <Navigate to={role === "admin" ? "/admin" : "/dashboard"} replace />;
    }

    return (
        <div className='min-h-screen bg-gradient-to-b from-slate-50 via-white to-teal-50/20 dark:from-slate-950 dark:via-[#0b0f19] dark:to-teal-950/20 flex flex-col justify-between transition-colors'>
            <Navbar />

            <main className='flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-16 w-full'>
                <div className='text-center max-w-3xl mx-auto'>
                    <div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-100 dark:border-teal-800/60 text-teal-700 dark:text-teal-300 text-xs sm:text-sm font-medium mb-5 shadow-xs'>
                        <HiSparkles className='text-sm' />
                        <span>Calm, Light & Distraction-Free Notes with Notiva</span>
                    </div>

                    <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15] sm:leading-[1.12]'>
                        Capture ideas.{' '}
                        <span className='bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent'>
                            Organize with Notiva.
                        </span>
                    </h1>

                    <p className='mt-4 sm:mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto'>
                        A soothing, beautifully structured workspace crafted to help you write thoughts, pin key priorities, and find notes instantly without visual clutter.
                    </p>

                    <div className='mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4'>
                        <Link
                            to="/signup"
                            className='w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm sm:text-base shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0'
                        >
                            <span>Get Started with Notiva</span>
                            <HiArrowRight className='text-lg' />
                        </Link>
                        <Link
                            to="/login"
                            className='w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm sm:text-base border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all duration-200'
                        >
                            Sign In
                        </Link>
                    </div>

                    <div className='mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500 dark:text-slate-400'>
                        <span className='inline-flex items-center gap-1.5'>
                            <HiCheck className='text-teal-600 dark:text-teal-400 text-sm' /> Free forever
                        </span>
                        <span className='inline-flex items-center gap-1.5'>
                            <HiCheck className='text-teal-600 dark:text-teal-400 text-sm' /> Light & dark theme
                        </span>
                        <span className='inline-flex items-center gap-1.5'>
                            <HiCheck className='text-teal-600 dark:text-teal-400 text-sm' /> Secure password hashing
                        </span>
                    </div>
                </div>

                <div className='mt-12 sm:mt-16 max-w-2xl mx-auto'>
                    <div className='p-1 rounded-3xl bg-gradient-to-tr from-teal-100 via-emerald-50 to-slate-100 dark:from-teal-950/40 dark:via-slate-900 dark:to-slate-900 shadow-xl shadow-teal-600/5'>
                        <div className='bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800'>
                            <div className='flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800'>
                                <div className='flex items-center gap-2'>
                                    <span className='w-2.5 h-2.5 rounded-full bg-red-400'></span>
                                    <span className='w-2.5 h-2.5 rounded-full bg-amber-400'></span>
                                    <span className='w-2.5 h-2.5 rounded-full bg-emerald-400'></span>
                                    <span className='ml-2 text-xs font-semibold text-slate-400 dark:text-slate-500'>Notiva Note Preview</span>
                                </div>
                                <span className='inline-flex items-center gap-1 text-[10.5px] font-medium px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60'>
                                    <MdOutlinePushPin className='text-xs' /> Pinned Note
                                </span>
                            </div>

                            <div className='mt-4 flex items-start justify-between gap-3'>
                                <div>
                                    <h3 className='text-[15px] sm:text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight'>
                                        Daily Priorities & Creative Ideas 💡
                                    </h3>
                                    <p className='text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-normal'>24 Nov, 2026</p>
                                </div>
                                <MdOutlinePushPin className='text-xl text-amber-500 shrink-0' />
                            </div>

                            <p className='mt-2.5 text-[13px] sm:text-[13.5px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal'>
                                A soft, clutter-free workspace allows your thoughts to flow naturally. Pin urgent ideas, categorize with hashtags, and search your archives seamlessly.
                            </p>

                            <div className='mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100/80 dark:border-slate-800/80'>
                                <div className='flex flex-wrap gap-1 text-xs'>
                                    <span className='bg-teal-50/80 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-medium px-2.5 py-0.5 rounded-full text-[11px] border border-teal-100/70 dark:border-teal-800/60'>#Design</span>
                                    <span className='bg-teal-50/80 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-medium px-2.5 py-0.5 rounded-full text-[11px] border border-teal-100/70 dark:border-teal-800/60'>#Productivity</span>
                                    <span className='bg-teal-50/80 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-medium px-2.5 py-0.5 rounded-full text-[11px] border border-teal-100/70 dark:border-teal-800/60'>#Notiva</span>
                                </div>

                                <div className='flex items-center gap-2.5 text-slate-400 dark:text-slate-500 text-base'>
                                    <MdCreate className='hover:text-teal-700 dark:hover:text-teal-400 cursor-pointer transition-colors' />
                                    <MdDelete className='hover:text-red-500 dark:hover:text-red-400 cursor-pointer transition-colors' />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6'>
                    <div className='bg-white dark:bg-slate-900/90 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-teal-200 dark:hover:border-teal-700/60 transition-all duration-200'>
                        <div className='w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xl mb-3.5 border border-teal-100/60 dark:border-teal-800/60'>
                            <MdOutlineStickyNote2 />
                        </div>
                        <h3 className='text-base font-bold text-slate-800 dark:text-slate-100 mb-1.5'>
                            Soft & Distraction-Free
                        </h3>
                        <p className='text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal'>
                            Designed with soothing light and dark themes that prevent eye strain. Write, edit, and organize effortlessly.
                        </p>
                    </div>

                    <div className='bg-white dark:bg-slate-900/90 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-200 dark:hover:border-amber-700/60 transition-all duration-200'>
                        <div className='w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl mb-3.5 border border-amber-100/60 dark:border-amber-800/60'>
                            <MdOutlinePushPin />
                        </div>
                        <h3 className='text-base font-bold text-slate-800 dark:text-slate-100 mb-1.5'>
                            Pin Key Tasks
                        </h3>
                        <p className='text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal'>
                            Highlight critical notes so they remain anchored at the top of your dashboard for immediate visibility.
                        </p>
                    </div>

                    <div className='bg-white dark:bg-slate-900/90 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700/60 transition-all duration-200'>
                        <div className='w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mb-3.5 border border-emerald-100/60 dark:border-emerald-800/60'>
                            <MdSearch />
                        </div>
                        <h3 className='text-base font-bold text-slate-800 dark:text-slate-100 mb-1.5'>
                            Instant Search
                        </h3>
                        <p className='text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal'>
                            Locate any idea, keyword, or hashtag in real time. Fast filtering helps you retrieve notes in milliseconds.
                        </p>
                    </div>
                </div>

                <div className='mt-16 sm:mt-20 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white text-center shadow-lg shadow-teal-700/15'>
                    <h2 className='text-2xl sm:text-3xl font-extrabold tracking-tight'>
                        Simple, calm, and structured.
                    </h2>
                    <p className='mt-2.5 text-xs sm:text-sm text-teal-100 max-w-lg mx-auto'>
                        Join today and experience the peaceful simplicity of note-taking with Notiva.
                    </p>
                    <div className='mt-6'>
                        <Link
                            to="/signup"
                            className='inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-teal-800 font-bold text-sm hover:bg-teal-50 shadow-sm transition-all duration-200 transform hover:-translate-y-0.5'
                        >
                            <span>Create Free Account</span>
                            <HiArrowRight />
                        </Link>
                    </div>
                </div>
            </main>

            <footer className='border-t border-slate-100 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 py-4 mt-auto transition-colors'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400'>
                    <div className='flex items-center gap-2'>
                        <div className='w-5 h-5 rounded-md bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white text-xs shadow-xs'>
                            <MdOutlineStickyNote2 />
                        </div>
                        <span className='font-bold tracking-tight text-slate-900 dark:text-white'>Notiva<span className='text-teal-600 dark:text-teal-400'>.</span></span>
                        <span className='text-slate-300 dark:text-slate-700'>•</span>
                        <span className='font-normal text-slate-500 dark:text-slate-400'>Calm & simple note taking</span>
                    </div>
                    <div className='flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500'>
                        <span>© 2026 Notiva. All rights reserved.</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Landing

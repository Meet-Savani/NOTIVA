import React from 'react'
import { MdOutlineStickyNote2, MdAdd, MdSearchOff } from 'react-icons/md'

const EmptyCard = ({ isSearch, message, onAddNew }) => {
    return (
        <div className='flex-1 flex flex-col items-center justify-center py-6 px-4 text-center my-auto'>
            {/* Catchy Light Icon Box in Soft Teal */}
            <div className='relative mb-5'>
                <div className='w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-100 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400 text-4xl sm:text-5xl shadow-sm'>
                    {isSearch ? <MdSearchOff /> : <MdOutlineStickyNote2 />}
                </div>
                {!isSearch && (
                    <div className='absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-lg shadow-md border-2 border-white dark:border-slate-900'>
                        <MdAdd />
                    </div>
                )}
            </div>

            <h3 className='text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight'>
                {isSearch ? "No matching notes found" : "Your canvas is clean & ready"}
            </h3>

            <p className='text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-md mt-2 leading-relaxed font-normal'>
                {message || "Capture your thoughts, ideas, tasks, and inspirations with Notiva. Click below to add your first note."}
            </p>

            {!isSearch && onAddNew && (
                <button
                    onClick={onAddNew}
                    className='mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0'
                >
                    <MdAdd className='text-xl' />
                    <span>Create Your First Note</span>
                </button>
            )}
        </div>
    )
}

export default EmptyCard

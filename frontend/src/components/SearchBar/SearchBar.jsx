import React from 'react'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { IoClose } from "react-icons/io5";

const SearchBar = ({ value, onChange, handleSearch, onClearSearch }) => {
    const handleKeyDown = (e) => {
        if(e.key === "Enter") {
            e.preventDefault();
            handleSearch();
        }
    }

    return (
        <form 
            onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
            }}
            className='w-full flex items-center px-2 min-[360px]:px-2.5 sm:px-3.5 py-1 min-[360px]:py-1.5 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-full focus-within:bg-white focus-within:dark:bg-slate-800 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/10 transition-all duration-200'
        >
            <input 
                type="text" 
                placeholder='Search notes...'
                className='w-full text-[11px] min-[360px]:text-xs sm:text-[13px] bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal text-slate-800 dark:text-slate-100 min-w-0 pr-1'
                value={value}
                onChange={onChange}
                onKeyDown={handleKeyDown} 
            />

            { value && (
                <button 
                    type="button"
                    onClick={onClearSearch}
                    className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mr-1 sm:mr-1.5 transition-colors shrink-0 p-0.5"
                    aria-label="Clear search"
                >
                    <IoClose className="text-sm sm:text-base" />
                </button>
            )}

            <button 
                type="submit"
                className='text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors p-0.5 shrink-0'
                aria-label="Search"
            >
                <FaMagnifyingGlass className='text-xs sm:text-sm' />
            </button>
        </form>
    )
}

export default SearchBar

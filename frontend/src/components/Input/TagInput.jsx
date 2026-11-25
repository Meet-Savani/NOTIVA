import React, { useState } from 'react'
import { MdAdd, MdClose } from 'react-icons/md'

const TagInput = ({ tags, setTags }) => {
    const [inputValue, setInputValue] = useState("");

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    }

    const addNewTag = () => {
        const cleanTag = inputValue.trim().replace(/^#/, '');
        if(cleanTag !== "" && !tags.includes(cleanTag)) {
            setTags([...tags, cleanTag]);
            setInputValue("");
        }
    }

    const handleKeyDown = (e) => {
        if(e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addNewTag();
        }
    }

    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    }

    return (
        <div>
            { tags?.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                    {tags.map((tag, index) => (
                        <span 
                            key={index} 
                            className='font-sans inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 border border-teal-200/70 dark:border-teal-800/70 px-3 py-1 rounded-full shadow-2xs'
                        >
                            #{tag}
                            <button 
                                type="button"
                                className='text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-0.5'
                                onClick={() => handleRemoveTag(tag)}
                                aria-label={`Remove tag ${tag}`}
                            >
                                <MdClose className='text-xs' />
                            </button>
                        </span>
                    ))}
                </div> 
            )}

            <div className="flex items-center gap-2">
                <input 
                    type="text" 
                    className='text-xs sm:text-sm bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition placeholder:text-slate-400 dark:placeholder:text-slate-500 flex-1' 
                    placeholder='Add tag and press Enter or comma...'
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown} 
                />

                <button 
                    type="button"
                    className='px-3.5 py-2 flex items-center justify-center gap-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-100/80 dark:border-teal-800/60 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 dark:hover:text-white transition-all text-xs font-semibold'
                    onClick={addNewTag} 
                >
                    <MdAdd className='text-base' />
                    <span>Add</span>
                </button>
            </div>
        </div>
    )
}

export default TagInput

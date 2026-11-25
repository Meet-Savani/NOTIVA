import React, { useState, useRef } from 'react'
import TagInput from '../../components/Input/TagInput'
import { MdClose, MdOutlineStickyNote2, MdCreate, MdOutlineCheck } from 'react-icons/md';
import axiosInstance from '../../utils/axiosInstance';
import { DEFAULT_CATEGORIES, saveUserCustomCategory, removeUserCustomCategory, getSortedCustomCategories } from '../../utils/constants';
import { broadcastRealtimeUpdate } from '../../utils/realtimeSync';

const AddEditNotes = ({ getAllNotes, noteData, type, onClose, userInfo, allNotes }) => {
    const userKey = userInfo?._id || userInfo?.email || "current_user";
    // Custom categories strictly exist only if at least one active note in allNotes uses them (chronological: first added comes first)
    const sortedCustom = getSortedCustomCategories(allNotes);

    // If editing a note that already had a custom category, keep it in the list for this session
    if (noteData?.category && !DEFAULT_CATEGORIES.some(dc => dc.toLowerCase() === noteData.category.toLowerCase())) {
        if (!sortedCustom.some(c => c.toLowerCase() === noteData.category.toLowerCase())) {
            sortedCustom.push(noteData.category.trim());
        }
    }

    const userCustomCategories = sortedCustom;

    const isInitialCustom = Boolean(
        noteData?.category && 
        !DEFAULT_CATEGORIES.some(dc => dc.toLowerCase() === noteData.category.toLowerCase()) &&
        !userCustomCategories.some(uc => uc.toLowerCase() === noteData.category.toLowerCase())
    );

    const [title, setTitle] = useState(noteData?.title || "");
    const [content, setContent] = useState(noteData?.content || "");
    const [tags, setTags] = useState(noteData?.tags || []);
    const [category, setCategory] = useState(noteData?.category || "General");
    const [customCategory, setCustomCategory] = useState(isInitialCustom ? noteData.category : "");
    const [isCustomCat, setIsCustomCat] = useState(isInitialCustom);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs for seamless keyboard Tab navigation (Title -> Category first value -> Content)
    const titleRef = useRef(null);
    const firstCategoryRef = useRef(null);
    const contentRef = useRef(null);

    const addNewNote = async () => {
        setIsSubmitting(true);
        const finalCategory = isCustomCat && customCategory.trim() 
            ? customCategory.trim() 
            : (category || "General");

        if (isCustomCat && customCategory.trim()) {
            saveUserCustomCategory(userKey, customCategory.trim());
        }

        try {
            const response = await axiosInstance.post("/add-note", {
                title, 
                content,
                tags,
                category: finalCategory,
            });

            if(response.data && response.data.note) {
                getAllNotes();
                broadcastRealtimeUpdate('NOTES_CHANGED');
                onClose();
            }
        } catch (error) {
            if(error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    const editNote = async () => {
        const noteId = noteData._id;
        const finalCategory = isCustomCat && customCategory.trim() 
            ? customCategory.trim() 
            : (category || "General");

        if (isCustomCat && customCategory.trim()) {
            saveUserCustomCategory(userKey, customCategory.trim());
        }
        setIsSubmitting(true);

        try {
            const response = await axiosInstance.put("/edit-note/" + noteId, {
                title, 
                content,
                tags,
                category: finalCategory,
            });

            if(response.data && response.data.note) {
                // If the old category was a custom category and is no longer used by any other note, auto-remove it
                const oldCat = noteData?.category?.trim();
                if (oldCat && oldCat.toLowerCase() !== finalCategory.toLowerCase() && !DEFAULT_CATEGORIES.some(dc => dc.toLowerCase() === oldCat.toLowerCase())) {
                    const otherNotesUseOldCat = (allNotes || []).some(
                        n => n._id !== noteId && (n.category || '').trim().toLowerCase() === oldCat.toLowerCase()
                    );
                    if (!otherNotesUseOldCat) {
                        removeUserCustomCategory(userKey, oldCat);
                    }
                }

                getAllNotes();
                broadcastRealtimeUpdate('NOTES_CHANGED');
                onClose();
            }
        } catch (error) {
            if(error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleAddNote = () => {
        if(title.trim() === "" || !title) {
            setError("Title is required");
            return;
        }

        if(content.trim() === "" || !content) {
            setError("Content is required");
            return;
        }

        setError("");

        if(type === "edit") {
            editNote();
        } else {
            addNewNote();
        }
    }

    // Keyboard shortcut (Ctrl+Enter or Cmd+Enter to save)
    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleAddNote();
        }
    }

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const charCount = content.length;

    return (
        <div className='relative w-full' onKeyDown={handleKeyDown}>
            <div className='flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800'>
                <div className='flex items-center gap-2.5'>
                    <div className='w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center text-lg border border-teal-100/60 dark:border-teal-800/60'>
                        {type === "edit" ? <MdCreate /> : <MdOutlineStickyNote2 />}
                    </div>
                    <div>
                        <h3 className='text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight'>
                            {type === "edit" ? "Edit Note" : "Create New Note"}
                        </h3>
                        <p className='text-[11px] text-slate-400 dark:text-slate-500'>
                            {type === "edit" ? "Make updates to your existing note" : "Capture your thoughts and organize ideas"}
                        </p>
                    </div>
                </div>

                <button 
                    className='w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition'
                    onClick={onClose}
                    aria-label="Close"
                >
                    <MdClose className='text-lg' />
                </button>
            </div>

            <div className="flex flex-col gap-1.5 mt-4">
                <label className='input-label'>Title</label>
                <input 
                    ref={titleRef}
                    type="text"
                    className='w-full text-base sm:text-lg font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 rounded-xl px-3.5 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal'
                    placeholder='e.g., Weekly Sprint Goals'
                    value={title}
                    onChange={({ target }) => setTitle(target.value)} 
                    onKeyDown={(e) => {
                        if (e.key === 'Tab' && !e.shiftKey) {
                            e.preventDefault();
                            firstCategoryRef.current?.focus();
                        }
                    }}
                    autoFocus={type === 'add'}
                />
            </div>

            <div className="flex flex-col gap-1.5 mt-4">
                <label className='input-label'>Category</label>
                <div className='flex flex-wrap gap-1.5'>
                    {/* Default System Categories */}
                    {DEFAULT_CATEGORIES.map((cat, idx) => (
                        <button
                            key={cat}
                            ref={idx === 0 ? firstCategoryRef : null}
                            type='button'
                            onClick={() => { setCategory(cat); setIsCustomCat(false); setCustomCategory(""); }}
                            onKeyDown={(e) => {
                                if (e.key === 'Tab' && !e.shiftKey) {
                                    e.preventDefault();
                                    contentRef.current?.focus();
                                } else if (e.key === 'Tab' && e.shiftKey) {
                                    e.preventDefault();
                                    titleRef.current?.focus();
                                } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    e.currentTarget.nextElementSibling?.focus();
                                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    e.currentTarget.previousElementSibling?.focus();
                                }
                            }}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs transition outline-none focus:ring-2 focus:ring-teal-500/50 ${
                                !isCustomCat && category === cat
                                    ? 'bg-teal-600 text-white font-semibold shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 font-medium'
                            }`}
                        >
                            {!isCustomCat && category === cat && <MdOutlineCheck className='text-xs' />}
                            <span>{cat}</span>
                        </button>
                    ))}

                    {/* Custom Categories created by this user */}
                    {userCustomCategories.map((cat) => (
                        <button
                            key={cat}
                            type='button'
                            onClick={() => { setCategory(cat); setIsCustomCat(false); setCustomCategory(""); }}
                            onKeyDown={(e) => {
                                if (e.key === 'Tab' && !e.shiftKey) {
                                    e.preventDefault();
                                    contentRef.current?.focus();
                                } else if (e.key === 'Tab' && e.shiftKey) {
                                    e.preventDefault();
                                    titleRef.current?.focus();
                                } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    e.currentTarget.nextElementSibling?.focus();
                                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    e.currentTarget.previousElementSibling?.focus();
                                }
                            }}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs transition outline-none focus:ring-2 focus:ring-teal-500/50 ${
                                !isCustomCat && category === cat
                                    ? 'bg-teal-600 text-white font-semibold shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 font-medium'
                            }`}
                        >
                            {!isCustomCat && category === cat && <MdOutlineCheck className='text-xs' />}
                            <span>{cat}</span>
                        </button>
                    ))}

                    <button
                        type='button'
                        onClick={() => {
                            setIsCustomCat(true);
                            setCustomCategory("");
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Tab' && !e.shiftKey && !isCustomCat) {
                                e.preventDefault();
                                contentRef.current?.focus();
                            } else if (e.key === 'Tab' && e.shiftKey) {
                                e.preventDefault();
                                titleRef.current?.focus();
                            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                                e.preventDefault();
                                e.currentTarget.previousElementSibling?.focus();
                            }
                        }}
                        className={`px-3 py-1 rounded-full text-xs transition outline-none focus:ring-2 focus:ring-teal-500/50 ${
                            isCustomCat
                                ? 'bg-teal-600 text-white font-semibold shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 font-medium'
                        }`}
                    >
                        + Custom
                    </button>
                </div>

                {isCustomCat && (
                    <input
                        type='text'
                        placeholder='Type custom category name (e.g., Marketing)...'
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Tab' && !e.shiftKey) {
                                e.preventDefault();
                                contentRef.current?.focus();
                            } else if (e.key === 'Tab' && e.shiftKey) {
                                e.preventDefault();
                                firstCategoryRef.current?.focus();
                            }
                        }}
                        className='mt-2 text-xs sm:text-[13px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-100'
                        autoFocus
                    />
                )}
            </div>

            <div className="flex flex-col gap-1.5 mt-4">
                <div className='flex items-center justify-between'>
                    <label className='input-label mb-0'>Content</label>
                    <span className='font-sans text-[11px] text-slate-400 dark:text-slate-500'>
                        {wordCount} words • {charCount} chars
                    </span>
                </div>
                <textarea 
                    ref={contentRef}
                    className='w-full font-sans text-xs sm:text-[13.5px] text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800/90 font-normal leading-relaxed border border-slate-200/90 dark:border-slate-700 rounded-xl px-3.5 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none h-[115px] sm:h-[125px] max-h-[130px] overflow-y-auto overscroll-contain'
                    placeholder='Type your thoughts, tasks, or meeting notes here...'
                    rows={4} 
                    value={content}
                    onChange={({ target }) => setContent(target.value)} 
                    onKeyDown={(e) => {
                        if (e.key === 'Tab' && e.shiftKey) {
                            e.preventDefault();
                            firstCategoryRef.current?.focus();
                        }
                    }}
                />
            </div>

            <div className="mt-4">
                <label className='input-label'>Tags</label>
                <TagInput tags={tags} setTags={setTags} />
            </div>

            { error && (
                <div className="mt-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs font-medium">
                    {error}
                </div>
            )}

            <div className='flex items-center justify-between gap-3 mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800'>
                <span className='text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline'>
                    Tip: Press <kbd className='px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono'>Ctrl+Enter</kbd> to save
                </span>

                <div className='flex items-center gap-2.5 ml-auto'>
                    <button
                        onClick={onClose}
                        className='px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-medium transition'
                    >
                        Cancel
                    </button>

                    <button 
                        className='btn-primary w-auto px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold'
                        disabled={isSubmitting}
                        onClick={handleAddNote}
                    >
                        {isSubmitting 
                            ? (type === "edit" ? "Updating..." : "Saving...") 
                            : (type === "edit" ? "Update Note" : "Save Note")}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddEditNotes

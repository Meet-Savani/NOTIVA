import React from "react";
import { 
    MdOutlinePushPin, 
    MdPushPin, 
    MdCreate, 
    MdDelete,
    MdStar,
    MdOutlineStarBorder,
    MdArchive,
    MdUnarchive,
    MdOutlineRemoveRedEye
} from "react-icons/md";
import { HiOutlineCalendar } from "react-icons/hi";
import moment from 'moment';

const NoteCard = ({
    title,
    date,
    content,
    tags,
    category,
    isPinned,
    isFavorite,
    isArchived,
    onEdit,
    onDelete,
    onPinNote,
    onFavoriteNote,
    onArchiveNote,
    onView,
}) => {
    return (
        <div className={`group relative rounded-2xl p-4 sm:p-4.5 bg-white dark:bg-slate-900/90 border transition-all duration-200 flex flex-col justify-between hover:shadow-md w-full min-w-0 ${
            isPinned 
                ? "border-amber-300/80 dark:border-amber-700/60 bg-gradient-to-b from-amber-50/25 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 shadow-2xs" 
                : isArchived
                ? "border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-80 hover:opacity-100"
                : "border-slate-200/80 dark:border-slate-800 hover:border-teal-300/80 dark:hover:border-teal-700/60 shadow-2xs"
        }`}>
            {/* Top Bar: Category Badge on left, Pin & Star on right with Date directly underneath */}
            <div className="min-w-0">
                <div className="flex items-start justify-between gap-2 min-w-0">
                    <span 
                        className="inline-flex items-center text-[10px] min-[380px]:text-[10.5px] sm:text-[11px] font-bold px-2 min-[380px]:px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/70 tracking-tight shrink min-w-0 max-w-[130px] sm:max-w-[160px] truncate whitespace-nowrap uppercase"
                        title={category || "General"}
                    >
                        <span className="truncate">{category || "General"}</span>
                    </span>

                    {/* Pin & Star top right, with date below them */}
                    <div className="flex flex-col items-end shrink-0 ml-1.5">
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFavoriteNote();
                                }}
                                className={`p-1 rounded-lg transition-colors ${
                                    isFavorite 
                                        ? "text-amber-500 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50" 
                                        : "text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                                title={isFavorite ? "Remove from Favorites" : "Mark as Favorite"}
                                aria-label="Favorite note"
                            >
                                {isFavorite ? <MdStar className="text-base sm:text-lg" /> : <MdOutlineStarBorder className="text-base sm:text-lg" />}
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPinNote();
                                }}
                                className={`p-1 rounded-lg transition-colors ${
                                    isPinned 
                                        ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50" 
                                        : "text-slate-400 dark:text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                }`}
                                title={isPinned ? "Unpin note" : "Pin note"}
                                aria-label={isPinned ? "Unpin note" : "Pin note"}
                            >
                                {isPinned ? <MdPushPin className="text-base sm:text-lg" /> : <MdOutlinePushPin className="text-base sm:text-lg" />}
                            </button>
                        </div>

                        <span className="text-[9.5px] min-[380px]:text-[10px] sm:text-[10.5px] text-slate-400 dark:text-slate-500 font-semibold sm:font-medium mt-0.5 whitespace-nowrap tracking-tight">
                            {moment(date).format("DD MMM, YYYY")}
                        </span>
                    </div>
                </div>

                {/* Content Section: Clamped without mid-word breaking */}
                <div className="mt-2.5 cursor-pointer min-w-0" onClick={onView} title="Click to view entire note">
                    <h3 
                        className="font-display text-[15px] min-[380px]:text-base sm:text-[16px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight leading-snug group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors line-clamp-1 break-words overflow-hidden" 
                    >
                        {title}
                    </h3>
                    <p className="font-sans text-[12px] min-[380px]:text-[12.5px] sm:text-[13px] text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-3 leading-relaxed break-words overflow-hidden font-normal">
                        {content}
                    </p>
                </div>
            </div>

            {/* Bottom Section: Strictly 2 Tags & Remaining Actions */}
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 min-w-0">
                {/* Tags (Max 2 displayed, remainder as +N) */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                    {tags && tags.length > 0 ? (
                        tags.slice(0, 2).map((tag, i) => (
                            <span 
                                key={i} 
                                className="font-sans inline-flex items-center text-[10px] min-[380px]:text-[10.5px] sm:text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50/90 dark:bg-teal-950/70 border border-teal-200/70 dark:border-teal-800/70 px-2 min-[380px]:px-2.5 py-0.5 rounded-full max-w-[75px] sm:max-w-[95px] truncate whitespace-nowrap tracking-tight shadow-2xs shrink-0"
                                title={`#${tag}`}
                            >
                                <span className="truncate">#{tag}</span>
                            </span>
                        ))
                    ) : (
                        <span className="font-sans text-[10.5px] sm:text-[11px] text-slate-300 dark:text-slate-600 italic whitespace-nowrap">No tags</span>
                    )}
                    {tags && tags.length > 2 && (
                        <span 
                            className="font-sans text-[9px] min-[380px]:text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 whitespace-nowrap"
                            title={`${tags.length - 2} more tags`}
                        >
                            +{tags.length - 2}
                        </span>
                    )}
                </div>

                {/* Action Buttons Toolbar: View, Archive, Edit, Delete */}
                <div className="flex items-center gap-0.5 shrink-0 ml-1">
                    {/* View Button to open modal */}
                    <button
                        onClick={onView}
                        className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View full note"
                        aria-label="View full note"
                    >
                        <MdOutlineRemoveRedEye className="text-base" />
                    </button>

                    <button
                        onClick={onArchiveNote}
                        className={`p-1.5 rounded-lg transition-colors ${
                            isArchived 
                                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40" 
                                : "text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                        title={isArchived ? "Unarchive note" : "Archive note"}
                        aria-label="Archive note"
                    >
                        {isArchived ? <MdUnarchive className="text-base" /> : <MdArchive className="text-base" />}
                    </button>

                    <button
                        onClick={onEdit}
                        className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
                        title="Edit note"
                        aria-label="Edit note"
                    >
                        <MdCreate className="text-base" />
                    </button>

                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Delete note"
                        aria-label="Delete note"
                    >
                        <MdDelete className="text-base" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoteCard;

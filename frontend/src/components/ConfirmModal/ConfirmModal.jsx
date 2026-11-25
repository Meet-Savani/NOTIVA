import React from 'react';
import Modal from 'react-modal';
import { MdOutlineDelete, MdClose, MdOutlineWarningAmber } from 'react-icons/md';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Item",
    message = "Are you sure you want to delete this? This action cannot be undone.",
    itemTitle = "",
    confirmText = "Delete",
    cancelText = "Cancel",
    type = "delete", // "delete" | "warning"
    isLoading = false
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            ariaHideApp={false}
            style={{
                overlay: {
                    backgroundColor: "rgba(15, 23, 42, 0.65)",
                    backdropFilter: "blur(6px)",
                    zIndex: 60,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem",
                },
            }}
            contentLabel={title}
            className="w-full sm:w-[420px] max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 outline-none my-auto transition-all"
        >
            <div className='flex flex-col'>
                {/* Header with icon and close button */}
                <div className='flex items-start justify-between gap-3'>
                    <div className='flex items-center gap-3'>
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                            type === 'warning'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'
                                : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/60'
                        }`}>
                            {type === 'warning' ? (
                                <MdOutlineWarningAmber className='text-2xl' />
                            ) : (
                                <MdOutlineDelete className='text-2xl' />
                            )}
                        </div>
                        <div>
                            <h3 className='text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight'>
                                {title}
                            </h3>
                            <p className='text-xs text-slate-400 dark:text-slate-500 mt-0.5'>
                                Please reconfirm your action
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className='w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0'
                        aria-label="Close"
                    >
                        <MdClose className='text-lg' />
                    </button>
                </div>

                {/* Message body & highlighted item badge */}
                <div className='mt-4'>
                    <p className='text-xs sm:text-[13.5px] text-slate-600 dark:text-slate-300 leading-relaxed'>
                        {message}
                    </p>

                    {itemTitle && (
                        <div className='mt-3 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70'>
                            <p className='text-xs font-semibold text-slate-800 dark:text-slate-200 truncate'>
                                "{itemTitle}"
                            </p>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className='flex items-center gap-2.5 mt-6 pt-3 border-t border-slate-100 dark:border-slate-800'>
                    <button
                        type='button'
                        onClick={onClose}
                        disabled={isLoading}
                        className='flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold transition'
                    >
                        {cancelText}
                    </button>
                    <button
                        type='button'
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-md transition ${
                            type === 'warning'
                                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20 active:scale-[0.98]'
                                : 'bg-red-600 hover:bg-red-700 shadow-red-600/20 active:scale-[0.98]'
                        } disabled:opacity-50`}
                    >
                        {type === 'warning' ? (
                            <MdOutlineWarningAmber className='text-base' />
                        ) : (
                            <MdOutlineDelete className='text-base' />
                        )}
                        <span>{isLoading ? "Processing..." : confirmText}</span>
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;

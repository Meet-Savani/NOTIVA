import React from 'react'
import { getInitials } from '../../utils/helper'
import { Link } from 'react-router-dom'
import { MdLogout, MdOutlineShield } from 'react-icons/md'

const ProfileInfo = ({ userInfo, onLogOut, onOpenProfile }) => {
    if (!userInfo) return null;

    const isAdmin = userInfo.role === "admin";

    return (
        <div className='flex items-center gap-2 sm:gap-3'>
            {isAdmin && (
                <Link
                    to="/admin"
                    className='hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100/90 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 border border-teal-200/80 dark:border-teal-800/90 text-xs sm:text-[13px] font-semibold text-teal-800 dark:text-teal-300 transition-all shrink-0 shadow-2xs hover:shadow-xs'
                    title='Go to Admin Panel'
                >
                    <MdOutlineShield className='text-base text-teal-700 dark:text-teal-300' />
                    <span>Admin Panel</span>
                </Link>
            )}

            <button 
                onClick={onOpenProfile}
                className='flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left group'
                title="Manage Profile"
                aria-label="Manage Profile"
            >
                {/* Profile photo: fixed first letter of first and last name */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-teal-800 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 shadow-2xs group-hover:scale-105 transition-transform text-[11px] sm:text-xs tracking-tight shrink-0">
                    {getInitials(userInfo?.fullName)}
                </div>

                {/* Only user name displayed (no 'Profile & Settings' text) */}
                <p className="hidden sm:block text-xs sm:text-[13.5px] font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight group-hover:text-teal-800 dark:group-hover:text-teal-400 transition-colors">
                    {userInfo?.fullName}
                </p>
            </button>

            {/* Logout button with icon instead of text */}
            <button 
                className='p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0' 
                onClick={onLogOut}
                title="Log Out"
                aria-label="Log Out"
            >
                <MdLogout className='text-base sm:text-lg' />
            </button>
        </div>
    )
}

export default ProfileInfo

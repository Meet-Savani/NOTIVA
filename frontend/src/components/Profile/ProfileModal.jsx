import React, { useState, useEffect } from 'react'
import Modal from 'react-modal'
import { 
    MdClose, 
    MdOutlinePerson, 
    MdOutlineLock, 
    MdOutlineBarChart 
} from 'react-icons/md'
import axiosInstance from '../../utils/axiosInstance'
import { getInitials } from '../../utils/helper'
import moment from 'moment'
import { broadcastRealtimeUpdate } from '../../utils/realtimeSync'

const ProfileModal = ({ isOpen, onClose, userInfo, setUserInfo, allNotes }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [fullName, setFullName] = useState(userInfo?.fullName || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Sync input states when userInfo or modal open status changes
    useEffect(() => {
        if (userInfo) {
            setFullName(userInfo.fullName || '');
            setError('');
        }
    }, [userInfo, isOpen]);

    if (!userInfo) return null;

    const handleUpdateName = async (e) => {
        e.preventDefault();
        if (!fullName.trim()) {
            setError("Full Name cannot be empty");
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const res = await axiosInstance.put('/update-profile', { 
                fullName: fullName.trim()
            });

            if (res.data && !res.data.error) {
                if (setUserInfo) {
                    setUserInfo((prev) => ({
                        ...prev,
                        ...res.data.user
                    }));
                }
                broadcastRealtimeUpdate('PROFILE_CHANGED');
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("All password fields are required");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters");
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const res = await axiosInstance.put('/change-password', {
                currentPassword,
                newPassword,
            });

            if (res.data && !res.data.error) {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to change password");
        } finally {
            setIsLoading(false);
        }
    };

    const initials = getInitials(userInfo.fullName);

    // Metrics for user account
    const totalCount = allNotes?.length || 0;
    const pinnedCount = allNotes?.filter(n => n.isPinned)?.length || 0;
    const favCount = allNotes?.filter(n => n.isFavorite)?.length || 0;
    const archCount = allNotes?.filter(n => n.isArchived)?.length || 0;

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            ariaHideApp={false}
            style={{
                overlay: {
                    backgroundColor: "rgba(15, 23, 42, 0.45)",
                    backdropFilter: "blur(4px)",
                    zIndex: 50,
                },
            }}
            contentLabel="Profile and Settings"
            className="w-[94%] sm:w-[84%] md:w-[62%] lg:w-[46%] max-h-[88vh] bg-white dark:bg-slate-900 rounded-3xl mt-8 sm:mt-10 p-5 sm:p-7 overflow-y-auto mx-auto shadow-2xl border border-slate-100 dark:border-slate-800 outline-none"
        >
            {/* Header */}
            <div className='flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800'>
                <div className='flex items-center gap-3'>
                    {/* Fixed first letter of first and last name */}
                    <div className='w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold text-base border border-teal-100 dark:border-teal-800/60 shrink-0'>
                        {initials}
                    </div>
                    <div>
                        <h2 className='text-lg font-bold text-slate-800 dark:text-white leading-tight flex items-center gap-2'>
                            <span>Profile & Settings</span>
                            {userInfo.role === 'admin' && (
                                <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 uppercase tracking-wider'>
                                    Admin
                                </span>
                            )}
                        </h2>
                        <p className='text-xs text-slate-400 dark:text-slate-500 mt-0.5'>{userInfo.email}</p>
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    className='w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition'
                    aria-label="Close modal"
                >
                    <MdClose className='text-xl' />
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className='flex items-center gap-2 mt-5 border-b border-slate-100 dark:border-slate-800 pb-2.5 flex-wrap'>
                <button
                    onClick={() => { setActiveTab('profile'); setError(''); }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                        activeTab === 'profile'
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-100/80 dark:border-teal-800/60 shadow-2xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <MdOutlinePerson className='text-base' />
                    <span>My Profile</span>
                </button>

                <button
                    onClick={() => { setActiveTab('security'); setError(''); }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                        activeTab === 'security'
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-100/80 dark:border-teal-800/60 shadow-2xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <MdOutlineLock className='text-base' />
                    <span>Security & Password</span>
                </button>

                <button
                    onClick={() => { setActiveTab('stats'); setError(''); }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                        activeTab === 'stats'
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-100/80 dark:border-teal-800/60 shadow-2xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <MdOutlineBarChart className='text-base' />
                    <span>Account Stats</span>
                </button>
            </div>

            {/* Tab Contents */}
            <div className='mt-5'>
                {error && (
                    <div className='p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs mb-4'>
                        {error}
                    </div>
                )}

                {activeTab === 'profile' && (
                    <form onSubmit={handleUpdateName} className='space-y-4'>
                        {/* Profile initials card */}
                        <div className='p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-4'>
                            <div className='w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/70 border-2 border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300 font-extrabold text-xl shadow-xs shrink-0'>
                                {initials}
                            </div>
                            <div>
                                <p className='text-sm font-bold text-slate-800 dark:text-slate-100'>
                                    {userInfo.fullName}
                                </p>
                                <p className='text-xs text-slate-400 dark:text-slate-500 mt-0.5'>
                                    Profile picture is generated from the first letter of your first and last name.
                                </p>
                            </div>
                        </div>

                        {/* Full Name Input */}
                        <div>
                            <label className='input-label'>Full Name</label>
                            <input
                                type='text'
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className='input-box'
                                placeholder='Your Full Name'
                                required
                            />
                        </div>

                        {/* Email Address (Read-only) */}
                        <div>
                            <label className='input-label'>Email Address</label>
                            <input
                                type='email'
                                value={userInfo.email}
                                disabled
                                className='input-box bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                            />
                            <p className='text-[11px] text-slate-400 dark:text-slate-500 mt-0.5'>
                                Email cannot be modified for account security.
                            </p>
                        </div>

                        {/* Meta info */}
                        <div className='text-xs text-slate-400 dark:text-slate-500 pt-1 flex items-center justify-between flex-wrap gap-2'>
                            <div>
                                <span>Member since: </span>
                                <span className='font-medium text-slate-600 dark:text-slate-300'>
                                    {userInfo.createdAt ? moment(userInfo.createdAt).format('DD MMM, YYYY') : 'Recent'}
                                </span>
                            </div>
                            <div>
                                <span>Role: </span>
                                <span className='font-semibold capitalize text-teal-700 dark:text-teal-400'>
                                    {userInfo.role || 'User'}
                                </span>
                            </div>
                        </div>

                        {/* Save Action */}
                        <div className='flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800'>
                            <button
                                type='submit'
                                disabled={isLoading}
                                className='btn-primary w-auto px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold'
                            >
                                {isLoading ? "Saving..." : "Save Profile"}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'security' && (
                    <form onSubmit={handleChangePassword} className='space-y-3.5'>
                        <div>
                            <label className='input-label'>Current Password</label>
                            <input
                                type='password'
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className='input-box'
                                placeholder='••••••••'
                            />
                        </div>

                        <div>
                            <label className='input-label'>New Password</label>
                            <input
                                type='password'
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className='input-box'
                                placeholder='At least 8 characters'
                            />
                        </div>

                        <div>
                            <label className='input-label'>Confirm New Password</label>
                            <input
                                type='password'
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className='input-box'
                                placeholder='Re-enter new password'
                            />
                        </div>

                        <div className='flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800'>
                            <button
                                type='submit'
                                disabled={isLoading}
                                className='btn-primary w-auto px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold'
                            >
                                {isLoading ? "Updating..." : "Update Password"}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'stats' && (
                    <div className='space-y-4'>
                        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                            <div className='p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-100 dark:border-slate-700 text-center'>
                                <p className='text-2xl font-extrabold text-slate-800 dark:text-slate-100'>{totalCount}</p>
                                <p className='text-xs text-slate-500 dark:text-slate-400 font-medium mt-1'>Total Notes</p>
                            </div>

                            <div className='p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/40 text-center'>
                                <p className='text-2xl font-extrabold text-amber-700 dark:text-amber-300'>{pinnedCount}</p>
                                <p className='text-xs text-amber-800 dark:text-amber-400 font-medium mt-1'>Pinned</p>
                            </div>

                            <div className='p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800/40 text-center'>
                                <p className='text-2xl font-extrabold text-teal-700 dark:text-teal-300'>{favCount}</p>
                                <p className='text-xs text-teal-800 dark:text-teal-400 font-medium mt-1'>Favorites</p>
                            </div>

                            <div className='p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/40 text-center'>
                                <p className='text-2xl font-extrabold text-indigo-700 dark:text-indigo-300'>{archCount}</p>
                                <p className='text-xs text-indigo-800 dark:text-indigo-400 font-medium mt-1'>Archived</p>
                            </div>
                        </div>

                        <div className='p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed'>
                            <p className='font-semibold text-slate-800 dark:text-slate-200 mb-1'>Account Status: Active</p>
                            <p>All your personal notes are securely stored and encrypted in Notiva. You can archive, categorize, and pin your thoughts anytime.</p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ProfileModal;

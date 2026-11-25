import React, { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { MdOutlineShield, MdOutlineLock, MdOutlinePerson, MdArrowBack } from 'react-icons/md'
import axiosInstance from '../../utils/axiosInstance'

const AdminLogin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (token && role === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    const handleAdminLogin = async (e) => {
        e.preventDefault();

        if (!username.trim() || !password) {
            setError("Admin Username/Email and Password are required");
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const response = await axiosInstance.post('/admin/login', {
                username: username.trim(),
                password: password,
            });

            if (response.data && response.data.accessToken) {
                localStorage.setItem('token', response.data.accessToken);
                localStorage.setItem('role', 'admin');
                navigate('/admin', { replace: true });
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError("Invalid admin credentials or server unreachable.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='dark-portal min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex flex-col justify-between text-slate-100 overflow-y-auto'>
            <div className='shrink-0 px-6 py-4 flex items-center justify-between border-b border-slate-700/60 bg-slate-900/60 backdrop-blur-md'>
                <Link to="/" className='flex items-center gap-2 text-slate-300 hover:text-white transition text-xs font-semibold'>
                    <MdArrowBack className='text-base' />
                    <span>Back to Notiva Public</span>
                </Link>

                <div className='flex items-center gap-1.5 text-xs font-medium text-teal-400 bg-teal-950/80 border border-teal-800/80 px-3 py-1 rounded-full'>
                    <MdOutlineShield className='text-sm' />
                    <span>Restricted Administrator Access</span>
                </div>
            </div>

            <div className='flex-1 flex items-center justify-center px-4 py-3 overflow-y-auto'>
                <div className='w-full max-w-sm sm:max-w-md border border-slate-700/80 rounded-3xl bg-slate-800/90 backdrop-blur-md shadow-2xl px-6 sm:px-8 py-6 transition-all my-auto'>
                    <div className='text-center mb-5'>
                        <div className='w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center text-2xl mx-auto mb-2.5 shadow-sm'>
                            <MdOutlineShield />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                            Notiva Admin Portal
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Sign in with system administrator credentials
                        </p>
                    </div>

                    <form onSubmit={handleAdminLogin}>
                        <div className='mb-3'>
                            <label className="text-xs font-semibold text-slate-300 mb-1 block">
                                Admin Username or Email
                            </label>
                            <div className='flex items-center bg-slate-900/80 border border-slate-700 px-3.5 py-2 rounded-xl focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/10 transition'>
                                <MdOutlinePerson className='text-slate-400 text-lg mr-2 shrink-0' />
                                <input 
                                    type="text" 
                                    placeholder='admin or admin@notiva.com' 
                                    autoComplete="username"
                                    className='w-full text-xs sm:text-sm bg-transparent outline-none text-white placeholder:text-slate-500'
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)} 
                                />
                            </div>
                        </div>

                        <div className='mb-3'>
                            <label className="text-xs font-semibold text-slate-300 mb-1 block">
                                Master Password
                            </label>
                            <div className='flex items-center bg-slate-900/80 border border-slate-700 px-3.5 py-2 rounded-xl focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/10 transition'>
                                <MdOutlineLock className='text-slate-400 text-lg mr-2 shrink-0' />
                                <input 
                                    type="password" 
                                    placeholder='••••••••••••' 
                                    autoComplete="current-password"
                                    className='w-full text-xs sm:text-sm bg-transparent outline-none text-white placeholder:text-slate-500'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)} 
                                />
                            </div>
                        </div>
                        
                        { error && (
                            <div className='p-2.5 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-xs mb-3 leading-relaxed'>
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className='w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-teal-500/20 hover:shadow-teal-500/30 transition active:scale-95 mt-1'
                        >
                            {isLoading ? "Authenticating..." : "Sign In to Admin Panel"}
                        </button>

                        <div className='mt-4 pt-3 border-t border-slate-700/60 text-center'>
                            <Link to="/login" className="text-xs text-slate-400 hover:text-teal-400 transition">
                                Are you a regular user? Go to User Sign In
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            <footer className='shrink-0 py-2.5 text-center text-[11px] text-slate-500 border-t border-slate-800 bg-slate-950/40'>
                © 2026 Notiva Administration Management. All rights reserved.
            </footer>
        </div>
    )
}

export default AdminLogin;

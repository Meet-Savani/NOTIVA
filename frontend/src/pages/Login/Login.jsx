import React, { useState } from 'react'
import Navbar from '../../components/Navbar/Navbar'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import PasswordInput from '../../components/Input/PasswordInput'
import axiosInstance from '../../utils/axiosInstance'
import { MdOutlineStickyNote2 } from 'react-icons/md'

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
        return <Navigate to={role === "admin" ? "/admin" : "/dashboard"} replace />;
    }

    const handleLogin = async (e) => {
        e.preventDefault();

        if(!email.trim()) {
            setError("Please enter your email address or admin username.");
            return;
        }

        if(!password) {
            setError("Please enter your password.");
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const response = await axiosInstance.post('/login', {
                email: email,
                password: password,
            });

            if(response.data && response.data.accessToken) {
                localStorage.setItem('token', response.data.accessToken);
                if (response.data.role === 'admin') {
                    localStorage.setItem('role', 'admin');
                    navigate('/admin', { replace: true });
                } else {
                    localStorage.setItem('role', 'user');
                    navigate('/dashboard', { replace: true });
                }
            }
        } catch (error) {
            if(error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else {
                setError("An unexpected error occurred. Please try again later.");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/20 dark:from-slate-950 dark:via-[#0b0f19] dark:to-teal-950/20 flex flex-col justify-between transition-colors overflow-y-auto'>
            <div className='shrink-0'>
                <Navbar />
            </div>

            <div className='flex-1 flex items-center justify-center px-4 py-2 sm:py-4 overflow-y-auto'>
                <div className='w-full max-w-sm sm:max-w-md border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/50 dark:shadow-black/40 px-6 sm:px-8 py-5 sm:py-6 transition-all my-auto'>
                    <div className='text-center mb-4'>
                        <div className='w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xl mx-auto mb-2 shadow-xs border border-teal-100/60 dark:border-teal-800/60'>
                            <MdOutlineStickyNote2 />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome to Notiva</h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                            Sign in to continue to your notes
                        </p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className='mb-3'>
                            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Email or Username</label>
                            <input 
                                type="text" 
                                placeholder='you@example.com or Notiva' 
                                autoComplete="username"
                                className='w-full text-xs sm:text-[13.5px] bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 px-3.5 py-2 sm:py-2.5 rounded-xl outline-none transition-all duration-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal text-slate-800 dark:text-slate-100'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)} 
                            />
                        </div>

                        <div className='mb-3'>
                            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Password</label>
                            <PasswordInput 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                autoComplete="current-password"
                            />
                        </div>
                        
                        { error && (
                            <div className='p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs mb-3 leading-relaxed'>
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className='btn-primary mt-1 py-2 sm:py-2.5 text-xs sm:text-sm'
                        >
                            {isLoading ? "Signing in..." : "Sign In to Notiva"}
                        </button>

                        <p className="text-xs sm:text-sm text-center mt-3.5 text-slate-600 dark:text-slate-400 font-normal">
                            Don't have an account yet?{" "}
                            <Link to="/signup" className="font-semibold text-teal-600 dark:text-teal-400 underline hover:text-teal-700 transition">
                                Create an Account
                            </Link>
                        </p>
                    </form>
                </div>
            </div>

            <footer className='shrink-0 py-2.5 sm:py-3 text-center text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100/70 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 flex items-center justify-center gap-2'>
                <div className='w-4 h-4 rounded bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center text-[10px]'>
                    <MdOutlineStickyNote2 />
                </div>
                <span>© 2026 Notiva. All rights reserved.</span>
            </footer>
        </div>
    )
}

export default Login

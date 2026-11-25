import React, { useState } from 'react'
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6'

const PasswordInput = ({ value, onChange, placeholder, autoComplete = "current-password" }) => {
    const [isShowPassword, setIsShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setIsShowPassword(!isShowPassword);
    }

    return (
        <div className='flex items-center bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 px-3.5 rounded-xl focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/10 transition-all duration-200'>
            <input 
                type={isShowPassword ? "text" : "password"}
                value={value}
                onChange={onChange} 
                placeholder={placeholder || "Password"}
                autoComplete={autoComplete}
                className='w-full text-xs sm:text-[13.5px] bg-transparent py-2 mr-2 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal text-slate-800 dark:text-slate-100' 
            />

            { isShowPassword ? 
                <FaRegEye size={18} className='text-teal-600 dark:text-teal-400 cursor-pointer hover:opacity-80 transition-opacity shrink-0'
                onClick={() => togglePasswordVisibility()} />
                : <FaRegEyeSlash size={18} className='text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0' onClick={() => togglePasswordVisibility()} />
            }
        </div>
    )
}

export default PasswordInput

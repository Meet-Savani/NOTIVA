import axios from 'axios';
import BASE_URL from './constants';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json", 
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('token');
        if(accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    }, 
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            const isInnerPage = window.location.pathname.startsWith('/dashboard') || 
                (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login');
            if (isInnerPage) {
                const theme = localStorage.getItem('theme');
                localStorage.clear();
                if (theme) localStorage.setItem('theme', theme);
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
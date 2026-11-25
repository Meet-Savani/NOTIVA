export const validateName = (name) => {
    return name && name.trim().length > 0;
}

export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

// Fixed first letter of first name and first letter of last name
export const getInitials = (name) => {
    if(!name) return "U";
    
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if(parts.length === 0) return "U";
    if(parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

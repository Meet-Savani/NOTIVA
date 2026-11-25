const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    let cleanUrl = envUrl.trim().replace(/\/+$/, '');

    // Fix accidental https on localhost
    if (/^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(cleanUrl)) {
      cleanUrl = cleanUrl.replace(/^https:/i, 'http:');
    }

    return cleanUrl;
  }

  // Fallback: local dev port 3000 or relative path for production
  return import.meta.env.DEV ? 'http://localhost:3000' : '';
};

const BASE_URL = getBaseUrl();

export const DEFAULT_CATEGORIES = [
  "General",
  "Work",
  "Personal",
  "Ideas",
  "Study",
  "To-Do",
  "Planning",
  "Projects",
];

export const getUserCustomCategories = (userIdOrEmail) => {
  if (!userIdOrEmail) return [];
  try {
    const raw = localStorage.getItem(`notiva_categories_${userIdOrEmail}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveUserCustomCategory = (userIdOrEmail, newCategory) => {
  if (!userIdOrEmail || !newCategory || typeof newCategory !== 'string') return;
  const trimmed = newCategory.trim();
  if (!trimmed || DEFAULT_CATEGORIES.some(c => c.toLowerCase() === trimmed.toLowerCase())) return;

  try {
    const current = getUserCustomCategories(userIdOrEmail);
    if (!current.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...current, trimmed];
      localStorage.setItem(`notiva_categories_${userIdOrEmail}`, JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Failed to save custom category", e);
  }
};

export const removeUserCustomCategory = (userIdOrEmail, categoryToRemove) => {
  if (!userIdOrEmail || !categoryToRemove) return;
  try {
    const current = getUserCustomCategories(userIdOrEmail);
    const updated = current.filter(c => c.toLowerCase() !== categoryToRemove.trim().toLowerCase());
    localStorage.setItem(`notiva_categories_${userIdOrEmail}`, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to remove custom category", e);
  }
};

// Sort custom categories chronologically based on event/time (first added / earliest created note comes first)
export const getSortedCustomCategories = (notes) => {
  const catTimeMap = new Map();
  (notes || []).forEach(note => {
    const cat = note.category?.trim();
    if (cat && !DEFAULT_CATEGORIES.some(dc => dc.toLowerCase() === cat.toLowerCase())) {
      const lower = cat.toLowerCase();
      const time = note.createdAt ? new Date(note.createdAt).getTime() : Date.now();
      const existing = catTimeMap.get(lower);
      if (!existing) {
        catTimeMap.set(lower, { name: cat, earliestTime: time });
      } else {
        if (time < existing.earliestTime) {
          existing.earliestTime = time;
        }
      }
    }
  });

  return Array.from(catTimeMap.values())
    .sort((a, b) => a.earliestTime - b.earliestTime)
    .map(item => item.name);
};

export const syncUserCustomCategories = (userIdOrEmail, notes) => {
  if (!userIdOrEmail) return [];
  try {
    const sortedCustom = getSortedCustomCategories(notes);
    localStorage.setItem(`notiva_categories_${userIdOrEmail}`, JSON.stringify(sortedCustom));
    return sortedCustom;
  } catch {
    return [];
  }
};

export const removeUserCustomCategories = (userIdOrEmail) => {
  if (!userIdOrEmail) return;
  try {
    localStorage.removeItem(`notiva_categories_${userIdOrEmail}`);
  } catch {
    // ignore
  }
};

export default BASE_URL;

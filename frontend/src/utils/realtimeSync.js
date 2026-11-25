/**
 * Real-Time Monitoring & Cross-Tab/Cross-Panel Synchronization Service
 * 
 * Provides instant real-time auto-fetch coordination across all browser tabs
 * and panels (User Notes Dashboard, Admin Panel, Profile Modals) before any page refresh.
 */

const SYNC_CHANNEL_NAME = 'notiva_realtime_sync_channel';
const STORAGE_EVENT_KEY = 'notiva_realtime_sync_event';

let broadcastChannel = null;

try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    }
} catch {
    broadcastChannel = null;
}

/**
 * Broadcast an instant real-time event to all active panels and tabs
 * @param {string} type - Event identifier (e.g. 'NOTES_CHANGED', 'USERS_CHANGED', 'STATS_CHANGED')
 * @param {object} payload - Optional event metadata
 */
export const broadcastRealtimeUpdate = (type, payload = {}) => {
    try {
        const message = {
            type,
            payload,
            timestamp: Date.now(),
        };

        if (broadcastChannel) {
            broadcastChannel.postMessage(message);
        }

        // Cross-tab fallback via storage event
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(message));
        }
    } catch {
        // Silently handle any storage/channel boundary errors
    }
};

/**
 * Subscribe to real-time auto-fetch updates
 * @param {Function} onUpdate - Callback invoked when a real-time event is received
 * @returns {Function} Cleanup/unsubscribe handler
 */
export const subscribeToRealtimeUpdates = (onUpdate) => {
    if (typeof window === 'undefined') return () => {};

    const handleMessage = (event) => {
        if (event && event.data) {
            onUpdate(event.data);
        }
    };

    const handleStorage = (event) => {
        if (event.key === STORAGE_EVENT_KEY && event.newValue) {
            try {
                const parsed = JSON.parse(event.newValue);
                onUpdate(parsed);
            } catch {
                // Ignore parse errors
            }
        }
    };

    if (broadcastChannel) {
        broadcastChannel.addEventListener('message', handleMessage);
    }
    window.addEventListener('storage', handleStorage);

    return () => {
        if (broadcastChannel) {
            broadcastChannel.removeEventListener('message', handleMessage);
        }
        window.removeEventListener('storage', handleStorage);
    };
};

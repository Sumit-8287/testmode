import { create } from 'zustand';

interface AuthState {
    student: any;
    isAuthenticated: boolean;
    isLoading: boolean;
    unreadNotificationsCount: number;
    setAuth: (student: any) => void;
    clearAuth: () => void;
    checkAuth: () => Promise<void>;
    setUnreadCount: (count: number) => void;
}

// Read localStorage SYNCHRONOUSLY so the app renders instantly (no black screen, no delay)
const _cached = (() => {
    try {
        const isAuth = localStorage.getItem('isStudentAuthenticated') === 'true';
        const raw = localStorage.getItem('studentData');
        const student = isAuth && raw ? JSON.parse(raw) : null;
        return { student, isAuthenticated: !!(isAuth && student), isLoading: false };
    } catch {
        return { student: null, isAuthenticated: false, isLoading: false };
    }
})();

export const useAuthStore = create<AuthState>((set) => ({
    ..._cached,
    unreadNotificationsCount: 0,
    setAuth: (student) => {
        if (!student) {
            localStorage.removeItem('isStudentAuthenticated');
            localStorage.removeItem('studentData');
            localStorage.removeItem('studentSessionToken');
            set({ student: null, isAuthenticated: false, isLoading: false });
        } else {
            localStorage.setItem('isStudentAuthenticated', 'true');
            localStorage.setItem('studentData', JSON.stringify(student));
            if (student.sessionToken) {
                localStorage.setItem('studentSessionToken', student.sessionToken);
            }
            set({ student, isAuthenticated: true, isLoading: false });
        }
    },
    clearAuth: async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
        } catch (e) { }
        localStorage.removeItem('isStudentAuthenticated');
        localStorage.removeItem('studentData');
        localStorage.removeItem('studentSessionToken');
        set({ student: null, isAuthenticated: false });
    },
    checkAuth: async () => {
        try {
            const response = await fetch('/api/me');
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('isStudentAuthenticated', 'true');
                localStorage.setItem('studentData', JSON.stringify(data.student));
                // Note: /api/me doesn't return the token normally, but if it exists in cookies, 
                // the backend validates it. Legacy components just need it to NOT be empty to avoid redirecting.
                if (!localStorage.getItem('studentSessionToken')) {
                    localStorage.setItem('studentSessionToken', 'legacy-cookie-session');
                }
                set({ student: data.student, isAuthenticated: true, isLoading: false });
            } else {
                localStorage.removeItem('isStudentAuthenticated');
                localStorage.removeItem('studentData');
                localStorage.removeItem('studentSessionToken');
                set({ student: null, isAuthenticated: false, isLoading: false });
            }
        } catch {
            // On network error keep existing localStorage-derived state, just clear loading
            set((s) => ({ ...s, isLoading: false }));
        }
    },
    setUnreadCount: (count: number) => set({ unreadNotificationsCount: count })
}));

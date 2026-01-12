import axios from 'axios';

// Export API_URL for direct usage if needed (though api instance is preferred)
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear token and redirect to login if unauthorized
            localStorage.removeItem('auth_token');
            // Only redirect if not already on admin page (to avoid loops)
            if (!window.location.hash.includes('/admin')) {
                window.location.href = '/#/admin';
            }
        }
        return Promise.reject(error);
    }
);

// Auth services
export const authService = {
    requestOtp: (email: string) => api.post('/auth/request-otp', { email }),
    verifyOtp: (email: string, otp: string) => api.post('/auth/verify-otp', { email, otp }),
    verifyToken: () => api.get('/auth/verify'),
};

// Content services
export const contentService = {
    get: (pageType: string) => api.get(`/content/${pageType}`),
    update: (pageType: string, content: any) => api.put(`/content/${pageType}`, { content }),
};

// Teacher services
export const teacherService = {
    getAll: () => api.get('/teachers'),
    create: (data: any) => api.post('/teachers', data),
    update: (id: number, data: any) => api.put(`/teachers/${id}`, data),
    delete: (id: number) => api.delete(`/teachers/${id}`),
};

// Class services
export const classService = {
    getAll: () => api.get('/classes'),
    create: (data: any) => api.post('/classes', data),
    update: (id: number, data: any) => api.put(`/classes/${id}`, data),
    delete: (id: number) => api.delete(`/classes/${id}`),
};

// Form services
export const formService = {
    getAll: () => api.get('/forms'),
    getBySlug: (slug: string) => api.get(`/forms/slug/${slug}`),
    getById: (id: string) => api.get(`/forms/${id}`),
    create: (data: any) => api.post('/forms', data),
    update: (id: string, data: any) => api.put(`/forms/${id}`, data),
    delete: (id: string) => api.delete(`/forms/${id}`),
    submit: (id: string, data: any) => api.post(`/forms/${id}/submit`, { data }),
    getSubmissions: (id: string) => api.get(`/forms/${id}/submissions`),
    updateSubmissionStatus: (id: number, status: string) => api.put(`/forms/submissions/${id}`, { status }),
};

// Menu services
export const menuService = {
    getAll: () => api.get('/menu'),
    updateDay: (day: string, data: any) => api.put(`/menu/${day}`, data),
    updateBulk: (menu: any) => api.post('/menu/bulk', { menu }),
};

// Schedule services
export const scheduleService = {
    getAll: () => api.get('/schedule'),
    create: (data: any) => api.post('/schedule', data),
    update: (id: number, data: any) => api.put(`/schedule/${id}`, data),
    delete: (id: number) => api.delete(`/schedule/${id}`),
    updateBulk: (schedule: any[]) => api.post('/schedule/bulk', { schedule }),
};

// Document services
export const documentService = {
    getAll: () => api.get('/documents'),
    create: (data: any) => api.post('/documents', data),
    update: (id: string, data: any) => api.put(`/documents/${id}`, data),
    delete: (id: string) => api.delete(`/documents/${id}`),
};

// Settings services
export const settingsService = {
    get: () => api.get('/settings'),
    update: (data: any) => api.put('/settings', data),
    testEmail: (email: string) => api.post('/settings/test-email', { email }),
};

// Meeting services (Appointments)
export const meetingService = {
    getAllForms: () => api.get('/meetings/forms'),
    getForm: (id: number) => api.get(`/meetings/forms/${id}`),
    createForm: (data: any) => api.post('/meetings/forms', data),
    updateForm: (id: number, data: any) => api.put(`/meetings/forms/${id}`, data),
    deleteForm: (id: number) => api.delete(`/meetings/forms/${id}`),

    getAllRequests: () => api.get('/meetings/requests'),
    createRequest: (data: any) => api.post('/meetings/requests', data),
    updateRequestStatus: (id: number, status: string) => api.put(`/meetings/requests/${id}`, { status }),
    deleteRequest: (id: number) => api.delete(`/meetings/requests/${id}`)
};


export default api;

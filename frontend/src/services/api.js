import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// User APIs
export const createUser = (userData) => api.post('/users/', userData);
export const getUsers = () => api.get('/users/');
export const getUser = (userId) => api.get(`/users/${userId}`);

// Cohort APIs
export const createCohort = (cohortData) => api.post('/cohorts/', cohortData);
export const getCohorts = () => api.get('/cohorts/');
export const getCohort = (cohortId) => api.get(`/cohorts/${cohortId}`);
export const uploadCohortPdf = (cohortId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/cohorts/${cohortId}/upload-pdf`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

// Cohort Member APIs
export const addCohortMember = (memberData) => api.post('/cohort-members/', memberData);
export const getUserCohorts = (userId) => api.get(`/cohort-members/user/${userId}`);
export const getCohortMembers = (cohortId) => api.get(`/cohort-members/cohort/${cohortId}`);

// Private Notes APIs
export const createPrivateNote = (noteData) => api.post('/private-notes/', noteData);
export const getPrivateNotes = (userId, cohortId) =>
    api.get(`/private-notes/user/${userId}/cohort/${cohortId}`);

// Public Notes APIs
export const createPublicNote = (noteData) => api.post('/public-notes/', noteData);
export const getPublicNotes = (cohortId) => api.get(`/public-notes/cohort/${cohortId}`);

// Chat Messages APIs
export const createChatMessage = (messageData) => api.post('/chat-messages/', messageData);
export const getChatMessages = (cohortId) => api.get(`/chat-messages/cohort/${cohortId}`);

// Admin APIs
export const getAdminStats = (userId) => api.get(`/admin/stats?user_id=${userId}`);
export const getCohortActivity = (cohortId, userId) =>
    api.get(`/admin/cohorts/${cohortId}/activity?user_id=${userId}`);

export default api;
/**
 * Axios API Service Client for Email-to-Workflow Backend.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new Error(message));
  }
);

// -------------------------------------------------------------
// Auth & Mailbox Sync API
// -------------------------------------------------------------
export const loginUser = (payload) => apiClient.post('/auth/login', payload);
export const connectRealEmail = (payload) => apiClient.post('/auth/connect-real-email', payload);
export const testImapCredentials = (payload) => apiClient.post('/auth/test-imap', payload);
export const getCurrentUser = () => apiClient.get('/auth/me');
export const getSyncStatus = () => apiClient.get('/auth/sync-status');
export const triggerSyncNow = () => apiClient.post('/auth/trigger-sync');
export const toggleBackgroundSync = () => apiClient.post('/auth/toggle-sync');

// -------------------------------------------------------------
// Emails API
// -------------------------------------------------------------
export const getEmails = (params) => apiClient.get('/emails', { params });
export const getEmailById = (id) => apiClient.get(`/emails/${id}`);
export const processEmailWorkflow = (id, forceRestart = false) => 
  apiClient.post(`/emails/${id}/process${forceRestart ? '?force_restart=true' : ''}`);

export const updateEmailFlags = (id, flags) => apiClient.patch(`/emails/${id}`, flags);
export const deleteEmail = (id) => apiClient.delete(`/emails/${id}`);
export const importRawEmail = (payload) => apiClient.post('/emails/import-raw', payload);
export const simulateEmail = (payload) => apiClient.post('/emails/simulate', payload);
export const getSimulationPresets = () => apiClient.get('/emails/presets');
export const autoTriageAllEmails = () => apiClient.post('/emails/auto-triage-all');
export const autoIngestRandomEmail = () => apiClient.post('/emails/auto-ingest-random');

// -------------------------------------------------------------
// Tasks API (Kanban)
// -------------------------------------------------------------
export const getTasks = (params) => apiClient.get('/tasks', { params });
export const getTaskById = (id) => apiClient.get(`/tasks/${id}`);
export const createTask = (payload) => apiClient.post('/tasks', payload);
export const updateTask = (id, payload) => apiClient.patch(`/tasks/${id}`, payload);
export const deleteTask = (id) => apiClient.delete(`/tasks/${id}`);

// -------------------------------------------------------------
// Workflows API (LangGraph)
// -------------------------------------------------------------
export const getWorkflows = (params) => apiClient.get('/workflows', { params });
export const getWorkflowById = (id) => apiClient.get(`/workflows/${id}`);
export const approveWorkflow = (id, payload) => apiClient.post(`/workflows/${id}/approve`, payload);
export const rejectWorkflow = (id, payload) => apiClient.post(`/workflows/${id}/reject`, payload);
export const refineWorkflowDraft = (id, payload) => apiClient.post(`/workflows/${id}/refine-draft`, payload);


// -------------------------------------------------------------
// Calendar API
// -------------------------------------------------------------
export const getCalendarEvents = (params) => apiClient.get('/calendar/events', { params });
export const createCalendarEvent = (payload) => apiClient.post('/calendar/events', payload);
export const updateCalendarEvent = (id, payload) => apiClient.patch(`/calendar/events/${id}`, payload);
export const deleteCalendarEvent = (id) => apiClient.delete(`/calendar/events/${id}`);

// -------------------------------------------------------------
// Notifications API
// -------------------------------------------------------------
export const getNotifications = () => apiClient.get('/notifications');
export const markNotificationRead = (id) => apiClient.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => apiClient.post('/notifications/mark-all-read');

// -------------------------------------------------------------
// Analytics & Reporting API
// -------------------------------------------------------------
export const getDashboardSummary = () => apiClient.get('/analytics/dashboard-summary');
export const getExecutiveReportData = () => apiClient.get('/analytics/export/report-data');
export const getCsvExportUrl = (type = 'tasks') => `${API_BASE_URL}/analytics/export/csv?type=${type}`;

// -------------------------------------------------------------
// Settings API
// -------------------------------------------------------------
export const getSettings = () => apiClient.get('/settings');
export const updateSettings = (payload) => apiClient.post('/settings', payload);
export const testLLMConnection = (payload) => apiClient.post('/settings/test-llm', payload);
export const purgeWorkspaceData = () => apiClient.post('/settings/purge-data');


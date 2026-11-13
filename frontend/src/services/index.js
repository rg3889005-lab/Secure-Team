import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendVerification: (data) => api.post('/auth/resend-verification', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (credential) => api.post('/auth/google', { credential }),
  facebookLogin: (data) => api.post('/auth/facebook', data),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
};

export const userService = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.patch('/users/me', data),
  changePassword: (data) => api.patch('/users/me/password', data),
  searchUsers: (params) => api.get('/users/search', { params }),
  getPublicProfile: (userId) => api.get(`/users/${userId}/public-profile`),
};

export const projectService = {
  getProjects: (params) => api.get('/projects', { params }),
  getMyProjects: (params) => api.get('/projects/my', { params }),
  getDiscoverProjects: (params) => api.get('/projects/discover', { params }),
  createProject: (data) => api.post('/projects', data),
  getProject: (id) => api.get(`/projects/${id}`),
  updateProject: (id, data) => api.patch(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  getMembers: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  updateMemberRole: (id, userId, role) => api.patch(`/projects/${id}/members/${userId}/role`, { role }),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  getProjectMessages: (id, params) => api.get(`/projects/${id}/messages`, { params }),
  sendProjectMessage: (id, data) => api.post(`/projects/${id}/messages`, data),
  sendInvitation: (id, data) => api.post(`/projects/${id}/invitations`, data),
  getProjectInvitations: (id) => api.get(`/projects/${id}/invitations`),
};

export const invitationService = {
  getMyInvitations: () => api.get('/invitations/my'),
  acceptInvitation: (id, data) => api.post(`/invitations/${id}/accept`, data),
  rejectInvitation: (id) => api.post(`/invitations/${id}/reject`),
  cancelInvitation: (id) => api.delete(`/invitations/${id}`),
};

export const taskService = {
  getTasks: (params) => api.get('/tasks', { params }),
  createTask: (data) => api.post('/tasks', data),
  getTask: (id) => api.get(`/tasks/${id}`),
  updateTask: (id, data) => api.patch(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  addComment: (id, content) => api.post(`/tasks/${id}/comments`, { content }),
};

export const chatService = {
  getConversations: () => api.get('/conversations'),
  createConversation: (data) => api.post('/conversations', data),
  getMessages: (id, params) => api.get(`/conversations/${id}/messages`, { params }),
  sendMessage: (id, data) => api.post(`/conversations/${id}/messages`, data),
  markAsRead: (id) => api.patch(`/conversations/${id}/read`),
  getUnreadCount: (id) => api.get(`/conversations/${id}/unread`),
};

export const fileService = {
  uploadFile: (formData) => api.post('/files', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getFiles: (params) => api.get('/files', { params }),
  downloadFile: (id) => api.get(`/files/${id}`, { responseType: 'blob' }),
  deleteFile: (id) => api.delete(`/files/${id}`),
};

export const notificationService = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  changeUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  suspendUser: (id, reason) => api.patch(`/admin/users/${id}/suspend`, { reason }),
  activateUser: (id) => api.patch(`/admin/users/${id}/activate`),
  getProjects: (params) => api.get('/admin/projects', { params }),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getAnalytics: () => api.get('/admin/analytics'),
  sendAnnouncement: (data) => api.post('/admin/notifications/announce', data),
};

import { get, post, del } from './api';

export const getNotifications = (params = {}) => {
  const query = new URLSearchParams();
  if (params.read !== undefined) query.set('read', params.read);
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  const qs = query.toString();
  return get(`/notifications${qs ? `?${qs}` : ''}`);
};

export const getUnreadCount = () => get('/notifications/unread-count');

export const markAsRead = (id) => post(`/notifications/${id}/mark-read`);

export const markAllAsRead = () => post('/notifications/mark-all-read');

export const deleteNotification = (id) => del(`/notifications/${id}`);

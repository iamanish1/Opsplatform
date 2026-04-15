import { get, post, patch } from './api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const companyLogin = async (email, password) => {
  const res = await fetch(`${API_BASE}/company/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error?.message || 'Login failed');
  return data; // { token, user }
};

export const companySignup = async (payload) => {
  const res = await fetch(`${API_BASE}/company/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error?.message || 'Signup failed');
  return data;
};

// ─── Talent Feed ─────────────────────────────────────────────────────────────

export const getTalentFeed = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.badge) params.set('badge', filters.badge);
  if (filters.minScore !== undefined) params.set('minScore', filters.minScore);
  if (filters.maxScore !== undefined) params.set('maxScore', filters.maxScore);
  if (filters.skills?.length) params.set('skills', filters.skills.join(','));
  if (filters.country) params.set('country', filters.country);
  if (filters.githubUsername) params.set('githubUsername', filters.githubUsername);
  if (filters.page) params.set('page', filters.page);
  if (filters.limit) params.set('limit', filters.limit);

  const query = params.toString();
  return get(`/company/talent-feed${query ? `?${query}` : ''}`);
};

// ─── Interview Requests ───────────────────────────────────────────────────────

export const createInterviewRequest = (payload) => post('/interview-requests', payload);

export const getInterviewRequests = (status) =>
  get(`/interview-requests${status ? `?status=${status}` : ''}`);

export const cancelInterviewRequest = (id) => post(`/interview-requests/${id}/cancel`);

export const completeInterviewRequest = (id) => post(`/interview-requests/${id}/complete`);

// ─── Company Profile ──────────────────────────────────────────────────────────

export const getCompanyProfile = () => get('/company/profile');

export const updateCompanyProfile = (data) => patch('/company/profile', data);

// ─── Public leaderboard (no auth) ────────────────────────────────────────────

export const getLeaderboard = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.skills?.length) params.set('skills', filters.skills.join(','));
  if (filters.badge) params.set('badge', filters.badge);
  if (filters.limit) params.set('limit', filters.limit);
  const query = params.toString();
  // Uses talent feed as leaderboard source — open to companies; for public we call the same
  return get(`/company/talent-feed?${query}`);
};

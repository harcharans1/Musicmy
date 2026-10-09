import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aiforge_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data) => api.post("/auth/reset-password", data),
};

export const toolApi = {
  list: (params) => api.get("/tools", { params }),
  get: (slug) => api.get(`/tools/${slug}`),
};

export const aiApi = {
  generate: (data) => api.post("/ai/generate", data),
  image: (data) => api.post("/ai/image", data),
  summarize: (data) => api.post("/ai/summarize", data),
  translate: (data) => api.post("/ai/translate", data),
  pdfSummarize: (formData) => api.post("/ai/pdf-summarize", formData, { headers: { "Content-Type": "multipart/form-data" } }),
};

export const userApi = {
  dashboard: () => api.get("/user/dashboard"),
  profile: () => api.get("/user/profile"),
  history: () => api.get("/user/history"),
  deleteHistory: (id) => api.delete(`/user/history/${id}`),
  favorites: () => api.get("/user/favorites"),
  addFavorite: (generationId) => api.post("/user/favorites", { generationId }),
  removeFavorite: (id) => api.delete(`/user/favorites/${id}`),
  usage: () => api.get("/user/usage"),
  updateProfile: (data) => api.put("/user/profile", data),
};

export const savedOutputApi = {
  save: (data) => api.post("/saved-outputs", data),
  list: () => api.get("/saved-outputs"),
  delete: (id) => api.delete(`/saved-outputs/${id}`),
};

export const paymentApi = {
  config: () => api.get("/payment/config"),
  submitRequest: (data) => api.post("/payment/request", data),
  myRequests: () => api.get("/payment/my-requests"),
};

export const adminPaymentApi = {
  list: (status = "pending") =>
    api.get("/payment/admin/requests", { params: { status } }),
  approve: (id) => api.post(`/payment/admin/requests/${id}/approve`),
  reject: (id, reason) =>
    api.post(`/payment/admin/requests/${id}/reject`, { reason }),
};

export const contentApi = {
  faqs: () => api.get("/content/faqs"),
  blog: () => api.get("/content/blog"),
  blogPost: (slug) => api.get(`/content/blog/${slug}`),
  contact: (data) => api.post("/content/contact", data),
};

export const adminApi = {
  dashboard: () => api.get("/admin/dashboard"),
  users: () => api.get("/admin/users"),
  revenue: () => api.get("/admin/revenue"),
  usage: () => api.get("/admin/usage"),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
};

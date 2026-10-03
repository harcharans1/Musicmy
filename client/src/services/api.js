import axios from "axios";

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("aiforge_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/* =========================
   AUTH API
========================= */

export const authApi = {
  register: (data) =>
    api.post("/auth/register", data),

  login: (data) =>
    api.post("/auth/login", data),

  me: () =>
    api.get("/auth/me"),

  logout: () =>
    api.post("/auth/logout"),
};

/* =========================
   TOOLS API
========================= */

export const toolApi = {
  list: (params) =>
    api.get("/tools", {
      params,
    }),

  get: (slug) =>
    api.get(`/tools/${slug}`),
};

/* =========================
   AI API
========================= */

export const aiApi = {
  generate: (data) =>
    api.post("/ai/generate", data),

  image: (data) =>
    api.post("/ai/image", data),

  summarize: (data) =>
    api.post("/ai/summarize", data),

  translate: (data) =>
    api.post("/ai/translate", data),
};
/* =========================
   SAVED OUTPUTS API
========================= */

export const savedOutputApi = {
  save: (data) =>
    api.post("/saved-outputs", data),

  list: () =>
    api.get("/saved-outputs"),

  delete: (id) =>
    api.delete(`/saved-outputs/${id}`),
};
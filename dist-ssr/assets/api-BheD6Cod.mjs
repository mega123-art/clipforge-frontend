import axios from "axios";
const api = axios.create({
  baseURL: "http://localhost:8000"
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (err) => {
    var _a;
    if (((_a = err.response) == null ? void 0 : _a.status) === 401) {
      const hadToken = !!localStorage.getItem("auth_token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      const path = window.location.pathname;
      if (hadToken && !path.startsWith("/signin") && !path.startsWith("/signup")) {
        try {
          sessionStorage.setItem(
            "post_login_redirect",
            path + window.location.search
          );
        } catch {
        }
        window.location.href = "/signin";
      }
    }
    return Promise.reject(err);
  }
);
export {
  api as default
};

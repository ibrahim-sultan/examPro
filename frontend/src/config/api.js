// Prefer env, otherwise default to deployed backend in production; use same-origin in dev.
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://exampro-ysox.onrender.com'
    : '');

export default API_BASE_URL;

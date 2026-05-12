// Prefer env, otherwise default to deployed backend in production; use localhost backend in dev.
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://exampro-ysox.onrender.com'
    : 'http://localhost:5000');

export default API_BASE_URL;

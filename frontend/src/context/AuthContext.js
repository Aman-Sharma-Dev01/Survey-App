// Re-export the JSX implementation from a .jsx file.
// This module intentionally contains no JSX so Vite's import analysis won't
// attempt to parse JSX in a .js file.
export { AuthProvider, useAuth, default as AuthContext } from './AuthContext.jsx';

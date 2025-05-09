import session from 'express-session';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// Session middleware setup (should be used in server.js)
export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'changeme',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
});

// Authentication middleware
export function authRequired(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
}

export function superadminRequired(req, res, next) {
  if (req.user?.role === 'superadmin') return next();
  res.status(403).json({ error: 'Superadmin only' });
}

// Login handler (to be used in server.js)
export async function handleLogin(req, res) {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  req.session.user = { _id: user._id, name: user.name, role: user.role, username: user.username };
  res.json({ name: user.name, role: user.role, username: user.username });
}

// Logout handler
export function handleLogout(req, res) {
  req.session.destroy(() => {
    res.json({ success: true });
  });
}

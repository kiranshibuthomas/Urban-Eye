const adminAuth = (req, res, next) => {
  // Check if user is authenticated (auth middleware should run first)
  if (!req.user) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }

  next();
};

module.exports = adminAuth;
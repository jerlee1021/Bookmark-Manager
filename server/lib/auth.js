import jwt from 'jsonwebtoken';

export const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: TOKEN_TTL_MS, // 7 days
};

//Gatekeep + identify the user
export const issueAuthCookie = (res, userId) => {
  const token = jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: '7d'});
  res.cookie('token', token, COOKIE_OPTIONS);
  return token;
}

export const requireAuth = (req, res, next) => {
  const token = req.cookies.token;
  if(!token) {
    return res.status(401).json({error: 'Authentication required'});
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
    req.userId = decoded.userId;
  } catch (error) {
    return res.status(401).json({error: 'Invalid token'});
  }
  next();
}


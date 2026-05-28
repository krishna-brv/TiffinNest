import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      if (req.user.isBlocked) {
        return res.status(403).json({ message: 'Your account has been blocked by admin' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const provider = (req, res, next) => {
  if (req.user && req.user.role === 'provider') {
    if (req.user.providerApprovalStatus === 'rejected') {
      return res.status(403).json({ message: 'Your provider account was rejected by admin' });
    }

    if (req.user.providerApprovalStatus !== 'approved') {
      return res.status(403).json({ message: 'Your provider account is waiting for admin approval' });
    }

    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a provider' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

export const customerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'customer') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a customer' });
  }
};

export const verifyToken = protect;
export const verifyAdmin = admin;

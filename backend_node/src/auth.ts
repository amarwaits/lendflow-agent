import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const SECRET = process.env.ADMIN_JWT_SECRET!;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME!;

export function createToken(username: string): string {
  return jwt.sign({ sub: username }, SECRET, { algorithm: 'HS256', expiresIn: '10h' });
}

export interface AuthenticatedRequest extends Request {
  adminUser: string;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ detail: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7);
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
  } catch {
    res.status(401).json({ detail: 'Invalid or expired token' });
    return;
  }

  if (payload.sub !== ADMIN_USERNAME) {
    res.status(401).json({ detail: 'Unauthorized admin' });
    return;
  }

  (req as AuthenticatedRequest).adminUser = payload.sub as string;
  next();
}

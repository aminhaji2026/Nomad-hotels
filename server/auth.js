import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import jwt from 'jsonwebtoken'

const JWT_SECRET =
  process.env.JWT_SECRET || process.env.AUTH_SECRET || 'nomadstay-dev-secret-change-me'
const TOKEN_TTL = process.env.JWT_TTL || '7d'

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(String(password), salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false
  const [salt, hash] = stored.split(':')
  const next = scryptSync(String(password), salt, 64)
  const prev = Buffer.from(hash, 'hex')
  if (prev.length !== next.length) return false
  return timingSafeEqual(prev, next)
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      stayIds: user.stayIds || [],
    },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL },
  )
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'customer',
    points: user.points || 0,
    referralCode: user.referralCode,
    referredBy: user.referredBy || null,
    stayIds: user.stayIds || [],
    phone: user.phone || '',
    status: user.status || 'ACTIVE',
    createdAt: user.createdAt,
  }
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Authentication required' })
  try {
    req.auth = verifyToken(token)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: 'Authentication required' })
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'You do not have access to this area' })
    }
    next()
  }
}

export function fingerprint(input) {
  return createHash('sha256').update(String(input)).digest('hex').slice(0, 16)
}

import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data')
const DB_PATH = path.join(DATA_DIR, 'nomadstay.json')

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function emptyDb() {
  return {
    users: [],
    stays: [],
    bookings: [],
    ledger: [],
    referrals: [],
  }
}

export function loadDb() {
  ensureDir(DATA_DIR)
  if (!fs.existsSync(DB_PATH)) {
    const db = emptyDb()
    saveDb(db)
    return db
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
}

export function saveDb(db) {
  ensureDir(DATA_DIR)
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

export function uid(prefix = '') {
  return `${prefix}${randomUUID().slice(0, 8)}`
}

export function makeReferralCode(name = 'NS') {
  const base = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'NS'
  return `${base}${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export { DATA_DIR, DB_PATH }

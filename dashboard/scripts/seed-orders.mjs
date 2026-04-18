#!/usr/bin/env node
/**
 * Targeted orders seed — reads live business/service/user IDs from DB,
 * then inserts properly-shaped order rows (matching the Spring Boot Order entity).
 *
 * Run from /dashboard:
 *   node scripts/seed-orders.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

// ── Env ──────────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url))
function loadEnv(p) {
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
  }
}
loadEnv(path.resolve(__dirname, '../.env.local'))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Helpers ───────────────────────────────────────────────────────────────────
const rnd  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

function randomDate(daysAgo) {
  const now = Date.now()
  return new Date(now - Math.random() * daysAgo * 86_400_000)
}

// Prices indexed by service name prefix (fallback 500 if not found)
const PRICE_MAP = {
  'Dine-in':        850,  'Takeaway':        550,  'Family Meal':    2400,
  'Regular Order':  380,  'Large Order':     650,  'Meeting':        1200,
  'Basic Haircut':  600,  'Hair Color':     3800,  'Full Facial':    2000,  'Mani-Pedi':      1400,
  'General Consult':900,  'Specialist':     2800,  'Lab Test':       1600,
  'Prescription':   480,  'OTC Purchase':   320,   'Health Suppl':   1200,
  'Haircut':        350,  'Beard':          250,   'Full Grooming':  700,
  'Measurements':   0,    'Shalwar':        1400,  'Suit':           4000,
  'Custom Cake':   2800,  'Party Platter':  1800,  'Bakery':         450,
  'Day Pass':       500,  'Monthly Member': 5000,  'PT Session':     1800,
  'Routine Check':  700,  'Scaling':        1800,  'Filling':        2200,
  'Initial Consult':3500, 'Document Prep':  6000,
  'Oil Change':    1800,  'Full Service':   6500,  'Tyre':           1000,
  'Product Purch': 9500,  'Device Repair':  1800,
  'Eye Exam':       600,  'Spectacles':     5000,  'Contact Lens':   2200,
  'Pet Consult':    800,  'Vaccination':    1200,
  'Portrait':      3500,  'Event Cover':   15000,
  'Screen Repl':   2500,  'Battery Repl':  1200,  'Software Fix':   800,
  'Local Delivery': 250,  'Nationwide':     500,
  'Room Booking':  6000,  'Conference':     8000,
  'General Purch':  650,  'Grocery':       1200,
  'Air Ticket':     600,  'Tour Package': 45000,
  'Policy Consult': 0,    'Claim Process':  0,
  'Property View':  0,    'Buy/Sell':      50000,
  'Forex':          200,  'Account Serv':   0,
  'Standard Serv':  600,  'Premium Serv':  1400,  'Express Serv':   900,
}

function priceForService(name) {
  for (const [prefix, price] of Object.entries(PRICE_MAP)) {
    if (name.startsWith(prefix)) return price
  }
  return 500
}

// ── Fetch live data ───────────────────────────────────────────────────────────
async function fetchData() {
  const [{ data: bizRows }, { data: svcRows }, { data: userRows }] = await Promise.all([
    supabase.from('businesses').select('id, business_name, business_type').eq('is_active', true),
    supabase.from('services').select('id, business_id, name').eq('is_active', true),
    supabase.from('users').select('id, full_name, email, phone_number'),
  ])

  const businesses = bizRows ?? []
  const services   = svcRows  ?? []
  const users      = userRows ?? []

  // Build map: businessId → [services]
  const servicesByBiz = {}
  for (const s of services) {
    if (!servicesByBiz[s.business_id]) servicesByBiz[s.business_id] = []
    servicesByBiz[s.business_id].push(s)
  }

  console.log(`  Loaded: ${businesses.length} businesses, ${services.length} services, ${users.length} users`)
  return { businesses, servicesByBiz, users }
}

// ── Build order rows ──────────────────────────────────────────────────────────
const ANON_NAMES = ['Walk-in Customer', 'Counter Customer', 'Phone Customer', 'Anonymous Guest']

function buildOrders(businesses, servicesByBiz, users) {
  const orderRows = []
  let counter = 1

  // ── Authenticated users (3–8 businesses each, 1–3 visits each) ──────────
  for (const user of users) {
    const bizSample = [...businesses].sort(() => Math.random() - 0.5).slice(0, rnd(3, 8))
    for (const biz of bizSample) {
      const svcs = servicesByBiz[biz.id] ?? []
      if (!svcs.length) continue
      const visits = rnd(1, 3)
      for (let v = 0; v < visits; v++) {
        const svc   = pick(svcs)
        const price = priceForService(svc.name)
        if (price === 0) continue   // skip free consultations from revenue calcs

        const date    = randomDate(90)
        const dayCode = date.toISOString().slice(0, 10).replace(/-/g, '')
        const qty     = rnd(1, 2)
        const items   = [{ name: svc.name, quantity: qty, price }]
        const total   = price * qty

        orderRows.push({
          business_id:    biz.id,
          customer_id:    user.id,
          order_number:   `ORD-${dayCode}-${String(counter++).padStart(5, '0')}`,
          service_type:   svc.name,
          customer_name:  user.full_name,
          customer_phone: user.phone_number,
          customer_email: user.email,
          items:          JSON.stringify(items),
          description:    `${svc.name} — queue order`,
          notes:          'Generated via seed script',
          total_amount:   total,
          paid_amount:    total,
          payment_status: 'paid',
          status:         'completed',
          created_at:     date.toISOString(),
        })
      }
    }
  }

  // ── Anonymous walk-in orders (20–50 per business) ────────────────────────
  for (const biz of businesses) {
    const svcs = servicesByBiz[biz.id] ?? []
    if (!svcs.length) continue
    const count = rnd(20, 50)

    for (let a = 0; a < count; a++) {
      const svc   = pick(svcs)
      const price = priceForService(svc.name)
      if (price === 0) continue

      const date     = randomDate(90)
      const dayCode  = date.toISOString().slice(0, 10).replace(/-/g, '')
      const qty      = 1
      const items    = [{ name: svc.name, quantity: qty, price }]
      const total    = price * qty
      const anonPhone = `03${rnd(10, 49)}${String(rnd(1_000_000, 9_999_999))}`

      orderRows.push({
        business_id:    biz.id,
        customer_id:    null,
        order_number:   `ORD-${dayCode}-${String(counter++).padStart(5, '0')}`,
        service_type:   svc.name,
        customer_name:  pick(ANON_NAMES),
        customer_phone: anonPhone,
        customer_email: null,
        items:          JSON.stringify(items),
        description:    `Walk-in: ${svc.name}`,
        notes:          'Walk-in customer',
        total_amount:   total,
        paid_amount:    total,
        payment_status: 'paid',
        status:         'completed',
        created_at:     date.toISOString(),
      })
    }
  }

  return orderRows
}

// ── Insert in batches ─────────────────────────────────────────────────────────
async function insertBatches(rows, batchSize = 200) {
  let inserted = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error } = await supabase.from('orders').insert(batch)
    if (error) {
      console.warn(`  ⚠  Batch @${i}: ${error.message}`)
    } else {
      inserted += batch.length
      process.stdout.write('.')
    }
  }
  console.log()
  return inserted
}

// ── Revenue sanity check ──────────────────────────────────────────────────────
async function revenueCheck() {
  const { data } = await supabase
    .from('orders')
    .select('business_id, total_amount')
    .eq('status', 'completed')
  if (!data) return
  const totals = {}
  for (const r of data) {
    totals[r.business_id] = (totals[r.business_id] ?? 0) + Number(r.total_amount)
  }
  const values = Object.values(totals).sort((a, b) => b - a)
  const top5   = values.slice(0, 5).map((v) => `Rs. ${v.toLocaleString()}`).join('  ')
  console.log(`\n  Top-5 business revenues: ${top5}`)
  console.log(`  Total platform order revenue: Rs. ${values.reduce((s, v) => s + v, 0).toLocaleString()}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║   Orders Seed (targeted fix)                                 ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  const { businesses, servicesByBiz, users } = await fetchData()

  console.log('\n  Building order rows...')
  const rows = buildOrders(businesses, servicesByBiz, users)
  console.log(`  Generated ${rows.length} order rows — inserting...\n`)

  const inserted = await insertBatches(rows)
  console.log(`\n  ✓  ${inserted} / ${rows.length} orders inserted`)

  await revenueCheck()
  console.log('\n  Done.\n')
}

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1) })

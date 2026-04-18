#!/usr/bin/env node
/**
 * seed-queue-payments.mjs
 *
 * Updates every existing queue entry with realistic pricing data:
 *   - unit_price  : based on service name (falls back to random 300–2000)
 *   - quantity    : 1–3
 *   - total_price : unit_price × quantity
 *   - advance_paid: 0 / partial (30–70 %) / full — distributed across scenarios
 *   - payment_left: total_price − advance_paid
 *
 * Run from /dashboard:
 *   node scripts/seed-queue-payments.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync }  from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

// ── Env ───────────────────────────────────────────────────────────────────────
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
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a

// Price lookup by service name prefix (Rs.)
const PRICE_MAP = {
  'General Inquiry':      500,
  'Document Submission':  800,
  'Payment & Billing':    600,
  'Appointment Booking':  1200,
  'Customer Support':     700,
  'Product Consultation': 1500,
  'Express Service':      900,
  'Premium Assistance':   2500,
  'Dine-in':              850,
  'Takeaway':             550,
  'Family Meal':          2400,
  'Regular Order':        380,
  'Large Order':          650,
  'Meeting':              1200,
  'Basic Haircut':        600,
  'Hair Color':           3800,
  'Full Facial':          2000,
  'Mani-Pedi':            1400,
  'General Consult':      900,
  'Specialist':           2800,
  'Lab Test':             1600,
  'Prescription':         480,
  'OTC Purchase':         320,
  'Haircut':              350,
  'Beard':                250,
  'Full Grooming':        700,
  'Suit':                 4000,
  'Custom Cake':          2800,
  'Party Platter':        1800,
  'Bakery':               450,
  'Day Pass':             500,
  'Monthly Member':       5000,
  'PT Session':           1800,
  'Routine Check':        700,
  'Scaling':              1800,
  'Filling':              2200,
  'Oil Change':           1800,
  'Full Service':         6500,
  'Tyre':                 1000,
  'Device Repair':        1800,
  'Eye Exam':             600,
  'Spectacles':           5000,
  'Contact Lens':         2200,
  'Pet Consult':          800,
  'Vaccination':          1200,
  'Portrait':             3500,
  'Screen Repl':          2500,
  'Battery Repl':         1200,
  'Software Fix':         800,
  'Local Delivery':       250,
  'Nationwide':           500,
  'Room Booking':         6000,
  'Conference':           8000,
  'General Purch':        650,
  'Grocery':              1200,
  'Standard Serv':        600,
  'Premium Serv':         1400,
  'Express Serv':         900,
}

function priceForNotes(notes) {
  // notes field stores "[Service Name]"
  const name = (notes ?? '').replace(/^\[|\]$/g, '').trim()
  for (const [prefix, price] of Object.entries(PRICE_MAP)) {
    if (name.startsWith(prefix)) return price
  }
  return rnd(300, 2000) // fallback
}

/**
 * Payment scenario distribution (per customer):
 *  40 % → no advance paid  (advance=0,     left=total)
 *  35 % → partial advance  (advance=30-70%, left=rest)
 *  25 % → fully paid       (advance=total,  left=0)
 */
function calcPayments(total) {
  const roll = Math.random()
  if (roll < 0.40) {
    return { advance_paid: 0, payment_left: total }
  } else if (roll < 0.75) {
    const pct = rnd(30, 70) / 100
    const advance = Math.round(total * pct)
    return { advance_paid: advance, payment_left: total - advance }
  } else {
    return { advance_paid: total, payment_left: 0 }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║   Queue Payments Seed                                        ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  // Fetch ALL queue entries (Supabase default limit is 1000; paginate if needed)
  let allRows = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await supabase
      .from('queues')
      .select('id, notes, customer_name, business_id, status, position, priority, created_at')
      .range(from, from + PAGE - 1)
    if (error) throw new Error(`Fetch error: ${error.message}`)
    allRows = allRows.concat(data ?? [])
    if ((data ?? []).length < PAGE) break
    from += PAGE
  }

  console.log(`  Fetched ${allRows.length} queue rows\n  Building payment updates...`)

  // Build update payloads (include required NOT NULL cols for upsert safety)
  const updates = allRows.map(row => {
    const qty        = rnd(1, 3)
    const unitPrice  = priceForNotes(row.notes)
    const total      = unitPrice * qty
    const { advance_paid, payment_left } = calcPayments(total)
    return {
      id:            row.id,
      customer_name: row.customer_name,
      business_id:   row.business_id,
      status:        row.status,
      position:      row.position,
      priority:      row.priority,
      created_at:    row.created_at,
      quantity:      qty,
      unit_price:    unitPrice,
      total_price:   total,
      advance_paid,
      payment_left,
    }
  })

  // Upsert in batches of 300
  const BATCH = 300
  let updated = 0
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH)
    const { error } = await supabase.from('queues').upsert(batch, { onConflict: 'id' })
    if (error) {
      console.warn(`  ⚠  Batch @${i}: ${error.message}`)
    } else {
      updated += batch.length
      process.stdout.write('.')
    }
  }
  console.log(`\n\n  ✓  Updated ${updated} / ${updates.length} queue entries`)

  // ── Verification ────────────────────────────────────────────────────────────
  const { data: sample } = await supabase
    .from('queues')
    .select('customer_name, unit_price, total_price, advance_paid, payment_left')
    .gt('total_price', 0)
    .limit(5)

  console.log('\n  Sample rows:')
  for (const r of sample ?? []) {
    console.log(
      `    ${r.customer_name.padEnd(20)} unit=${r.unit_price}  total=${r.total_price}` +
      `  advance=${r.advance_paid}  left=${r.payment_left}`
    )
  }

  const { data: stats } = await supabase
    .from('queues')
    .select('advance_paid, payment_left')
    .gt('advance_paid', 0)

  console.log(`\n  Entries with advance paid  : ${(stats ?? []).length}`)
  const totalAdvance = (stats ?? []).reduce((s, r) => s + Number(r.advance_paid), 0)
  console.log(`  Total advance collected    : Rs. ${totalAdvance.toLocaleString()}`)
  console.log('\n  Done.\n')
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })

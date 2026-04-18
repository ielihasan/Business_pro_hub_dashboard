#!/usr/bin/env node
/**
 * seed-active-queues.mjs
 *
 * For every business:
 *   1. Ensures it has exactly 5 active services (queue types).
 *      Top-up services are added if the business has fewer than 5.
 *   2. Adds 15 "waiting" queue entries per service, all timestamped
 *      within the last 2 hours so dashboards show them as live/active.
 *
 * Result per business: 5 queues × 15 customers = 75 active queue slots.
 *
 * Run from /dashboard:
 *   node scripts/seed-active-queues.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync }  from 'fs'
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
const pick = arr => arr[Math.floor(Math.random() * arr.length)]

// ── Constants ─────────────────────────────────────────────────────────────────
const QUEUES_PER_BUSINESS  = 5   // ensure each business has exactly this many services
const CUSTOMERS_PER_QUEUE  = 15  // waiting customers per service queue

// Top-up service templates used when a business has fewer than 5 services
const TOPUP_SERVICES = [
  { name: 'General Inquiry',       color: '#3B82F6', duration: 10, capacity: 50 },
  { name: 'Document Submission',   color: '#10B981', duration: 8,  capacity: 40 },
  { name: 'Payment & Billing',     color: '#F59E0B', duration: 7,  capacity: 60 },
  { name: 'Appointment Booking',   color: '#8B5CF6', duration: 12, capacity: 30 },
  { name: 'Customer Support',      color: '#EC4899', duration: 15, capacity: 40 },
  { name: 'Product Consultation',  color: '#14B8A6', duration: 10, capacity: 35 },
  { name: 'Express Service',       color: '#EF4444', duration: 5,  capacity: 25 },
  { name: 'Premium Assistance',    color: '#F97316', duration: 20, capacity: 20 },
]

// Realistic Pakistani customer names for queue entries
const CUSTOMER_NAMES = [
  'Muhammad Ali',     'Fatima Noor',      'Ahmed Raza',       'Zainab Malik',
  'Hassan Khan',      'Ayesha Siddiqui',  'Omar Farooq',      'Sara Rehman',
  'Bilal Hussain',    'Hina Javed',       'Tariq Mehmood',    'Amna Sheikh',
  'Usman Butt',       'Sobia Iqbal',      'Adnan Qureshi',    'Nadia Baig',
  'Faisal Nawaz',     'Maria Rizvi',      'Imran Chaudhry',   'Saima Mirza',
  'Raza Ahmed',       'Rabia Zafar',      'Kamran Anwar',     'Kiran Abbasi',
  'Shahid Noor',      'Amira Latif',      'Junaid Sattar',    'Shehla Waheed',
  'Wasim Dar',        'Sana Akhtar',      'Nasir Jamil',      'Rubab Tahir',
  'Asad Chohan',      'Tooba Gillani',    'Waqar Baloch',     'Iram Ashraf',
  'Khalid Pervaiz',   'Sidra Tanvir',     'Yasir Fayyaz',     'Mehwish Pasha',
  'Shakeel Rauf',     'Bushra Kamal',     'Zahid Niazi',      'Fozia Pirzada',
  'Shoaib Lodhi',     'Aqsa Hafeez',      'Azhar Gondal',     'Hira Safi',
  'Majid Ansari',     'Saira Khan',       'Ibrar Bhatti',     'Neelam Rana',
  'Sohail Durrani',   'Riffat Sajid',     'Babar Awan',       'Uzma Qadri',
  'Asif Saleem',      'Madiha Cheema',    'Naveed Tarar',     'Shazia Aslam',
  'Jalil Akhtar',     'Sumera Gill',      'Arif Piracha',     'Tanzila Shah',
  'Ejaz Warraich',    'Nageen Farid',     'Aamir Chattha',    'Zarqa Langah',
  'Pervaiz Khokhar',  'Nausheen Tufail',  'Shafiq Virk',      'Suriya Pirzada',
  'Mukhtar Awan',     'Rukhsar Ghafoor',  'Javed Gabol',      'Nusrat Siyal',
]

const PRIORITIES = ['normal', 'normal', 'normal', 'normal', 'urgent']

// ── Step 1: Fetch all businesses + their current service counts ───────────────
async function fetchBusinessesWithServices() {
  const { data: businesses, error: bizErr } = await supabase
    .from('businesses')
    .select('id, business_name, business_type')
    .eq('is_active', true)

  if (bizErr) throw new Error(`Failed to fetch businesses: ${bizErr.message}`)

  const { data: services, error: svcErr } = await supabase
    .from('services')
    .select('id, business_id, name')
    .eq('is_active', true)

  if (svcErr) throw new Error(`Failed to fetch services: ${svcErr.message}`)

  // Group services by business
  const svcByBiz = {}
  for (const s of services ?? []) {
    if (!svcByBiz[s.business_id]) svcByBiz[s.business_id] = []
    svcByBiz[s.business_id].push(s)
  }

  console.log(`  Loaded ${businesses.length} businesses, ${services.length} services`)
  return { businesses, svcByBiz }
}

// ── Step 2: Top-up services to reach QUEUES_PER_BUSINESS ─────────────────────
async function ensureFiveServices(businesses, svcByBiz) {
  console.log(`\n  Ensuring each business has ${QUEUES_PER_BUSINESS} services...`)
  let added = 0

  for (const biz of businesses) {
    const existing = svcByBiz[biz.id] ?? []
    const needed   = QUEUES_PER_BUSINESS - existing.length
    if (needed <= 0) continue

    // Pick top-up templates not already used by name
    const existingNames = new Set(existing.map(s => s.name))
    const templates = TOPUP_SERVICES
      .filter(t => !existingNames.has(t.name))
      .slice(0, needed)

    if (templates.length === 0) continue

    const rows = templates.map(t => ({
      business_id:        biz.id,
      name:               t.name,
      description:        JSON.stringify({
        label:         `${t.name} at ${biz.business_name}`,
        color:         t.color,
        max_capacity:  t.capacity,
        is_queue_type: true,
      }),
      estimated_duration: t.duration,
      is_active:          true,
    }))

    const { data: inserted, error } = await supabase
      .from('services')
      .insert(rows)
      .select('id, name')

    if (error) {
      console.warn(`  ⚠  Services top-up for ${biz.business_name}: ${error.message}`)
    } else {
      for (const s of inserted ?? []) {
        if (!svcByBiz[biz.id]) svcByBiz[biz.id] = []
        svcByBiz[biz.id].push(s)
        added++
      }
    }
  }

  console.log(`  ✓  Added ${added} top-up services`)
}

// ── Step 3: Build 15 waiting queue entries per service ────────────────────────
function buildQueueRows(businesses, svcByBiz) {
  const rows = []
  const now  = new Date()

  for (const biz of businesses) {
    const services = (svcByBiz[biz.id] ?? []).slice(0, QUEUES_PER_BUSINESS)

    for (const svc of services) {
      for (let pos = 1; pos <= CUSTOMERS_PER_QUEUE; pos++) {
        // Spread join times: earliest joined ~2 hrs ago, latest ~1 min ago
        const minutesAgo = Math.round((CUSTOMERS_PER_QUEUE - pos + 1) * (120 / CUSTOMERS_PER_QUEUE))
        const joinedAt   = new Date(now.getTime() - minutesAgo * 60_000)

        const name  = pick(CUSTOMER_NAMES)
        const phone = `03${rnd(10, 49)}${String(rnd(1_000_000, 9_999_999))}`

        rows.push({
          business_id:   biz.id,
          customer_id:   null,
          customer_name: name,
          customer_phone: phone,
          customer_email: null,
          service_type:  svc.id,
          notes:         `[${svc.name}]`,
          priority:      pick(PRIORITIES),
          position:      pos,
          status:        'waiting',
          joined_at:     joinedAt.toISOString(),
          created_at:    joinedAt.toISOString(),
          started_at:    null,
          completed_at:  null,
        })
      }
    }
  }

  return rows
}

// ── Step 4: Batch insert queue rows ──────────────────────────────────────────
async function insertQueues(rows) {
  const BATCH = 300
  let inserted = 0

  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase.from('queues').insert(rows.slice(i, i + BATCH))
    if (error) console.warn(`  ⚠  Queue batch @${i}: ${error.message}`)
    else { inserted += Math.min(BATCH, rows.length - i); process.stdout.write('.') }
  }
  console.log()
  return inserted
}

// ── Verification ──────────────────────────────────────────────────────────────
async function verify() {
  const { count: waiting } = await supabase
    .from('queues')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'waiting')

  const { data: topBiz } = await supabase
    .from('queues')
    .select('business_id')
    .eq('status', 'waiting')

  const counts = {}
  for (const r of topBiz ?? []) counts[r.business_id] = (counts[r.business_id] ?? 0) + 1
  const vals = Object.values(counts).sort((a, b) => b - a)

  console.log(`\n  Total "waiting" queue entries in DB : ${waiting}`)
  console.log(`  Businesses with active queues       : ${Object.keys(counts).length}`)
  console.log(`  Max customers waiting (1 business)  : ${vals[0] ?? 0}`)
  console.log(`  Min customers waiting (1 business)  : ${vals[vals.length - 1] ?? 0}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║   Active Queue Seed                                          ║')
  console.log(`║   Target: ${QUEUES_PER_BUSINESS} queues × ${CUSTOMERS_PER_QUEUE} customers per business               ║`)
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  const { businesses, svcByBiz } = await fetchBusinessesWithServices()

  await ensureFiveServices(businesses, svcByBiz)

  console.log(`\n  Building queue entries (${businesses.length} businesses × ${QUEUES_PER_BUSINESS} queues × ${CUSTOMERS_PER_QUEUE} customers)...`)
  const rows = buildQueueRows(businesses, svcByBiz)
  console.log(`  Generated ${rows.length} queue rows — inserting...`)

  const inserted = await insertQueues(rows)
  console.log(`\n  ✓  ${inserted} / ${rows.length} queue entries inserted`)

  await verify()

  console.log('\n  Dashboards will now show:')
  console.log(`    • ${QUEUES_PER_BUSINESS} active queue lanes per business`)
  console.log(`    • ${CUSTOMERS_PER_QUEUE} waiting customers per lane`)
  console.log(`    • ${QUEUES_PER_BUSINESS * CUSTOMERS_PER_QUEUE} total active customers per business\n`)
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })

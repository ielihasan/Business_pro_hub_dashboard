#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   BusinessHub Pro — Database Seed Script                     ║
 * ║                                                              ║
 * ║   Creates:                                                   ║
 * ║     • 5   Admin accounts   (admin1–5@test.com)               ║
 * ║     • 50  Business owners  (business1–50@test.com)           ║
 * ║     • 50  Staff accounts   (staff1–50@test.com)              ║
 * ║     • 100 User accounts    (user1–100@test.com)              ║
 * ║                                                              ║
 * ║   Simulates:                                                 ║
 * ║     • Queue entries, completed orders, revenue               ║
 * ║     • Subscription payments across last 90 days              ║
 * ║                                                              ║
 * ║   Password for ALL accounts: 11111111                        ║
 * ║                                                              ║
 * ║   Run from /dashboard folder:                                ║
 * ║     node scripts/seed.mjs                                    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

// ─── Load .env.local ─────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env.local')

function loadEnv(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
      process.env[key] = val
    }
  } catch (e) {
    console.error(`Cannot read ${filePath}: ${e.message}`)
    process.exit(1)
  }
}

loadEnv(envPath)

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sleep  = (ms) => new Promise((r) => setTimeout(r, ms))
const rnd    = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick   = (arr) => arr[Math.floor(Math.random() * arr.length)]

/** Returns a random Date within the past [daysAgo] days, at least [minDaysAgo] days ago */
function randomDate(daysAgo, minDaysAgo = 0) {
  const now  = Date.now()
  const from = now - daysAgo * 86_400_000
  const to   = now - minDaysAgo * 86_400_000
  return new Date(from + Math.random() * (to - from))
}

// Insert in batches; returns total inserted count
async function batchInsert(table, rows, batchSize = 200) {
  let inserted = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const { error } = await supabase.from(table).insert(rows.slice(i, i + batchSize))
    if (error) warn(`  ${table} batch @${i}: ${error.message}`)
    else {
      inserted += Math.min(batchSize, rows.length - i)
      process.stdout.write('.')
    }
  }
  if (rows.length) console.log()
  return inserted
}

// ─── Logger ──────────────────────────────────────────────────────────────────
const ok   = (msg) => console.log(`  ✓  ${msg}`)
const warn = (msg) => console.warn(`  ⚠  ${msg}`)
const header = (msg) => console.log(`\n${'─'.repeat(60)}\n  ${msg}\n${'─'.repeat(60)}`)

// ─── Seed constants ───────────────────────────────────────────────────────────
const PASSWORD = '11111111'

const PAKISTANI_NAMES = [
  'Ali Hassan',       'Sara Ahmed',       'Omar Khan',        'Zara Malik',
  'Bilal Chaudhry',   'Ayesha Siddiqui',  'Hamza Qureshi',    'Fatima Rehman',
  'Usman Butt',       'Hina Nawaz',       'Tariq Mehmood',    'Sobia Iqbal',
  'Adnan Sheikh',     'Nadia Rizvi',      'Faisal Javed',     'Maria Farooq',
  'Imran Ghani',      'Saima Yousuf',     'Raza Hussain',     'Amna Baig',
  'Danish Mirza',     'Rabia Zafar',      'Kamran Anwar',     'Kiran Abbasi',
  'Shahid Noor',      'Amira Latif',      'Junaid Sattar',    'Shehla Waheed',
  'Naeem Soomro',     'Lubna Memon',      'Asad Chohan',      'Tooba Gillani',
  'Wasim Dar',        'Sana Akhtar',      'Nasir Jamil',      'Rubab Tahir',
  'Waqar Baloch',     'Iram Ashraf',      'Khalid Pervaiz',   'Sidra Tanvir',
  'Yasir Fayyaz',     'Mehwish Pasha',    'Shakeel Rauf',     'Bushra Kamal',
  'Zahid Niazi',      'Fozia Pirzada',    'Shoaib Lodhi',     'Aqsa Hafeez',
  'Azhar Gondal',     'Hira Safi',        'Majid Ansari',     'Saira Khan',
  'Ibrar Bhatti',     'Neelam Rana',      'Sohail Durrani',   'Riffat Sajid',
  'Babar Awan',       'Uzma Qadri',       'Asif Saleem',      'Madiha Cheema',
  'Naveed Tarar',     'Shazia Aslam',     'Jalil Akhtar',     'Sumera Gill',
  'Arif Piracha',     'Tanzila Shah',     'Afzal Sipra',      'Parveen Minhas',
  'Rashid Gondal',    'Shaheen Dogar',    'Ejaz Warraich',    'Nageen Farid',
  'Aamir Chattha',    'Zarqa Langah',     'Ghulam Rasool',    'Mehmooda Bajwa',
  'Pervaiz Khokhar',  'Nausheen Tufail',  'Shafiq Virk',      'Suriya Pirzada',
  'Mukhtar Awan',     'Rukhsar Ghafoor',  'Maqsood Alvi',     'Farzana Arain',
  'Iftikhar Balooch', 'Samina Brohi',     'Javed Gabol',      'Nusrat Siyal',
  'Karim Shaikh',     'Dilnoza Siddiqui', 'Rauf Khuhro',      'Shirin Channa',
  'Liaquat Palari',   'Hajra Leghari',    'Tauseef Pirzado',  'Sanam Tunio',
  'Ghulam Mustafa',   'Tahira Sehto',     'Qadir Morio',      'Zahida Rind',
]

// 25 distinct business types cycling across the 50 businesses
const BUSINESS_TYPES = [
  'Restaurant', 'Coffee Shop', 'Salon & Spa', 'Medical Clinic', 'Bank Branch',
  'Pharmacy', 'Barbershop', 'Tailor Shop', 'Bakery', 'Gym & Fitness',
  'Dental Clinic', 'Law Firm', 'Car Workshop', 'Electronics Store', 'Optician',
  'Veterinary Clinic', 'Photography Studio', 'Mobile Repair', 'Courier Office', 'Hotel',
  'Bookstore', 'Supermarket', 'Travel Agency', 'Insurance Office', 'Real Estate Agency',
]

const BIZ_NAMES_BY_TYPE = {
  'Restaurant':          ['Spice Garden', 'Lahore Darbar', 'Karachi Grills', 'Peshawar Palace', 'Islamabad Bites', 'Desi Dhaba', 'Punjab Kitchen', 'Sindh Flavours'],
  'Coffee Shop':         ['Brew & Co', 'The Bean Scene', 'Café Lahore', 'Morning Mug', 'Roast House', 'Mocha Lounge', 'Sip & Go', 'The Daily Grind'],
  'Salon & Spa':         ['Glamour Studio', 'Silk Touch', 'Style Hub', 'Beauty Lane', 'Radiance Salon', 'Gloss & Glow', 'Posh Looks', 'Chic Corner'],
  'Medical Clinic':      ['City Care Clinic', 'HealthFirst', 'Medicare Hub', 'PrimeCare', 'Wellness Centre', 'MedPoint', 'FamilyCare', 'AlShifa Clinic'],
  'Bank Branch':         ['National Bank Branch', 'HBL Service Centre', 'UBL Exchange', 'MCB Office', 'Allied Bank Hub'],
  'Pharmacy':            ['Medica Plus', 'HealthMart', 'Lifeline Pharmacy', 'Care Chemist', 'Apollo Drugs', 'PharmaCare', 'MedZone', 'Dawakhana Plus'],
  'Barbershop':          ["Razor's Edge", 'The Shave Room', 'Fade Masters', 'Classic Cuts', 'The Barber Co', 'Prime Cuts', 'Urban Barbers', 'Sharp Blades'],
  'Tailor Shop':         ['Master Stitchers', 'Fabric House', 'Elite Tailors', 'DressCode', 'Stitch & Style', 'Qabil Darzi', 'Bespoke Suits', 'Needlecraft'],
  'Bakery':              ['Golden Crust', 'Sweet Bites', 'The Oven', 'Artisan Breads', 'Patisserie 46', 'Flour & Love', 'Daily Bake', 'Crumb & Co'],
  'Gym & Fitness':       ['PowerFit', 'IronZone', 'FitLife Studio', 'ProGym', 'Muscle Factory', 'PeakForm', 'ActiveZone', 'BodyPro Gym'],
  'Dental Clinic':       ['SmileCare', 'BrightTeeth', 'Dental First', 'Oral Health Hub', 'PrimeDental', 'GumGuard', 'PearlDental', 'ToothWise'],
  'Law Firm':            ['Justice Partners', 'Lex Group', 'Advocate Plus', 'Legal Edge', 'ProBono Law'],
  'Car Workshop':        ['AutoFix', 'Speedway Garage', 'ProMech', 'DriveWell', 'Star Autos', 'CareMech', 'PitStop Garage', 'Torque Masters'],
  'Electronics Store':   ['TechZone', 'Gadget Hub', 'DigiMart', 'Circuit Plus', 'ElectroShop', 'iShoppe', 'SmartMart', 'BinaryWorld'],
  'Optician':            ['Vision Plus', 'EyeFirst', 'ClearView', 'OptikCare', 'Spec House', 'LensCraft', 'FocusPoint', 'SightCare'],
  'Veterinary Clinic':   ['PetCare Vet', 'Animal Wellness', 'PawFirst', 'VetZone', 'Pet Health Hub'],
  'Photography Studio':  ['Pixel Studio', 'Click & Smile', 'LensArt', 'ShutterPoint', 'PhotoPro', 'FrameIt', 'Portrait Lane', 'SnapshotPro'],
  'Mobile Repair':       ['FixIt Mobile', 'PhoneZone', 'TechRepair', 'SmartFix', 'DeviceCare', 'iRepair', 'ScreenFix', 'GadgetDoc'],
  'Courier Office':      ['SpeedPost', 'RapidCourier', 'SwiftDelivery', 'PackageGo', 'ExpressPack'],
  'Hotel':               ['Grand Suites', 'City Lodge', 'Comfort Inn', 'Horizon Hotel', 'Pearl Residency'],
  'Bookstore':           ['PageTurner', 'Book Nook', 'Literary Lane', 'Reading Room', 'Classic Books'],
  'Supermarket':         ['FreshMart', 'DailyBasket', 'QuickShop', 'HomeStore', 'ValueMart'],
  'Travel Agency':       ['Globe Trekkers', 'Wanderlust Travel', 'Dream Tours', 'Voyage Plus', 'TravelPro'],
  'Insurance Office':    ['Shield Assure', 'SafeGuard', 'SecureLife', 'TrustPlan', 'Assure Plus'],
  'Real Estate Agency':  ['Prime Properties', 'HomeKey Realty', 'LandMark', 'EstateOne', 'PropertyHub'],
}

// Services with realistic prices (PKR) and menu items per business type
const SERVICES_BY_TYPE = {
  'Restaurant': [
    { name: 'Dine-in Table',        price: 850,  items: ['Chicken Biryani', 'Karahi', 'Naan', 'Raita', 'Soft Drink'] },
    { name: 'Takeaway Order',       price: 550,  items: ['Biryani Box', 'Karahi', 'Roti', 'Pulao', 'BBQ Platter'] },
    { name: 'Family Meal Package',  price: 2400, items: ['Family Platter', 'Rice Bowl', 'BBQ Set', 'Dessert', 'Drinks'] },
  ],
  'Coffee Shop': [
    { name: 'Regular Order',        price: 380,  items: ['Cappuccino', 'Latte', 'Americano', 'Cold Brew', 'Croissant'] },
    { name: 'Large Order',          price: 650,  items: ['Frappuccino', 'Waffle', 'Club Sandwich', 'Chai Latte', 'Brownie'] },
    { name: 'Meeting Package',      price: 1200, items: ['2× Lattes', '2× Sandwiches', 'Cookies', 'Orange Juice'] },
  ],
  'Salon & Spa': [
    { name: 'Basic Haircut',        price: 600,  items: ['Wash & Cut', 'Blow Dry', 'Style Finish'] },
    { name: 'Hair Color & Style',   price: 3800, items: ['Full Color', 'Highlights', 'Keratin Treatment', 'Blow Dry'] },
    { name: 'Full Facial',          price: 2000, items: ['Deep Cleanse', 'Hydra Facial', 'Face Massage', 'Moisturiser'] },
    { name: 'Mani-Pedi Package',    price: 1400, items: ['Manicure', 'Pedicure', 'Gel Polish', 'Hand Scrub'] },
  ],
  'Medical Clinic': [
    { name: 'General Consultation', price: 900,  items: ['Consultation Fee', 'BP & Sugar Check', 'Prescription'] },
    { name: 'Specialist Visit',     price: 2800, items: ['Specialist Fee', 'Full Assessment', 'Lab Referral', 'Follow-up'] },
    { name: 'Lab Test Package',     price: 1600, items: ['CBC', 'Blood Sugar (Fasting)', 'Lipid Profile', 'Urine RE'] },
  ],
  'Bank Branch': [
    { name: 'Account Services',     price: 0,    items: ['Account Opening', 'Statement Request', 'Cheque Book Issue'] },
    { name: 'Loan Inquiry',         price: 0,    items: ['Loan Application', 'Documentation Review', 'Advisor Session'] },
    { name: 'Forex / Remittance',   price: 200,  items: ['Currency Exchange', 'Wire Transfer Fee', 'Receipt'] },
  ],
  'Pharmacy': [
    { name: 'Prescription Fill',    price: 480,  items: ['Paracetamol', 'Amoxicillin', 'Cough Syrup', 'Multivitamins'] },
    { name: 'OTC Purchase',         price: 320,  items: ['Disprin', 'Vicks Rub', 'Dettol Antiseptic', 'Bandage Roll'] },
    { name: 'Health Supplement',    price: 1200, items: ['Omega-3 Capsules', 'Vitamin D3', 'Iron Tablets', 'Zinc Syrup'] },
  ],
  'Barbershop': [
    { name: 'Haircut',              price: 350,  items: ['Wash & Cut', 'Style Finish'] },
    { name: 'Beard Trim & Shape',   price: 250,  items: ['Beard Shape', 'Clean Shave', 'Aftershave Balm'] },
    { name: 'Full Grooming',        price: 700,  items: ['Haircut', 'Beard Trim', 'Head Massage', 'Styling Product'] },
  ],
  'Tailor Shop': [
    { name: 'Measurements & Consult', price: 0,   items: ['Body Measurement', 'Design Consultation', 'Fabric Advice'] },
    { name: 'Shalwar Kameez Stitch',  price: 1400, items: ['Fabric Stitching', 'Embroidery Patch', 'Finishing & Press'] },
    { name: 'Suit Stitching',         price: 4000, items: ['Coat Stitch', 'Trouser Stitch', 'Lining', 'Buttons & Trim'] },
  ],
  'Bakery': [
    { name: 'Regular Order',        price: 450,  items: ['Bread Loaf', 'Croissant', 'Blueberry Muffin', 'Choco Cookies'] },
    { name: 'Custom Cake Order',    price: 2800, items: ['Custom Cake (1kg)', 'Fondant Decoration', 'Gift Box Packing'] },
    { name: 'Party Platter',        price: 1800, items: ['Mini Sandwiches', 'Pastries', 'Cup Cakes', 'Brownie Bites'] },
  ],
  'Gym & Fitness': [
    { name: 'Day Pass',             price: 500,  items: ['Gym Access', 'Locker Use', 'Towel'] },
    { name: 'Monthly Membership',   price: 5000, items: ['Unlimited Access', 'Locker Rental', 'Personalised Plan'] },
    { name: 'PT Session',           price: 1800, items: ['1-on-1 Training (1hr)', 'Diet Consultation', 'Progress Tracking'] },
  ],
  'Dental Clinic': [
    { name: 'Routine Checkup',      price: 700,  items: ['Dental Exam', 'Digital X-Ray', 'Basic Cleaning'] },
    { name: 'Scaling & Polishing',  price: 1800, items: ['Ultrasonic Scaling', 'Polishing', 'Fluoride Treatment'] },
    { name: 'Filling / Restoration',price: 2200, items: ['Composite Filling', 'Procedure', 'Post-op Medication'] },
  ],
  'Law Firm': [
    { name: 'Initial Consultation', price: 3500, items: ['Legal Advice (1hr)', 'Case Assessment', 'Documentation Review'] },
    { name: 'Document Preparation', price: 6000, items: ['Contract Drafting', 'Notarization', 'Court Filing Fee'] },
  ],
  'Car Workshop': [
    { name: 'Engine Oil Change',    price: 1800, items: ['Synthetic Engine Oil 4L', 'Oil Filter', 'Labour'] },
    { name: 'Full Service',         price: 6500, items: ['Oil Change', 'Air Filter', 'Spark Plugs', 'Brake Check', 'Wash'] },
    { name: 'Tyre Change & Balance',price: 1000, items: ['Tyre Mounting', 'Dynamic Balancing', 'Valve Stem'] },
  ],
  'Electronics Store': [
    { name: 'Product Purchase',     price: 9500, items: ['Mobile Phone', 'Laptop Accessory', 'TWS Earbuds', 'USB-C Charger'] },
    { name: 'Device Repair',        price: 1800, items: ['Screen Replacement', 'Battery', 'Software Unlock', 'Cleaning'] },
  ],
  'Optician': [
    { name: 'Eye Examination',      price: 600,  items: ['Comprehensive Eye Test', 'Refraction', 'Written Prescription'] },
    { name: 'Spectacles Package',   price: 5000, items: ['Designer Frame', 'Anti-Glare Lenses', 'UV400 Coating', 'Case'] },
    { name: 'Contact Lens Fitting', price: 2200, items: ['Trial Lenses', 'Fitting Session', '3-Month Lens Pack', 'Solution'] },
  ],
  'Veterinary Clinic': [
    { name: 'Pet Consultation',     price: 800,  items: ['Clinical Exam', 'Advice & Prescription'] },
    { name: 'Vaccination Package',  price: 1200, items: ['Core Vaccines', 'Rabies Shot', 'Health Certificate'] },
  ],
  'Photography Studio': [
    { name: 'Portrait Session',     price: 3500, items: ['1hr Studio Session', '10 Edited Photos', 'USB Delivery'] },
    { name: 'Event Coverage',       price: 15000, items: ['4hr Coverage', '100+ Edited Photos', 'Video Highlights', 'Album'] },
  ],
  'Mobile Repair': [
    { name: 'Screen Replacement',   price: 2500, items: ['OEM Screen', 'Labour', '30-Day Warranty'] },
    { name: 'Battery Replacement',  price: 1200, items: ['Original Battery', 'Installation', 'Test'] },
    { name: 'Software Fix',         price: 800,  items: ['OS Reinstall', 'Data Backup', 'App Setup'] },
  ],
  'Courier Office': [
    { name: 'Local Delivery',       price: 250,  items: ['Same-city Delivery', 'Tracking SMS', 'Delivery Slip'] },
    { name: 'Nationwide Parcel',    price: 500,  items: ['Next-day Delivery', 'Insurance Cover', 'Tracking'] },
  ],
  'Hotel': [
    { name: 'Room Booking',         price: 6000, items: ['Standard Room (1 night)', 'Breakfast', 'Wifi', 'Parking'] },
    { name: 'Conference Room',      price: 8000, items: ['Half-day Room Rental', 'Projector', 'Tea Breaks', 'Stationery'] },
  ],
  'Bookstore': [
    { name: 'General Purchase',     price: 650,  items: ['Novel', 'Reference Book', 'Stationery Pack', 'Gift Wrap'] },
  ],
  'Supermarket': [
    { name: 'Grocery Shopping',     price: 1200, items: ['Atta 5kg', 'Rice 2kg', 'Cooking Oil 1L', 'Sugar', 'Spice Pack'] },
  ],
  'Travel Agency': [
    { name: 'Air Ticket Booking',   price: 600,  items: ['Booking Fee', 'E-Ticket', 'Seat Confirmation'] },
    { name: 'Tour Package',         price: 45000, items: ['Return Flights', '5-Night Hotel', 'Transfers', 'Guide'] },
  ],
  'Insurance Office': [
    { name: 'Policy Consultation',  price: 0,    items: ['Needs Assessment', 'Plan Comparison', 'Proposal Sheet'] },
    { name: 'Claim Processing',     price: 0,    items: ['Claim Form', 'Document Submission', 'Processing Fee'] },
  ],
  'Real Estate Agency': [
    { name: 'Property Viewing',     price: 0,    items: ['Site Visit', 'Market Briefing', 'Comparative Analysis'] },
    { name: 'Buy/Sell Commission',  price: 50000, items: ['Legal Verification', 'Registry Assistance', 'Token Documentation'] },
  ],
}

const GENERIC_SERVICES = [
  { name: 'Standard Service',  price: 600,  items: ['Service Fee', 'Consultation', 'Processing'] },
  { name: 'Premium Service',   price: 1400, items: ['Premium Package', 'Priority Handling', 'Follow-up'] },
  { name: 'Express Service',   price: 900,  items: ['Express Fee', 'Quick Processing', 'Documentation'] },
]

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala']
const AREAS  = ['DHA', 'Gulberg', 'Model Town', 'Johar Town', 'Bahria Town', 'F-7', 'I-8', 'G-11', 'Clifton', 'Defence', 'PECHS', 'Nazimabad', 'Blue Area', 'Saddar']

const STAFF_POSITIONS = ['Queue Manager', 'Customer Service Rep', 'Front Desk Officer', 'Service Coordinator', 'Senior Attendant']

const PAYMENT_METHODS   = ['cash', 'card', 'bank_transfer', 'jazzcash', 'easypaisa']
const SUBSCRIPTION_PLANS = ['free', 'starter', 'professional', 'enterprise']
const PLAN_PRICES        = { free: 0, starter: 2999, professional: 5999, enterprise: 14999 }
const COLORS             = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

const ANON_NAMES = [
  'Walk-in Customer', 'Counter Customer', 'Phone Customer',
  'Referred Customer', 'Anonymous Guest', 'Walk-up Customer',
]

// ─── Counters (summary) ───────────────────────────────────────────────────────
const summary = { admins: 0, businesses: 0, staff: 0, users: 0, queues: 0, orders: 0, payments: 0 }

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1 — ADMINS
// ═══════════════════════════════════════════════════════════════════════════════
async function createAdmins() {
  header('PHASE 1 · Creating 5 Admin accounts')
  const admins = []

  for (let i = 1; i <= 5; i++) {
    const email    = `admin${i}@test.com`
    const fullName = `Admin User ${i}`
    const now      = new Date().toISOString()

    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email, password: PASSWORD, email_confirm: true,
      user_metadata: { full_name: fullName, role: 'admin' },
    })

    if (authErr) { warn(`admin${i}: ${authErr.message}`); continue }

    const userId = authData.user.id

    const { error: dbErr } = await supabase.from('admins').insert({
      id: userId, full_name: fullName, email,
      role: 'admin', is_approved: true, approved_at: now,
    })

    if (dbErr) {
      warn(`admin${i} db: ${dbErr.message}`)
      await supabase.auth.admin.deleteUser(userId)
    } else {
      admins.push({ id: userId, email, full_name: fullName })
      summary.admins++
      ok(`admin${i}@test.com`)
    }

    await sleep(200)
  }
  return admins
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — BUSINESS OWNERS
// ═══════════════════════════════════════════════════════════════════════════════
async function createBusinesses() {
  header('PHASE 2 · Creating 50 Business Owner accounts')
  const businesses = []

  for (let i = 1; i <= 50; i++) {
    const email      = `business${i}@test.com`
    const ownerName  = PAKISTANI_NAMES[(i - 1) % PAKISTANI_NAMES.length]
    const bType      = BUSINESS_TYPES[(i - 1) % BUSINESS_TYPES.length]
    const bNamePool  = BIZ_NAMES_BY_TYPE[bType] || [`${bType} ${i}`]
    const bName      = bNamePool[(i - 1) % bNamePool.length]
    const city       = pick(CITIES)
    const area       = pick(AREAS)
    const plan       = SUBSCRIPTION_PLANS[rnd(0, 3)]
    const phone      = `03${rnd(10, 49)}${String(rnd(1_000_000, 9_999_999))}`
    const address    = `${rnd(1, 999)} ${area}, ${city}`
    const desc       = `${bName} — your trusted ${bType.toLowerCase()} in ${city}.`
    const now        = new Date().toISOString()

    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email, password: PASSWORD, email_confirm: true,
      user_metadata: { full_name: ownerName, role: 'business_owner' },
    })

    if (authErr) { warn(`business${i}: ${authErr.message}`); continue }

    const userId = authData.user.id

    // --- admins row (auth/role management) ---
    const { error: adminErr } = await supabase.from('admins').insert({
      id: userId, full_name: ownerName, email,
      role: 'business_owner', business_name: bName, business_type: bType,
      business_address: address, business_phone: phone,
      business_description: desc, subscription_plan: plan,
      subscription_status: 'active', is_approved: true, approved_at: now,
    })

    if (adminErr) {
      warn(`business${i} admins: ${adminErr.message}`)
      await supabase.auth.admin.deleteUser(userId)
      continue
    }

    // --- businesses row (canonical FK target) ---
    // The trg_sync_business_from_admins trigger may have already inserted this row;
    // use upsert so we always end up with the full data.
    const { error: bizErr } = await supabase.from('businesses').upsert({
      id: userId, full_name: ownerName, email,
      business_name: bName, business_type: bType,
      business_address: address, business_phone: phone,
      business_description: desc, subscription_plan: plan,
      is_active: true, approved_at: now,
    }, { onConflict: 'id' })

    if (bizErr) warn(`business${i} businesses: ${bizErr.message}`)

    businesses.push({ id: userId, email, full_name: ownerName, business_name: bName, business_type: bType, city, plan })
    summary.businesses++
    ok(`business${i}@test.com → ${bName} (${bType}) [${plan}]`)

    await sleep(200)
  }
  return businesses
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — BUSINESS HOURS
// ═══════════════════════════════════════════════════════════════════════════════
async function createBusinessHours(businesses) {
  header('PHASE 3 · Seeding business hours (Mon–Sat open, Sun closed)')
  const rows = []

  for (const biz of businesses) {
    for (let day = 0; day <= 6; day++) {
      const isOpen    = day !== 0             // 0 = Sunday → closed
      const isFriday  = day === 5
      const isSaturday= day === 6
      rows.push({
        business_id: biz.id,
        day_of_week:  day,
        is_open:      isOpen,
        open_time:    isOpen ? (isFriday ? '14:00' : '09:00') : null,
        close_time:   isOpen ? '21:00' : null,
        break_start:  isOpen && !isSaturday ? '13:00' : null,
        break_end:    isOpen && !isSaturday ? '14:00' : null,
      })
    }
  }

  await batchInsert('business_hours', rows, 350)
  ok(`${rows.length} hours rows inserted for ${businesses.length} businesses`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4 — SERVICES / QUEUE TYPES
// ═══════════════════════════════════════════════════════════════════════════════
async function createServices(businesses) {
  header('PHASE 4 · Creating services (queue types) per business')
  const serviceMap = {}   // businessId → [{ id, name, price, items[] }]

  for (const biz of businesses) {
    const templates = SERVICES_BY_TYPE[biz.business_type] || GENERIC_SERVICES
    const rows = templates.map((tpl) => ({
      business_id:        biz.id,
      name:               tpl.name,
      description:        JSON.stringify({
        label:        `${tpl.name} at ${biz.business_name}`,
        color:        pick(COLORS),
        max_capacity: rnd(20, 100),
        is_queue_type: true,
      }),
      estimated_duration: rnd(5, 25),
      is_active:          true,
    }))

    const { data: inserted, error } = await supabase.from('services').insert(rows).select('id, name')
    if (error) {
      warn(`Services for ${biz.business_name}: ${error.message}`)
      continue
    }

    serviceMap[biz.id] = (inserted || []).map((s, idx) => ({
      id:    s.id,
      name:  s.name,
      price: templates[idx]?.price ?? 500,
      items: templates[idx]?.items ?? ['Service Item'],
    }))

    process.stdout.write('.')
  }
  console.log()
  ok(`Services created for ${Object.keys(serviceMap).length} businesses`)
  return serviceMap
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 5 — STAFF (1 per business, 50 total)
// ═══════════════════════════════════════════════════════════════════════════════
async function createStaff(businesses) {
  header('PHASE 5 · Creating 50 Staff accounts (one per business)')
  const staffList = []

  for (let i = 0; i < 50; i++) {
    const biz      = businesses[i]
    if (!biz) break

    const n        = i + 1
    const email    = `staff${n}@test.com`
    const staffName = PAKISTANI_NAMES[(50 + i) % PAKISTANI_NAMES.length]
    const position = pick(STAFF_POSITIONS)
    const phone    = `03${rnd(10, 49)}${String(rnd(1_000_000, 9_999_999))}`

    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email, password: PASSWORD, email_confirm: true,
      user_metadata: { full_name: staffName, role: 'staff', business_id: biz.id },
    })

    if (authErr) { warn(`staff${n}: ${authErr.message}`); continue }

    const userId = authData.user.id

    const { data: row, error: dbErr } = await supabase.from('staff').insert({
      business_id:  biz.id,
      auth_user_id: userId,
      full_name:    staffName,
      email,
      phone,
      position,
      is_active:    true,
      temp_password: PASSWORD,
    }).select('id').single()

    if (dbErr) {
      warn(`staff${n} db: ${dbErr.message}`)
    } else {
      staffList.push({ id: row.id, auth_user_id: userId, business_id: biz.id })
      summary.staff++
      ok(`staff${n}@test.com → ${position} @ ${biz.business_name}`)
    }

    await sleep(200)
  }
  return staffList
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 6 — USERS (100 regular customers)
// ═══════════════════════════════════════════════════════════════════════════════
async function createUsers() {
  header('PHASE 6 · Creating 100 User accounts')
  const users = []

  for (let i = 1; i <= 100; i++) {
    const email    = `user${i}@test.com`
    const fullName = PAKISTANI_NAMES[(i - 1) % PAKISTANI_NAMES.length]
    const phone    = `03${rnd(10, 49)}${String(rnd(1_000_000, 9_999_999))}`

    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email, password: PASSWORD, email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authErr) { warn(`user${i}: ${authErr.message}`); continue }

    const userId = authData.user.id

    // A Supabase trigger may auto-create a sparse row on auth user creation;
    // upsert ensures we always write the full profile data.
    const { error: dbErr } = await supabase.from('users').upsert({
      id: userId, full_name: fullName, email, phone_number: phone,
    }, { onConflict: 'id' })

    if (dbErr) {
      warn(`user${i} db: ${dbErr.message}`)
    } else {
      users.push({ id: userId, full_name: fullName, email, phone })
      summary.users++
      if (i % 10 === 0) ok(`user${i - 9}–user${i} created`)
    }

    await sleep(100)
  }
  return users
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7 — TRANSACTIONS (queue entries + orders)
// ═══════════════════════════════════════════════════════════════════════════════
async function simulateTransactions(businesses, users, serviceMap, staffList) {
  header('PHASE 7 · Simulating transactions across last 90 days')

  // Build a map: businessId → staff record (for served_by_staff_id)
  const staffByBiz = new Map(staffList.map((s) => [s.business_id, s]))

  const queueRows = []
  const orderRows = []

  // ── Authenticated user visits (100 users × 3–8 businesses each) ──────────
  for (const user of users) {
    const bizSample = [...businesses]
      .sort(() => Math.random() - 0.5)
      .slice(0, rnd(3, 8))

    for (const biz of bizSample) {
      const services = serviceMap[biz.id] ?? []
      if (!services.length) continue

      // Each user makes 1–3 visits to the same business
      const visits = rnd(1, 3)

      for (let v = 0; v < visits; v++) {
        const visitDate = randomDate(90)
        const svc       = pick(services)
        const staff     = staffByBiz.get(biz.id)
        const status    = pick(['completed', 'completed', 'completed', 'completed', 'cancelled', 'no_show'])
        const startedAt = status !== 'cancelled' && status !== 'no_show'
          ? new Date(visitDate.getTime() + rnd(5, 30) * 60_000)
          : null
        const completedAt = status === 'completed'
          ? new Date(visitDate.getTime() + rnd(15, 60) * 60_000)
          : null

        queueRows.push({
          business_id:      biz.id,
          customer_id:      user.id,
          customer_name:    user.full_name,
          customer_phone:   user.phone,
          customer_email:   user.email,
          service_type:     svc.id,
          notes:            `[${svc.name}]`,
          priority:         pick(['normal', 'normal', 'normal', 'urgent']),
          position:         rnd(1, 40),
          status,
          joined_at:        visitDate.toISOString(),
          created_at:       visitDate.toISOString(),
          started_at:       startedAt?.toISOString() ?? null,
          completed_at:     completedAt?.toISOString() ?? null,
          served_by_staff_id: status === 'completed' && staff ? staff.id : null,
        })

        // Create a matching order for every paid + completed queue visit
        if (status === 'completed' && svc.price > 0) {
          const numItems    = rnd(1, Math.min(3, svc.items.length))
          const chosenItems = [...svc.items].sort(() => Math.random() - 0.5).slice(0, numItems)
          const lineItems   = chosenItems.map((name) => ({
            name,
            quantity: rnd(1, 2),
            price:    Math.round((svc.price / numItems) * (0.75 + Math.random() * 0.5)),
          }))
          const total     = lineItems.reduce((s, it) => s + it.price * it.quantity, 0)
          const dayCode   = visitDate.toISOString().slice(0, 10).replace(/-/g, '')

          orderRows.push({
            business_id:    biz.id,
            customer_id:    user.id,
            order_number:   `ORD-${dayCode}-${String(orderRows.length + 1).padStart(5, '0')}`,
            service_type:   svc.name,
            customer_name:  user.full_name,
            customer_phone: user.phone,
            customer_email: user.email,
            items:          JSON.stringify(lineItems),   // jsonb column → must be a string
            description:    `Queue service: ${svc.name}`,
            notes:          `Served via queue`,
            total_amount:   total,
            paid_amount:    total,
            payment_status: 'paid',
            status:         'completed',
            created_at:     visitDate.toISOString(),
          })
        }
      }
    }
  }

  // ── Anonymous walk-in entries (gives each business organic queue history) ─
  for (const biz of businesses) {
    const services  = serviceMap[biz.id] ?? []
    if (!services.length) continue
    const staff     = staffByBiz.get(biz.id)
    const anonCount = rnd(30, 70)          // 30–70 anonymous visitors per business

    for (let a = 0; a < anonCount; a++) {
      const visitDate   = randomDate(90)
      const svc         = pick(services)
      const status      = pick(['completed', 'completed', 'completed', 'cancelled'])
      const startedAt   = status === 'completed'
        ? new Date(visitDate.getTime() + rnd(5, 30) * 60_000)
        : null
      const completedAt = status === 'completed'
        ? new Date(visitDate.getTime() + rnd(15, 60) * 60_000)
        : null
      const anonPhone   = `03${rnd(10, 49)}${String(rnd(1_000_000, 9_999_999))}`

      queueRows.push({
        business_id:       biz.id,
        customer_id:       null,
        customer_name:     pick(ANON_NAMES),
        customer_phone:    anonPhone,
        customer_email:    null,
        service_type:      svc.id,
        notes:             `[${svc.name}]`,
        priority:          'normal',
        position:          rnd(1, 60),
        status,
        joined_at:         visitDate.toISOString(),
        created_at:        visitDate.toISOString(),
        started_at:        startedAt?.toISOString() ?? null,
        completed_at:      completedAt?.toISOString() ?? null,
        served_by_staff_id: status === 'completed' && staff ? staff.id : null,
      })

      // Anonymous completed paid visits also generate orders
      if (status === 'completed' && svc.price > 0 && Math.random() > 0.4) {
        const numItems    = rnd(1, Math.min(2, svc.items.length))
        const chosenItems = [...svc.items].sort(() => Math.random() - 0.5).slice(0, numItems)
        const lineItems   = chosenItems.map((name) => ({
          name,
          quantity: 1,
          price:    Math.round((svc.price / numItems) * (0.8 + Math.random() * 0.4)),
        }))
        const total   = lineItems.reduce((s, it) => s + it.price * it.quantity, 0)
        const dayCode = visitDate.toISOString().slice(0, 10).replace(/-/g, '')

        orderRows.push({
          business_id:    biz.id,
          customer_id:    null,
          order_number:   `ORD-${dayCode}-${String(orderRows.length + 1).padStart(5, '0')}`,
          service_type:   svc.name,
          customer_name:  pick(ANON_NAMES),
          customer_phone: anonPhone,
          customer_email: null,
          items:          JSON.stringify(lineItems),   // jsonb column → must be a string
          description:    `Walk-in: ${svc.name}`,
          notes:          `Walk-in customer`,
          total_amount:   total,
          paid_amount:    total,
          payment_status: 'paid',
          status:         'completed',
          created_at:     visitDate.toISOString(),
        })
      }
    }
  }

  // ── Persist queue rows ────────────────────────────────────────────────────
  console.log(`\n  Inserting ${queueRows.length} queue entries...`)
  const qInserted = await batchInsert('queues', queueRows, 250)
  summary.queues  = qInserted
  ok(`${queueRows.length} queue entries inserted`)

  // ── Persist order rows ────────────────────────────────────────────────────
  console.log(`\n  Inserting ${orderRows.length} orders...`)
  const oInserted  = await batchInsert('orders', orderRows, 250)
  summary.orders   = oInserted
  ok(`${orderRows.length} orders inserted`)

  return { queueRows, orderRows }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 8 — SUBSCRIPTIONS + PLATFORM PAYMENTS
// ═══════════════════════════════════════════════════════════════════════════════
async function createSubscriptionsAndPayments(businesses) {
  header('PHASE 8 · Creating subscriptions & platform payment history')

  const subRows = []
  const payRows = []
  const now     = new Date()

  for (const biz of businesses) {
    const plan       = biz.plan ?? 'free'
    const periodStart = new Date(now)
    periodStart.setDate(now.getDate() - rnd(1, 28))
    const periodEnd = new Date(periodStart)
    periodEnd.setMonth(periodStart.getMonth() + 1)

    subRows.push({
      business_id:          biz.id,
      plan_id:              plan,
      status:               'active',
      current_period_start: periodStart.toISOString(),
      current_period_end:   periodEnd.toISOString(),
    })

    // Historical subscription payments (1–6 months back)
    if (PLAN_PRICES[plan] > 0) {
      const monthsBack = rnd(1, 6)
      for (let m = 0; m < monthsBack; m++) {
        const payDate = new Date(now)
        payDate.setMonth(now.getMonth() - m)
        payDate.setDate(rnd(1, 28))

        payRows.push({
          business_id:    biz.id,
          amount:         PLAN_PRICES[plan],
          currency:       'PKR',
          status:         'completed',
          payment_method: pick(['card', 'bank_transfer', 'jazzcash', 'easypaisa']),
          description:    `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan – Monthly Subscription`,
          plan_id:        plan,
          transaction_id: `TXN-${payDate.getTime()}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
          created_at:     payDate.toISOString(),
        })
      }
    }
  }

  // Insert subscriptions
  console.log(`\n  Inserting ${subRows.length} subscriptions...`)
  await batchInsert('subscriptions', subRows, 100)
  ok(`${subRows.length} subscriptions inserted`)

  // Insert payments
  console.log(`\n  Inserting ${payRows.length} platform payments...`)
  await batchInsert('payments', payRows, 100)
  summary.payments = payRows.length
  ok(`${payRows.length} platform payments inserted`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║       BusinessHub Pro — Database Seed Script                 ║')
  console.log('║       Target: ' + SUPABASE_URL.replace('https://', '').slice(0, 40).padEnd(46) + '║')
  console.log('╚══════════════════════════════════════════════════════════════╝')

  const t0 = Date.now()

  const admins    = await createAdmins()
  const businesses = await createBusinesses()
  await createBusinessHours(businesses)
  const serviceMap = await createServices(businesses)
  const staffList  = await createStaff(businesses)
  const users      = await createUsers()
  await simulateTransactions(businesses, users, serviceMap, staffList)
  await createSubscriptionsAndPayments(businesses)

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)

  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║   Seed Complete                                              ║')
  console.log('╠══════════════════════════════════════════════════════════════╣')
  console.log(`║  Admins created        ${String(summary.admins).padEnd(38)}║`)
  console.log(`║  Businesses created    ${String(summary.businesses).padEnd(38)}║`)
  console.log(`║  Staff created         ${String(summary.staff).padEnd(38)}║`)
  console.log(`║  Users created         ${String(summary.users).padEnd(38)}║`)
  console.log(`║  Queue entries         ${String(summary.queues).padEnd(38)}║`)
  console.log(`║  Orders                ${String(summary.orders).padEnd(38)}║`)
  console.log(`║  Platform payments     ${String(summary.payments).padEnd(38)}║`)
  console.log(`║  Elapsed               ${(elapsed + 's').padEnd(38)}║`)
  console.log('╠══════════════════════════════════════════════════════════════╣')
  console.log('║  Password (all accounts): 11111111                          ║')
  console.log('║  Admins:    admin1@test.com  …  admin5@test.com             ║')
  console.log('║  Businesses: business1@test.com  …  business50@test.com    ║')
  console.log('║  Staff:     staff1@test.com  …  staff50@test.com           ║')
  console.log('║  Users:     user1@test.com   …  user100@test.com           ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')
}

main().catch((e) => {
  console.error('\nFatal:', e.message)
  process.exit(1)
})

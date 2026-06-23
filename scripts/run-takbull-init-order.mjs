/**
 * Local Takbull init-order (terminal test) – loads .env.local, no Vercel CLI required.
 * Usage: node scripts/run-takbull-init-order.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadEnvLocal() {
  const envPath = path.join(root, '.env.local');
  if (!fs.existsSync(envPath)) throw new Error('.env.local not found');
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const USER_ID = '7e937bc4-ccf8-4478-9c63-74d98a81176e';
const TIER = 'creator';
const BILLING = 'monthly';

const env = loadEnvLocal();
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const takbullApiKey = env.TAKBULL_API_KEY;
const takbullApiSecret = env.TAKBULL_API_SECRET;
const redirectUrl = env.TAKBULL_REDIRECT_URL || 'http://localhost:3000/order-received';

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local (required for order insert).');
  process.exit(1);
}
if (!takbullApiKey || !takbullApiSecret) {
  console.error('Missing TAKBULL_API_KEY / TAKBULL_API_SECRET in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const { data: plan, error: planErr } = await supabase
  .from('plans')
  .select('id, name, monthly_price, yearly_price, tier')
  .eq('tier', TIER)
  .eq('is_active', true)
  .single();

if (planErr || !plan) {
  console.error('Plan not found:', planErr?.message);
  process.exit(1);
}

const amount = Number(plan.monthly_price);
const orderReference = `VRL-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

const { data: profile } = await supabase
  .from('profiles')
  .select('full_name, email, phone')
  .eq('user_id', USER_ID)
  .maybeSingle();

const { data: order, error: orderError } = await supabase
  .from('takbull_orders')
  .insert({
    user_id: USER_ID,
    subscription_tier: TIER,
    billing_period: BILLING,
    plan_id: plan.id,
    order_reference: orderReference,
    order_status: 'pending',
    payment_status: 'pending',
    is_recurring: true,
  })
  .select()
  .single();

if (orderError) {
  console.error('Failed to create order:', orderError.message);
  process.exit(1);
}

const productName = plan.name || `Viraly Pro - ${TIER}`;
const now = new Date();
const dueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

const takbullPayload = {
  DealType: 4,
  Interval: 1,
  OrderReference: orderReference,
  OrderTotalSum: amount,
  InitialAmount: amount,
  InitialAmountDescription: productName,
  Products: [{ ProductName: productName, Price: amount }],
  Customer: {
    CustomerFullName: profile?.full_name?.trim() || 'דבי מאור',
    Email: profile?.email || 'debimaor@gmail.com',
    PhoneNumber: profile?.phone?.trim() || '0508363231',
  },
  RedirectAddress: redirectUrl,
  Currency: 'ILS',
  Language: 'he',
  RecuringDueDate: dueDate,
  RecuringInterval: 5,
  NumberOfPayments: 1,
  API_Key: takbullApiKey,
  API_Secret: takbullApiSecret,
};

const res = await fetch('https://api.takbull.co.il/api/ExtranalAPI/GetTakbullPaymentPageRedirectUrl', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify(takbullPayload),
});

const raw = await res.text();
let data;
try {
  data = JSON.parse(raw);
} catch {
  console.error('Takbull non-JSON response:', res.status, raw.slice(0, 500));
  process.exit(1);
}

await supabase
  .from('takbull_orders')
  .update({
    takbull_response: data,
    uniq_id: data.uniqId || null,
    order_status: data.responseCode === 0 ? 'processing' : 'failed',
    error_message: data.responseCode !== 0 ? data.message : null,
  })
  .eq('id', order.id);

if (!res.ok || data.responseCode !== 0) {
  console.error('Takbull error:', data);
  process.exit(1);
}

const paymentUrl = data.url || data.redirectUrl;
console.log(JSON.stringify({
  ok: true,
  orderId: order.id,
  orderReference,
  uniqId: data.uniqId,
  amount,
  paymentUrl,
}, null, 2));

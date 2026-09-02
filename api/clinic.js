import { createClerkClient, verifyToken } from '@clerk/backend';

const ADMIN_EMAIL = 'shabankrasniqifizoterapi@gmail.com';
const ALLOWED_PARTIES = ['https://shabankrasniqi.com', 'https://www.shabankrasniqi.com', 'http://localhost:3000', 'http://localhost:5173'];

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

function env(name) {
  return process.env[name] || '';
}

function supabaseConfig() {
  const url = env('SUPABASE_URL') || (env('SUPABASE_PROJECT_REF') ? `https://${env('SUPABASE_PROJECT_REF')}.supabase.co` : '');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Supabase nuk është konfiguruar në Vercel.');
  return { url: url.replace(/\/$/, ''), key };
}

async function sb(path, options = {}) {
  const { url, key } = supabaseConfig();
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const response = await fetch(`${url}/rest/v1/${path}`, { ...options, headers });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = typeof data === 'object' && data?.message ? data.message : (typeof data === 'object' && data?.error ? data.error : `Supabase ${response.status}`);
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function auth(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  const secretKey = env('CLERK_SECRET_KEY');
  if (!secretKey) throw Object.assign(new Error('Clerk Secret Key nuk është konfiguruar në Vercel.'), { status: 503 });
  const payload = await verifyToken(token, { secretKey, authorizedParties: ALLOWED_PARTIES });
  const userId = payload?.sub;
  if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  const clerk = createClerkClient({ secretKey, publishableKey: env('CLERK_PUBLISHABLE_KEY') || env('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') });
  const user = await clerk.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || '';
  return { userId, email, user, isAdmin: email === ADMIN_EMAIL };
}

function adminOnly(actor) {
  if (!actor.isAdmin) throw Object.assign(new Error('Forbidden'), { status: 403 });
}

function queryValue(req, key) {
  return req.query?.[key] ?? '';
}

async function ensurePatient(actor) {
  const email = actor.email || actor.user.primaryEmailAddress?.emailAddress || null;
  const firstName = actor.user.firstName || null;
  const lastName = actor.user.lastName || null;
  const existing = await sb(`patients?select=*&clerk_user_id=eq.${encodeURIComponent(actor.userId)}&limit=1`);
  if (existing?.[0]) {
    const updated = await sb(`patients?id=eq.${existing[0].id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ email, first_name: firstName, last_name: lastName })
    });
    return updated?.[0] || existing[0];
  }
  const created = await sb('patients', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ clerk_user_id: actor.userId, email, first_name: firstName, last_name: lastName })
  });
  return created?.[0];
}

async function patientDashboard(actor) {
  const patient = await ensurePatient(actor);
  const pid = patient.id;
  const [appointments, plans, documents, messages, activity] = await Promise.all([
    sb(`appointments?select=*&patient_id=eq.${pid}&order=starts_at.asc&limit=20`),
    sb(`treatment_plans?select=*,treatment_exercises(*)&patient_id=eq.${pid}&order=created_at.desc&limit=10`),
    sb(`documents?select=id,title,mime_type,size_bytes,uploaded_at&patient_id=eq.${pid}&order=uploaded_at.desc&limit=20`),
    sb(`patient_messages?select=id,sender_role,message,read_at,created_at&patient_id=eq.${pid}&order=created_at.desc&limit=30`),
    sb(`patient_activity?select=*&patient_id=eq.${pid}&order=created_at.desc&limit=30`)
  ]);
  return { patient, appointments, treatmentPlans: plans, documents, messages, activity };
}

async function adminPatient(actor, id) {
  adminOnly(actor);
  if (!id) throw Object.assign(new Error('Patient ID mungon.'), { status: 400 });
  const [patients, appointments, plans, documents, messages, activity] = await Promise.all([
    sb(`patients?select=*&id=eq.${encodeURIComponent(id)}&limit=1`),
    sb(`appointments?select=*&patient_id=eq.${encodeURIComponent(id)}&order=starts_at.asc`),
    sb(`treatment_plans?select=*,treatment_exercises(*)&patient_id=eq.${encodeURIComponent(id)}&order=created_at.desc`),
    sb(`documents?select=*&patient_id=eq.${encodeURIComponent(id)}&order=uploaded_at.desc`),
    sb(`patient_messages?select=*&patient_id=eq.${encodeURIComponent(id)}&order=created_at.desc`),
    sb(`patient_activity?select=*&patient_id=eq.${encodeURIComponent(id)}&order=created_at.desc`)
  ]);
  if (!patients?.[0]) throw Object.assign(new Error('Pacienti nuk u gjet.'), { status: 404 });
  return { patient: patients[0], appointments, treatmentPlans: plans, documents, messages, activity };
}

export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      return res.status(204).end();
    }
    const actor = await auth(req);
    const resource = queryValue(req, 'resource') || 'me';

    if (req.method === 'GET' && resource === 'me') {
      return json(res, 200, await patientDashboard(actor));
    }

    if (req.method === 'GET' && resource === 'patients') {
      adminOnly(actor);
      const search = queryValue(req, 'search').trim();
      const path = search
        ? `patients?select=*&or=(email.ilike.*${encodeURIComponent(search)}*,first_name.ilike.*${encodeURIComponent(search)}*,last_name.ilike.*${encodeURIComponent(search)}*)&order=updated_at.desc&limit=100`
        : 'patients?select=*&order=updated_at.desc&limit=100';
      return json(res, 200, { patients: await sb(path) });
    }

    if (req.method === 'GET' && resource === 'patient') {
      return json(res, 200, await adminPatient(actor, queryValue(req, 'id')));
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const action = body.action || '';

      if (action === 'appointment-request') {
        const patient = await ensurePatient(actor);
        if (!body.starts_at) throw Object.assign(new Error('Data dhe ora mungojnë.'), { status: 400 });
        const created = await sb('appointments', {
          method: 'POST', headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ patient_id: patient.id, starts_at: body.starts_at, duration_minutes: Number(body.duration_minutes || 60), service: body.service || 'Fizioterapi', status: 'requested', location: body.location || 'Klinika', notes: body.notes || null })
        });
        await sb('patient_activity', { method: 'POST', body: JSON.stringify({ patient_id: patient.id, event_type: 'appointment_requested', title: 'Kërkesë për termin', description: body.starts_at }) });
        return json(res, 201, { appointment: created?.[0] });
      }

      if (action === 'message') {
        const patient = await ensurePatient(actor);
        if (!body.message?.trim()) throw Object.assign(new Error('Mesazhi është bosh.'), { status: 400 });
        const created = await sb('patient_messages', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ patient_id: patient.id, sender_role: actor.isAdmin ? 'admin' : 'patient', message: body.message.trim() }) });
        return json(res, 201, { message: created?.[0] });
      }

      if (action === 'create-patient') {
        adminOnly(actor);
        if (!body.clerk_user_id) throw Object.assign(new Error('clerk_user_id mungon.'), { status: 400 });
        const created = await sb('patients', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ clerk_user_id: body.clerk_user_id, email: body.email || null, first_name: body.first_name || null, last_name: body.last_name || null, phone: body.phone || null, date_of_birth: body.date_of_birth || null, notes: body.notes || null }) });
        return json(res, 201, { patient: created?.[0] });
      }

      if (action === 'create-appointment' || action === 'create-plan' || action === 'create-exercise') {
        adminOnly(actor);
        let table = 'appointments';
        let payload = {};
        if (action === 'create-appointment') {
          table = 'appointments';
          payload = { patient_id: body.patient_id, starts_at: body.starts_at, duration_minutes: Number(body.duration_minutes || 60), service: body.service || 'Fizioterapi', status: body.status || 'scheduled', location: body.location || 'Klinika', notes: body.notes || null };
        } else if (action === 'create-plan') {
          table = 'treatment_plans';
          payload = { patient_id: body.patient_id, title: body.title, summary: body.summary || null, goals: body.goals || null, status: body.status || 'active', start_date: body.start_date || null, end_date: body.end_date || null };
        } else {
          table = 'treatment_exercises';
          payload = { treatment_plan_id: body.treatment_plan_id, name: body.name, instructions: body.instructions || null, sets: body.sets == null ? null : Number(body.sets), repetitions: body.repetitions == null ? null : Number(body.repetitions), frequency: body.frequency || null, video_url: body.video_url || null, sort_order: Number(body.sort_order || 0) };
        }
        const created = await sb(table, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(payload) });
        return json(res, 201, { item: created?.[0] });
      }
    }

    if (req.method === 'PATCH') {
      const body = req.body || {};
      const action = body.action || '';
      if (action === 'profile') {
        const patient = await ensurePatient(actor);
        const patch = {};
        for (const key of ['phone', 'date_of_birth', 'notes']) if (body[key] !== undefined) patch[key] = body[key] || null;
        const updated = await sb(`patients?id=eq.${patient.id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch) });
        return json(res, 200, { patient: updated?.[0] || patient });
      }
      adminOnly(actor);
      const table = body.table;
      const id = body.id;
      const allowed = new Set(['patients', 'appointments', 'treatment_plans', 'treatment_exercises', 'documents']);
      if (!allowed.has(table) || !id) throw Object.assign(new Error('Të dhëna të pavlefshme.'), { status: 400 });
      const patch = { ...(body.patch || {}) };
      delete patch.id; delete patch.patient_id; delete patch.clerk_user_id;
      const updated = await sb(`${table}?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(patch) });
      return json(res, 200, { item: updated?.[0] });
    }

    if (req.method === 'DELETE') {
      adminOnly(actor);
      const table = queryValue(req, 'table');
      const id = queryValue(req, 'id');
      const allowed = new Set(['appointments', 'treatment_plans', 'treatment_exercises', 'documents']);
      if (!allowed.has(table) || !id) throw Object.assign(new Error('Të dhëna të pavlefshme.'), { status: 400 });
      await sb(`${table}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { error: 'Endpoint nuk u gjet.' });
  } catch (error) {
    console.error('[clinic]', error);
    return json(res, error.status || 500, { error: error.message || 'Gabim i serverit.' });
  }
}

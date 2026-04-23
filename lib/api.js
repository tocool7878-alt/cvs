async function api(table, method='GET', body=null, query='') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const h = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
  if(method==='POST' || method==='PATCH') h['Prefer'] = 'return=representation';
  const res = await fetch(url, { method, headers: h, body: body ? JSON.stringify(body) : null });
  if(!res.ok){ const e = await res.json().catch(()=>({})); throw new Error(e.message || e.details || res.statusText); }
  if(method==='DELETE') return null;
  return res.json().catch(()=>null);
}
const dbGet = (t, q='') => api(t, 'GET', null, q);
const dbPost = (t, b) => api(t, 'POST', b);
const dbPatch = (t, q, b) => api(t, 'PATCH', b, q);
const dbSoftDel = (t, q) => dbPatch(t, q, { deleted_at: new Date().toISOString() });
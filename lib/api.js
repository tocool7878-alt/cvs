async function api(table, method='GET', body=null, query='') {
  const wireFields = ['wire-core', 'wire-conn-a', 'wire-apc-a', 'wire-conn-b', 'wire-apc-b', 'wire-length'];
  wireFields.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('change', updateWirePreview);
  });
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
//按鈕切換時觸發選單連動
function setFilter(scope, val, el) {
  F[scope] = val;
  const pgKey = { inv: 'inv', in: 'inbound', out: 'outbound' }[scope];
  if (pgKey) PG[pgKey] = 1;

  const group = el.closest('.toggle-group');
  if (group) {
    group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  }
  el.classList.add('active');

  // 若切換庫存篩選，連動更新品項下拉選單的顯示與內容
  if (scope === 'inv') {
    const itemSel = document.getElementById('inv-item-filter');
    if (itemSel) itemSel.value = ''; // 切換分類時重設品項
    updateInvItemSelect();
    renderInventory();
  } else if (scope === 'in') {
    renderInbound();
  } else {
    renderOutbound();
  }
}

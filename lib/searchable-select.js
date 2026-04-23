function normalizeStr(str) { return String(str||'').toLowerCase().replace(/[\s\-_()"]/g, ''); }
function isMatchSel(target, kw) {
  if(!target || !kw) return false;
  try {
    const t = normalizeStr(target), k = normalizeStr(kw);
    if(t.includes(k)) return true;
    const m = t.match(/^(lc|sc|fc|l|s|f)(apc)?(lc|sc|fc|l|s|f)(apc)?(.*)/);
    if(m) { const fl = (m[3]||'') + (m[4]||'') + m[1] + (m[2]||'') + (m[5]||''); if(fl.includes(k)) return true; }
    return false;
  } catch(e) { return false; }
}
function fuzzyMatch(query, target) {
  if(!query) return true;
  const q = query.toLowerCase().replace(/\s+/g, ''), t = target.toLowerCase();
  if(t.includes(q)) return true;
  if(q.length >= 2 && t.includes([...q].reverse().join(''))) return true;
  return false;
}
function fuzzyMatchAny(query, ...fields) { return fields.some(f => f && (isMatchSel(f, query) || fuzzyMatch(query, String(f)))); }

function buildSelOptions(key, items) { selItems[key] = items; renderSelOptions(key, ''); }
function filterSelOptions(key) { renderSelOptions(key, document.getElementById(key+'-search').value); }
function renderSelOptions(key, kw) {
  const list = document.getElementById(key+'-list'); if(!list) return;
  const src = selItems[key] || [];
  const filtered = kw ? src.filter(i => isMatchSel(i.label, kw)) : src;
  if(!filtered.length) { list.innerHTML = '<div class="sel-option" style="color:var(--text3);cursor:default">無符合結果</div>'; return; }
  const curVal = document.getElementById(key)?.value || '';
  list.innerHTML = filtered.map(i => `<div class="sel-option${i.value === curVal ? ' selected' : ''}" data-key="${key}" data-val="${i.value}" data-label="${encodeURIComponent(i.label)}">${i.label}</div>`).join('');
  list.querySelectorAll('.sel-option').forEach(el => {
    el.addEventListener('mousedown', function(e){
      e.preventDefault(); pickSelOption(this.dataset.key, this.dataset.val, decodeURIComponent(this.dataset.label||''));
    });
  });
}
function toggleSelDrop(key) {
  const drop = document.getElementById(key+'-drop'); const trigger = document.getElementById(key+'-trigger');
  const wasOpen = drop.classList.contains('open');
  document.querySelectorAll('.sel-dropdown.open').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.sel-trigger.open').forEach(t => t.classList.remove('open'));
  if(!wasOpen) { drop.classList.add('open'); trigger.classList.add('open'); const si = document.getElementById(key+'-search'); if(si){ si.value=''; renderSelOptions(key,''); setTimeout(()=>si.focus(),50); } }
}
function pickSelOption(key, value, label) {
  document.getElementById(key).value = value; document.getElementById(key+'-trigger').textContent = label || '— 請選擇 —';
  document.getElementById(key+'-drop').classList.remove('open'); document.getElementById(key+'-trigger').classList.remove('open');
  if(key === 'in-item') onItemChange('in'); if(key === 'out-item') onItemChange('out');
}
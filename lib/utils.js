function showLoad(on) {
  if (on && !loadEl) { loadEl = document.createElement('div'); loadEl.className = 'loading-bar'; document.body.appendChild(loadEl); }
  else if (!on && loadEl) { loadEl.remove(); loadEl = null; }
}
function showToast(msg, type='ok') {
  const el = document.getElementById('toast');
  el.className = 'toast ' + type; el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 3200);
}

function nextId(list, prefix, digits=3) {
  const nums = list.map(x => parseInt(x.id.slice(1))).filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return prefix + String(next).padStart(next > 999 ? 4 : digits, '0');
}
function fmtTime(t) {
  if(!t) return '—'; const d = new Date(t);
  return d.toLocaleDateString('zh-TW') + ' ' + d.toTimeString().slice(0,5);
}
function localISO() {
  const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16);
}
function toLocalInputFormat(utcString) {
  if (!utcString) return localISO();
  const d = new Date(utcString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}
function buildWireDisplayName(connA, apcA, connB, apcB) {
  return connA[0] + (apcA ? '(APC)' : '') + connB[0] + (apcB ? '(APC)' : '');
}
function getItemFullName(info, type) {
  if (!info) return '';
  if (type === 'wire') {
    let name = info.display_name || '';
    if (info.brand) name += '-' + info.brand;
    if (info.length) name += '-' + info.length;
    return name;
  } else {
    let name = info.category || '';
    if (info.brand) name += '(' + info.brand + ')';
    if (info.spec) name += '-' + info.spec;
    return name || info.display_name;
  }
}
function calcStock(itemId, itemType) {
  const item = itemType === 'wire' ? C.wires.find(w => w.id === itemId) : C.equips.find(e => e.id === itemId);
  const init = item ? item.init_stock : 0;
  const ti = C.inbound.filter(r => r.item_id === itemId && r.item_type === itemType).reduce((s, r) => s + r.qty, 0);
  const to = C.outbound.filter(r => r.item_id === itemId && r.item_type === itemType).reduce((s, r) => s + r.qty, 0);
  return { init, in: ti, out: to, stock: init + ti - to };
}
function getItemInfo(id, type) { return type === 'wire' ? C.wires.find(x => x.id === id) : C.equips.find(x => x.id === id); }

function sortData(arr, col, dir) {
  return [...arr].sort((a, b) => {
    let va = a[col], vb = b[col];
    if(typeof va === 'string' && typeof vb === 'string') return dir * va.localeCompare(vb, 'zh-TW');
    return dir * ((va || 0) - (vb || 0));
  });
}
function setupSort(tblEl, stateKey, renderFn) {
  tblEl.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      if(S[stateKey].col === col) S[stateKey].dir *= -1; else { S[stateKey].col = col; S[stateKey].dir = -1; }
      tblEl.querySelectorAll('th').forEach(h => { h.classList.remove('sort-asc', 'sort-desc'); const i = h.querySelector('.sort-icon'); if(i) i.textContent = '↕'; });
      th.classList.add(S[stateKey].dir === 1 ? 'sort-asc' : 'sort-desc');
      const si = th.querySelector('.sort-icon'); if(si) si.textContent = S[stateKey].dir === 1 ? '↑' : '↓';
      renderFn();
    });
  });
}
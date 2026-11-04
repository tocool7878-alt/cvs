/**
 * 計算指定品項在「特定紀錄完成當下」的結存數量
 * @param {string} itemId - 品項 ID
 * @param {string} itemType - wire / equip / power
 * @param {string} targetTime - 該筆紀錄的時間 (ISO 字串)
 * @param {string} targetId - 該筆紀錄的編號 (I001, O001)，用於時間完全相同時防呆
 */
function calcStockAtTime(itemId, itemType, targetTime, targetId) {
  const item = getItemInfo(itemId, itemType);
  const init = item ? (item.init_stock || 0) : 0;
  
  const targetT = new Date(targetTime).getTime();

  // 篩選出發生時間「早於或等於」該筆紀錄的所有進料
  const pastIn = C.inbound.filter(r => {
    if (r.item_id !== itemId || r.item_type !== itemType) return false;
    const t = new Date(r.time).getTime();
    if (t < targetT) return true;
    if (t === targetT) return r.id <= targetId; // 若同一分鐘建立，以 ID 順序為準
    return false;
  }).reduce((sum, r) => sum + r.qty, 0);

  // 篩選出發生時間「早於或等於」該筆紀錄的所有領料
  const pastOut = C.outbound.filter(r => {
    if (r.item_id !== itemId || r.item_type !== itemType) return false;
    const t = new Date(r.time).getTime();
    if (t < targetT) return true;
    if (t === targetT) return r.id <= targetId;
    return false;
  }).reduce((sum, r) => sum + r.qty, 0);

  return init + pastIn - pastOut;
}

function showLoad(on) {
  if (on && !loadEl) { loadEl = document.createElement('div'); loadEl.className = 'loading-bar'; document.body.appendChild(loadEl); }
  else if (!on && loadEl) { loadEl.remove(); loadEl = null; }
}
function showToast(msg, type='ok') {
  const el = document.getElementById('toast');
  el.className = 'toast ' + type; el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 3200);
}

/**
 * 自動產生下一個不重複編號（例如 W001, W002...）
 * 包含既有快取與進出料紀錄比對，確保號碼遞增不撞號
 */
function nextId(list, prefix, pad = 3) {
  if (!list || !list.length) return prefix + String(1).padStart(pad, '0');
  
  // 取出所有符合前綴的數字編號
  const nums = list
    .map(x => {
      const id = String(x.id || x);
      if (id.startsWith(prefix)) {
        const numPart = parseInt(id.replace(prefix, ''), 10);
        return isNaN(numPart) ? 0 : numPart;
      }
      return 0;
    })
    .filter(n => n > 0);

  const max = nums.length ? Math.max(...nums) : 0;
  return prefix + String(max + 1).padStart(pad, '0');
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
    const core = info.core_type ? `(${info.core_type})` : '(雙)';
    let name = core + (info.display_name || '');
    // 線材無品牌，直接接長度
    if (info.length) name += '-' + info.length;
    return name;
  } else {
    // 設備與電力設備：種類(品牌)-規格
    let name = info.category || '';
    if (info.brand) name += '(' + info.brand + ')';
    if (info.spec) name += '-' + info.spec;
    return name || info.display_name;
  }
}

function calcStock(itemId, itemType) {
  let item = null;
  if (itemType === 'wire') item = C.wires.find(w => w.id === itemId);
  else if (itemType === 'equip') item = C.equips.find(e => e.id === itemId);
  else if (itemType === 'power') item = C.powers.find(p => p.id === itemId);

  const init = item ? item.init_stock : 0;
  const ti = C.inbound.filter(r => r.item_id === itemId && r.item_type === itemType).reduce((s, r) => s + r.qty, 0);
  const to = C.outbound.filter(r => r.item_id === itemId && r.item_type === itemType).reduce((s, r) => s + r.qty, 0);
  return { init, in: ti, out: to, stock: init + ti - to };
}

function getItemInfo(id, type) {
  if (type === 'wire') return C.wires.find(x => x.id === id);
  if (type === 'equip') return C.equips.find(x => x.id === id);
  if (type === 'power') return C.powers.find(x => x.id === id);
  return null;
}

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

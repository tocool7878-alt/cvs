function goPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  ['inventory','inbound','outbound','dashboard','settings'].forEach((n, i) => {
    if(n === name) document.querySelectorAll('.nav-tab')[i].classList.add('active');
  });
  if(name === 'inventory') renderInventory();
  else if(name === 'inbound') renderInbound();
  else if(name === 'outbound') renderOutbound();
  else if(name === 'dashboard') { populateDashFilters(); renderDashboard(); }
  else if(name === 'settings') renderSettings();
}
function switchSettingTab(tab) {
  ['wire','equip','persons','purposes','locations','brands'].forEach(t => {
    const el = document.getElementById('stab-' + t); if(el) el.style.display = t === tab ? '' : 'none';
  });
  document.querySelectorAll('.page-tab').forEach((el, i) => {
    const tabs = ['wire','equip','persons','purposes','locations','brands'];
    el.classList.toggle('active', tabs[i] === tab);
  });
}
function setFilter(scope, val, el) {
  F[scope] = val; const pgKey = { inv: 'inv', in: 'inbound', out: 'outbound' }[scope];
  if(pgKey) PG[pgKey] = 1;
  const pg = { inv: 'page-inventory', in: 'page-inbound', out: 'page-outbound' }[scope];
  document.querySelectorAll('#' + pg + ' .toggle-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  if(scope === 'inv') renderInventory(); else if(scope === 'in') renderInbound(); else renderOutbound();
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function _openModal(id) {
  document.getElementById(id).classList.add('open');
  setTimeout(() => {
    const m = document.getElementById(id); const first = m.querySelector('input:not([readonly]):not([type=hidden]),select,textarea');
    if(first) first.focus();
  }, 80);
}

function setModalType(scope, type) {
  MT[scope] = type; const isWire = type === 'wire';
  document.getElementById(scope+'-twire').className = 'btn btn-sm ' + (isWire ? 'btn-primary' : 'btn-ghost');
  document.getElementById(scope+'-tequip').className = 'btn btn-sm ' + (isWire ? 'btn-ghost' : 'btn-purple');
  document.getElementById(scope+'-item-lbl').textContent = isWire ? '線材規格 *' : '設備品項 *';
  let itemList = [];
  if(isWire) {
    let items = scope === 'out' ? C.wires.filter(w => calcStock(w.id, 'wire').stock > 0) : C.wires;
    items = [...items].sort((a,b) => getItemFullName(a, 'wire').localeCompare(getItemFullName(b, 'wire')));
    itemList = items.map(w => { const st = scope === 'out' ? ` (庫存:${calcStock(w.id, 'wire').stock})` : ''; return { value: w.id, label: getItemFullName(w, 'wire') + st }; });
  } else {
    let items = scope === 'out' ? C.equips.filter(e => calcStock(e.id, 'equip').stock > 0) : C.equips;
    items = [...items].sort((a,b) => getItemFullName(a, 'equip').localeCompare(getItemFullName(b, 'equip')));
    itemList = items.map(e => { const st = scope === 'out' ? ` (庫存:${calcStock(e.id, 'equip').stock})` : ''; return { value: e.id, label: getItemFullName(e, 'equip') + st }; });
  }
  buildSelOptions(scope+'-item', itemList);
  document.getElementById(scope+'-item-trigger').textContent = '— 請選擇 —';
  document.getElementById(scope+'-item').value = ''; document.getElementById(scope+'-unit').value = '';
  const psel = document.getElementById(scope+'-person');
  psel.innerHTML = '<option value="">— 請選擇 —</option>' + C.persons.map(p => `<option value="${p.name}">${p.name}${p.dept ? ' / '+p.dept : ''}</option>`).join('');
}
function onItemChange(scope) {
  const id = document.getElementById(scope+'-item').value; if(!id) { document.getElementById(scope+'-unit').value = ''; return; }
  const info = getItemInfo(id, MT[scope]); document.getElementById(scope+'-unit').value = info ? info.unit : '';
  if(scope === 'out') checkOutQty();
}

async function loadAll() {
  showLoad(true);
  try {
    const [wires, equips, equipCats, persons, purposes, locations, brands, inbound, outbound] = await Promise.all([
      dbGet('wire_items', '?deleted_at=is.null&order=id'), dbGet('equip_items', '?deleted_at=is.null&order=id'),
      dbGet('equip_categories', '?deleted_at=is.null&order=sort_order'), dbGet('persons', '?deleted_at=is.null&order=name'),
      dbGet('purposes', '?deleted_at=is.null&order=name'), dbGet('locations', '?deleted_at=is.null&order=sort_order'),
      dbGet('brands', '?deleted_at=is.null&order=sort_order'), dbGet('inbound', '?deleted_at=is.null&order=id.desc'),
      dbGet('outbound', '?deleted_at=is.null&order=id.desc'),
    ]);
    C = { wires, equips, equipCats, persons, purposes, locations, brands, inbound, outbound };
  } catch(e) { showToast('連線失敗：'+e.message, 'err'); }
  showLoad(false);
}

// 綁定全域監聽事件
document.addEventListener('DOMContentLoaded', () => {
  // 設定表格排序
  const inTbl = document.querySelector('th[data-tbl="inbound"]')?.closest('table'); if(inTbl) setupSort(inTbl, 'inbound', renderInbound);
  const outTbl = document.querySelector('th[data-tbl="outbound"]')?.closest('table'); if(outTbl) setupSort(outTbl, 'outbound', renderOutbound);
  
  // 回頂部按鈕
  const mainEl = document.querySelector('.main');
  if(mainEl) mainEl.addEventListener('scroll', function() {
    const btn = document.getElementById('scroll-top-btn'); if(btn) btn.classList.toggle('visible', this.scrollTop > 200);
  });
  
  // 綁定系統設定中的預覽事件
  const wireFields = ['wire-conn-a','wire-apc-a','wire-conn-b','wire-apc-b','wire-length','wire-brand'];
  wireFields.forEach(id => { const el = document.getElementById(id); if(el) el.addEventListener('change', updateWirePreview); });
  ['wire-apc-a','wire-apc-b'].forEach(id => { const el = document.getElementById(id); if(el) el.addEventListener('change', updateWirePreview); });
  const wlc = document.getElementById('wire-length-custom'); if(wlc) wlc.addEventListener('input', updateWirePreview);
  const wl = document.getElementById('wire-length');
  if(wl) wl.addEventListener('change', function() {
    document.getElementById('wire-length-custom').style.display = this.value === '__custom__' ? '' : 'none'; updateWirePreview();
  });
  const eu = document.getElementById('equip-unit');
  if(eu) eu.addEventListener('change', function() {
    document.getElementById('equip-unit-custom').style.display = this.value === '__custom__' ? '' : 'none';
  });

  // 初始載入
  loadAll().then(() => renderInventory());
});

document.addEventListener('keydown', e => {
  if(e.key === 'Escape') {
    const open = [...document.querySelectorAll('.overlay.open')]; if(open.length) closeModal(open[open.length-1].id);
  }
  if(e.key === 'Enter' && !e.shiftKey) {
    const open = [...document.querySelectorAll('.overlay.open')]; if(!open.length) return;
    const active = open[open.length-1];
    if(document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.closest('.sel-search-box')) return;
    const map = { 'modal-wire': submitWire, 'modal-equip': submitEquip, 'modal-person': submitPerson, 'modal-purpose': submitPurpose, 'modal-location': submitLocation, 'modal-brand': submitBrand, 'modal-inbound': submitInbound, 'modal-outbound': submitOutbound };
    const fn = map[active.id]; if(fn) { e.preventDefault(); fn(); }
  }
});
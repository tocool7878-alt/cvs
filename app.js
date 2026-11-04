// ==================== APP 控制器 ====================

function goPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + name);
  if (target) target.classList.add('active');

  const navs = ['inventory', 'inbound', 'outbound', 'dashboard', 'settings'];
  document.querySelectorAll('.nav-tab').forEach((t, i) => {
    t.classList.toggle('active', navs[i] === name);
  });

  if (name === 'inventory') {
    if (typeof updateInvItemSelect === 'function') updateInvItemSelect();
    if (typeof renderInventory === 'function') renderInventory();
  } else if (name === 'inbound') {
    if (typeof renderInbound === 'function') renderInbound();
  } else if (name === 'outbound') {
    if (typeof renderOutbound === 'function') renderOutbound();
  } else if (name === 'dashboard') {
    if (typeof populateDashFilters === 'function') populateDashFilters();
    if (typeof renderDashboard === 'function') renderDashboard();
  } else if (name === 'settings') {
    if (typeof renderSettings === 'function') renderSettings();
  }
}

function switchSettingTab(tab) {
  const tabs = ['wire', 'equip', 'power', 'persons', 'purposes', 'locations', 'brands'];
  tabs.forEach(t => {
    const el = document.getElementById('stab-' + t);
    if (el) el.style.display = (t === tab ? '' : 'none');
  });
  document.querySelectorAll('.page-tab').forEach((el, i) => {
    el.classList.toggle('active', tabs[i] === tab);
  });
}

function setFilter(scope, val, el) {
  F[scope] = val;
  const pgKey = { inv: 'inv', in: 'inbound', out: 'outbound' }[scope];
  if (pgKey) PG[pgKey] = 1;

  const group = el.closest('.toggle-group');
  if (group) group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');

  if (scope === 'inv') {
    const itemSel = document.getElementById('inv-item-filter');
    if (itemSel) itemSel.value = '';
    if (typeof updateInvItemSelect === 'function') updateInvItemSelect();
    if (typeof renderInventory === 'function') renderInventory();
  } else if (scope === 'in') {
    if (typeof renderInbound === 'function') renderInbound();
  } else {
    if (typeof renderOutbound === 'function') renderOutbound();
  }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}

function _openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('open');
  setTimeout(() => {
    const first = m.querySelector('input:not([readonly]):not([type=hidden]),select,textarea');
    if (first) first.focus();
  }, 80);
}

function setModalType(scope, type) {
  MT[scope] = type;
  const isWire = type === 'wire', isEquip = type === 'equip', isPower = type === 'power';

  const btnW = document.getElementById(scope + '-twire');
  const btnE = document.getElementById(scope + '-tequip');
  const btnP = document.getElementById(scope + '-tpower');
  if (btnW) btnW.className = 'btn btn-sm ' + (isWire ? 'btn-primary' : 'btn-ghost');
  if (btnE) btnE.className = 'btn btn-sm ' + (isEquip ? 'btn-purple' : 'btn-ghost');
  if (btnP) btnP.className = 'btn btn-sm ' + (isPower ? 'btn-warn' : 'btn-ghost');

  const lbl = document.getElementById(scope + '-item-lbl');
  if (lbl) lbl.textContent = isWire ? '線材規格 *' : (isPower ? '電力設備規格 *' : '設備品項 *');

  let list = [];
  if (isWire) {
    let items = scope === 'out' ? (C.wires || []).filter(w => calcStock(w.id, 'wire').stock > 0) : (C.wires || []);
    list = [...items].sort((a, b) => getItemFullName(a, 'wire').localeCompare(getItemFullName(b, 'wire')))
      .map(w => ({ value: w.id, label: getItemFullName(w, 'wire') + (scope === 'out' ? ` (庫存:${calcStock(w.id, 'wire').stock})` : '') }));
  } else if (isEquip) {
    let items = scope === 'out' ? (C.equips || []).filter(e => calcStock(e.id, 'equip').stock > 0) : (C.equips || []);
    list = [...items].sort((a, b) => getItemFullName(a, 'equip').localeCompare(getItemFullName(b, 'equip')))
      .map(e => ({ value: e.id, label: getItemFullName(e, 'equip') + (scope === 'out' ? ` (庫存:${calcStock(e.id, 'equip').stock})` : '') }));
  } else if (isPower) {
    let items = scope === 'out' ? (C.powers || []).filter(p => calcStock(p.id, 'power').stock > 0) : (C.powers || []);
    list = [...items].sort((a, b) => getItemFullName(a, 'power').localeCompare(getItemFullName(b, 'power')))
      .map(p => ({ value: p.id, label: getItemFullName(p, 'power') + (scope === 'out' ? ` (庫存:${calcStock(p.id, 'power').stock})` : '') }));
  }

  if (typeof buildSelOptions === 'function') buildSelOptions(scope + '-item', list);
  const trigger = document.getElementById(scope + '-item-trigger');
  if (trigger) trigger.textContent = '— 請選擇 —';
  const itemInput = document.getElementById(scope + '-item');
  if (itemInput) itemInput.value = '';
  const unitInput = document.getElementById(scope + '-unit');
  if (unitInput) unitInput.value = '';

  const psel = document.getElementById(scope + '-person');
  if (psel) {
    psel.innerHTML = '<option value="">— 請選擇 —</option>' + (C.persons || []).map(p => `<option value="${p.name}">${p.name}${p.dept ? ' / ' + p.dept : ''}</option>`).join('');
  }
}

function onItemChange(scope) {
  const id = document.getElementById(scope + '-item')?.value || '';
  const unitInput = document.getElementById(scope + '-unit');
  if (!id) { if (unitInput) unitInput.value = ''; return; }
  const info = getItemInfo(id, MT[scope]);
  if (unitInput) unitInput.value = info ? info.unit : '';
  if (scope === 'out' && typeof checkOutQty === 'function') checkOutQty();
}

async function loadAll() {
  showLoad(true);
  try {
    const [wires, equips, equipCats, powers, powerCats, persons, purposes, locations, brands, inbound, outbound] = await Promise.all([
      dbGet('wire_items', '?deleted_at=is.null&order=id'),
      dbGet('equip_items', '?deleted_at=is.null&order=id'),
      dbGet('equip_categories', '?deleted_at=is.null&order=sort_order'),
      dbGet('power_items', '?deleted_at=is.null&order=id'),
      dbGet('power_categories', '?deleted_at=is.null&order=sort_order'),
      dbGet('persons', '?deleted_at=is.null&order=name'),
      dbGet('purposes', '?deleted_at=is.null&order=name'),
      dbGet('locations', '?deleted_at=is.null&order=sort_order'),
      dbGet('brands', '?deleted_at=is.null&order=sort_order'),
      dbGet('inbound', '?deleted_at=is.null&order=time.desc'),
      dbGet('outbound', '?deleted_at=is.null&order=time.desc'),
    ]);
    C = { wires, equips, equipCats, powers, powerCats, persons, purposes, locations, brands, inbound, outbound };
  } catch (e) {
    showToast('連線失敗：' + e.message, 'err');
  }
  showLoad(false);
}

document.addEventListener('DOMContentLoaded', () => {
  const inTbl = document.querySelector('th[data-tbl="inbound"]')?.closest('table');
  if (inTbl && typeof setupSort === 'function') setupSort(inTbl, 'inbound', renderInbound);
  const outTbl = document.querySelector('th[data-tbl="outbound"]')?.closest('table');
  if (outTbl && typeof setupSort === 'function') setupSort(outTbl, 'outbound', renderOutbound);
  const invTbl = document.querySelector('th[data-tbl="inventory"]')?.closest('table');
  if (invTbl && typeof setupSort === 'function') setupSort(invTbl, 'inv', renderInventory);

  const mainEl = document.querySelector('.main');
  if (mainEl) {
    mainEl.addEventListener('scroll', function() {
      const btn = document.getElementById('scroll-top-btn');
      if (btn) btn.classList.toggle('visible', this.scrollTop > 200);
    });
  }

  const wireFields = ['wire-core', 'wire-conn-a', 'wire-apc-a', 'wire-conn-b', 'wire-apc-b', 'wire-length'];
  wireFields.forEach(id => {
    const el = document.getElementById(id);
    if (el && typeof updateWirePreview === 'function') el.addEventListener('change', updateWirePreview);
  });
  const wlc = document.getElementById('wire-length-custom');
  if (wlc && typeof updateWirePreview === 'function') wlc.addEventListener('input', updateWirePreview);
  const wl = document.getElementById('wire-length');
  if (wl) {
    wl.addEventListener('change', function() {
      const customEl = document.getElementById('wire-length-custom');
      if (customEl) customEl.style.display = this.value === '__custom__' ? '' : 'none';
      if (typeof updateWirePreview === 'function') updateWirePreview();
    });
  }

  const eu = document.getElementById('equip-unit');
  if (eu) {
    eu.addEventListener('change', function() {
      const customEl = document.getElementById('equip-unit-custom');
      if (customEl) customEl.style.display = this.value === '__custom__' ? '' : 'none';
    });
  }
  const pu = document.getElementById('power-unit');
  if (pu) {
    pu.addEventListener('change', function() {
      const customEl = document.getElementById('power-unit-custom');
      if (customEl) customEl.style.display = this.value === '__custom__' ? '' : 'none';
    });
  }

  loadAll().then(() => {
    if (typeof updateInvItemSelect === 'function') updateInvItemSelect();
    if (typeof renderInventory === 'function') renderInventory();
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const open = [...document.querySelectorAll('.overlay.open')];
    if (open.length) closeModal(open[open.length - 1].id);
  }
  if (e.key === 'Enter' && !e.shiftKey) {
    const open = [...document.querySelectorAll('.overlay.open')];
    if (!open.length) return;
    const active = open[open.length - 1];
    if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.closest('.sel-search-box')) return;
    const map = {
      'modal-wire': typeof submitWire === 'function' ? submitWire : null,
      'modal-equip': typeof submitEquip === 'function' ? submitEquip : null,
      'modal-power': typeof submitPower === 'function' ? submitPower : null,
      'modal-person': typeof submitPerson === 'function' ? submitPerson : null,
      'modal-purpose': typeof submitPurpose === 'function' ? submitPurpose : null,
      'modal-location': typeof submitLocation === 'function' ? submitLocation : null,
      'modal-brand': typeof submitBrand === 'function' ? submitBrand : null,
      'modal-inbound': typeof submitInbound === 'function' ? submitInbound : null,
      'modal-outbound': typeof submitOutbound === 'function' ? submitOutbound : null
    };
    const fn = map[active.id];
    if (fn) {
      e.preventDefault();
      fn();
    }
  }
});

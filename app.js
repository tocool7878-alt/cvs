// ==================== APP 主程式與事件控制 ====================

// 頁面導航切換
function goPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById('page-' + name);
  if (targetPage) targetPage.classList.add('active');
  
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  ['inventory', 'inbound', 'outbound', 'dashboard', 'settings'].forEach((n, i) => {
    const tabs = document.querySelectorAll('.nav-tab');
    if (n === name && tabs[i]) tabs[i].classList.add('active');
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

// 系統設定頁籤切換
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

// 分類過濾按鈕切換
function setFilter(scope, val, el) {
  F[scope] = val;
  const pgKey = { inv: 'inv', in: 'inbound', out: 'outbound' }[scope];
  if (pgKey) PG[pgKey] = 1;

  const group = el.closest('.toggle-group');
  if (group) {
    group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  }
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

// 彈窗控制
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

// 進領料彈窗：切換線材 / 設備 / 電力
function setModalType(scope, type) {
  MT[scope] = type;
  const isWire = type === 'wire';
  const isEquip = type === 'equip';
  const isPower = type === 'power';

  const btnW = document.getElementById(scope + '-twire');
  const btnE = document.getElementById(scope + '-tequip');
  const btnP = document.getElementById(scope + '-tpower');
  if (btnW) btnW.className = 'btn btn-sm ' + (isWire ? 'btn-primary' : 'btn-ghost');
  if (btnE) btnE.className = 'btn btn-sm ' + (isEquip ? 'btn-purple' : 'btn-ghost');
  if (btnP) btnP.className = 'btn btn-sm ' + (isPower ? 'btn-warn' : 'btn-ghost');

  const lbl = document.getElementById(scope + '-item-lbl');
  if (lbl) {
    lbl.textContent = isWire ? '線材規格 *' : (isPower ? '電力設備規格 *' : '設備品項 *');
  }

  let itemList = [];
  if (isWire) {
    let items = scope === 'out' ? (C.wires || []).filter(w => calcStock(w.id, 'wire').stock > 0) : (C.wires || []);
    items = [...items].sort((a, b) => getItemFullName(a, 'wire').localeCompare(getItemFullName(b,

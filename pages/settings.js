function _populateBrandSel(selId) {
  const sel = document.getElementById(selId);
  sel.innerHTML = '<option value="">— 不指定 —</option>' + C.brands.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
}
function renderSettings() {
  const wKw = (document.getElementById('wire-search')?.value||''), eKw = (document.getElementById('equip-search')?.value||'');
  const fw = wKw ? C.wires.filter(w => fuzzyMatchAny(wKw, getItemFullName(w,'wire'), w.id)) : C.wires;
  const fe = eKw ? C.equips.filter(e => fuzzyMatchAny(eKw, getItemFullName(e,'equip'), e.id, e.category)) : C.equips;
  document.getElementById('tbl-wire').innerHTML = pagedRows(fw, 'wire').map(w => `<tr>
    <td class="mono">${w.id}</td><td>${getItemFullName(w,'wire')}</td>
    <td>${w.conn_a}${w.conn_a_apc?' (APC)':''}</td><td>${w.conn_b}${w.conn_b_apc?' (APC)':''}</td>
    <td>${w.brand||'—'}</td><td>${w.length}</td><td>${w.unit}</td><td class="mono">${w.init_stock}</td>
    <td><div class="td-actions"><button class="btn btn-warn btn-xs" onclick="openWireModal('${w.id}')">修改</button><button class="btn btn-danger btn-xs" onclick="softDelWire('${w.id}')">刪除</button></div></td></tr>`).join('') || '<tr><td colspan="9" class="empty">無符合項目</td></tr>';
  renderPagination('wire-pg', fw.length, 'wire', renderSettings);
  document.getElementById('tbl-equip').innerHTML = pagedRows(fe, 'equip').map(e => `<tr>
    <td class="mono">${e.id}</td><td>${e.category}</td><td>${e.brand||'—'}</td><td>${e.spec}</td>
    <td>${e.unit}</td><td class="mono">${e.init_stock}</td>
    <td><div class="td-actions"><button class="btn btn-warn btn-xs" onclick="openEquipModal('${e.id}')">修改</button><button class="btn btn-danger btn-xs" onclick="softDelEquip('${e.id}')">刪除</button></div></td></tr>`).join('') || '<tr><td colspan="7" class="empty">無符合項目</td></tr>';
  renderPagination('equip-pg', fe.length, 'equip', renderSettings);
  document.getElementById('tbl-persons').innerHTML = C.persons.map(p => `<tr><td>${p.name}</td><td>${p.dept||''}</td><td><div class="td-actions"><button class="btn btn-warn btn-xs" onclick="openPersonModal('${p.name}')">修改</button><button class="btn btn-danger btn-xs" onclick="softDelPerson('${encodeURIComponent(p.name)}')">刪除</button></div></td></tr>`).join('') || '<tr><td colspan="3" class="empty">尚無人員</td></tr>';
  document.getElementById('tbl-purposes').innerHTML = C.purposes.map(p => `<tr><td>${p.name}</td><td><div class="td-actions"><button class="btn btn-warn btn-xs" onclick="openPurposeModal('${p.name}')">修改</button><button class="btn btn-danger btn-xs" onclick="softDelPurpose('${encodeURIComponent(p.name)}')">刪除</button></div></td></tr>`).join('') || '<tr><td colspan="2" class="empty">尚無用途</td></tr>';
  document.getElementById('tbl-locations').innerHTML = C.locations.map(l => `<tr><td>${l.name}</td><td>${l.is_other?'✓ 需填說明':''}</td><td><div class="td-actions"><button class="btn btn-warn btn-xs" onclick="openLocationModal('${l.name}')">修改</button><button class="btn btn-danger btn-xs" onclick="softDelLocation('${encodeURIComponent(l.name)}')">刪除</button></div></td></tr>`).join('') || '<tr><td colspan="3" class="empty">尚無地點</td></tr>';
  const brandTbl = document.getElementById('tbl-brands');
  if(brandTbl) brandTbl.innerHTML = C.brands.map(b => `<tr><td>${b.name}</td><td><div class="td-actions"><button class="btn btn-warn btn-xs" onclick="openBrandModal('${b.name}')">修改</button><button class="btn btn-danger btn-xs" onclick="softDelBrand('${encodeURIComponent(b.name)}')">刪除</button></div></td></tr>`).join('') || '<tr><td colspan="2" class="empty">尚無品牌</td></tr>';
}

function updateWirePreview() {
  const a = document.getElementById('wire-conn-a').value, aApc = document.getElementById('wire-apc-a').checked;
  const b = document.getElementById('wire-conn-b').value, bApc = document.getElementById('wire-apc-b').checked;
  const len = document.getElementById('wire-length').value === '__custom__' ? document.getElementById('wire-length-custom').value : document.getElementById('wire-length').value;
  const brand = document.getElementById('wire-brand').value;
  const base = buildWireDisplayName(a, aApc, b, bApc);
  document.getElementById('wire-preview').textContent = getItemFullName({ display_name: base, brand: brand, length: len }, 'wire');
}
function openWireModal(editId=null) {
  document.getElementById('wire-eid').value = editId || ''; document.getElementById('mwire-title').textContent = editId ? '修改線材品項' : '新增線材品項';
  _populateBrandSel('wire-brand');
  if(editId) {
    const w = C.wires.find(x => x.id === editId); if(!w) return;
    document.getElementById('wire-id').value = w.id; document.getElementById('wire-conn-a').value = w.conn_a;
    document.getElementById('wire-apc-a').checked = w.conn_a_apc; document.getElementById('wire-conn-b').value = w.conn_b;
    document.getElementById('wire-apc-b').checked = w.conn_b_apc; document.getElementById('wire-brand').value = w.brand || '';
    document.getElementById('wire-init').value = w.init_stock;
    const stdLens = ['1M','2M','3M','5M','6M','8M','10M','12M','15M','20M'];
    if(stdLens.includes(w.length)) { document.getElementById('wire-length').value = w.length; document.getElementById('wire-length-custom').style.display = 'none'; }
    else { document.getElementById('wire-length').value = '__custom__'; document.getElementById('wire-length-custom').style.display = ''; document.getElementById('wire-length-custom').value = w.length; }
  } else {
    document.getElementById('wire-id').value = nextId(C.wires, 'W'); document.getElementById('wire-conn-a').value = 'LC';
    document.getElementById('wire-apc-a').checked = false; document.getElementById('wire-conn-b').value = 'LC';
    document.getElementById('wire-apc-b').checked = false; document.getElementById('wire-brand').value = '';
    document.getElementById('wire-length').value = ''; document.getElementById('wire-length-custom').style.display = 'none';
    document.getElementById('wire-length-custom').value = ''; document.getElementById('wire-init').value = '0';
    document.getElementById('wire-brand-new').value = '';
  }
  updateWirePreview(); _openModal('modal-wire');
}
async function addBrandFromWire() {
  const name = document.getElementById('wire-brand-new').value.trim(); if(!name) { showToast('請輸入品牌名稱', 'err'); return; }
  if(C.brands.find(b => b.name === name)) { showToast('此品牌已存在', 'err'); return; }
  try { showLoad(true); await dbPost('brands', { name, sort_order: C.brands.length + 1 }); C.brands = await dbGet('brands', '?deleted_at=is.null&order=sort_order'); _populateBrandSel('wire-brand'); document.getElementById('wire-brand').value = name; document.getElementById('wire-brand-new').value = ''; updateWirePreview(); showToast('✓ 品牌已新增'); }
  catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false);
}
async function submitWire() {
  const eid = document.getElementById('wire-eid').value;
  let length = document.getElementById('wire-length').value; if(length === '__custom__') length = document.getElementById('wire-length-custom').value.trim();
  const conn_a = document.getElementById('wire-conn-a').value, conn_a_apc = document.getElementById('wire-apc-a').checked;
  const conn_b = document.getElementById('wire-conn-b').value, conn_b_apc = document.getElementById('wire-apc-b').checked;
  const brand = document.getElementById('wire-brand').value, init_stock = parseInt(document.getElementById('wire-init').value) || 0;
  if(!length) { showToast('請選擇長度', 'err'); return; }
  const display_name = buildWireDisplayName(conn_a, conn_a_apc, conn_b, conn_b_apc);
  try { showLoad(true); if(eid) { await dbPatch('wire_items', `?id=eq.${eid}`, { conn_a, conn_a_apc, conn_b, conn_b_apc, display_name, length, brand, init_stock }); showToast('✓ 品項已更新'); } else { await dbPost('wire_items', { id: nextId(C.wires, 'W'), conn_a, conn_a_apc, conn_b, conn_b_apc, display_name, length, brand, unit: '包', init_stock }); showToast('✓ 線材品項已新增'); } C.wires = await dbGet('wire_items', '?deleted_at=is.null&order=id'); closeModal('modal-wire'); renderSettings(); }
  catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false);
}
async function softDelWire(id) {
  if(C.inbound.some(r => r.item_id === id && r.item_type === 'wire') || C.outbound.some(r => r.item_id === id && r.item_type === 'wire')) { showToast('此品項仍有進/領料紀錄，無法刪除', 'err'); return; }
  if(!confirm('確認刪除？（資料庫仍保留）')) return;
  try { showLoad(true); await dbSoftDel('wire_items', `?id=eq.${id}`); C.wires = await dbGet('wire_items', '?deleted_at=is.null&order=id'); showToast('✓ 已刪除'); renderSettings(); }
  catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false);
}

function openEquipModal(editId=null) {
  document.getElementById('equip-eid').value = editId || ''; document.getElementById('mequip-title').textContent = editId ? '修改設備品項' : '新增設備品項';
  const sel = document.getElementById('equip-cat'); sel.innerHTML = '<option value="">— 請選擇 —</option>' + C.equipCats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  _populateBrandSel('equip-brand');
  if(editId) {
    const e = C.equips.find(x => x.id === editId); if(!e) return;
    document.getElementById('equip-id').value = e.id; sel.value = e.category;
    document.getElementById('equip-brand').value = e.brand || ''; document.getElementById('equip-spec').value = e.spec;
    document.getElementById('equip-init').value = e.init_stock;
    const stdUnits = ['台','片','架','組'];
    if(stdUnits.includes(e.unit)) { document.getElementById('equip-unit').value = e.unit; document.getElementById('equip-unit-custom').style.display = 'none'; }
    else { document.getElementById('equip-unit').value = '__custom__'; document.getElementById('equip-unit-custom').style.display = ''; document.getElementById('equip-unit-custom').value = e.unit; }
  } else {
    document.getElementById('equip-id').value = nextId(C.equips, 'M'); sel.value = '';
    document.getElementById('equip-brand').value = ''; document.getElementById('equip-spec').value = '';
    document.getElementById('equip-unit').value = ''; document.getElementById('equip-unit-custom').style.display = 'none';
    document.getElementById('equip-unit-custom').value = ''; document.getElementById('equip-init').value = '0';
    document.getElementById('equip-cat-new').value = ''; document.getElementById('equip-brand-new').value = '';
  }
  _openModal('modal-equip');
}
async function addEquipCat() {
  const name = document.getElementById('equip-cat-new').value.trim(); if(!name) { showToast('請輸入種類名稱', 'err'); return; }
  if(C.equipCats.find(c => c.name === name)) { showToast('此種類已存在', 'err'); return; }
  try { showLoad(true); await dbPost('equip_categories', { name, sort_order: C.equipCats.length + 1 }); C.equipCats = await dbGet('equip_categories', '?deleted_at=is.null&order=sort_order'); const sel = document.getElementById('equip-cat'); sel.innerHTML = '<option value="">— 請選擇 —</option>' + C.equipCats.map(c => `<option value="${c.name}">${c.name}</option>`).join(''); sel.value = name; document.getElementById('equip-cat-new').value = ''; showToast('✓ 種類已新增'); }
  catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false);
}
async function addBrandFromEquip() {
  const name = document.getElementById('equip-brand-new').value.trim(); if(!name) { showToast('請輸入品牌名稱', 'err'); return; }
  if(C.brands.find(b => b.name === name)) { showToast('此品牌已存在', 'err'); return; }
  try { showLoad(true); await dbPost('brands', { name, sort_order: C.brands.length + 1 }); C.brands = await dbGet('brands', '?deleted_at=is.null&order=sort_order'); _populateBrandSel('equip-brand'); document.getElementById('equip-brand').value = name; document.getElementById('equip-brand-new').value = ''; showToast('✓ 品牌已新增'); }
  catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false);
}
async function submitEquip() {
  const eid = document.getElementById('equip-eid').value; const category = document.getElementById('equip-cat').value;
  const brand = document.getElementById('equip-brand').value; const spec = document.getElementById('equip-spec').value.trim();
  let unit = document.getElementById('equip-unit').value; if(unit === '__custom__') unit = document.getElementById('equip-unit-custom').value.trim();
  const init_stock = parseInt(document.getElementById('equip-init').value) || 0;
  if(!category || !spec || !unit) { showToast('請填寫種類、規格與單位', 'err'); return; }
  const display_name = category + '-' + spec;
  try { showLoad(true); if(eid) { await dbPatch('equip_items', `?id=eq.${eid}`, { category, brand, spec, display_name, unit, init_stock }); showToast('✓ 品項已更新'); } else { await dbPost('equip_items', { id: nextId(C.equips, 'M'), category, brand, spec, display_name, unit, init_stock }); showToast('✓ 設備品項已新增'); } C.equips = await dbGet('equip_items', '?deleted_at=is.null&order=id'); closeModal('modal-equip'); renderSettings(); }
  catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false);
}
async function softDelEquip(id) {
  if(C.inbound.some(r => r.item_id === id && r.item_type === 'equip') || C.outbound.some(r => r.item_id === id && r.item_type === 'equip')) { showToast('此品項仍有進/領料紀錄，無法刪除', 'err'); return; }
  if(!confirm('確認刪除？（資料庫仍保留）')) return;
  try { showLoad(true); await dbSoftDel('equip_items', `?id=eq.${id}`); C.equips = await dbGet('equip_items', '?deleted_at=is.null&order=id'); showToast('✓ 已刪除'); renderSettings(); }
  catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false);
}

function openBrandModal(origName=null) {
  document.getElementById('brand-eorig').value = origName || ''; document.getElementById('mbrand-title').textContent = origName ? '修改品牌' : '新增品牌';
  document.getElementById('brand-name').value = origName ? C.brands.find(x => x.name === origName)?.name || '' : ''; _openModal('modal-brand');
}
async function submitBrand() {
  const orig = document.getElementById('brand-eorig').value; const name = document.getElementById('brand-name').value.trim();
  if(!name) { showToast('請輸入品牌名稱', 'err'); return; }
  try { showLoad(true); if(orig) { await dbPatch('brands', `?name=eq.${encodeURIComponent(orig)}`, { name }); } else { await dbPost('brands', { name, sort_order: C.brands.length + 1 }); } C.brands = await dbGet('brands', '?deleted_at=is.null&order=sort_order'); closeModal('modal-brand'); showToast('✓ 品牌已儲存'); renderSettings(); }
  catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false);
}
async function softDelBrand(nameEnc) {
  const name = decodeURIComponent(nameEnc); if(!confirm('確認刪除品牌？')) return;
  try { showLoad(true); await dbSoftDel('brands', `?name=eq.${encodeURIComponent(name)}`); C.brands = await dbGet('brands', '?deleted_at=is.null&order=sort_order'); showToast('✓ 已刪除'); renderSettings(); }
  catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false);
}

function openPersonModal(origName=null) { document.getElementById('person-eorig').value = origName || ''; document.getElementById('mperson-title').textContent = origName ? '修改人員' : '新增人員'; if(origName) { const p = C.persons.find(x => x.name === origName); if(!p) return; document.getElementById('person-name').value = p.name; document.getElementById('person-dept').value = p.dept || ''; } else { document.getElementById('person-name').value = ''; document.getElementById('person-dept').value = ''; } _openModal('modal-person'); }
async function submitPerson() { const orig = document.getElementById('person-eorig').value; const name = document.getElementById('person-name').value.trim(); const dept = document.getElementById('person-dept').value.trim(); if(!name) { showToast('請輸入姓名', 'err'); return; } try { showLoad(true); if(orig) { await dbPatch('persons', `?name=eq.${encodeURIComponent(orig)}`, { name, dept }); } else { await dbPost('persons', { name, dept }); } C.persons = await dbGet('persons', '?deleted_at=is.null&order=name'); closeModal('modal-person'); showToast('✓ 人員已儲存'); renderSettings(); } catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false); }
async function softDelPerson(nameEnc) { const name = decodeURIComponent(nameEnc); if(C.inbound.some(r => r.person === name) || C.outbound.some(r => r.person === name)) { showToast('此人員仍有紀錄，無法刪除', 'err'); return; } if(!confirm('確認刪除？')) return; try { showLoad(true); await dbSoftDel('persons', `?name=eq.${encodeURIComponent(name)}`); C.persons = await dbGet('persons', '?deleted_at=is.null&order=name'); showToast('✓ 已刪除'); renderSettings(); } catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false); }
function openPurposeModal(origName=null) { document.getElementById('purpose-eorig').value = origName || ''; document.getElementById('mpurpose-title').textContent = origName ? '修改用途' : '新增領料用途'; document.getElementById('purpose-name').value = origName ? C.purposes.find(x => x.name === origName)?.name || '' : ''; _openModal('modal-purpose'); }
async function submitPurpose() { const orig = document.getElementById('purpose-eorig').value; const name = document.getElementById('purpose-name').value.trim(); if(!name) { showToast('請輸入用途名稱', 'err'); return; } try { showLoad(true); if(orig) { await dbPatch('purposes', `?name=eq.${encodeURIComponent(orig)}`, { name }); } else { await dbPost('purposes', { name }); } C.purposes = await dbGet('purposes', '?deleted_at=is.null&order=name'); closeModal('modal-purpose'); showToast('✓ 用途已儲存'); renderSettings(); } catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false); }
async function softDelPurpose(nameEnc) { const name = decodeURIComponent(nameEnc); if(C.outbound.some(r => r.purpose === name)) { showToast('此用途仍有領料紀錄，無法刪除', 'err'); return; } if(!confirm('確認刪除？')) return; try { showLoad(true); await dbSoftDel('purposes', `?name=eq.${encodeURIComponent(name)}`); C.purposes = await dbGet('purposes', '?deleted_at=is.null&order=name'); showToast('✓ 已刪除'); renderSettings(); } catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false); }
function openLocationModal(origName=null) { document.getElementById('location-eorig').value = origName || ''; document.getElementById('mlocation-title').textContent = origName ? '修改地點' : '新增使用地點'; if(origName) { const l = C.locations.find(x => x.name === origName); if(!l) return; document.getElementById('location-name').value = l.name; document.getElementById('location-isother').checked = l.is_other; } else { document.getElementById('location-name').value = ''; document.getElementById('location-isother').checked = false; } _openModal('modal-location'); }
async function submitLocation() { const orig = document.getElementById('location-eorig').value; const name = document.getElementById('location-name').value.trim(); const is_other = document.getElementById('location-isother').checked; if(!name) { showToast('請輸入地點名稱', 'err'); return; } try { showLoad(true); if(orig) { await dbPatch('locations', `?name=eq.${encodeURIComponent(orig)}`, { name, is_other }); } else { await dbPost('locations', { name, is_other, sort_order: C.locations.length + 1 }); } C.locations = await dbGet('locations', '?deleted_at=is.null&order=sort_order'); closeModal('modal-location'); showToast('✓ 地點已儲存'); renderSettings(); } catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false); }
async function softDelLocation(nameEnc) { const name = decodeURIComponent(nameEnc); if(!confirm('確認刪除？')) return; try { showLoad(true); await dbSoftDel('locations', `?name=eq.${encodeURIComponent(name)}`); C.locations = await dbGet('locations', '?deleted_at=is.null&order=sort_order'); showToast('✓ 已刪除'); renderSettings(); } catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false); }
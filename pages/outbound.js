function renderOutbound() {
  const kw = (document.getElementById('out-search')?.value||'');
  let rows = C.outbound.filter(r => {
    if(F.out !== 'all' && r.item_type !== F.out) return false;
    if(kw && !fuzzyMatchAny(kw, r.item_name, r.id, r.person, r.purpose, r.location, r.note)) return false;
    return true;
  });
  rows = sortData(rows, S.outbound.col, S.outbound.dir);
  const tb = document.getElementById('tbl-outbound');
  if(!rows.length) { tb.innerHTML = '<tr><td colspan="11" class="empty">無資料</td></tr>'; document.getElementById('out-pg').innerHTML=''; return; }
  tb.innerHTML = pagedRows(rows, 'outbound').map(r => {
    const loc = r.location + (r.location_note ? '（'+r.location_note+'）' : '');
    return `<tr>
      <td class="mono">${r.id}</td><td class="mono">${fmtTime(r.time)}</td>
      <td><span class="badge ${r.item_type==='wire'?'badge-wire':'badge-equip'}">${r.item_type==='wire'?'線材':'設備'}</span></td>
      <td>${getItemFullName(getItemInfo(r.item_id, r.item_type), r.item_type) || r.item_name}</td><td>${r.unit}</td>
      <td class="mono" style="color:var(--danger)">${r.qty}</td><td>${r.person}</td><td>${loc}</td>
      <td><span class="badge badge-out">${r.purpose}</span></td><td style="color:var(--text2)">${r.note||'—'}</td>
      <td><div class="td-actions"><button class="btn btn-warn btn-xs" onclick="openOutboundModal('${r.id}')">修改</button><button class="btn btn-danger btn-xs" onclick="softDelOutbound('${r.id}')">刪除</button></div></td></tr>`;
  }).join('');
  renderPagination('out-pg', rows.length, 'outbound', renderOutbound);
}
function onLocationChange() {
  const sel = document.getElementById('out-location'); const opt = sel.options[sel.selectedIndex];
  const isOther = opt && opt.dataset.other === 'true';
  document.getElementById('out-loc-note-row').style.display = isOther ? '' : 'none';
  if(!isOther) document.getElementById('out-location-note').value = '';
}
function checkOutQty() {
  const itemId = document.getElementById('out-item').value; const qty = parseInt(document.getElementById('out-qty').value) || 0;
  const qtyInput = document.getElementById('out-qty'); const hint = document.getElementById('out-qty-hint'); const btn = document.getElementById('out-submit-btn');
  if(!itemId) { hint.textContent = ''; qtyInput.classList.remove('qty-warn'); btn.disabled = false; return; }
  const st = calcStock(itemId, MT.out); hint.textContent = `庫存:${st.stock}`;
  if(qty > st.stock && qty > 0) { qtyInput.classList.add('qty-warn'); hint.style.color = 'var(--danger)'; btn.disabled = true; showToast(`數量不能超過現有庫存 ${st.stock}`, 'warn'); }
  else { qtyInput.classList.remove('qty-warn'); hint.style.color = 'var(--text3)'; btn.disabled = false; }
}
function openOutboundModal(editId=null) {
  document.getElementById('out-eid').value = editId || '';
  document.getElementById('mout-title').textContent = editId ? '修改領料紀錄' : '新增領料紀錄';
  const type = editId ? C.outbound.find(x => x.id === editId)?.item_type || 'wire' : 'wire';
  setModalType('out', type);
  const lsel = document.getElementById('out-location');
  lsel.innerHTML = '<option value="">— 請選擇 —</option>' + C.locations.map(l => `<option value="${l.name}" data-other="${l.is_other}">${l.name}</option>`).join('');
  document.getElementById('out-purpose').innerHTML = '<option value="">— 請選擇 —</option>' + C.purposes.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
  if(editId) {
    const r = C.outbound.find(x => x.id === editId); if(!r) return;
    document.getElementById('out-item').value = r.item_id;
    const info = getItemInfo(r.item_id, r.item_type);
    const trigger = document.getElementById('out-item-trigger');
    if(trigger) trigger.textContent = getItemFullName(info, r.item_type) || r.item_name || '— 請選擇 —';
    document.getElementById('out-unit').value = r.unit; document.getElementById('out-qty').value = r.qty;
    document.getElementById('out-person').value = r.person; lsel.value = r.location;
    document.getElementById('out-location-note').value = r.location_note || ''; document.getElementById('out-purpose').value = r.purpose;
    document.getElementById('out-note').value = r.note || ''; document.getElementById('out-time').value = r.time ? toLocalInputFormat(r.time) : localISO();
    onLocationChange(); document.getElementById('out-qty-hint').textContent = '';
  } else {
    document.getElementById('out-item').value = '';
    const trigger = document.getElementById('out-item-trigger'); if(trigger) trigger.textContent = '— 請選擇 —';
    document.getElementById('out-unit').value = ''; document.getElementById('out-qty').value = '';
    document.getElementById('out-note').value = ''; document.getElementById('out-time').value = localISO();
    document.getElementById('out-qty-hint').textContent = ''; document.getElementById('out-loc-note-row').style.display = 'none';
  }
  document.getElementById('out-submit-btn').disabled = false; _openModal('modal-outbound');
}
async function submitOutbound() {
  const eid = document.getElementById('out-eid').value; const item_id = document.getElementById('out-item').value; const qty = parseInt(document.getElementById('out-qty').value);
  const person = document.getElementById('out-person').value; const location = document.getElementById('out-location').value;
  const location_note = document.getElementById('out-location-note').value.trim(); const purpose = document.getElementById('out-purpose').value;
  const note = document.getElementById('out-note').value.trim(); const timeVal = document.getElementById('out-time').value;
  const locObj = C.locations.find(l => l.name === location);
  if(locObj?.is_other && !location_note) { showToast('請填寫地點說明', 'err'); return; }
  if(!item_id || !qty || qty < 1 || !person || !location || !purpose) { showToast('請填寫所有必填欄位', 'err'); return; }
  if(!eid) { const st = calcStock(item_id, MT.out); if(qty > st.stock) { showToast(`數量超過庫存（${st.stock}），無法送出`, 'err'); return; } }
  const info = getItemInfo(item_id, MT.out); const unit = info ? info.unit : ''; const item_name = getItemFullName(info, MT.out);
  const time = timeVal ? new Date(timeVal).toISOString() : new Date().toISOString();
  try {
    showLoad(true);
    if(eid) { await dbPatch('outbound', `?id=eq.${eid}`, { item_type: MT.out, item_id, item_name, unit, qty, person, location, location_note, purpose, note, time }); showToast('✓ 領料紀錄已更新'); }
    else {
      const latest = await dbGet('outbound', '?order=id.desc&limit=1'); const latestNum = latest && latest[0] ? parseInt(latest[0].id.slice(1)) : 0;
      const cacheMax = C.outbound.length ? Math.max(...C.outbound.map(x => parseInt(x.id.slice(1)))) : 0;
      const next = Math.max(latestNum, cacheMax) + 1; const id = 'O' + String(next).padStart(next > 999 ? 4 : 3, '0');
      await dbPost('outbound', { id, time, item_type: MT.out, item_id, item_name, unit, qty, person, location, location_note, purpose, note }); showToast('✓ 領料紀錄已新增');
    }
    C.outbound = await dbGet('outbound', '?deleted_at=is.null&order=id.desc'); closeModal('modal-outbound'); renderOutbound();
  } catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false);
}
async function softDelOutbound(id) {
  if(!confirm('確認刪除此領料紀錄？（資料庫仍保留）')) return;
  try { showLoad(true); await dbSoftDel('outbound', `?id=eq.${id}`); C.outbound = await dbGet('outbound', '?deleted_at=is.null&order=id.desc'); showToast('✓ 已刪除'); renderOutbound(); }
  catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false);
}
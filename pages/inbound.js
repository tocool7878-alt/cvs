function renderInbound() {
  const kw = (document.getElementById('in-search')?.value||'');
  let rows = C.inbound.filter(r => {
    if(F.in !== 'all' && r.item_type !== F.in) return false;
    if(kw && !fuzzyMatchAny(kw, r.item_name, r.id, r.person, r.note)) return false;
    return true;
  });
  rows = sortData(rows, S.inbound.col, S.inbound.dir);
  const tb = document.getElementById('tbl-inbound');
  if(!rows.length) { tb.innerHTML = '<tr><td colspan="9" class="empty">無資料</td></tr>'; document.getElementById('in-pg').innerHTML=''; return; }
  tb.innerHTML = pagedRows(rows, 'inbound').map(r => `<tr>
    <td class="mono">${r.id}</td><td class="mono">${fmtTime(r.time)}</td>
    <td><span class="badge ${r.item_type==='wire'?'badge-wire':'badge-equip'}">${r.item_type==='wire'?'線材':'設備'}</span></td>
    <td>${getItemFullName(getItemInfo(r.item_id, r.item_type), r.item_type) || r.item_name}</td><td>${r.unit}</td>
    <td class="mono" style="color:var(--accent2)">${r.qty}</td><td>${r.person}</td><td style="color:var(--text2)">${r.note||'—'}</td>
    <td><div class="td-actions"><button class="btn btn-warn btn-xs" onclick="openInboundModal('${r.id}')">修改</button><button class="btn btn-danger btn-xs" onclick="softDelInbound('${r.id}')">刪除</button></div></td></tr>`).join('');
  renderPagination('in-pg', rows.length, 'inbound', renderInbound);
}
function openInboundModal(editId=null) {
  document.getElementById('in-eid').value = editId || '';
  document.getElementById('min-title').textContent = editId ? '修改進料紀錄' : '新增進料紀錄';
  const type = editId ? C.inbound.find(x => x.id === editId)?.item_type || 'wire' : 'wire';
  setModalType('in', type);
  if(editId) {
    const r = C.inbound.find(x => x.id === editId); if(!r) return;
    document.getElementById('in-item').value = r.item_id;
    const info = getItemInfo(r.item_id, r.item_type);
    const trigger = document.getElementById('in-item-trigger');
    if(trigger) trigger.textContent = getItemFullName(info, r.item_type) || r.item_name || '— 請選擇 —';
    document.getElementById('in-unit').value = r.unit;
    document.getElementById('in-qty').value = r.qty;
    document.getElementById('in-person').value = r.person;
    document.getElementById('in-note').value = r.note || '';
    document.getElementById('in-time').value = r.time ? toLocalInputFormat(r.time) : localISO();
  } else {
    document.getElementById('in-item').value = '';
    const trigger = document.getElementById('in-item-trigger'); if(trigger) trigger.textContent = '— 請選擇 —';
    document.getElementById('in-unit').value = ''; document.getElementById('in-qty').value = '';
    document.getElementById('in-note').value = ''; document.getElementById('in-time').value = localISO();
  }
  _openModal('modal-inbound');
}
async function submitInbound() {
  const eid = document.getElementById('in-eid').value;
  const item_id = document.getElementById('in-item').value;
  const qty = parseInt(document.getElementById('in-qty').value);
  const person = document.getElementById('in-person').value;
  const note = document.getElementById('in-note').value.trim();
  const timeVal = document.getElementById('in-time').value;
  if(!item_id || !qty || qty < 1 || !person) { showToast('請填寫所有必填欄位', 'err'); return; }
  const info = getItemInfo(item_id, MT.in); const unit = info ? info.unit : '';
  const item_name = getItemFullName(info, MT.in);
  const time = timeVal ? new Date(timeVal).toISOString() : new Date().toISOString();
  try {
    showLoad(true);
    if(eid) { await dbPatch('inbound', `?id=eq.${eid}`, { item_type: MT.in, item_id, item_name, unit, qty, person, note, time }); showToast('✓ 進料紀錄已更新'); }
    else {
      const latest = await dbGet('inbound', '?order=id.desc&limit=1'); const latestNum = latest && latest[0] ? parseInt(latest[0].id.slice(1)) : 0;
      const cacheMax = C.inbound.length ? Math.max(...C.inbound.map(x => parseInt(x.id.slice(1)))) : 0;
      const next = Math.max(latestNum, cacheMax) + 1; const id = 'I' + String(next).padStart(next > 999 ? 4 : 3, '0');
      await dbPost('inbound', { id, time, item_type: MT.in, item_id, item_name, unit, qty, person, note }); showToast('✓ 進料紀錄已新增');
    }
    C.inbound = await dbGet('inbound', '?deleted_at=is.null&order=id.desc'); closeModal('modal-inbound'); renderInbound();
  } catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false);
}
async function softDelInbound(id) {
  if(!confirm('確認刪除此進料紀錄？（資料庫仍保留）')) return;
  try { showLoad(true); await dbSoftDel('inbound', `?id=eq.${id}`); C.inbound = await dbGet('inbound', '?deleted_at=is.null&order=id.desc'); showToast('✓ 已刪除'); renderInbound(); }
  catch(e) { showToast('失敗：'+e.message, 'err'); } showLoad(false);
}
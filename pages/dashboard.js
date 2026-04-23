function populateDashFilters() {
  const allT = [...C.inbound.map(r=>r.time), ...C.outbound.map(r=>r.time)];
  const years = [...new Set(allT.map(t => t.slice(0,4)))].sort().reverse();
  const fy = document.getElementById('f-year'), cy = fy.value;
  fy.innerHTML = '<option value="">全部</option>' + years.map(y => `<option ${y === cy ? 'selected' : ''}>${y}</option>`).join('');
  const fp = document.getElementById('f-person'), cp = fp.value;
  fp.innerHTML = '<option value="">全部</option>' + C.persons.map(p => `<option ${p.name === cp ? 'selected' : ''}>${p.name}</option>`).join('');
  const allItems = [...C.wires.map(w => ({ id: w.id, name: getItemFullName(w, 'wire'), type: 'wire' })), ...C.equips.map(e => ({ id: e.id, name: getItemFullName(e, 'equip'), type: 'equip' }))];
  const fi = document.getElementById('f-item'), ci = fi.value;
  fi.innerHTML = '<option value="">全部</option>' + allItems.map(i => `<option value="${i.id}:${i.type}" ${i.id + ':' + i.type === ci ? 'selected' : ''}>${i.name}</option>`).join('');
  const fl = document.getElementById('f-loc'), cl = fl.value;
  fl.innerHTML = '<option value="">全部</option>' + C.locations.map(l => `<option ${l.name === cl ? 'selected' : ''}>${l.name}</option>`).join('');
}
function renderDashboard() {
  const year = document.getElementById('f-year').value, month = document.getElementById('f-month').value;
  const type = document.getElementById('f-type').value, person = document.getElementById('f-person').value;
  const itemVal = document.getElementById('f-item').value, loc = document.getElementById('f-loc').value, kw = (document.getElementById('f-kw').value||'');
  const [fItemId, fItemType] = itemVal ? itemVal.split(':') : [null, null];
  function match(r, dir) {
    if(year && r.time.slice(0,4) !== year) return false;
    if(month && parseInt(r.time.slice(5,7)) !== parseInt(month)) return false;
    if(type && r.item_type !== type) return false;
    if(person && r.person !== person) return false;
    if(fItemId && r.item_id !== fItemId) return false;
    if(dir === 'out' && loc && r.location !== loc) return false;
    if(kw && !fuzzyMatchAny(kw, r.item_name, r.person, r.id, r.note, r.purpose||'', r.location||'')) return false;
    return true;
  }
  const inRows = C.inbound.filter(r => match(r, 'in')).map(r => ({ ...r, dir: 'in' }));
  const outRows = C.outbound.filter(r => match(r, 'out')).map(r => ({ ...r, dir: 'out' }));
  const all = [...inRows, ...outRows].sort((a,b) => b.time.localeCompare(a.time));
  const totalIn = inRows.reduce((s,r) => s + r.qty, 0), totalOut = outRows.reduce((s,r) => s + r.qty, 0), net = totalIn - totalOut;
  document.getElementById('kpi-count').textContent = all.length; document.getElementById('kpi-in').textContent = totalIn; document.getElementById('kpi-out').textContent = totalOut;
  const kn = document.getElementById('kpi-net'); kn.textContent = (net > 0 ? '+' : '') + net; kn.style.color = net > 0 ? 'var(--accent2)' : net < 0 ? 'var(--danger)' : 'var(--text)';
  const tb = document.getElementById('tbl-dashboard');
  if(!all.length) { tb.innerHTML = '<tr><td colspan="11" class="empty">無符合條件的紀錄</td></tr>'; return; }
  tb.innerHTML = all.map(r => {
    const locStr = r.location ? (r.location + (r.location_note ? '（' + r.location_note + '）' : '')) : '—';
    return `<tr>
      <td><span class="badge ${r.item_type==='wire'?'badge-wire':'badge-equip'}">${r.item_type==='wire'?'線材':'設備'}</span></td>
      <td><span class="badge ${r.dir==='in'?'badge-in':'badge-out'}">${r.dir==='in'?'進料':'領料'}</span></td>
      <td class="mono">${fmtTime(r.time)}</td><td class="mono">${r.id}</td>
      <td>${getItemFullName(getItemInfo(r.item_id, r.item_type), r.item_type) || r.item_name}</td><td>${r.unit}</td>
      <td class="mono" style="color:${r.dir==='in'?'var(--accent2)':'var(--danger)'}">${r.qty}</td>
      <td>${r.person}</td><td>${locStr}</td><td>${r.purpose||'—'}</td><td style="color:var(--text2)">${r.note||'—'}</td>
    </tr>`;
  }).join('');
}
function clearDashFilters() {
  ['f-year','f-month','f-type','f-person','f-item','f-loc','f-kw'].forEach(id => document.getElementById(id).value = '');
  renderDashboard();
}
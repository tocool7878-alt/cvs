function changeInvSort() {
  const val = document.getElementById('inv-sort').value;
  const [col, dir] = val.split('_');
  S.inv.col = col;
  S.inv.dir = dir === 'asc' ? 1 : -1;
  PG.inv = 1;
  renderInventory();
}

function renderInventory() {
  const kw = (document.getElementById('inv-search')?.value || '');
  let rows = [];

  // 線材
  if (F.inv === 'all' || F.inv === 'wire') {
    C.wires.forEach(w => {
      const st = calcStock(w.id, 'wire');
      if (st.stock <= 0 && st.in === 0 && st.out === 0) return;
      const name = getItemFullName(w, 'wire');
      if (kw && !fuzzyMatchAny(kw, name, w.id)) return;
      rows.push({ id: w.id, type: 'wire', name, unit: w.unit, in: st.in, out: st.out, stock: st.stock });
    });
  }

  // 一般設備
  if (F.inv === 'all' || F.inv === 'equip') {
    C.equips.forEach(e => {
      const st = calcStock(e.id, 'equip');
      if (st.stock <= 0 && st.in === 0 && st.out === 0) return;
      const name = getItemFullName(e, 'equip');
      if (kw && !fuzzyMatchAny(kw, name, e.id)) return;
      rows.push({ id: e.id, type: 'equip', name, unit: e.unit, in: st.in, out: st.out, stock: st.stock });
    });
  }

  // 電力設備
  if (F.inv === 'all' || F.inv === 'power') {
    C.powers.forEach(p => {
      const st = calcStock(p.id, 'power');
      if (st.stock <= 0 && st.in === 0 && st.out === 0) return;
      const name = getItemFullName(p, 'power');
      if (kw && !fuzzyMatchAny(kw, name, p.id)) return;
      rows.push({ id: p.id, type: 'power', name, unit: p.unit, in: st.in, out: st.out, stock: st.stock });
    });
  }

  rows = sortData(rows, S.inv.col, S.inv.dir);
  const tb = document.getElementById('tbl-inventory');
  if (!tb) return;

  if (!rows.length) {
    tb.innerHTML = '<tr><td colspan="8" class="empty">無庫存資料</td></tr>';
    document.getElementById('inv-pg').innerHTML = '';
    return;
  }

  const badgeMap = { wire: 'badge-wire', equip: 'badge-equip', power: 'badge-warn' };
  const labelMap = { wire: '線材', equip: '設備', power: '電力' };

  tb.innerHTML = pagedRows(rows, 'inv').map(r => `
    <tr class="clickable-row" onclick="openDetail('${r.id}','${r.type}')">
      <td class="mono">${r.id}</td>
      <td><span class="badge ${badgeMap[r.type] || 'badge-equip'}">${labelMap[r.type] || '設備'}</span></td>
      <td>${r.name}</td>
      <td>${r.unit}</td>
      <td class="mono" style="color:var(--accent2)">${r.in}</td>
      <td class="mono" style="color:var(--danger)">${r.out}</td>
      <td class="mono" style="font-weight:600;color:var(--accent)">${r.stock}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();openDetail('${r.id}','${r.type}')">明細</button>
        </div>
      </td>
    </tr>
  `).join('');

  renderPagination('inv-pg', rows.length, 'inv', renderInventory);
}

function openDetail(itemId, itemType) {
  const info = getItemInfo(itemId, itemType);
  if (!info) return;
  const st = calcStock(itemId, itemType);
  const name = getItemFullName(info, itemType);
  document.getElementById('detail-title').textContent = '📦 ' + name;
  const inRecs = C.inbound.filter(r => r.item_id === itemId && r.item_type === itemType);
  const outRecs = C.outbound.filter(r => r.item_id === itemId && r.item_type === itemType);

  let html = `
    <div class="detail-stats">
      <div class="detail-stat"><div class="detail-stat-label">現有庫存</div><div class="detail-stat-val ds-stock">${st.stock}</div></div>
      <div class="detail-stat"><div class="detail-stat-label">累計進料</div><div class="detail-stat-val ds-in">${st.in}</div></div>
      <div class="detail-stat"><div class="detail-stat-label">累計領料</div><div class="detail-stat-val ds-out">${st.out}</div></div>
    </div>`;

  if (inRecs.length) {
    html += `
      <div class="detail-section">
        <div class="detail-section-title">進料明細（${inRecs.length}筆）</div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>編號</th><th>時間</th><th>數量</th><th>經手人</th><th>備註</th></tr></thead>
            <tbody>
              ${inRecs.map(r => `<tr><td class="mono">${r.id}</td><td class="mono">${fmtTime(r.time)}</td><td class="mono" style="color:var(--accent2)">${r.qty}</td><td>${r.person}</td><td style="color:var(--text2)">${r.note || '—'}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  if (outRecs.length) {
    html += `
      <div class="detail-section">
        <div class="detail-section-title">領料明細（${outRecs.length}筆）</div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>編號</th><th>時間</th><th>數量</th><th>領料人</th><th>地點</th><th>用途</th><th>備註</th></tr></thead>
            <tbody>
              ${outRecs.map(r => `<tr><td class="mono">${r.id}</td><td class="mono">${fmtTime(r.time)}</td><td class="mono" style="color:var(--danger)">${r.qty}</td><td>${r.person}</td><td>${r.location || '—'}</td><td><span class="badge badge-out">${r.purpose}</span></td><td style="color:var(--text2)">${r.note || '—'}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  if (!inRecs.length && !outRecs.length) html += '<div class="empty">尚無進出料紀錄</div>';
  document.getElementById('detail-body').innerHTML = html;
  _openModal('modal-detail');
}

function renderPagination(containerId, total, pageKey, renderFn) {
  const ps = PS[pageKey] || DEFAULT_PS;
  const totalPages = Math.max(1, Math.ceil(total / ps));
  if(PG[pageKey] > totalPages) PG[pageKey] = totalPages;
  const cur = PG[pageKey];
  const s = Math.max(1, cur - 2), e2 = Math.min(totalPages, s + 4);
  let html = `<div class="pagination">
    <button class="pg-btn" onclick="goPg('${pageKey}',1)" ${cur===1?'disabled':''}>«</button>
    <button class="pg-btn" onclick="goPg('${pageKey}',${cur-1})" ${cur===1?'disabled':''}>‹</button>`;
  for(let p = s; p <= e2; p++) html += `<button class="pg-btn${p===cur?' active':''}" onclick="goPg('${pageKey}',${p})">${p}</button>`;
  html += `<button class="pg-btn" onclick="goPg('${pageKey}',${cur+1})" ${cur===totalPages?'disabled':''}>›</button>
    <button class="pg-btn" onclick="goPg('${pageKey}',${totalPages})" ${cur===totalPages?'disabled':''}>»</button>
    <span class="pg-info">${cur}/${totalPages} 頁，共 ${total} 筆</span>
    <div class="pg-jump"><span>跳至</span><input type="number" min="1" max="${totalPages}" placeholder="${cur}" onkeydown="if(event.key==='Enter'){const v=parseInt(this.value);if(v>=1&&v<=${totalPages}){goPg('${pageKey}',v);this.value='';event.preventDefault();}}" style="width:48px;padding:5px 7px;font-size:12px;text-align:center;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);outline:none"><span>頁</span></div>
    <div class="pg-jump" style="margin-left:8px;border-left:1px solid var(--border);padding-left:12px"><span>每頁</span><input type="number" min="5" max="200" value="${ps}" onchange="setPageSize('${pageKey}',this.value)" style="width:52px;padding:5px 7px;font-size:12px;text-align:center;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);outline:none"><span>筆</span></div>
  </div>`;
  const c = document.getElementById(containerId); if(c) c.innerHTML = html;
}
function goPg(key, page) {
  PG[key] = Math.max(1, Math.min(page, 9999));
  if(key === 'inv') renderInventory();
  else if(key === 'inbound') renderInbound();
  else if(key === 'outbound') renderOutbound();
  else if(key === 'wire' || key === 'equip') renderSettings();
}
function setPageSize(key, val) {
  const n = parseInt(val); if(!n || n < 5) return;
  PS[key] = n; PG[key] = 1;
  if(key === 'inv') renderInventory();
  else if(key === 'inbound') renderInbound();
  else if(key === 'outbound') renderOutbound();
  else if(key === 'wire' || key === 'equip') renderSettings();
}
function pagedRows(rows, key) {
  const ps = PS[key] || DEFAULT_PS;
  return rows.slice((PG[key] - 1) * ps, (PG[key] - 1) * ps + ps);
}
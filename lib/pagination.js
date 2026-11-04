function goPg(key, page) {
  PG[key] = Math.max(1, Math.min(page, 9999));
  if(key === 'inv') renderInventory();
  else if(key === 'inbound') renderInbound();
  else if(key === 'outbound') renderOutbound();
  else if(key === 'wire' || key === 'equip' || key === 'power') renderSettings();
}
function setPageSize(key, val) {
  const n = parseInt(val); if(!n || n < 5) return;
  PS[key] = n; PG[key] = 1;
  if(key === 'inv') renderInventory();
  else if(key === 'inbound') renderInbound();
  else if(key === 'outbound') renderOutbound();
  else if(key === 'wire' || key === 'equip' || key === 'power') renderSettings();
}
function pagedRows(list, key) {
  // 優先讀取 PS[key]，若未定義則預設採用 25
  const size = (typeof PS !== 'undefined' && PS[key]) ? PS[key] : 25;
  const page = (typeof PG !== 'undefined' && PG[key]) ? PG[key] : 1;
  const start = (page - 1) * size;
  return list.slice(start, start + size);
}
function renderPagination(containerId, totalRows, key, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const size = (typeof PS !== 'undefined' && PS[key]) ? PS[key] : 25;
  const totalPages = Math.ceil(totalRows / size) || 1;
  const curPage = PG[key] || 1;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `<div class="pagination">`;
  html += `<button class="btn btn-ghost btn-xs" ${curPage === 1 ? 'disabled' : ''} onclick="PG['${key}']--;${onPageChange.name}()">‹ 上一頁</button>`;
  html += `<span class="pg-info">${curPage} / ${totalPages}</span>`;
  html += `<button class="btn btn-ghost btn-xs" ${curPage === totalPages ? 'disabled' : ''} onclick="PG['${key}']++;${onPageChange.name}()">下一頁 ›</button>`;
  html += `</div>`;

  container.innerHTML = html;
}

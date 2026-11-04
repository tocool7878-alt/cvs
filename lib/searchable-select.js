// ===================== FUZZY SEARCH (強化接頭反轉比對) =====================
function normalizeStr(str) {
  return String(str || '').toLowerCase().replace(/\s+/g, '');
}

// 智慧接頭反轉函式：若字串開頭包含光纖接頭代碼，將兩端接頭對調
function flipConnectorString(str) {
  if (!str) return '';
  // 移除頭部的括號標記（如 (單)、(雙)），方便解析接頭
  const clean = str.replace(/^\((單|雙)\)/, '');
  
  // 支援規格如：LC-SC, SC-LC, LC(APC)-SC, SL, LS, SL-3M, LS-10M 等
  // 正則解析接頭 A、APC A、分隔符(可有可無)、接頭 B、APC B、剩餘部分(長度等)
  const regex = /^(lc|sc|fc|l|s|f)(apc)?[\-_]?(lc|sc|fc|l|s|f)(apc)?(.*)$/i;
  const match = clean.match(regex);
  if (match) {
    const [, connA, apcA, connB, apcB, rest] = match;
    const flipped = (connB || '') + (apcB || '') + (connA || '') + (apcA || '') + (rest || '');
    return flipped;
  }
  return '';
}

function isMatchSel(target, kw) {
  if (!target || !kw) return false;
  
  const t = normalizeStr(target);
  const k = normalizeStr(kw);
  
  // 1. 一般正向包含比對
  if (t.includes(k)) return true;
  
  // 忽略符號後的一般正向比對 (例: "SL3M" 能配對 "SL-3M")
  const tPlain = t.replace(/[\-_()]/g, '');
  const kPlain = k.replace(/[\-_()]/g, '');
  if (tPlain.includes(kPlain)) return true;

  // 2. 針對目標字串做接頭反轉比對 (例如 target 是 (雙)LS-3M -> 反轉成 SL-3M)
  const targetFlipped = flipConnectorString(t);
  if (targetFlipped && targetFlipped.includes(k)) return true;
  if (targetFlipped && targetFlipped.replace(/[\-_()]/g, '').includes(kPlain)) return true;

  // 3. 針對使用者輸入的關鍵字做接頭反轉比對 (例如 輸入 SL- -> 反轉成 LS-)
  const kwFlipped = flipConnectorString(k);
  if (kwFlipped && t.includes(kwFlipped)) return true;
  if (kwFlipped && tPlain.includes(kwFlipped.replace(/[\-_()]/g, ''))) return true;

  return false;
}

function fuzzyMatch(query, target) {
  if (!query) return true;
  return isMatchSel(target, query);
}

function fuzzyMatchAny(query, ...fields) {
  if (!query) return true;
  return fields.some(f => f && isMatchSel(String(f), query));
}

function buildSelOptions(key, items) { selItems[key] = items; renderSelOptions(key, ''); }
function filterSelOptions(key) { renderSelOptions(key, document.getElementById(key+'-search').value); }
function renderSelOptions(key, kw) {
  const list = document.getElementById(key+'-list'); if(!list) return;
  const src = selItems[key] || [];
  const filtered = kw ? src.filter(i => isMatchSel(i.label, kw)) : src;
  if(!filtered.length) { list.innerHTML = '<div class="sel-option" style="color:var(--text3);cursor:default">無符合結果</div>'; return; }
  const curVal = document.getElementById(key)?.value || '';
  list.innerHTML = filtered.map(i => `<div class="sel-option${i.value === curVal ? ' selected' : ''}" data-key="${key}" data-val="${i.value}" data-label="${encodeURIComponent(i.label)}">${i.label}</div>`).join('');
  list.querySelectorAll('.sel-option').forEach(el => {
    el.addEventListener('mousedown', function(e){
      e.preventDefault(); pickSelOption(this.dataset.key, this.dataset.val, decodeURIComponent(this.dataset.label||''));
    });
  });
}
function toggleSelDrop(key) {
  const drop = document.getElementById(key+'-drop'); const trigger = document.getElementById(key+'-trigger');
  const wasOpen = drop.classList.contains('open');
  document.querySelectorAll('.sel-dropdown.open').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.sel-trigger.open').forEach(t => t.classList.remove('open'));
  if(!wasOpen) { drop.classList.add('open'); trigger.classList.add('open'); const si = document.getElementById(key+'-search'); if(si){ si.value=''; renderSelOptions(key,''); setTimeout(()=>si.focus(),50); } }
}
function pickSelOption(key, value, label) {
  document.getElementById(key).value = value; document.getElementById(key+'-trigger').textContent = label || '— 請選擇 —';
  document.getElementById(key+'-drop').classList.remove('open'); document.getElementById(key+'-trigger').classList.remove('open');
  if(key === 'in-item') onItemChange('in'); if(key === 'out-item') onItemChange('out');
}

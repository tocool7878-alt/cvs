// 快取資料
let C = { wires:[], equips:[], equipCats:[], persons:[], purposes:[], locations:[], brands:[], inbound:[], outbound:[] };
// 過濾狀態
const F = { inv:'all', in:'all', out:'all' };
// 表單類型狀態
const MT = { in:'wire', out:'wire' };
// 排序狀態
const S = { inv:{col:'id',dir:-1}, inbound:{col:'id',dir:-1}, outbound:{col:'id',dir:-1} };
// 分頁狀態
const PG = { inv:1, inbound:1, outbound:1, wire:1, equip:1 };
const PS = { inv:12, inbound:20, outbound:20, wire:20, equip:20 };
const DEFAULT_PS = 20;

let loadEl;
let toastT;
let selItems = {};
// 快取資料（新增 powers 與 powerCats）
let C = { wires:[], equips:[], equipCats:[], powers:[], powerCats:[], persons:[], purposes:[], locations:[], brands:[], inbound:[], outbound:[] };
// 過濾狀態
const F = { inv:'all', in:'all', out:'all' };
// 表單類型狀態 (支援 wire, equip, power)
const MT = { in:'wire', out:'wire' };
// 排序狀態
const S = { inv:{col:'id',dir:-1}, inbound:{col:'id',dir:-1}, outbound:{col:'id',dir:-1} };
// 分頁狀態（新增 power: 1）
const PG = { inv:1, inbound:1, outbound:1, wire:1, equip:1, power:1 };
const PS = { inv:25, inbound:25, outbound:25, wire:25, equip:25, power:25 };
const DEFAULT_PS = 25;

let loadEl;
let toastT;
let selItems = {};

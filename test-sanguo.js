const fs = require('fs');
const html = fs.readFileSync('/home/hatch/workspace/sanguo-pixel/index.html', 'utf-8');
const m = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/);
if (!m) { console.log('NO INLINE SCRIPT'); process.exit(1); }
const script = m[1];

class El {
  constructor() {
    this._h = {}; this._t = ''; this._html = ''; this.children = []; this.parentElement = this;
    this.style = {}; this.dataset = {}; this.value = '';
    this._cls = new Set();
    this.classList = { add: c => this._cls.add(c), remove: c => this._cls.delete(c),
      toggle: (c, f) => { if (f === undefined) { this._cls.has(c) ? this._cls.delete(c) : this._cls.add(c); } else if (f) this._cls.add(c); else this._cls.delete(c); },
      contains: c => this._cls.has(c) };
  }
  addEventListener(t, f) { (this._h[t] = this._h[t] || []).push(f); }
  appendChild(c) { this.children.push(c); return c; }
  remove() {}
  querySelectorAll() { return []; }
  querySelector() { return null; }
  getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 }; }
  scrollIntoView() {}
  select() {}
  focus() {}
  set textContent(v) { this._t = String(v); }
  get textContent() { return this._t; }
  set innerHTML(v) { this._html = v; this.children = []; }
  get innerHTML() { return this._html; }
  closest() { return null; }
  getAttribute() { return null; }
}
const els = new Map();
function getEl(id) { if (!els.has(id)) els.set(id, new El()); return els.get(id); }
const store = new Map();
global.document = { getElementById: getEl, querySelectorAll: () => [], querySelector: () => null,
  createElement: () => new El(), body: new El(),
  addEventListener: (t, f) => {}, execCommand: () => true };
global.localStorage = { getItem: k => store.has(k) ? store.get(k) : null,
  setItem: (k, v) => { store.set(k, v); }, removeItem: k => { store.delete(k); } };
global.window = { addEventListener: (t, f) => {}, confirm: () => true, scrollTo: () => {} };
global.requestAnimationFrame = fn => { fn(); return 0; };
global.navigator = {};

let pass = 0, fail = 0;
function t(name, cond, extra) {
  if (cond) { pass++; }
  else { fail++; console.log('FAIL: ' + name + (extra !== undefined ? ' | ' + extra : '')); }
}

eval(script + ';globalThis.__T={SAVE_KEY,HEROES,ENEMIES,FORMATIONS,DIFFS,SKILLS,SP_MAX,SP_PER_ACTION,defaultSave,loadSave,persistSave,stageScale,heroStats,upgradeCost,newBattle,calcDamage,isCrit,renderAll,renderHeader,renderTeams,renderStatus,renderSkillBtns,log,floatDmg,bumpCard,slotPos,spriteHtml,buildBattlefield,updateBattlefield,updateSprite,dashTo,slashFx,boltFx,fieldFlash,rainFx,fireballFx,sfx,toggleMute,selectMy,attackEnemy,doAttack,enemyCounter,simayiCurse,endTurn,useSkill,checkEnd,winBattle,loseBattle,nextStage,backToStart,showStart,setDiff,setFormation,startBattle,openFormation,closeFormation,renderFormationList,openUpgrade,closeUpgrade,renderUpgradeList,buyUpgrade,$,esc,clamp,fmt,get save(){return save},set save(v){save=v},get battle(){return battle},set battle(v){battle=v}};');
const T = globalThis.__T;
const realRandom = Math.random;
function mockRandom(v) { Math.random = () => v; }
function unmock() { Math.random = realRandom; }
function freshBattle() { T.save = T.defaultSave(); T.newBattle(); T.renderAll(); }

// --- S1 預設存檔 ---
const d1 = T.defaultSave();
t('S1 預設軍功0關卡1', d1.merit === 0 && d1.stage === 1, JSON.stringify(d1));
t('S1 預設普通鶴翼', d1.diff === 'normal' && d1.formation === 'crane');
t('S1 升級全0', Object.values(d1.upgrades).every(u => u.atk === 0 && u.hp === 0));

// --- S2 升級數值 ---
freshBattle();
T.save.upgrades.zhaoyun = { atk: 2, hp: 1 };
t('S2 攻擊+150/級', T.heroStats(T.HEROES[0]).atk === 1800 + 300, T.heroStats(T.HEROES[0]).atk);
t('S2 體力+800/級', T.heroStats(T.HEROES[0]).hp === 9800 + 800, T.heroStats(T.HEROES[0]).hp);
t('S2 升級費用遞增', T.upgradeCost(0) === 200 && T.upgradeCost(1) === 400 && T.upgradeCost(4) === 1000);

// --- S3 關卡倍率 ---
T.save.stage = 1; t('S3 第1關倍率1', T.stageScale() === 1);
T.save.stage = 2; t('S3 第2關倍率1.12', Math.abs(T.stageScale() - 1.12) < 1e-9, T.stageScale());
T.save.stage = 6; t('S3 第6關倍率1.6', Math.abs(T.stageScale() - 1.6) < 1e-9, T.stageScale());

// --- S4 開戰數值 ---
freshBattle();
t('S4 SP 128 回合1', T.battle.sp === 128 && T.battle.turn === 1);
t('S4 司馬懿28000', T.battle.enemy[0].hp === 28000 && T.battle.enemy[0].max === 28000);
t('S4 趙雲9800/1800', T.battle.my[0].hp === 9800 && T.battle.my[0].atk === 1800);
T.save.stage = 2; T.newBattle();
t('S4 第2關敵方×1.12', T.battle.enemy[0].hp === Math.round(28000 * 1.12), T.battle.enemy[0].hp);
T.save.stage = 1; T.save.diff = 'hard'; T.newBattle();
t('S4 困難敵方×1.3', T.battle.enemy[0].hp === Math.round(28000 * 1.3), T.battle.enemy[0].hp);
T.save.diff = 'easy'; T.newBattle();
t('S4 簡單敵方×0.7', T.battle.enemy[0].hp === Math.round(28000 * 0.7), T.battle.enemy[0].hp);

// --- S5 攻擊流程（mock 0.5：傷害×1.0、鶴翼×1.1、無暴擊、必反擊） ---
freshBattle();
mockRandom(0.5);
T.selectMy(0);
t('S5 選中趙雲', T.battle.selected === 0);
T.attackEnemy(0);
t('S5 趙雲打司馬懿1980', T.battle.enemy[0].hp === 28000 - 1980, T.battle.enemy[0].hp);
t('S5 鄧艾反擊1170', T.battle.my[0].hp === 9800 - 1170, T.battle.my[0].hp);
t('S5 回合變2 SP回滿', T.battle.turn === 2 && T.battle.sp === 128);
t('S5 選取已清除', T.battle.selected === -1);
unmock();

// --- S6 未選武將不能攻擊 ---
freshBattle();
mockRandom(0.5);
T.attackEnemy(0);
t('S6 未選不攻擊', T.battle.enemy[0].hp === 28000 && T.battle.turn === 1);
unmock();

// --- S7 計謀 ---
freshBattle();
mockRandom(0.5);
T.useSkill('thunder');
t('S7 潛雷計扣30SP', T.battle.sp === 106, T.battle.sp);
t('S7 潛雷計敵全體-3000', T.battle.enemy.every(e => e.hp === e.max - 3000), T.battle.enemy.map(e => e.hp).join(','));
T.useSkill('rain');
t('S7 聖雨扣40SP', T.battle.sp === 74, T.battle.sp);
t('S7 聖雨滿血不溢出', T.battle.my.every(u => u.hp === u.max));
T.battle.my[0].hp = 5000;
T.useSkill('fire');
t('S7 火計打最低血量', T.battle.enemy.slice().sort((a, b) => a.hp - b.hp)[0].hp === 24000 - 3000 - 4500, T.battle.enemy.map(e => e.hp).join(','));
t('S7 火計扣20SP', T.battle.sp === 62, T.battle.sp);
unmock();

// --- S8 SP不足 ---
freshBattle();
T.battle.sp = 10;
T.useSkill('thunder');
t('S8 SP不足不放', T.battle.sp === 10 && T.battle.enemy[0].hp === 28000);

// --- S9 勝利（攻擊殺最後一隻） ---
freshBattle();
mockRandom(0.5);
T.battle.enemy.forEach((e, i) => { e.hp = i === 0 ? 1 : 0; });
T.selectMy(1); // 關羽 2200×1.1=2420
T.attackEnemy(0);
t('S9 勝利battle.over', T.battle.over === true);
t('S9 勝場+1 軍功+500', T.save.wins === 1 && T.save.merit === 500, T.save.merit);
t('S9 最高關卡', T.save.best === 1);
unmock();

// --- S9b 勝利（潛雷計清場） ---
freshBattle();
mockRandom(0.5);
T.battle.enemy.forEach(e => { e.hp = 1; });
T.useSkill('thunder');
t('S9b 計謀勝利battle.over', T.battle.over === true);
t('S9b 計謀勝利軍功+500', T.save.wins === 1 && T.save.merit === 500, T.save.merit);
unmock();

// --- S10 敗北 ---
freshBattle();
T.battle.my.forEach(u => { u.hp = 0; });
T.checkEnd();
t('S10 敗北battle.over', T.battle.over === true);
t('S10 敗北不加軍功', T.save.merit === 0);

// --- S11 下一關 ---
freshBattle();
mockRandom(0.5);
T.battle.enemy.forEach(e => { e.hp = 1; });
T.useSkill('thunder');
T.nextStage();
t('S11 勝利後下一關stage2', T.save.stage === 2, T.save.stage);
t('S11 第2關敵方變強', T.battle.enemy[0].hp === Math.round(28000 * 1.12), T.battle.enemy[0].hp);
unmock();

// --- S12 升級購買 ---
T.save = T.defaultSave();
T.save.merit = 1000;
T.buyUpgrade('zhaoyun', 'atk');
t('S12 買攻擊扣200', T.save.merit === 800 && T.save.upgrades.zhaoyun.atk === 1, T.save.merit);
T.buyUpgrade('zhaoyun', 'atk');
t('S12 第二級扣400', T.save.merit === 400 && T.save.upgrades.zhaoyun.atk === 2, T.save.merit);
T.buyUpgrade('zhaoyun', 'hp');
t('S12 買體力扣200', T.save.merit === 200 && T.save.upgrades.zhaoyun.hp === 1, T.save.merit);
T.buyUpgrade('zhaoyun', 'hp');
t('S12 錢不夠不買', T.save.merit === 200 && T.save.upgrades.zhaoyun.hp === 1, T.save.merit);

// --- S13 陣型效果 ---
freshBattle();
T.setFormation('arrow');
mockRandom(0.2);
t('S13 鋒矢暴擊率+15%', T.isCrit() === true);
mockRandom(0.5);
t('S13 0.5不暴擊', T.isCrit() === false);
unmock();
T.setFormation('fish');
mockRandom(0.5);
t('S13 魚鱗攻擊無加成', T.calcDamage(1800, true, false) === Math.round(1800 * 1.0), T.calcDamage(1800, true, false));
T.setFormation('crane');
t('S13 鶴翼攻擊+10%', T.calcDamage(1800, true, false) === Math.round(1800 * 1.1), T.calcDamage(1800, true, false));

// --- S14 司馬懿妖術（第5回合） ---
freshBattle();
mockRandom(0.5);
T.battle.turn = 4;
T.endTurn();
t('S14 第5回合妖術-1500', T.battle.my[2].hp === 9600 - 1500, T.battle.my[2].hp);
t('S14 回合變5', T.battle.turn === 5);
unmock();

// --- S15 渲染有圖片與名字 ---
freshBattle();
T.renderTeams();
const fieldHtml = T.$('field-sprites').innerHTML;
t('S15 戰場有趙雲圖片', fieldHtml.includes('assets/zhaoyun.webp') && fieldHtml.includes('趙雲'));
t('S15 戰場有司馬懿圖片', fieldHtml.includes('assets/simayi.webp') && fieldHtml.includes('司馬懿'));
t('S15 十張圖全在原始碼', ['zhaoyun','guanyu','zhangfei','zhouyu','jiangwei','simayi','simayan','dengai','zhonghui','xuhuang'].every(n => html.includes('assets/' + n + '.webp')));

// --- S16 原始碼檢查 ---
t('S16 標題像素三國志', html.includes('像素三國志'));
t('S16 無alert', !html.includes('alert('));
t('S16 有存檔與升級', html.includes('sanguo_pixel_v1') && html.includes('buyUpgrade'));
t('S16 有三計謀', html.includes('潛雷計') && html.includes('聖雨') && html.includes('火計'));

// --- S17 彈窗遮擋回歸（v1.1 blocker）：.overlay 不可蓋掉 hidden ---
t('S17 overlay.hidden 規則在', html.includes('.overlay.hidden') && html.includes('display: none'));
t('S17 開機陣型清單已畫好', T.$('formation-list').innerHTML.includes('鶴翼陣') && T.$('formation-list').innerHTML.includes('魚鱗陣') && T.$('formation-list').innerHTML.includes('鋒矢陣'));
t('S17 開機其他彈窗是 hidden', T.$('panel-formation').classList.contains('hidden') && T.$('panel-result').classList.contains('hidden') && T.$('panel-upgrade').classList.contains('hidden'));
T.showStart();
t('S17 開機開始畫面顯示', !T.$('panel-start').classList.contains('hidden'));
t('S17 showStart 藏起其他彈窗', T.$('panel-formation').classList.contains('hidden') && T.$('panel-result').classList.contains('hidden') && T.$('panel-upgrade').classList.contains('hidden'));

// --- S18 動作版（v1.2）：戰場＋衝刺＋倒地＋技能特效 ---
freshBattle();
mockRandom(0.5);
T.selectMy(0);
T.attackEnemy(0);
const spr0 = T.$('sprimg-my-0');
t('S18 攻擊衝刺 transform', spr0.style.transform && spr0.style.transform.includes('translate'), spr0.style.transform);
t('S18 名條不跟著衝', !T.$('sprite-my-0').style.transform);
T.renderAll();
t('S18 原地更新不洗掉衝刺', T.$('sprimg-my-0').style.transform && T.$('sprimg-my-0').style.transform.includes('translate'));
t('S18 戰場圖片還在', T.$('field-sprites').innerHTML.includes('assets/zhaoyun.webp'));
unmock();
freshBattle();
T.battle.my[0].hp = 0;
T.renderAll();
t('S18 倒下加 dead', T.$('sprite-my-0').classList.contains('dead'));
freshBattle();
T.useSkill('thunder');
t('S18 潛雷計閃光', T.$('fx-flash').classList.contains('flash-on'));
freshBattle();
T.useSkill('rain');
t('S18 聖雨落雨', T.$('fx-rain').classList.contains('rain-on'));
freshBattle();
T.useSkill('fire');
t('S18 火計火球', T.$('fx-layer').children.length > 0);

// --- S19 動作版修正（v1.2.1）：刀光＋落雷＋閃光時長 ---
freshBattle();
T.slashFx('enemy', 0);
t('S19 刀光＋爆裂', T.$('fx-layer').children.length >= 2);
T.boltFx('enemy', 1);
t('S19 落雷', T.$('fx-layer').children.length >= 3);
t('S19 閃光 0.8 秒', html.includes('flashAnim .8s'));
t('S19 衝刺停在七成', html.includes('dx * 0.7') && html.includes('dy * 0.7'));
t('S19 受擊閃白', html.includes('hit-flash'));

// --- S20 動作版修正（v1.2.2）：X 刀光＋傷害數字浮在特效層 ---
freshBattle();
T.slashFx('enemy', 0);
t('S20 X 刀光兩道＋爆裂', T.$('fx-layer').children.length >= 3);
const before = T.$('fx-layer').children.length;
T.floatDmg('enemy', 0, '-1000', '');
t('S20 傷害數字在特效層', T.$('fx-layer').children.length === before + 1);
t('S20 受擊閃白整隻', html.includes('.gen-sprite.hit-flash { filter: brightness(2.2); }'));
t('S20 閃光持續亮', html.includes('55% { opacity: .75; }'));

console.log('\n' + pass + ' passed, ' + fail + ' failed');

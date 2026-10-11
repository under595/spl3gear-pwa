(function () {
  const { GEARPOWER_DATAS, GEARPOWER_TABLE, SUB_DATAS, WEAPON_DATAS } = window.SPL3_DATA;
  const SENDOU = window.SPL3_SENDOU || {};
  const { nearestKey } = window.SPL3.utils;
  const BODY_DOUBLE = "追加ギアパワー倍化";
  const MAX_GP = 57;
  const ABILITY_VALUES = {
    ConsumeRt_Main: [0.55, 0.775, 1.0],
    ConsumeRt_Sub_Lv0: [0.8, 0.9, 1.0],
    ConsumeRt_Sub_Lv1: [0.7, 0.85, 1.0],
    ConsumeRt_Sub_Lv2: [0.65, 0.825, 1.0],
    ConsumeRt_Sub_Lv3: [0.6, 0.8, 1.0],
    ConsumeRt_Sub_Lv4: [0.711111, 0.855555, 1.0],
    DamageRt_BombH: [0.5, 0.75, 1.0],
    DamageRt_BombL: [0.6, 0.75, 1.0],
    DamageRt_LineMarker: [0.5, 0.75, 1.0],
    DamageRt_Shield: [0.5, 0.75, 1.0],
    DamageRt_Sprinkler: [0.5, 0.75, 1.0],
    Dying_AroundFrm: [30.0, 60.0, 90.0],
    Dying_ChaseFrm: [90.0, 180.0, 270.0],
    IncreaseRt_Special: [1.3, 1.15, 1.0],
    InkRecoverFrm_Std: [220.0, 410.0, 600.0],
    InkRecoverFrm_Stealth: [117.0, 148.5, 180.0],
    MoveVelRt_Shot: [1.25, 1.125, 1.0],
    MoveVel_Human: [0.144, 0.12, 0.096],
    MoveVel_Human_Fast: [0.144, 0.124, 0.104],
    MoveVel_Human_Slow: [0.144, 0.116, 0.088],
    MoveVel_Stealth: [0.24, 0.216, 0.192],
    MoveVel_Stealth_Fast: [0.24, 0.2208, 0.2016],
    MoveVel_Stealth_Slow: [0.24, 0.216, 0.1728],
    OpInk_ArmorHP: [39.0, 26.0, 0.0],
    OpInk_DamageLmt: [0.2, 0.3, 0.4],
    OpInk_DamagePerFrame: [0.0015, 0.00225, 0.003],
    OpInk_JumpVel: [0.11, 0.098, 0.08],
    OpInk_MoveVel: [0.0768, 0.0557, 0.024],
    ReduceJumpSwerveRate: [1.0, 0.75, 0.0],
    Somersault_MoveVelKd: [1.0, 0.925, 0.85],
    SpecialGaugeRt_Restart: [1.0, 0.8, 0.5],
    SuperJump_ChargeFrm: [20.0, 35.0, 80.0],
    SuperJump_MoveFrm: [96.6, 132.3, 138.0],
  };
  const SUB_SAVE_LEVELS = {
    "ラインマーカー": 0,
    "クイックボム": 1,
    "ポイズンミスト": 1,
    "ポイントセンサー": 1,
    "ロボットボム": 1,
    "タンサンボム": 1,
    "カーリングボム": 2,
    "スプラッシュボム": 2,
    "トーピード": 2,
    "キューバンボム": 2,
    "スプラッシュシールド": 3,
    "スプリンクラー": 3,
    "トラップ": 3,
    "ジャンプビーコン": 4,
  };
  const ABILITY_LABELS = {
    ISM: "メイン効率",
    ISS: "サブ効率",
    IRU: "インク回復力",
    RSU: "ヒト移動速度",
    SSU: "イカ移動速度",
    SCU: "スペシャル増加量",
    RES: "相手インク影響",
    IA: "アクション強化",
    QR: "復活時間",
    QSJ: "スーパージャンプ",
    SS: "スペシャル減少量",
  };
  const SPECIAL_EFFECT_BONUSES = {
    "カムバック": [
      ["メイン効率", 10], ["サブ効率", 10], ["インク回復力", 10],
      ["ヒト移動速度", 10], ["イカ移動速度", 10], ["スペシャル増加量", 10],
    ],
    "ラストスパート": [["メイン効率", 30], ["サブ効率", 30], ["インク回復力", 30]],
    "スタートダッシュ": [["イカ移動速度", 30], ["ヒト移動速度", 30], ["相手インク影響", 30]],
    "受け身術": [["イカ移動速度", 30], ["ヒト移動速度", 30], ["相手インク影響", 30], ["アクション強化", 30]],
  };
  const SUB_DAMAGE_RATES = {
    "スプラッシュボム": "DamageRt_BombH",
    "キューバンボム": "DamageRt_BombH",
    "カーリングボム": "DamageRt_BombH",
    "ロボットボム": "DamageRt_BombH",
    "トラップ": "DamageRt_BombH",
    "トーピード": "DamageRt_BombH",
    "クイックボム": "DamageRt_BombL",
    "タンサンボム": "DamageRt_BombL",
    "ラインマーカー": "DamageRt_LineMarker",
    "スプリンクラー": "DamageRt_Sprinkler",
    "スプラッシュシールド": "DamageRt_Shield",
  };
  const MAIN_COST_KEYS = [
    "InkConsume",
    "InkConsumeFullCharge",
    "InkConsumeFullChargeSplatling",
    "InkConsumeFullCharge_ChargeParam",
    "InkConsumeMinCharge",
    "InkConsume_SwingParam",
    "InkConsumeSlosher",
    "InkConsume_WeaponSwingParam",
    "InkConsume_WeaponWideSwingParam",
    "InkConsume_WeaponVerticalSwingParam",
    "InkConsume_WeaponShelterShotgunParam",
  ];
  const MAIN_LOCK_KEYS = [
    "InkRecoverStop",
    "InkRecoverStop_WeaponWideSwingParam",
    "InkRecoverStop_WeaponVerticalSwingParam",
  ];

  function getPowerMeta(powerName) { return GEARPOWER_DATAS[powerName]; }

  function canPlacePower(powerName, slot) {
    if (!powerName) return true;
    const meta = getPowerMeta(powerName);
    if (!meta) return false;
    if (!meta.main) return true;
    if (slot.type !== "main") return false;
    if (meta.head) return slot.part === "head";
    if (meta.body) return slot.part === "body";
    if (meta.leg) return slot.part === "leg";
    return slot.type === "main";
  }

  function getAllowedPart(powerName) {
    const meta = getPowerMeta(powerName);
    if (!meta || !meta.main) return null;
    if (meta.head) return "head";
    if (meta.body) return "body";
    if (meta.leg) return "leg";
    return null;
  }

  function classifyPowers() {
    const normal = [];
    const mainOnly = { head: [], body: [], leg: [] };
    for (const [name, meta] of Object.entries(GEARPOWER_DATAS)) {
      if (!meta.main) normal.push(name);
      else if (mainOnly[getAllowedPart(name)]) mainOnly[getAllowedPart(name)].push(name);
    }
    return { normal, mainOnly };
  }

  function countGearPoints(slots, disabledSlots = null) {
    const totals = {};
    const bodyDoubles = {};
    for (const [part, values] of Object.entries(slots)) bodyDoubles[part] = values.main === BODY_DOUBLE && !slotDisabled(disabledSlots, part, "main", 0);
    for (const [part, values] of Object.entries(slots)) {
      if (!slotDisabled(disabledSlots, part, "main", 0)) addPower(totals, values.main, 10);
      for (let index = 0; index < values.subs.length; index++) {
        if (!slotDisabled(disabledSlots, part, "sub", index)) addPower(totals, values.subs[index], bodyDoubles[part] ? 6 : 3);
      }
    }
    return totals;
  }

  function slotDisabled(disabledSlots, part, type, index) {
    if (!disabledSlots || !disabledSlots[part]) return false;
    if (type === "main") return Boolean(disabledSlots[part].main);
    return Boolean(disabledSlots[part].subs && disabledSlots[part].subs[index]);
  }

  function addPower(totals, powerName, gp) {
    if (!powerName) return;
    const meta = getPowerMeta(powerName);
    if (!meta) return;
    if (meta.main) {
      totals[meta.l] = { name: meta.l, gp: 0, mainOnly: true, source: powerName };
      return;
    }
    if (!totals[meta.l]) totals[meta.l] = { name: meta.l, gp: 0, mainOnly: false, source: powerName };
    totals[meta.l].gp += gp;
  }

  function buildResults(slots, weaponName, options = {}) {
    const weapon = WEAPON_DATAS[weaponName] || Object.values(WEAPON_DATAS)[0];
    const baseTotals = countGearPoints(slots, options.disabledSlots);
    const totals = applyActiveSpecialEffects(baseTotals, options);
    const results = [];
    for (const item of Object.values(baseTotals)) {
      if (item.mainOnly) results.push(buildMainOnlyResult(item, options));
    }
    results.push(...buildSendouDetailResults(weaponName, weapon, totals, options));
    for (const item of Object.values(totals)) {
      if (!item.mainOnly) results.push(buildNumericResult(item, weaponName, weapon, totals, baseTotals));
    }
    return results.filter(Boolean).sort((a, b) => resultRank(a) - resultRank(b));
  }

  function resultRank(result) {
    const order = [
      "メイン消費量",
      "メイン効率/1発",
      "サブ効率/1発",
      "サブ性能",
      "インク回復力",
      "イカ移動速度",
      "ヒト移動速度",
      "射撃中ヒト速",
      "アクション強化",
      "相手インク影響",
      "サブ影響軽減",
      "スペシャル増加量",
      "スペシャル減少量",
      "復活時間",
      "スーパージャンプ",
      "対物ダメージ",
      "ドリンク",
      "カムバック",
      "ラストスパート",
      "スタートダッシュ",
      "逆境",
      "イカニンジャ",
      "ペナアップ",
      "リベンジ",
      "サーマル",
      "追加ギアパワー倍化",
      "ステルスジャンプ",
      "対物攻撃力アップ",
      "受け身術",
    ];
    const idx = order.indexOf(result.name);
    return idx === -1 ? 100 + result.name.charCodeAt(0) : idx;
  }

  function buildMainOnlyResult(item, options) {
    const table = GEARPOWER_TABLE[item.name] || GEARPOWER_TABLE[item.source];
    const meta = Object.values(GEARPOWER_DATAS).find((entry) => entry.l === item.name);
    return { type: "text", name: item.name, icon: (table && table.i) || (meta && meta.i), text: mainOnlyText(item.name, table && table.text, options) };
  }

  function buildNumericResult(item, weaponName, weapon, totals, baseTotals) {
    const gp = Math.min(MAX_GP, item.gp);
    const baseGp = Math.min(MAX_GP, (baseTotals[item.name] && baseTotals[item.name].gp) || 0);
    const context = { totals, baseTotals, baseGp, gp };
    switch (item.name) {
      case "イカ移動速度": return swimSpeedResult(gp, weapon && weapon.w, Boolean(totals["イカニンジャ"]), context);
      case "ヒト移動速度": return humanSpeedResult(gp, weaponName, weapon, context);
      case "サブ効率": return subSaverResult(gp, weaponName, weapon, context);
      case "サブ性能": return subPowerResult(gp, weapon);
      case "メイン効率": return mainSaverResult(gp, context);
      case "インク回復力": return inkRecoveryResult(gp, context);
      case "スペシャル増加量": return specialChargeResult(gp, context);
      case "スペシャル性能": return null;
      case "スペシャル減少量": return specialSaverResult(gp, Boolean(totals["ペナアップ"]), context);
      case "復活時間": return quickRespawnResult(gp, Boolean(totals["ペナアップ"]));
      case "スーパージャンプ": return superJumpResult(gp, Boolean(totals["ステルスジャンプ"]));
      case "相手インク影響": return enemyInkResult(gp);
      case "アクション強化": return actionResult(gp);
      case "サブ影響軽減": return subDefenseResult(gp, weapon);
      default: return genericTableResult(item.name, gp);
    }
  }

  function applyActiveSpecialEffects(baseTotals, options = {}) {
    const totals = {};
    for (const [name, item] of Object.entries(baseTotals)) totals[name] = { ...item };
    for (const [mainOnlyName, bonuses] of Object.entries(SPECIAL_EFFECT_BONUSES)) {
      if (!baseTotals[mainOnlyName]) continue;
      if (mainOnlyName === "カムバック" && !options.comebackActive) continue;
      for (const [label, gp] of bonusValues(mainOnlyName, bonuses, options)) addBonusPower(totals, label, gp, mainOnlyName);
    }
    if (options.drinkActive) {
      addBonusPower(totals, "相手インク影響", MAX_GP, "ドリンク");
      addBonusPower(totals, "復活時間", MAX_GP, "ドリンク");
      addBonusPower(totals, "スーパージャンプ", MAX_GP, "ドリンク");
      addBonusPower(totals, "スペシャル減少量", MAX_GP, "ドリンク");
      addBonusPower(totals, "アクション強化", MAX_GP, "ドリンク");
      addMinPower(totals, "イカ移動速度", 29, "ドリンク");
      addMinPower(totals, "ヒト移動速度", 29, "ドリンク");
    }
    return totals;
  }

  function bonusValues(name, bonuses, options) {
    if (name !== "ラストスパート") return bonuses;
    const ap = Math.floor((18 / 21) * clamp(Number(options.ldeIntensity ?? 35), 0, 35));
    return [["メイン効率", ap], ["サブ効率", ap], ["インク回復力", ap]];
  }

  function addBonusPower(totals, label, gp, source) {
    if (!totals[label]) totals[label] = { name: label, gp: 0, mainOnly: false, source, bonusSources: [] };
    totals[label].gp = Math.min(MAX_GP, totals[label].gp + gp);
    totals[label].bonusSources = [...(totals[label].bonusSources || []), source];
  }

  function addMinPower(totals, label, gp, source) {
    if (!totals[label]) totals[label] = { name: label, gp: 0, mainOnly: false, source, bonusSources: [] };
    totals[label].gp = Math.min(MAX_GP, Math.max(totals[label].gp, gp));
    totals[label].bonusSources = [...(totals[label].bonusSources || []), source];
  }

  function mainOnlyText(name, fallback, options = {}) {
    if (name === "カムバック") {
      if (options.comebackActive) return "発動中: メイン効率/サブ効率/インク回復/ヒト速/イカ速/スペ増に各10APを加算して計算します。";
      return "未発動: チェックをONにすると、メイン効率/サブ効率/インク回復/ヒト速/イカ速/スペ増に各10APを加算します。";
    }
    if (name === "ラストスパート") {
      const intensity = clamp(Number(options.ldeIntensity ?? 35), 0, 35);
      const ap = Math.floor((18 / 21) * intensity);
      return `現在の強度: ${intensity} / 加算AP: ${ap}。メイン効率/サブ効率/インク回復に加算して計算します。`;
    }
    if (name === "スタートダッシュ") return "発動時: イカ速/ヒト速/相手インク影響軽減に各30APを加算して計算します。";
    if (name === "受け身術") return "発動後効果として、イカ速/ヒト速/相手インク影響軽減/アクション強化に各30APを加算して計算します。";
    return stripHtml(fallback) || "このギアパワーの特殊効果を発動します。";
  }

  function buildSendouDetailResults(weaponName, weapon, totals, options) {
    const params = getSendouWeaponParams(weaponName);
    if (!params) return [];
    const results = [];
    const scu = totals["スペシャル増加量"] ? totals["スペシャル増加量"].gp : 0;
    const ism = totals["メイン効率"] ? totals["メイン効率"].gp : 0;
    const rsu = totals["ヒト移動速度"] ? totals["ヒト移動速度"].gp : 0;
    const spu = totals["スペシャル性能"] ? totals["スペシャル性能"].gp : 0;
    const os = Boolean(totals["対物攻撃力アップ"]);

    if (params.kit.SpecialPoint) {
      const effect = effectByKey("IncreaseRt_Special", Math.min(MAX_GP, scu));
      results.push({
        type: "multi",
        name: "スペシャル必要P",
        icon: SENDOU_SPECIAL_ICON(weapon),
        gp: scu,
        values: [
          { label: "基本", value: `${params.kit.SpecialPoint}P` },
          { label: "スペ増後", value: `${Math.ceil(params.kit.SpecialPoint / effect)}P` },
        ],
        ratio: calcBarRatio(scu),
      });
    }

    const mainCost = mainInkCost(params);
    if (mainCost !== undefined) {
      const effect = effectByKey("ConsumeRt_Main", Math.min(MAX_GP, ism));
      const tank = inkTankSize(weaponName);
      results.push({
        type: "multi",
        name: "メイン消費量",
        icon: iconForLabel("メイン効率"),
        gp: ism,
        values: [
          { label: "1発", value: `${formatNumber(mainCost * effect * 100 / tank, 2)}%` },
          { label: "満タン", value: `${Math.floor(tank / (mainCost * effect))}回` },
        ],
        ratio: consumptionRatio(mainCost * effect / tank, mainCost / tank, mainCost * effectByKey("ConsumeRt_Main", MAX_GP) / tank),
      });
    }

    const moveSpeed = firstNumber(params.main, ["MoveSpeed", "MoveSpeed_Charge", "MoveSpeedFullCharge", "MoveSpeedVariable"]);
    if (moveSpeed !== undefined) {
      const shot = moveSpeed * effectByKey("MoveVelRt_Shot", Math.min(MAX_GP, rsu)) * 10;
      results.push({
        type: "multi",
        name: "射撃中ヒト速",
        icon: iconForLabel("ヒト移動速度"),
        gp: rsu,
        values: [{ label: "速度", value: `${formatNumber(shot)} DU/f` }, { label: "基準", value: `${formatNumber(moveSpeed * 10)} DU/f` }],
        ratio: speedRatio(shot, moveSpeed * 10),
      });
    }

    const damages = collectDamageValues(params.main).slice(0, 3);
    if (damages.length) {
      const mainDamageValues = damages.map((item) => ({ label: item.label, value: `${formatNumber(item.value / 10, 1)}` }));
      if (mainCost !== undefined) {
        const tank = inkTankSize(weaponName);
        const effect = effectByKey("ConsumeRt_Main", Math.min(MAX_GP, ism));
        mainDamageValues.push({ label: "1発インク", value: `${formatNumber(mainCost * effect * 100 / tank, 2)}%` });
      }
      results.push({
        type: "multi",
        name: "メインダメージ",
        icon: weapon && weapon.i,
        values: mainDamageValues,
        ratio: clamp((damages[0].value / 10) / 100 * 100, 0, 100),
      });
    }

    const subDamages = collectDamageValues(params.sub).slice(0, 2);
    if (subDamages.length) {
      results.push({
        type: "multi",
        name: "サブダメージ",
        icon: SUB_DATAS[weapon && weapon.sub] && SUB_DATAS[weapon.sub].i,
        values: subDamages.map((item) => ({ label: item.label, value: `${formatNumber(item.value / 10, 1)}` })),
        ratio: calcBarRatio(0),
      });
    }

    const specialResult = specialPowerResult(params.special, spu, weapon);
    if (specialResult) results.push(specialResult);

    const objectResult = objectDamageResult(params.id, damages[0], os, weapon);
    if (objectResult) results.push(objectResult);

    if (options.drinkActive) {
      results.push({ type: "text", name: "ドリンク", icon: "sp10.png", text: "ドリンク状態として、SSU/RSUは最低29AP、RES/QR/QSJ/SS/IAは57AP相当で計算します。" });
    }

    return results;
  }

  function buildEfficiencyTest(slots, weaponName, options = {}) {
    const weapon = WEAPON_DATAS[weaponName] || Object.values(WEAPON_DATAS)[0];
    const params = getSendouWeaponParams(weaponName);
    if (!params) return null;
    const baseTotals = countGearPoints(slots, options.disabledSlots);
    const totals = applyActiveSpecialEffects(baseTotals, options);
    const shotCount = clamp(Math.round(Number(options.mainShotCount ?? 5)), 1, 10);
    const ism = Math.min(MAX_GP, totals["メイン効率"] ? totals["メイン効率"].gp : 0);
    const iss = Math.min(MAX_GP, totals["サブ効率"] ? totals["サブ効率"].gp : 0);
    const iru = Math.min(MAX_GP, totals["インク回復力"] ? totals["インク回復力"].gp : 0);
    const tank = inkTankSize(weaponName);
    const mainCostBase = mainInkCost(params);
    if (mainCostBase === undefined) return null;
    const mainCost = mainCostBase * effectByKey("ConsumeRt_Main", ism);
    const requiredInk = mainCost * shotCount;
    const recoverFrames = recoveryFramesForInk(requiredInk, tank, iru);
    const mainLock = mainInkLock(params);
    const subCostBase = subInkCost(params, weapon);
    const subLevel = SUB_SAVE_LEVELS[weapon && weapon.sub] ?? 2;
    const subCost = subCostBase === undefined ? undefined : subCostBase * effectByKey(`ConsumeRt_Sub_Lv${subLevel}`, iss);
    const subLock = subInkLock(params);
    const subRemainingInk = subCost === undefined ? null : Math.max(0, tank - subCost);

    return {
      shotCount,
      mainCostPercent: mainCost * 100 / tank,
      requiredInkPercent: requiredInk * 100 / tank,
      main: efficiencyEntry("メイン発射後", mainLock, recoverFrames, requiredInk, tank),
      sub: subCost === undefined ? null : efficiencyEntry("サブ発射後", subLock, recoverFrames, requiredInk, tank, subCost),
      subRemaining: subRemainingInk === null ? null : {
        percent: subRemainingInk * 100 / tank,
        mainShots: Math.floor(subRemainingInk / Math.max(0.0001, mainCost)),
        mainMaxShots: Math.floor(tank / Math.max(0.0001, mainCost)),
      },
    };
  }

  function genericTableResult(name, gp) {
    const tableDef = GEARPOWER_TABLE[name];
    if (!tableDef) return simpleGpResult(name, gp);
    if (tableDef.raw) return rawResult(name, tableDef, gp, calcEffectByAbilityRanges(tableDef.raw, gp));
    if (tableDef.table) return tableResult(name, gp, tableDef.table, tableDef.i);
    if (tableDef.text) return { type: "text", name, icon: tableDef.i, text: tableDef.text };
    return simpleGpResult(name, gp, tableDef.i);
  }

  function tableResult(name, gp, table, icon) {
    if (!table) return simpleGpResult(name, gp, icon);
    const key = nearestKey(table, gp);
    const row = table[key];
    return { type: "bar", name, icon, gp, value: (row && row.v) || `${gp}GP`, ratio: clamp((row && row.r) || calcBarRatio(gp), 0, 100) };
  }

  function rawResult(name, tableDef, gp, value) {
    const key = nearestKey(tableDef.table, gp);
    let text;
    if (tableDef.fmt === "resid") text = `${Math.round(value * 1000) / 10}%残`;
    else if (tableDef.fmt === "invrel") text = formatPercent((tableDef.raw[0] - value) / tableDef.raw[0] * 100);
    else text = formatPercent((value / (tableDef.fmt === "rel01" ? 0.1 : 1) - 1) * 100);
    return { type: "bar", name, icon: tableDef.i, gp, value: text, ratio: clamp((tableDef.table[key] && tableDef.table[key].r) || calcBarRatio(gp), 0, 100) };
  }

  function simpleGpResult(name, gp, icon) { return { type: "bar", name, icon: icon || iconForLabel(name), gp, value: `${gp}GP`, ratio: calcBarRatio(gp) }; }

  function mainSaverResult(gp, context) {
    const effect = effectByKey("ConsumeRt_Main", gp);
    return { type: "multi", name: "メイン効率/1発", icon: iconForLabel("メイン効率"), gp, values: resultValues(context, [{ label: "消費", value: formatPercent((effect - 1) * 100) }, { label: "倍率", value: `${formatNumber(effect * 100, 1)}%` }]), ratio: consumptionRatio(effect, 1.0, 0.55) };
  }

  function swimSpeedResult(gp, weight = "中量", hasNinja = false, context) {
    const key = weight === "軽量" ? "MoveVel_Stealth_Fast" : weight === "重量" ? "MoveVel_Stealth_Slow" : "MoveVel_Stealth";
    const base = effectByKey(key, 0) * 10;
    let speed = effectByKey(key, gp) * 10;
    if (hasNinja) speed *= 0.9;
    return { type: "multi", name: "イカ移動速度", icon: iconForLabel("イカ移動速度"), gp, values: resultValues(context, [{ label: hasNinja ? "イカニンジャ込み" : "速度", value: `${formatNumber(speed)} DU/f` }, { label: "変化率", value: formatPercent((speed / base - 1) * 100) }]), ratio: speedRatio(speed, base) };
  }

  function humanSpeedResult(gp, weaponName, weapon, context) {
    const weight = (weapon && weapon.w) || "中量";
    const key = weight === "軽量" ? "MoveVel_Human_Fast" : weight === "重量" ? "MoveVel_Human_Slow" : "MoveVel_Human";
    const base = effectByKey(key, 0) * 10;
    const speed = effectByKey(key, gp) * 10;
    const nonShooting = `${formatNumber(speed)} DU/f`;
    let shooting = "-";
    if (!["ローラー", "フデ", "ワイパー"].includes(weapon && weapon.cat)) {
      const effect = effectByKey("MoveVelRt_Shot", gp);
      shooting = formatPercent((effect - 1) * 100);
    }
    return { type: "multi", name: "ヒト移動速度", icon: iconForLabel("ヒト移動速度"), gp, values: resultValues(context, [{ label: "非射撃時", value: nonShooting }, { label: "射撃中倍率", value: shooting }]), ratio: speedRatio(speed, base) };
  }

  function subSaverResult(gp, weaponName, weapon, context) {
    const sub = SUB_DATAS[weapon && weapon.sub];
    if (!sub) return simpleGpResult("サブ効率", gp, iconForLabel("サブ効率"));
    const level = SUB_SAVE_LEVELS[weapon && weapon.sub] ?? 2;
    const effect = effectByKey(`ConsumeRt_Sub_Lv${level}`, gp);
    const tank = inkTankSize(weaponName);
    const cost = Number(sub.c) * effect;
    const percent = Math.floor((cost * 100 / tank + 0.0045) * 100) / 100;
    const count = Math.floor(tank / cost);
    return { type: "multi", name: "サブ効率/1発", icon: iconForLabel("サブ効率"), gp, values: resultValues(context, [{ label: "1発", value: `${formatNumber(percent)}%` }, { label: "満タン", value: `${count}個` }]), ratio: consumptionRatio(cost / tank, Number(sub.c) / tank, Number(sub.c) * effectByKey(`ConsumeRt_Sub_Lv${level}`, 57) / tank) };
  }

  function inkRecoveryResult(gp, context) {
    const squid = Math.ceil(effectByKey("InkRecoverFrm_Stealth", gp)) / 60;
    const human = Math.ceil(effectByKey("InkRecoverFrm_Std", gp)) / 60;
    return { type: "multi", name: "インク回復力", icon: iconForLabel("インク回復力"), gp, values: resultValues(context, [{ label: "イカ", value: `${formatNumber(squid, 2)}秒` }, { label: "ヒト", value: `${formatNumber(human, 2)}秒` }]), ratio: consumptionRatio(squid, 3, 1.95) };
  }

  function specialChargeResult(gp, context) {
    const effect = effectByKey("IncreaseRt_Special", gp);
    return { type: "multi", name: "スペシャル増加量", icon: iconForLabel("スペシャル増加量"), gp, values: resultValues(context, [{ label: "増加", value: formatPercent((effect - 1) * 100) }, { label: "倍率", value: `${formatNumber(effect * 100, 1)}%` }]), ratio: calcBarRatio(gp) };
  }

  function specialSaverResult(gp, hasRespawnPunisher, context) {
    const effect = effectByKey("SpecialGaugeRt_Restart", gp);
    const ownPenalty = hasRespawnPunisher ? 22.5 : 0;
    return { type: "multi", name: "スペシャル減少量", icon: iconForLabel("スペシャル減少量"), gp, values: resultValues(context, [{ label: "通常", value: `${formatNumber(effect * 100, 1)}%残` }, { label: "ペナ自装備", value: `${formatNumber(Math.max(0, effect * 100 - ownPenalty), 1)}%残` }]), ratio: clamp(effect * 100, 0, 100) };
  }

  function quickRespawnResult(gp, hasRespawnPunisher) {
    const chase = effectByKey("Dying_ChaseFrm", gp);
    const around = effectByKey("Dying_AroundFrm", gp);
    const base = Math.ceil(effectByKey("Dying_ChaseFrm", 0) + effectByKey("Dying_AroundFrm", 0) - 60) / 60;
    const current = Math.ceil(chase + around + (hasRespawnPunisher ? 68 : 0) - 60) / 60;
    const rpAp = Math.ceil(gp * 0.15);
    const rpChase = effectByKey("Dying_ChaseFrm", rpAp);
    const rpAround = effectByKey("Dying_AroundFrm", rpAp);
    const byEnemyRp = Math.ceil(rpChase + rpAround + 45 + (hasRespawnPunisher ? 68 : 0) - 60) / 60;
    return { type: "multi", name: "復活時間", icon: iconForLabel("復活時間"), gp, values: [{ label: hasRespawnPunisher ? "ペナ自装備" : "時間", value: `${formatNumber(current, 2)}秒` }, { label: "RP被撃破", value: `${formatNumber(byEnemyRp, 2)}秒` }, { label: "短縮", value: formatSeconds(current - base) }], ratio: consumptionRatio(current, base, 1) };
  }

  function superJumpResult(gp, hasStealthJump) {
    const charge = Math.ceil(effectByKey("SuperJump_ChargeFrm", gp));
    const move = Math.ceil(effectByKey("SuperJump_MoveFrm", gp));
    const total = Math.ceil(charge + move + (hasStealthJump ? 60 : 0)) / 60;
    const base = Math.ceil(Math.ceil(effectByKey("SuperJump_ChargeFrm", 0)) + Math.ceil(effectByKey("SuperJump_MoveFrm", 0))) / 60;
    return { type: "multi", name: "スーパージャンプ", icon: iconForLabel("スーパージャンプ"), gp, values: [{ label: hasStealthJump ? "ステジャン込み" : "合計", value: `${formatNumber(total, 2)}秒` }, { label: "地上", value: `${charge}F` }], ratio: consumptionRatio(total, base, 2) };
  }

  function enemyInkResult(gp) {
    const speed = effectByKey("OpInk_MoveVel", gp) * 10;
    const damageSec = effectToDamage(effectByKey("OpInk_DamagePerFrame", gp)) * 60;
    const limit = effectToDamage(effectByKey("OpInk_DamageLmt", gp));
    const armor = Math.ceil(effectByKey("OpInk_ArmorHP", gp));
    return { type: "multi", name: "相手インク影響", icon: iconForLabel("相手インク影響"), gp, values: [{ label: "移動", value: `${formatNumber(speed)} DU/f` }, { label: "被ダメ/秒", value: `${formatNumber(damageSec, 1)}` }, { label: "上限", value: `${formatNumber(limit, 1)}` }, { label: "猶予", value: `${armor}F` }], ratio: clamp(speed / (effectByKey("OpInk_MoveVel", 57) * 10) * 100, 0, 100) };
  }

  function actionResult(gp) {
    const swerve = effectByKey("ReduceJumpSwerveRate", gp);
    const roll = effectByKey("Somersault_MoveVelKd", gp);
    return { type: "multi", name: "アクション強化", icon: iconForLabel("アクション強化"), gp, values: [{ label: "ブレ軽減", value: formatPercent(swerve * 100) }, { label: "ロール維持", value: `${formatNumber(roll * 100, 1)}%` }], ratio: calcBarRatio(gp) };
  }

  function subPowerResult(gp, weapon) {
    const sub = SUB_DATAS[weapon && weapon.sub];
    if (!sub || !sub.t || sub.t === "-") return { type: "bar", name: "サブ性能", icon: iconForLabel("サブ性能"), gp, value: "-", ratio: 0 };
    if ((weapon && weapon.sub) === "ジャンプビーコン") {
      const boost = beaconQsjBoost(gp);
      return { type: "multi", name: "サブ性能(ビーコン)", icon: iconForLabel("サブ性能"), gp, values: [{ label: "スパ短相当", value: `${boost}AP` }, { label: "効果", value: formatPercent((effectByKey("SuperJump_ChargeFrm", boost) / effectByKey("SuperJump_ChargeFrm", 0) - 1) * 100) }], ratio: calcBarRatio(boost) };
    }
    const raw = calcEffectByAbilityRanges(sub.d, gp);
    const value = sub.m === "hp" ? `${Math.round(raw)}hp` : formatPercent((raw / Number(sub.d[0]) - 1) * 100);
    return { type: "bar", name: `サブ性能(${sub.t})`, icon: iconForLabel("サブ性能"), gp, value, ratio: calcBarRatio(gp) };
  }

  function subDefenseResult(gp, weapon) {
    const subName = weapon && weapon.sub;
    const key = SUB_DAMAGE_RATES[subName] || "DamageRt_BombH";
    const effect = effectByKey(key, gp);
    const sampleDamage = key === "DamageRt_BombL" ? 35 : key === "DamageRt_LineMarker" ? 40 : 30;
    const damage = Math.floor(sampleDamage * effect * 10) / 10;
    return { type: "multi", name: "サブ影響軽減", icon: iconForLabel("サブ影響軽減"), gp, values: [{ label: subName || "サブ", value: `${formatNumber(damage, 1)}ダメ` }, { label: "軽減率", value: formatPercent((effect - 1) * 100) }], ratio: consumptionRatio(effect, 1, ABILITY_VALUES[key][0]) };
  }

  function iconForLabel(label) { return (Object.values(GEARPOWER_DATAS).find((entry) => entry.l === label) || {}).i; }
  function abilityCurve(gp) { return Math.min(3.3 * gp - 0.027 * gp * gp, 100) / 100; }

  function effectByKey(key, gp) {
    return calcEffectHighMidLow(ABILITY_VALUES[key], gp);
  }

  function calcEffectHighMidLow(range = [], gp = 0) {
    const high = Number(range[0] ?? 0), mid = Number(range[1] ?? high), low = Number(range[2] ?? mid);
    if (high === low) return low;
    const slope = mid === low ? 0 : (mid - low) / (high - low);
    return low + (high - low) * lerpN(slope, abilityCurve(gp));
  }

  function calcEffectByAbilityRanges(range = [], gp = 0) {
    const min = Number(range[0] ?? 0), mid = Number(range[1] ?? min), max = Number(range[2] ?? mid);
    if (max === min) return min;
    const slope = (mid - min) / (max - min);
    const t = Math.min(3.3 * gp - 0.027 * gp * gp, 100) / 100;
    return Math.round((min + (max - min) * lerpN(slope, t)) * 1000) / 1000;
  }

  function lerpN(slope, t) {
    if (Number(t.toFixed(3)) === 0.5 || slope === 0 || slope === 1) return slope;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(Math.E, Math.log(slope) * Math.log(t) / Math.log(2) * -1);
  }

  function formatPercent(value) {
    const rounded = Math.round(value * 100) / 100;
    if (Math.abs(rounded) < 0.005) return "±0%";
    return `${rounded > 0 ? "+" : "-"}${Math.abs(rounded).toFixed(2).replace(/\.00$/, "")}%`;
  }

  function formatSeconds(value) {
    const rounded = Math.round(value * 100) / 100;
    if (Math.abs(rounded) < 0.005) return "±0秒";
    return `${rounded > 0 ? "+" : "-"}${Math.abs(rounded).toFixed(2).replace(/\.00$/, "")}秒`;
  }

  function formatNumber(value, digits = 3) {
    return Number(value).toFixed(digits).replace(/\.?0+$/, "");
  }

  function resultValues(context, values) {
    if (!context || context.gp === context.baseGp) return values;
    const value = context.baseGp === 0 ? `${context.gp}(発動時)` : `${context.baseGp}->${context.gp}`;
    return [{ label: "AP", value }, ...values];
  }

  function effectToDamage(effect) {
    return Number((effect * 100 - 0.05).toFixed(1));
  }

  function getSendouWeaponParams(weaponName) {
    if (!SENDOU.weaponParams || !SENDOU.weaponNameToSendouId) return null;
    const id = SENDOU.weaponNameToSendouId[weaponName];
    if (id === undefined) return null;
    const kit = SENDOU.weaponParams.weaponKits[String(id)];
    const main = { ...(SENDOU.weaponParams.baseWeaponStats[String(sendouBaseId(id))] || {}), ...(kit || {}) };
    return {
      id,
      kit: kit || {},
      main,
      sub: kit ? SENDOU.weaponParams.subWeapons[String(kit.subWeaponId)] || {} : {},
      special: kit ? SENDOU.weaponParams.specialWeapons[String(kit.specialWeaponId)] || {} : {},
    };
  }

  function sendouBaseId(id) {
    const alt = { 45: 40, 47: 40, 46: 41, 48: 41, 205: 200, 1015: 1010, 1115: 1110, 2015: 2010, 3005: 3000, 4015: 4010, 5015: 5010, 6005: 6000, 7015: 7010, 8005: 8000 };
    if (alt[id]) return alt[id];
    if (SENDOU.weaponParams && SENDOU.weaponParams.baseWeaponStats[String(id)]) return id;
    return Math.floor(id / 10) * 10;
  }

  function firstNumber(obj, keys) {
    for (const key of keys) if (typeof obj[key] === "number") return obj[key];
    return undefined;
  }

  function mainInkCost(params) {
    return firstNumber(params && params.main, MAIN_COST_KEYS);
  }

  function mainInkLock(params) {
    return Math.ceil(firstNumber(params && params.main, MAIN_LOCK_KEYS) || 0);
  }

  function subInkCost(params, weapon) {
    if (params && params.sub && typeof params.sub.InkConsume === "number") return params.sub.InkConsume;
    const sub = SUB_DATAS[weapon && weapon.sub];
    if (sub && Number.isFinite(Number(sub.c))) return Number(sub.c);
    return undefined;
  }

  function subInkLock(params) {
    return Math.ceil((params && params.sub && typeof params.sub.InkRecoverStop === "number") ? params.sub.InkRecoverStop : 0);
  }

  function recoveryFramesForInk(inkAmount, tank, gp) {
    const fullTankFrames = Math.ceil(effectByKey("InkRecoverFrm_Stealth", Math.min(MAX_GP, gp)));
    return Math.ceil(fullTankFrames * clamp(inkAmount / tank, 0, 1));
  }

  function efficiencyEntry(label, lockFrames, recoverFrames, requiredInk, tank, actionCost) {
    const totalFrames = lockFrames + recoverFrames;
    const values = [
      { label: "合計", value: `${totalFrames}F` },
      { label: "ロック", value: `${lockFrames}F` },
      { label: "回復", value: `${recoverFrames}F` },
      { label: "必要", value: `${formatNumber(requiredInk * 100 / tank, 2)}%` },
    ];
    if (typeof actionCost === "number") values.push({ label: "発射消費", value: `${formatNumber(actionCost * 100 / tank, 2)}%` });
    return {
      label,
      lockFrames,
      recoverFrames,
      totalFrames,
      requiredInkPercent: requiredInk * 100 / tank,
      actionCostPercent: typeof actionCost === "number" ? actionCost * 100 / tank : undefined,
      values,
      ratio: clamp(totalFrames / 240 * 100, 0, 100),
    };
  }

  function collectDamageValues(obj) {
    const labels = {
      DamageParam_ValueMax: "最大",
      DamageParam_ValueMin: "最小",
      DamageParam_ValueDirect: "直撃",
      DamageParam_ValueFullCharge: "フル",
      DamageParam_ValueMaxCharge: "最大",
      DamageParam_ValueMinCharge: "最小",
      DamageParam_SplatanaVerticalDirect: "縦直",
      DamageParam_SplatanaVertical: "縦",
      DamageParam_SplatanaHorizontalDirect: "横直",
      DamageParam_SplatanaHorizontal: "横",
      DirectDamage: "直撃",
      SplashDamage: "爆風",
      CannonDamage: "砲撃",
      BumpDamage: "接触",
      MaxDamage: "最大",
      MinDamage: "最小",
    };
    const result = [];
    for (const [key, value] of Object.entries(obj || {})) {
      if (typeof value === "number" && /Damage/.test(key) && value > 0) {
        result.push({ key, label: labels[key] || key.replace(/.*_/, ""), value });
      }
      if (Array.isArray(value) && /Damage/.test(key)) {
        for (const entry of value) {
          if (entry && typeof entry.Damage === "number") result.push({ key, label: labels[key] || key.replace(/.*_/, ""), value: entry.Damage });
        }
      }
    }
    return result.sort((a, b) => b.value - a.value);
  }

  function specialPowerResult(specialParams, gp, weapon) {
    const overwrites = specialParams && specialParams.overwrites;
    if (!overwrites) return null;
    const entries = Object.entries(overwrites).filter(([, range]) => range && typeof range.High === "number" && range.High !== range.Low);
    if (!entries.length) return null;
    const values = entries.slice(0, 3).map(([key, range]) => {
      const effect = calcEffectHighMidLow([range.High, range.Mid, range.Low], Math.min(MAX_GP, gp));
      const unit = /Frame/.test(key) ? "F" : "";
      return { label: compactParamName(key), value: `${formatNumber(effect, 2)}${unit}` };
    });
    return { type: "multi", name: "スペシャル性能", icon: SENDOU_SPECIAL_ICON(weapon), gp, values, ratio: calcBarRatio(gp) };
  }

  function objectDamageResult(weaponId, damage, hasObjectShredder, weapon) {
    if (!damage || !SENDOU.objectDamage) return null;
    const normalized = sendouBaseId(weaponId);
    let bestRate = 1;
    let target = "Rainmaker";
    for (const group of Object.values(SENDOU.objectDamage)) {
      if (!Array.isArray(group.mainWeaponIds) || !group.mainWeaponIds.includes(normalized)) continue;
      const rate = (group.rates || []).find((item) => item.target === "Gachihoko_Barrier") || (group.rates || [])[0];
      if (rate) {
        bestRate = rate.rate || 1;
        target = rate.target || target;
        break;
      }
    }
    const objectShredderRate = hasObjectShredder ? 1.1 : 1;
    const finalDamage = Math.round((damage.value / 10) * bestRate * objectShredderRate);
    const hp = SENDOU.objectHitPoints && SENDOU.objectHitPoints.RainmakerBarrier || 1000;
    return {
      type: "multi",
      name: "対物ダメージ",
      icon: iconForLabel("対物攻撃力アップ"),
      values: [
        { label: target, value: `${finalDamage}` },
        { label: "破壊目安", value: `${Math.ceil(hp / Math.max(1, finalDamage))}発` },
      ],
      ratio: clamp(finalDamage / hp * 100, 0, 100),
    };
  }

  function compactParamName(key) {
    return key.replace(/Special|Frame|Distance|Radius|Damage|Param|_/g, "").slice(0, 6) || key.slice(0, 6);
  }

  function SENDOU_SPECIAL_ICON(weapon) {
    const special = weapon && weapon.sp;
    const data = window.SPL3_DATA.SPECIAL_DATAS && window.SPL3_DATA.SPECIAL_DATAS[special];
    return data && data.i;
  }

  function beaconQsjBoost(gp) {
    const known = { 0: 0, 3: 4, 6: 9, 13: 18, 28: 36, 57: 57 };
    const keys = Object.keys(known).map(Number);
    if (known[gp] !== undefined) return known[gp];
    const lower = keys.filter((key) => key <= gp).pop() ?? 0;
    const upper = keys.find((key) => key >= gp) ?? 57;
    if (lower === upper) return known[lower];
    const rate = (gp - lower) / (upper - lower);
    return Math.round(known[lower] + (known[upper] - known[lower]) * rate);
  }

  function stripHtml(value) {
    return String(value || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }

  function inkTankSize(weaponName) {
    return ["わかばシューター", "もみじシューター"].includes(weaponName) ? 1.1 : 1.0;
  }

  function consumptionRatio(value, base, best) {
    if (base === best) return calcBarRatio(0);
    return clamp((base - value) / (base - best) * 100, 0, 100);
  }

  function speedRatio(value, base) {
    return clamp(50 + (value / base - 1) * 220, 0, 100);
  }

  function calcBarRatio(gp) { return clamp(Math.round(gp / 57 * 100), 0, 100); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)); }

  window.SPL3 = window.SPL3 || {};
  window.SPL3.calculations = { getPowerMeta, canPlacePower, getAllowedPart, classifyPowers, countGearPoints, buildResults, buildEfficiencyTest, iconForLabel };
})();

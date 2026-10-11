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
  const MAIN_PAINT_POINTS = {
    "わかばシューター": { p: 4.5, f: 5 }, "もみじシューター": { p: 4.5, f: 5 },
    "ボールドマーカー": { p: 5.7, f: 5 }, "ボールドマーカーネオ": { p: 5.7, f: 5 },
    "シャープマーカー": { p: 4.1, f: 5 }, "シャープマーカーネオ": { p: 4.1, f: 5 },
    "スプラシューター": { p: 4.0, f: 6 }, "スプラシューターコラボ": { p: 4.0, f: 6 }, "ヒーローシューターレプリカ": { p: 4.0, f: 6 }, "オーダーシューターレプリカ": { p: 4.0, f: 6 },
    "N-ZAP85": { p: 3.6, f: 5 }, "N-ZAP89": { p: 3.6, f: 5 },
    "プロモデラーMG": { p: 4.5, f: 4 }, "プロモデラーRG": { p: 4.5, f: 4 },
    "52ガロン": { p: 6.7, f: 9 }, "52ガロンデコ": { p: 6.7, f: 9 },
    "96ガロン": { p: 7.5, f: 12 }, "96ガロンデコ": { p: 7.5, f: 12 },
    "プライムシューター": { p: 4.7, f: 8 }, "プライムシューターコラボ": { p: 4.7, f: 8 },
    "ジェットスイーパー": { p: 4.5, f: 8 }, "ジェットスイーパーカスタム": { p: 4.5, f: 8 },
    "スペースシューター": { p: 4.0, f: 6 }, "スペースシューターコラボ": { p: 4.0, f: 6 },
    "ノヴァブラスター": { p: 14.0, f: 40 }, "ノヴァブラスターネオ": { p: 14.0, f: 40 },
    "ホットブラスター": { p: 16.2, f: 50 }, "ホットブラスターカスタム": { p: 16.2, f: 50 },
    "ロングブラスター": { p: 14.2, f: 60 }, "ロングブラスターカスタム": { p: 14.2, f: 60 },
    "クラッシュブラスター": { p: 8.6, f: 20 }, "クラッシュブラスターネオ": { p: 8.6, f: 20 },
    "ラピッドブラスター": { p: 14.4, f: 35 }, "ラピッドブラスターデコ": { p: 14.4, f: 35 },
    "Rブラスターエリート": { p: 13.5, f: 40 }, "Rブラスターエリートデコ": { p: 13.5, f: 40 },
    "S-BLAST92": { p: 13.6, f: 55 }, "S-BLAST91": { p: 13.6, f: 55 },
    "L3リールガン": { p: 12.8, f: 18, shotsPerAction: 3 }, "L3リールガンD": { p: 12.8, f: 18, shotsPerAction: 3 },
    "H3リールガン": { p: 16.3, f: 32, shotsPerAction: 3 }, "H3リールガンD": { p: 16.3, f: 32, shotsPerAction: 3 },
    "パブロ": { p: 10.3, f: 7 }, "パブロ・ヒュー": { p: 10.3, f: 7 }, "パブロヒュー": { p: 10.3, f: 7 },
    "ホクサイ": { p: 7.7, f: 11 }, "ホクサイ・ヒュー": { p: 7.7, f: 11 }, "ホクサイヒュー": { p: 7.7, f: 11 },
    "バケットスロッシャー": { p: 13.6, f: 29 }, "バケットスロッシャーデコ": { p: 13.6, f: 29 },
    "ヒッセン": { p: 11.5, f: 25 }, "ヒッセン・ヒュー": { p: 11.5, f: 25 }, "ヒッセンヒュー": { p: 11.5, f: 25 },
    "スクリュースロッシャー": { p: 14.7, f: 38 }, "スクリュースロッシャーネオ": { p: 14.7, f: 38 },
    "オーバーフロッシャー": { p: 16.6, f: 32 }, "オーバーフロッシャーデコ": { p: 16.6, f: 32 },
    "エクスプロッシャー": { p: 21.8, f: 55 }, "エクスプロッシャーカスタム": { p: 21.8, f: 55 },
    "モップリン": { p: 18.0, f: 45 }, "モップリンD": { p: 18.0, f: 45 },
    "スプラマニューバー": { p: 3.0, f: 5 }, "スプラマニューバーコラボ": { p: 3.0, f: 5 }, "オーダーマニューバーレプリカ": { p: 3.0, f: 5 },
    "スパッタリー": { p: 4.0, f: 5 }, "スパッタリー・ヒュー": { p: 4.0, f: 5 },
    "デュアルスイーパー": { p: 4.2, f: 6 }, "デュアルスイーパーカスタム": { p: 4.2, f: 6 },
    "ケルビン525": { p: 5.2, f: 9 }, "ケルビン525デコ": { p: 5.2, f: 9 },
    "クアッドホッパーブラック": { p: 3.3, f: 6 }, "クアッドホッパーホワイト": { p: 3.3, f: 6 },
    "ガエンFF": { p: 4.6, f: 8 },
    "パラシェルター": { p: 17.2, f: 29 }, "パラシェルターソレーラ": { p: 17.2, f: 29 }, "オーダーシェルターレプリカ": { p: 17.2, f: 29 },
    "キャンピングシェルター": { p: 17.5, f: 51 }, "キャンピングシェルターソレーラ": { p: 17.5, f: 51 },
    "スパイガジェット": { p: 12.5, f: 26 }, "スパイガジェットソレーラ": { p: 12.5, f: 26 },
    "24式張替傘・甲": { p: 14.8, f: 34 },
    "スプラチャージャー": { p: 23.0, f: 66 }, "スプラチャージャーコラボ": { p: 23.0, f: 66 }, "スプラスコープ": { p: 23.0, f: 66 }, "スプラスコープコラボ": { p: 23.0, f: 66 },
    "リッター4K": { p: 32.0, f: 98 }, "リッター4Kカスタム": { p: 32.0, f: 98 }, "4Kスコープ": { p: 32.0, f: 98 }, "4Kスコープカスタム": { p: 32.0, f: 98 },
    "スクイックリンα": { p: 20.0, f: 51 }, "スクイックリンβ": { p: 20.0, f: 51 },
    "14式竹筒銃・甲": { p: 15.0, f: 26 }, "14式竹筒銃・乙": { p: 15.0, f: 26 },
    "ソイチューバー": { p: 24.0, f: 77 }, "ソイチューバーカスタム": { p: 24.0, f: 77 },
    "R-PEN/5H": { p: 16.0, f: 146, shotsPerAction: 5 }, "R-PEN/5B": { p: 16.0, f: 146, shotsPerAction: 5 },
  };
  const MAIN_KILL_TIMES = {
    "ボールドマーカー": [{ mode: "通常", hit: 11, human: 14, squid: 21, sec: 0.233 }],
    "わかばシューター": [{ mode: "通常", hit: 16, human: 19, squid: 26, sec: 0.317 }],
    "シャープマーカー": [{ mode: "通常", hit: 16, human: 19, squid: 27, sec: 0.317 }],
    "プロモデラーMG": [{ mode: "通常", hit: 17, human: 20, squid: 27, sec: 0.333 }],
    "スプラシューター": [{ mode: "通常", hit: 13, human: 16, squid: 24, sec: 0.267 }],
    "52ガロン": [{ mode: "通常", hit: 10, human: 13, squid: 21, sec: 0.217 }],
    "N-ZAP85": [{ mode: "通常", hit: 16, human: 19, squid: 27, sec: 0.317 }],
    "プライムシューター": [{ mode: "通常", hit: 17, human: 20, squid: 28, sec: 0.333 }],
    "96ガロン": [{ mode: "通常", hit: 13, human: 16, squid: 24, sec: 0.267 }],
    "ジェットスイーパー": [{ mode: "通常", hit: 25, human: 28, squid: 36, sec: 0.467 }],
    "スペースシューター": [{ mode: "通常", hit: 25, human: 28, squid: 36, sec: 0.467 }],
    "ノヴァブラスター": [{ mode: "直撃", hit: 1, human: 14, squid: 24, sec: 0.233 }, { mode: "爆風", hit: 41, human: 54, squid: 64, sec: 0.900 }],
    "ホットブラスター": [{ mode: "直撃", hit: 1, human: 14, squid: 24, sec: 0.233 }, { mode: "爆風", hit: 51, human: 64, squid: 74, sec: 1.067 }],
    "ロングブラスター": [{ mode: "直撃", hit: 1, human: 14, squid: 24, sec: 0.233 }, { mode: "爆風", hit: 61, human: 74, squid: 84, sec: 1.233 }],
    "クラッシュブラスター": [{ mode: "直撃", hit: 21, human: 32, squid: 40, sec: 0.533 }, { mode: "爆風", hit: 61, human: 72, squid: 80, sec: 1.200 }],
    "ラピッドブラスター": [{ mode: "直撃", hit: 36, human: 47, squid: 55, sec: 0.783 }, { mode: "爆風", hit: 71, human: 82, squid: 90, sec: 1.367 }],
    "Rブラスターエリート": [{ mode: "直撃", hit: 41, human: 52, squid: 61, sec: 0.867 }, { mode: "爆風", hit: 81, human: 92, squid: 101, sec: 1.533 }],
    "S-BLAST92": [{ mode: "直撃", hit: 1, human: 14, squid: 24, sec: 0.233 }, { mode: "爆風", hit: 56, human: 69, squid: 79, sec: 1.150 }],
    "L3リールガン": [{ mode: "通常", hit: 19, human: 22, squid: 31, sec: 0.367 }],
    "H3リールガン": [{ mode: "通常", hit: 11, human: 14, squid: 23, sec: 0.233 }, { mode: "1発外し", hit: 33, human: 36, squid: 45, sec: 0.600 }],
    "ボトルガイザー": [{ mode: "初弾のみ", hit: 17, human: 20, squid: 29, sec: 0.333 }, { mode: "連射のみ", hit: 22, human: null, squid: null, sec: 0.367 }, { mode: "初弾+連射", hit: 25, human: 28, squid: 37, sec: 0.467 }, { mode: "初+初+連", hit: 19, human: 22, squid: 31, sec: 0.367 }],
    "スプラローラー": [{ mode: "横", hit: 1, human: 23, squid: 36, sec: 0.383 }, { mode: "縦", hit: 1, human: 33, squid: 46, sec: 0.550 }],
    "ダイナモローラー": [{ mode: "横", hit: 1, human: 47, squid: 60, sec: 0.783 }, { mode: "縦", hit: 1, human: 62, squid: 75, sec: 1.033 }],
    "ヴァリアブルローラー": [{ mode: "横", hit: 1, human: 21, squid: 34, sec: 0.350 }, { mode: "縦", hit: 1, human: 52, squid: 65, sec: 0.867 }],
    "パブロ": [{ mode: "振り", hit: 21, human: 25, squid: 35, sec: 0.417 }],
    "ホクサイ": [{ mode: "振り", hit: 22, human: 26, squid: 36, sec: 0.433 }],
    "フィンセント": [{ mode: "振り", hit: 14, human: 40, squid: 49, sec: 0.667 }],
    "バケットスロッシャー": [{ mode: "通常", hit: 30, human: 43, squid: 49, sec: 0.717 }],
    "ヒッセン": [{ mode: "通常", hit: 24, human: 37, squid: 43, sec: 0.617 }],
    "スクリュースロッシャー": [{ mode: "直撃", hit: 39, human: 52, squid: 58, sec: 0.867 }, { mode: "渦", hit: 77, human: 91, squid: 97, sec: 1.517 }],
    "オーバーフロッシャー": [{ mode: "通常", hit: 16, human: 23, squid: 29, sec: 0.383 }],
    "エクスプロッシャー": [{ mode: "直撃", hit: 56, human: 73, squid: 79, sec: 1.217 }, { mode: "爆風", hit: 111, human: 129, squid: 135, sec: 2.150 }, { mode: "直撃+爆風", hit: 56, human: 73, squid: 79, sec: 1.217 }],
    "モップリン": [{ mode: "通常", hit: 46, human: 63, squid: 69, sec: 1.050 }],
    "スクイックリンα": [{ mode: "FC", hit: 1, human: 49, squid: 54, sec: 0.817 }, { mode: "CK", hit: 1, human: null, squid: 29, sec: 0.483 }],
    "スプラチャージャー": [{ mode: "FC", hit: 1, human: 64, squid: 69, sec: 1.067 }, { mode: "CK", hit: 1, human: null, squid: 33, sec: 0.550 }],
    "リッター4K": [{ mode: "FC", hit: 1, human: 96, squid: 101, sec: 1.600 }, { mode: "CK", hit: 1, human: null, squid: 33, sec: 0.550 }],
    "14式竹筒銃・甲": [{ mode: "FC", hit: 27, human: 50, squid: 55, sec: 0.833 }, { mode: "NC", hit: 43, human: 54, squid: 59, sec: 0.900 }, { mode: "FC+NC", hit: 15, human: 38, squid: 43, sec: 0.633 }, { mode: "13fC", hit: 20, human: 36, squid: 41, sec: 0.600 }, { mode: "17fC+NC", hit: 15, human: 35, squid: 40, sec: 0.583 }],
    "ソイチューバー": [{ mode: "FC", hit: 1, human: 75, squid: 80, sec: 1.250 }, { mode: "1周C", hit: 1, human: 54, squid: 59, sec: 0.900 }, { mode: "FCK", hit: 1, human: null, squid: 25, sec: 0.417 }],
    "R-PEN/5H": [{ mode: "FC", hit: 18, human: 93, squid: 98, sec: 1.550 }, { mode: "FC+NC", hit: 15, human: 158, squid: 163, sec: 2.633 }],
    "スプラスピナー": [{ mode: "FC", hit: 13, human: 43, squid: 48, sec: 0.717 }, { mode: "最小限C", hit: 13, human: 27, squid: 32, sec: 0.450 }],
    "バレルスピナー": [{ mode: "FC", hit: 13, human: 88, squid: 93, sec: 1.467 }, { mode: "最小限C", hit: 13, human: 30, squid: 35, sec: 0.500 }],
    "ハイドラント": [{ mode: "FC", hit: 9, human: 162, squid: 167, sec: 2.700 }, { mode: "最小限C", hit: 13, human: 35, squid: 40, sec: 0.583 }],
    "クーゲルシュライバー": [{ mode: "FC長", hit: 16, human: 159, squid: 164, sec: 2.650 }, { mode: "21fC短", hit: 10, human: 34, squid: 39, sec: 0.567 }, { mode: "最小限C", hit: 10, human: 24, squid: 29, sec: 0.400 }],
    "ノーチラス47": [{ mode: "FC", hit: 13, human: 92, squid: 97, sec: 1.533 }, { mode: "最小限C", hit: 13, human: 30, squid: 35, sec: 0.500 }, { mode: "CK", hit: 13, human: null, squid: 32, sec: 0.533 }],
    "イグザミナー": [{ mode: "FC", hit: 10, human: 133, squid: 138, sec: 2.217 }, { mode: "最小限C", hit: 13, human: 29, squid: 34, sec: 0.483 }],
    "スパッタリー": [{ mode: "N", hit: 11, human: 14, squid: 23, sec: 0.233 }, { mode: "SL", hit: 9, human: 28, squid: 28, sec: 0.467 }],
    "スプラマニューバー": [{ mode: "N", hit: 16, human: 19, squid: 28, sec: 0.317 }, { mode: "SL", hit: 13, human: 36, squid: 36, sec: 0.600 }],
    "ケルビン525": [{ mode: "N", hit: 19, human: 22, squid: 31, sec: 0.367 }, { mode: "SL", hit: 10, human: 41, squid: 41, sec: 0.683 }],
    "デュアルスイーパー": [{ mode: "N", hit: 19, human: 22, squid: 31, sec: 0.367 }, { mode: "SL", hit: 19, human: 46, squid: 46, sec: 0.767 }],
    "クアッドホッパーブラック": [{ mode: "N", hit: 19, human: 22, squid: 31, sec: 0.367 }, { mode: "ヒトSL", hit: 19, human: 28, squid: null, sec: 0.467 }, { mode: "イカSL", hit: 18, human: null, squid: 30, sec: 0.500 }, { mode: "SL後", hit: 16, human: 43, squid: 40, sec: 0.717 }],
    "ガエンFF": [{ mode: "N", hit: 25, human: 28, squid: 37, sec: 0.467 }, { mode: "SL", hit: 13, human: 42, squid: 42, sec: 0.700 }],
    "パラシェルター": [{ mode: "通常", hit: 30, human: 41, squid: 53, sec: 0.683 }, { mode: "射撃+傘", hit: 14, human: 25, squid: 37, sec: 0.417 }],
    "キャンピングシェルター": [{ mode: "通常", hit: 1, human: 14, squid: 29, sec: 0.233 }],
    "スパイガジェット": [{ mode: "単発", hit: 59, human: 70, squid: 82, sec: 1.167 }, { mode: "連射", hit: 53, human: null, squid: null, sec: 0.883 }, { mode: "単発+連射", hit: 52, human: 63, squid: 75, sec: 1.050 }, { mode: "単+傘+連+傘", hit: 42, human: 53, squid: 65, sec: 0.883 }],
    "24式張替傘・甲": [{ mode: "通常", hit: 35, human: 46, squid: 58, sec: 0.767 }, { mode: "射撃+傘", hit: 12, human: 23, squid: 35, sec: 0.383 }],
    "トライストリンガー": [{ mode: "FC", hit: 1, human: 76, squid: 81, sec: 1.267 }, { mode: "1周C", hit: 1, human: 34, squid: 39, sec: 0.567 }, { mode: "NC", hit: 22, human: 34, squid: 39, sec: 0.567 }, { mode: "FC爆", hit: 88, human: 209, squid: 214, sec: 3.483 }, { mode: "1周爆", hit: 46, human: 125, squid: 130, sec: 2.083 }],
    "LACT-450": [{ mode: "FC", hit: 1, human: 38, squid: 43, sec: 0.633 }, { mode: "1周C", hit: 1, human: 16, squid: 21, sec: 0.267 }, { mode: "NC", hit: 15, human: 24, squid: 29, sec: 0.400 }, { mode: "CK", hit: 1, human: null, squid: 29, sec: 0.483 }],
    "フルイドV": [{ mode: "FC", hit: 1, human: 84, squid: 89, sec: 1.400 }, { mode: "1周C", hit: 1, human: 44, squid: 49, sec: 0.733 }, { mode: "NC", hit: 1, human: 16, squid: 21, sec: 0.267 }, { mode: "FC爆", hit: 1, human: 130, squid: 135, sec: 2.167 }, { mode: "1周C爆", hit: 1, human: 90, squid: 95, sec: 1.500 }],
    "ジムワイパー": [{ mode: "FC", hit: 1, human: 26, squid: 31, sec: 0.433 }, { mode: "FC弾", hit: 43, human: 71, squid: 76, sec: 1.183 }, { mode: "踏みFC", hit: 1, human: 38, squid: 43, sec: 0.633 }, { mode: "NC", hit: 30, human: 39, squid: 44, sec: 0.650 }, { mode: "NC弾", hit: 53, human: 65, squid: 70, sec: 1.083 }, { mode: "FC弾+NC弾", hit: 27, human: 55, squid: 60, sec: 0.917 }, { mode: "NC弾+FC弾", hit: 44, human: 56, squid: 61, sec: 0.933 }],
    "ドライブワイパー": [{ mode: "FC", hit: 1, human: 20, squid: 25, sec: 0.333 }, { mode: "FC弾", hit: 37, human: 59, squid: 64, sec: 0.983 }, { mode: "踏みFC", hit: 1, human: 31, squid: 36, sec: 0.517 }, { mode: "NC", hit: 33, human: 39, squid: 44, sec: 0.650 }, { mode: "NC弾", hit: 49, human: 58, squid: 63, sec: 0.967 }, { mode: "FC弾+NC弾+NC弾", hit: 40, human: 62, squid: 67, sec: 1.033 }, { mode: "NC弾+NC弾+FC弾", hit: 47, human: 56, squid: 61, sec: 0.933 }],
    "デンタルワイパー": [{ mode: "FC", hit: 1, human: 43, squid: 48, sec: 0.717 }, { mode: "FC弾", hit: 53, human: 98, squid: 103, sec: 1.633 }, { mode: "踏みFC", hit: 1, human: 57, squid: 62, sec: 0.950 }, { mode: "NC", hit: 31, human: 43, squid: 48, sec: 0.717 }, { mode: "NC弾", hit: 61, human: 76, squid: 81, sec: 1.267 }, { mode: "FC弾+NC弾", hit: 23, human: 68, squid: 73, sec: 1.133 }, { mode: "NC弾+FC弾", hit: 62, human: 77, squid: 82, sec: 1.283 }],
  };
  const MAIN_KILL_ALIASES = {
    "もみじシューター": "わかばシューター",
    "ボールドマーカーネオ": "ボールドマーカー",
    "シャープマーカーネオ": "シャープマーカー",
    "スプラシューターコラボ": "スプラシューター",
    "ヒーローシューターレプリカ": "スプラシューター",
    "オーダーシューターレプリカ": "スプラシューター",
    "N-ZAP89": "N-ZAP85",
    "プロモデラーRG": "プロモデラーMG",
    "52ガロンデコ": "52ガロン",
    "96ガロンデコ": "96ガロン",
    "プライムシューターコラボ": "プライムシューター",
    "ジェットスイーパーカスタム": "ジェットスイーパー",
    "スペースシューターコラボ": "スペースシューター",
    "ノヴァブラスターネオ": "ノヴァブラスター",
    "ホットブラスターカスタム": "ホットブラスター",
    "ロングブラスターカスタム": "ロングブラスター",
    "クラッシュブラスターネオ": "クラッシュブラスター",
    "ラピッドブラスターデコ": "ラピッドブラスター",
    "Rブラスターエリートデコ": "Rブラスターエリート",
    "S-BLAST91": "S-BLAST92",
    "L3リールガンD": "L3リールガン",
    "H3リールガンD": "H3リールガン",
    "スプラローラーコラボ": "スプラローラー",
    "ダイナモローラーテスラ": "ダイナモローラー",
    "ヴァリアブルローラーフォイル": "ヴァリアブルローラー",
    "パブロ・ヒュー": "パブロ",
    "パブロヒュー": "パブロ",
    "ホクサイ・ヒュー": "ホクサイ",
    "ホクサイヒュー": "ホクサイ",
    "バケットスロッシャーデコ": "バケットスロッシャー",
    "ヒッセン・ヒュー": "ヒッセン",
    "ヒッセンヒュー": "ヒッセン",
    "スクリュースロッシャーネオ": "スクリュースロッシャー",
    "オーバーフロッシャーデコ": "オーバーフロッシャー",
    "エクスプロッシャーカスタム": "エクスプロッシャー",
    "モップリンD": "モップリン",
    "スクイックリンβ": "スクイックリンα",
    "スプラチャージャーコラボ": "スプラチャージャー",
    "スプラスコープ": "スプラチャージャー",
    "スプラスコープコラボ": "スプラチャージャー",
    "リッター4Kカスタム": "リッター4K",
    "4Kスコープ": "リッター4K",
    "4Kスコープカスタム": "リッター4K",
    "14式竹筒銃・乙": "14式竹筒銃・甲",
    "ソイチューバーカスタム": "ソイチューバー",
    "R-PEN/5B": "R-PEN/5H",
    "スプラスピナーコラボ": "スプラスピナー",
    "バレルスピナーデコ": "バレルスピナー",
    "ハイドラントカスタム": "ハイドラント",
    "クーゲルシュライバー・ヒュー": "クーゲルシュライバー",
    "クーゲルシュライバーヒュー": "クーゲルシュライバー",
    "ノーチラス79": "ノーチラス47",
    "イグザミナー・ヒュー": "イグザミナー",
    "イグザミナーヒュー": "イグザミナー",
    "スパッタリー・ヒュー": "スパッタリー",
    "スパッタリーヒュー": "スパッタリー",
    "スプラマニューバーコラボ": "スプラマニューバー",
    "オーダーマニューバーレプリカ": "スプラマニューバー",
    "ケルビン525デコ": "ケルビン525",
    "デュアルスイーパーカスタム": "デュアルスイーパー",
    "クアッドホッパーホワイト": "クアッドホッパーブラック",
    "ガエンFFカスタム": "ガエンFF",
    "パラシェルターソレーラ": "パラシェルター",
    "オーダーシェルターレプリカ": "パラシェルター",
    "キャンピングシェルターソレーラ": "キャンピングシェルター",
    "スパイガジェットソレーラ": "スパイガジェット",
    "24式張替傘・乙": "24式張替傘・甲",
    "トライストリンガーコラボ": "トライストリンガー",
    "オーダーストリンガーレプリカ": "トライストリンガー",
    "LACT450": "LACT-450",
    "LACT-450デコ": "LACT-450",
    "フルイドⅤ": "フルイドV",
    "フルイドⅤカスタム": "フルイドV",
    "ジムワイパー・ヒュー": "ジムワイパー",
    "ジムワイパーヒュー": "ジムワイパー",
    "ドライブワイパーデコ": "ドライブワイパー",
    "デンタルワイパーミント": "デンタルワイパー",
    "デンタルワイパースミ": "デンタルワイパー",
  };
  const MAIN_RANGE_LINES = {
    "4Kスコープ": 6.5, "4Kスコープカスタム": 6.5,
    "リッター4K": 6.2, "リッター4Kカスタム": 6.2,
    "R-PEN/5H": 5.7, "R-PEN/5B": 5.7,
    "スプラスコープ": 5.5, "スプラスコープコラボ": 5.5,
    "スプラチャージャー": 5.2, "スプラチャージャーコラボ": 5.2, "オーダーチャージャーレプリカ": 5.2,
    "トライストリンガー": 5.1, "トライストリンガーコラボ": 5.1, "オーダーストリンガーレプリカ": 5.1,
    "オーバーフロッシャー": 5.0, "オーバーフロッシャーデコ": 5.0,
    "フルイドⅤ": 4.8, "フルイドⅤカスタム": 4.8,
    "ジムワイパー": 4.5, "ジムワイパー・ヒュー": 4.5, "ジムワイパーヒュー": 4.5, "オーダーワイパーレプリカ": 4.5,
    "ソイチューバー": 4.2, "ソイチューバーカスタム": 4.2,
    "エクスプロッシャー": 4.1, "エクスプロッシャーカスタム": 4.1, "ジェットスイーパー": 4.1, "ジェットスイーパーカスタム": 4.1,
    "ハイドラント": 4.0, "ハイドラントカスタム": 4.0, "クーゲルシュライバー": 4.0, "クーゲルシュライバー・ヒュー": 4.0, "クーゲルシュライバーヒュー": 4.0, "14式竹筒銃・甲": 4.0, "14式竹筒銃・乙": 4.0,
    "バレルスピナー": 3.8, "バレルスピナーデコ": 3.8, "オーダースピナーレプリカ": 3.8,
    "スクイックリンα": 3.7, "スクイックリンβ": 3.7, "ガエンFF": 3.7, "ガエンFFカスタム": 3.7,
    "ドライブワイパー": 3.5, "ドライブワイパーデコ": 3.5, "Rブラスターエリート": 3.5, "Rブラスターエリートデコ": 3.5, "LACT450": 3.5, "LACT-450": 3.5, "LACT-450デコ": 3.5,
    "ボトルガイザー": 3.4, "ボトルガイザーフォイル": 3.4,
    "イグザミナー": 3.3, "イグザミナー・ヒュー": 3.3, "イグザミナーヒュー": 3.3, "デンタルワイパーミント": 3.3, "デンタルワイパースミ": 3.3,
    "96ガロン": 3.1, "96ガロンデコ": 3.1, "ラピッドブラスター": 3.1, "ラピッドブラスターデコ": 3.1, "ノーチラス47": 3.1, "ノーチラス79": 3.1, "モップリン": 3.1, "モップリンD": 3.1,
    "デュアルスイーパー": 3.0, "デュアルスイーパーカスタム": 3.0, "プライムシューター": 3.0, "プライムシューターコラボ": 3.0, "H3リールガン": 3.0, "H3リールガンD": 3.0, "スペースシューター": 3.0, "スペースシューターコラボ": 3.0, "S-BLAST92": 3.0, "S-BLAST91": 3.0,
    "スクリュースロッシャー": 2.9, "スクリュースロッシャーネオ": 2.9,
    "ロングブラスター": 2.7, "ロングブラスターカスタム": 2.7, "バケットスロッシャー": 2.7, "バケットスロッシャーデコ": 2.7, "スプラスピナー": 2.7, "スプラスピナーコラボ": 2.7, "L3リールガン": 2.7, "L3リールガンD": 2.7, "オーダースロッシャーレプリカ": 2.7,
    "ケルビン525": 2.5, "ケルビン525デコ": 2.5, "52ガロン": 2.5, "52ガロンデコ": 2.5, "フィンセント": 2.5, "フィンセント・ヒュー": 2.5, "フィンセントヒュー": 2.5, "24式張替傘・甲": 2.5, "24式張替傘・乙": 2.5,
    "クアッドホッパーブラック": 2.4, "クアッドホッパーホワイト": 2.4, "スプラマニューバー": 2.4, "スプラマニューバーコラボ": 2.4, "オーダーマニューバーレプリカ": 2.4, "スプラシューター": 2.4, "スプラシューターコラボ": 2.4, "ヒーローシューターレプリカ": 2.4, "オーダーシューターレプリカ": 2.4, "オクタシューターレプリカ": 2.4,
    "スパイガジェット": 2.3, "スパイガジェットソレーラ": 2.3,
    "ダイナモローラー": 2.2, "ダイナモローラーテスラ": 2.2, "ヒッセン": 2.2, "ヒッセン・ヒュー": 2.2, "ヒッセンヒュー": 2.2, "N-ZAP85": 2.2, "N-ZAP89": 2.2,
    "キャンピングシェルター": 2.1, "キャンピングシェルターソレーラ": 2.1,
    "ホットブラスター": 2.0, "ホットブラスターカスタム": 2.0, "プロモデラーRG": 2.0, "プロモデラーMG": 2.0, "シャープマーカー": 2.0, "シャープマーカーネオ": 2.0, "わかばシューター": 2.0, "もみじシューター": 2.0, "パラシェルター": 2.0, "パラシェルターソレーラ": 2.0, "オーダーシェルターレプリカ": 2.0,
    "クラッシュブラスター": 1.9, "クラッシュブラスターネオ": 1.9,
    "ノヴァブラスター": 1.6, "ノヴァブラスターネオ": 1.6, "オーダーブラスターレプリカ": 1.6,
    "スプラローラー": 1.5, "スプラローラーコラボ": 1.5, "スパッタリー": 1.5, "スパッタリー・ヒュー": 1.5, "スパッタリーヒュー": 1.5, "ホクサイ": 1.5, "ホクサイ・ヒュー": 1.5, "ホクサイヒュー": 1.5, "オーダーローラーレプリカ": 1.5, "オーダーブラシレプリカ": 1.5,
    "ヴァリアブルローラー": 1.4, "ヴァリアブルローラーフォイル": 1.4,
    "パブロ": 1.2, "パブロ・ヒュー": 1.2, "パブロヒュー": 1.2, "ボールドマーカー": 1.2, "ボールドマーカーネオ": 1.2,
  };

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
    const iss = totals["サブ効率"] ? totals["サブ効率"].gp : 0;
    const rsu = totals["ヒト移動速度"] ? totals["ヒト移動速度"].gp : 0;
    const spu = totals["スペシャル性能"] ? totals["スペシャル性能"].gp : 0;
    const os = Boolean(totals["対物攻撃力アップ"]);

    if (params.kit.SpecialPoint) {
      const effect = effectByKey("IncreaseRt_Special", Math.min(MAX_GP, scu));
      const specialPoint = Math.ceil(params.kit.SpecialPoint / effect);
      const paintPoint = mainPaintPoint(weaponName);
      const specialValues = [
        { label: "必要P", value: `スペ増後${specialPoint}P/基本${params.kit.SpecialPoint}P` },
      ];
      if (paintPoint) {
        const boostedShots = Math.ceil(specialPoint / paintPoint.p);
        const baseShots = Math.ceil(params.kit.SpecialPoint / paintPoint.p);
        specialValues.push({ label: "必要ショット", value: `${boostedShots}発/${baseShots}発` });
      }
      results.push({
        type: "multi",
        name: "スペシャル必要P",
        icon: SENDOU_SPECIAL_ICON(weapon),
        gp: scu,
        values: specialValues,
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
      const killTimes = mainKillTimes(weaponName);
      if (killTimes) {
        mainDamageValues.push({ label: "キル速", value: formatKillTime(killTimes.best) });
        if (killTimes.others.length) mainDamageValues.push({ label: "他キル", value: killTimes.others.map(formatKillTime).join(" / ") });
      }
      const paintPoint = mainPaintPoint(weaponName);
      if (paintPoint) mainDamageValues.push({ label: "塗P/発", value: `${formatNumber(paintPoint.p, 1)}P` });
      if (mainCost !== undefined) {
        const tank = inkTankSize(weaponName);
        const effect = effectByKey("ConsumeRt_Main", Math.min(MAX_GP, ism));
        mainDamageValues.push({ label: "1発インク", value: `${formatNumber(mainCost * effect * 100 / tank, 2)}%` });
      }
      const range = mainRange(weaponName, params);
      if (range !== undefined) mainDamageValues.push({ label: "射程", value: `約${formatNumber(range, 1)}ライン` });
      results.push({
        type: "multi",
        name: "メイン",
        icon: weapon && weapon.i,
        values: mainDamageValues,
        ratio: clamp((damages[0].value / 10) / 100 * 100, 0, 100),
      });
    }

    const subDamages = collectDamageValues(params.sub).slice(0, 2);
    if (subDamages.length) {
      const subDamageValues = subDamages.map((item) => ({ label: item.label, value: `${formatNumber(item.value / 10, 1)}` }));
      const subCost = subInkConsumptionValues(params, weapon, weaponName, iss);
      if (subCost) subDamageValues.push({ label: "消費", value: `(${subCost.current}/${subCost.base})` });
      results.push({
        type: "multi",
        name: "サブ",
        icon: SUB_DATAS[weapon && weapon.sub] && SUB_DATAS[weapon.sub].i,
        values: subDamageValues,
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

  function mainRange(weaponName, params) {
    const lineRange = MAIN_RANGE_LINES[weaponName] ?? MAIN_RANGE_LINES[normalizeWeaponName(weaponName)];
    return lineRange;
  }

  function mainPaintPoint(weaponName) {
    return MAIN_PAINT_POINTS[weaponName] ?? MAIN_PAINT_POINTS[normalizeWeaponName(weaponName)] ?? null;
  }

  function mainKillTimes(weaponName) {
    const key = MAIN_KILL_ALIASES[weaponName] ?? MAIN_KILL_ALIASES[normalizeWeaponName(weaponName)] ?? weaponName;
    const entries = MAIN_KILL_TIMES[key] ?? MAIN_KILL_TIMES[normalizeWeaponName(key)];
    if (!entries || !entries.length) return null;
    const ranked = entries.slice().sort((a, b) => killRankFrame(a) - killRankFrame(b));
    return { best: ranked[0], others: ranked.slice(1) };
  }

  function killRankFrame(entry) {
    if (Number.isFinite(entry.human)) return entry.human;
    if (Number.isFinite(entry.squid)) return entry.squid;
    if (Number.isFinite(entry.hit)) return entry.hit;
    return Infinity;
  }

  function formatKillTime(entry) {
    const label = entry.mode && entry.mode !== "通常" ? `${entry.mode} ` : "";
    const frame = killRankFrame(entry);
    const sec = Number.isFinite(entry.sec) ? entry.sec : frame / 60;
    return `${label}${frame}F/${formatNumber(sec, 3)}秒`;
  }

  function normalizeWeaponName(name) {
    return String(name || "").replace(/[・\s-]/g, "").replace("Ⅴ", "V");
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

  function subInkConsumptionValues(params, weapon, weaponName, gp) {
    const baseCost = subInkCost(params, weapon);
    if (baseCost === undefined) return null;
    const level = SUB_SAVE_LEVELS[weapon && weapon.sub] ?? 2;
    const tank = inkTankSize(weaponName);
    const current = baseCost * effectByKey(`ConsumeRt_Sub_Lv${level}`, Math.min(MAX_GP, gp));
    return {
      current: `${formatNumber(current * 100 / tank, 2)}%`,
      base: `${formatNumber(baseCost * 100 / tank, 2)}%`,
    };
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

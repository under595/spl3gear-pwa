(function () {
  const { GEARPOWER_DATAS, WEAPON_DATAS, SUB_DATAS, SPECIAL_DATAS } = window.SPL3_DATA;
  const MAP_DATA = window.SPL3_MAP_DATA || { rules: [], maps: {} };
  const { PARTS, getSlotValue, isSlotDisabled } = window.SPL3.state;
  const { assetPath, createElement } = window.SPL3.utils;
  const { buildEfficiencyTest, buildResults, canPlacePower, classifyPowers, getAllowedPart, getPowerMeta } = window.SPL3.calculations;
  const PINNED_RESULT_NAMES = new Set(["メイン", "サブ", "スペシャル必要P", "スペシャル性能"]);
  const PINNED_RESULT_ORDER = ["メイン", "サブ", "スペシャル必要P", "スペシャル性能"];
  const MAP_MARKERS = [
    { id: "pin", symbol: "📍", label: "ピン", file: "pin.png" },
    { id: "red", symbol: "🔴", label: "赤", file: "red.png" },
    { id: "yellow", symbol: "🟡", label: "黄", file: "yellow.png" },
    { id: "green", symbol: "🟢", label: "緑", file: "green.png" },
    { id: "blue", symbol: "🔵", label: "青", file: "blue.png" },
    { id: "star", symbol: "⭐", label: "注目", file: "star.png" },
    { id: "gun", symbol: "🔫", label: "射線", file: "gun.png" },
    { id: "warning", symbol: "⚠️", label: "注意", file: "warning.png" },
  ];
  const MAP_MARKER_LIMIT = 32;
  const DEFAULT_GUN_MARKER_RANGE = 24;
  const MAP_GUN_MARKER_RANGES = {
    "ユノハナ大渓谷": 23, "ゴンズイ地区": 24, "ヤガラ市場": 22, "マテガイ放水路": 25, "ナメロウ金属": 23,
    "マサバ海峡大橋": 26, "キンメダイ美術館": 22, "マヒマヒリゾート＆スパ": 21, "海女美術大学": 24, "チョウザメ造船": 25,
    "ザトウマーケット": 23, "スメーシーワールド": 22, "クサヤ温泉": 24, "ヒラメが丘団地": 23, "ナンプラー遺跡": 24,
    "マンタマリア号": 25, "タラポートショッピングパーク": 24, "コンブトラック": 23, "タカアシ経済特区": 25, "オヒョウ海運": 24,
    "バイガイ亭": 22, "ネギトロ炭鉱": 25, "カジキ空港": 26, "リュウグウターミナル": 23, "デカライン高架下": 24,
  };
  const GUN_MARKER_SPREAD_DEGREES = 30;
  const GUN_MARKER_DRAG_SENSITIVITY = 0.5;
  const APP_VERSION = "Ver1.44";

function render(root, state, actions) {
  const results = buildResults(state.slots, state.weaponName, {
    ldeIntensity: state.ldeIntensity,
    drinkActive: state.drinkActive,
    ikaFlowActive: state.ikaFlowActive,
    comebackActive: state.comebackActive,
    disabledSlots: state.disabledSlots,
  });
  root.replaceChildren();
  const children = [renderTopTabs(state, actions)];
  if (state.activeTab === "map") {
    children.push(renderMapPage(state, actions), renderAppVersion(actions));
    root.append(...children);
    return;
  }
  const visible = normalizedVisibleGroups(state.visibleGroups);
  children.push(renderWeaponBar(state, actions));
  if (visible.weaponDetails) children.push(renderPinnedResults(results, state, actions));
  if (visible.rangeComparison) children.push(renderRangeComparison(state, actions));
  if (visible.efficiency) children.push(renderEfficiencyTest(state, actions));
  if (visible.gearSet) children.push(renderGearSetTabs(state, actions), renderGearInput(state, actions), renderPowerPool(state, actions));
  if (visible.analyzer) children.push(renderAnalyzerControls(state, actions));
  children.push(renderResults(results), renderOptionsGroup(state, actions), renderAppVersion(actions));
  root.append(...children);
}

function renderTopTabs(state, actions) {
  const tabs = createElement("div", "top-tabs", { role: "tablist", "aria-label": "ページ切替" });
  for (const [id, label] of [["gear", "ギア"], ["map", "マップ"]]) {
    const selected = (state.activeTab || "gear") === id;
    const button = createElement("button", `top-tab ${selected ? "is-active" : ""}`.trim(), {
      type: "button",
      role: "tab",
      "aria-selected": String(selected),
      text: label,
    });
    button.addEventListener("click", () => actions.setActiveTab(id));
    tabs.append(button);
  }
  return tabs;
}

function normalizedVisibleGroups(groups) {
  return {
    weaponDetails: !groups || groups.weaponDetails !== false,
    rangeComparison: !groups || groups.rangeComparison !== false,
    efficiency: !groups || groups.efficiency !== false,
    gearSet: !groups || groups.gearSet !== false,
    analyzer: !groups || groups.analyzer !== false,
  };
}

function renderOptionsGroup(state, actions) {
  const isOpen = state.optionsOpen !== false;
  const visible = normalizedVisibleGroups(state.visibleGroups);
  const section = createElement("section", `options-group ${isOpen ? "" : "is-collapsed"}`.trim(), { "aria-label": "オプション" });
  const header = createElement("div", "options-header");
  header.append(createElement("strong", "", { text: "オプション" }));
  const hiddenCount = Object.values(visible).filter((value) => !value).length;
  header.append(createElement("span", "options-summary", { text: hiddenCount ? `${hiddenCount}項目非表示` : "全表示" }));
  const toggle = createElement("button", "detail-toggle", {
    type: "button",
    text: isOpen ? "閉じる" : "開く",
    title: isOpen ? "オプションを閉じる" : "オプションを開く",
    "aria-expanded": String(isOpen),
  });
  toggle.addEventListener("click", actions.toggleOptions);
  header.append(toggle);
  section.append(header);
  if (!isOpen) return section;

  const body = createElement("div", "options-body");
  const items = [
    ["weaponDetails", "ブキ詳細"],
    ["rangeComparison", "射程対比"],
    ["efficiency", "効率"],
    ["gearSet", "ギアセット"],
    ["analyzer", "解放条件"],
  ];
  for (const [key, label] of items) {
    const item = createElement("label", "option-check");
    const checkbox = createElement("input", "", { type: "checkbox", title: `${label}を表示` });
    checkbox.checked = visible[key];
    checkbox.addEventListener("change", (event) => actions.setGroupVisible(key, event.target.checked));
    item.append(checkbox, createElement("span", "", { text: label }));
    body.append(item);
  }
  section.append(body);
  return section;
}

function renderGearSetTabs(state, actions) {
  const tabs = createElement("div", "gear-set-tabs", { role: "tablist", "aria-label": "ギアセット" });
  for (let index = 0; index < 5; index++) {
    const selected = index === Number(state.gearSetIndex || 0);
    const tab = createElement("button", `gear-set-tab ${selected ? "is-active" : ""}`.trim(), {
      type: "button",
      role: "tab",
      "aria-selected": String(selected),
      text: `セット${index + 1}`,
      title: `ギアセット${index + 1}`,
    });
    tab.addEventListener("click", () => actions.selectGearSet(index));
    tabs.append(tab);
  }
  return tabs;
}

function renderEfficiencyTest(state, actions) {
  const data = buildEfficiencyTest(state.slots, state.weaponName, {
    ldeIntensity: state.ldeIntensity,
    drinkActive: state.drinkActive,
    ikaFlowActive: state.ikaFlowActive,
    comebackActive: state.comebackActive,
    mainShotCount: state.mainShotCount,
    disabledSlots: state.disabledSlots,
  });
  const isOpen = state.efficiencyTestOpen !== false;
  const section = createElement("section", `efficiency-test ${isOpen ? "" : "is-collapsed"}`.trim(), { "aria-label": "効率" });
  const header = createElement("div", "efficiency-header");
  header.append(createElement("strong", "", { text: "効率" }));

  const headerControls = createElement("div", "efficiency-header-controls");
  const subRemainingText = efficiencySubRemainingText(data);
  if (subRemainingText && !isOpen) {
    headerControls.append(createElement("span", "efficiency-summary", { text: subRemainingText }));
  }
  if (isOpen) {
    const picker = createElement("label", "main-shot-picker");
    picker.append(createElement("span", "", { text: "メイン発射数" }));
    const select = createElement("select", "", { title: "メイン発射数" });
    const current = Math.max(1, Math.min(10, Number(state.mainShotCount ?? 5)));
    for (let count = 1; count <= 10; count++) {
      const option = document.createElement("option");
      option.value = String(count);
      option.textContent = `${count}発`;
      option.selected = count === current;
      select.append(option);
    }
    select.addEventListener("change", (event) => actions.setMainShotCount(event.target.value));
    picker.append(select);
    headerControls.append(picker);
  }
  const toggle = createElement("button", "detail-toggle", {
    type: "button",
    text: isOpen ? "閉じる" : "開く",
    title: isOpen ? "効率を閉じる" : "効率を開く",
    "aria-expanded": String(isOpen),
  });
  toggle.addEventListener("click", actions.toggleEfficiencyTest);
  headerControls.append(toggle);
  header.append(headerControls);
  section.append(header);

  if (!isOpen) return section;

  if (!data) {
    section.append(createElement("div", "efficiency-empty", { text: "このブキの効率テストに必要なインクデータがありません" }));
    return section;
  }

  const rows = createElement("div", "efficiency-rows");
  rows.append(renderEfficiencyRow(data.main));
  if (data.sub) rows.append(renderEfficiencyRow(data.sub));
  section.append(rows);
  if (subRemainingText) {
    section.append(createElement("div", "sub-remaining-summary", {
      text: subRemainingText,
    }));
  }
  return section;
}

function efficiencySubRemainingText(data) {
  if (!data || !data.subRemaining) return "";
  return `サブ後の残${formatDisplayNumber(data.subRemaining.percent, 2)}%（メイン${data.subRemaining.mainShots}発/MAX${data.subRemaining.mainMaxShots}発）`;
}

function renderEfficiencyRow(entry) {
  const row = createElement("article", "efficiency-row");
  const title = createElement("div", "efficiency-title");
  title.append(createElement("strong", "", { text: entry.label }), createElement("b", "", { text: `${entry.totalFrames}F` }));
  const body = createElement("div", "efficiency-body");
  body.append(renderEfficiencyMeter(entry));
  const values = createElement("div", "efficiency-values");
  for (const item of entry.values) {
    const chip = createElement("span", "result-chip");
    chip.append(createElement("small", "", { text: item.label }), createElement("b", "", { text: item.value }));
    values.append(chip);
  }
  body.append(values);
  row.append(title, body);
  return row;
}

function renderEfficiencyMeter(entry) {
  const total = Math.max(1, entry.totalFrames);
  const meter = createElement("div", "efficiency-meter");
  const lock = createElement("span", "efficiency-meter-lock", { text: `${entry.lockFrames}F` });
  const recover = createElement("span", "efficiency-meter-recover", { text: `${entry.recoverFrames}F` });
  lock.style.width = `${Math.max(0, entry.lockFrames / total * 100)}%`;
  recover.style.width = `${Math.max(0, entry.recoverFrames / total * 100)}%`;
  meter.append(lock, recover);
  return meter;
}

function renderAnalyzerControls(state, actions) {
  const isOpen = state.analyzerControlsOpen !== false;
  const wrap = createElement("section", `analyzer-controls ${isOpen ? "" : "is-collapsed"}`.trim(), { "aria-label": "解放条件" });

  const header = createElement("div", "analyzer-header");
  header.append(createElement("strong", "", { text: "解放条件" }));
  const summary = createElement("span", "analyzer-summary", { text: analyzerSummaryText(state) });
  const toggle = createElement("button", "detail-toggle", {
    type: "button",
    text: isOpen ? "閉じる" : "開く",
    title: isOpen ? "解放条件を閉じる" : "解放条件を開く",
    "aria-expanded": String(isOpen),
  });
  toggle.addEventListener("click", actions.toggleAnalyzerControls);
  header.append(summary, toggle);
  wrap.append(header);
  if (!isOpen) return wrap;

  const lde = createElement("label", "control-line");
  lde.append(createElement("span", "", { text: "ラスパ強度" }));
  const range = createElement("input", "", { type: "range", min: "0", max: "35", step: "1", value: String(state.ldeIntensity ?? 35), title: "ラストスパート強度" });
  const currentIntensity = Number(state.ldeIntensity ?? 35);
  const value = createElement("b", "", { text: `${currentIntensity} (${Math.floor((18 / 21) * currentIntensity)}AP)` });
  range.addEventListener("input", (event) => actions.setLdeIntensity(event.target.value));
  lde.append(range, value);

  const drink = createElement("label", "control-line checkbox-line");
  const checkbox = createElement("input", "", { type: "checkbox", title: "エナジースタンド/ドリンク状態" });
  checkbox.checked = Boolean(state.drinkActive);
  checkbox.addEventListener("change", (event) => actions.setDrinkActive(event.target.checked));
  drink.append(checkbox, createElement("span", "", { text: "ドリンク状態" }));

  const ikaFlow = createElement("label", "control-line checkbox-line");
  const ikaFlowCheckbox = createElement("input", "", { type: "checkbox", title: "イカフロー状態" });
  ikaFlowCheckbox.checked = Boolean(state.ikaFlowActive);
  ikaFlowCheckbox.addEventListener("change", (event) => actions.setIkaFlowActive(event.target.checked));
  ikaFlow.append(ikaFlowCheckbox, createElement("span", "", { text: "イカフロー状態" }));

  const body = createElement("div", "analyzer-body");
  body.append(lde, drink, ikaFlow);

  if (hasMainPower(state, "カムバック")) {
    const comeback = createElement("label", "control-line checkbox-line");
    const comebackCheckbox = createElement("input", "", { type: "checkbox", title: "カムバック発動状態" });
    comebackCheckbox.checked = Boolean(state.comebackActive);
    comebackCheckbox.addEventListener("change", (event) => actions.setComebackActive(event.target.checked));
    comeback.append(comebackCheckbox, createElement("span", "", { text: "カムバック" }));
    body.append(comeback);
  }

  wrap.append(body);
  return wrap;
}

function analyzerSummaryText(state) {
  const intensity = Number(state.ldeIntensity ?? 35);
  const items = [`ラスパ${intensity}`];
  if (state.drinkActive) items.push("ドリンクON");
  if (state.ikaFlowActive) items.push("イカフローON");
  if (state.comebackActive && hasMainPower(state, "カムバック")) items.push("カムバックON");
  return items.join(" / ");
}

function hasMainPower(state, powerName) {
  return PARTS.some((part) => state.slots[part.id].main === powerName && !isSlotDisabled(state.disabledSlots, { part: part.id, type: "main", index: 0 }));
}

function renderWeaponBar(state, actions) {
  const weapon = WEAPON_DATAS[state.weaponName] ?? Object.values(WEAPON_DATAS)[0];
  const wrap = createElement("div", "weapon-bar");
  const icons = createElement("div", "weapon-icons");
  icons.append(
    iconImage(weapon?.i, state.weaponName, "weapon-icon bg-light"),
    iconImage(SUB_DATAS[weapon?.sub]?.i, weapon?.sub, "weapon-icon"),
    iconImage(SPECIAL_DATAS[weapon?.sp]?.i, weapon?.sp, "weapon-icon")
  );

  const categorySelect = createWeaponCategorySelect(state, actions);
  const select = createElement("select", "weapon-select", { "aria-label": "ブキを選択" });
  const favorites = (state.favoriteWeapons || []).filter((name) => WEAPON_DATAS[name]);
  const favoriteSet = new Set(favorites);
  const currentCategory = normalizeWeaponCategory(state.weaponCategory);
  const filteredFavorites = currentCategory === "fav" || currentCategory === "all" ? favorites : [];
  if (filteredFavorites.length) {
    const favoriteGroup = document.createElement("optgroup");
    favoriteGroup.label = "★ お気に入り";
    for (const name of filteredFavorites) favoriteGroup.append(createWeaponOption(name, state.weaponName, true));
    select.append(favoriteGroup);
  }
  const groups = groupWeapons();
  for (const [category, names] of Object.entries(groups)) {
    if (currentCategory !== "all" && currentCategory !== category) continue;
    const optgroup = document.createElement("optgroup");
    optgroup.label = category;
    for (const name of names) {
      if (!favoriteSet.has(name)) optgroup.append(createWeaponOption(name, state.weaponName, false));
    }
    if (optgroup.children.length) select.append(optgroup);
  }
  if (!Array.from(select.options).some((option) => option.value === state.weaponName)) {
    const currentGroup = document.createElement("optgroup");
    currentGroup.label = "選択中";
    currentGroup.append(createWeaponOption(state.weaponName, state.weaponName, favoriteSet.has(state.weaponName)));
    select.prepend(currentGroup);
  }
  select.addEventListener("change", (event) => actions.selectWeapon(event.target.value));
  const selectArea = createElement("div", "weapon-select-area");
  const star = createElement("button", `favorite-weapon-toggle ${favoriteSet.has(state.weaponName) ? "is-active" : ""}`.trim(), {
    type: "button",
    text: favoriteSet.has(state.weaponName) ? "★" : "☆",
    title: favoriteSet.has(state.weaponName) ? "お気に入りをはずす" : "お気に入りにする",
    "aria-label": favoriteSet.has(state.weaponName) ? "お気に入りをはずす" : "お気に入りにする",
  });
  star.addEventListener("click", () => actions.toggleFavoriteWeapon(state.weaponName));
  selectArea.append(categorySelect, select, star);
  wrap.append(icons, selectArea);
  return wrap;
}

function renderMapPage(state, actions) {
  const rule = normalizeMapRule(state.mapRule);
  const groups = groupMapVariants(rule);
  const imageType = normalizeMapImageType(state.mapImageType);
  const page = createElement("section", "map-page", { "aria-label": "スプラトゥーン3 マップ" });
  page.append(renderMapImageTypeSwitch(imageType, actions));
  for (let index = 0; index < 2; index++) {
    page.append(renderMapSet(state, actions, rule, groups, index, imageType));
  }
  return page;
}

function renderMapImageTypeSwitch(imageType, actions) {
  const wrap = createElement("div", "map-image-type-switch", { role: "group", "aria-label": "マップ画像タイプ" });
  for (const [type, label] of [["photo", "写真画像を使う"], ["white", "白画像を使う"]]) {
    const button = createElement("button", `map-image-type-button ${imageType === type ? "is-active" : ""}`.trim(), {
      type: "button",
      text: label,
      "aria-pressed": String(imageType === type),
    });
    button.addEventListener("click", () => actions.setMapImageType(type));
    wrap.append(button);
  }
  return wrap;
}

function renderMapSet(state, actions, rule, groups, slotIndex, imageType) {
  const slot = normalizeMapSlotState(state.mapSlots && state.mapSlots[slotIndex]);
  const parsedStage = parseMapVariant(slot.stage);
  const group = groups.find((item) => item.base === parsedStage.base) || groups.find((item) => item.base === slot.stage) || groups.find((item) => item.base === "リュウグウターミナル") || groups[0] || null;
  const stage = group ? group.base : "";
  const requestedVariant = slot.variant || parsedStage.variant;
  const selectedState = getMapStateVariant(requestedVariant);
  const waterVisible = typeof slot.waterVisible === "boolean" ? slot.waterVisible : !isWaterlessMapVariant(requestedVariant);
  const variant = group ? resolveMapVariant(group, selectedState, waterVisible) : "";
  const current = group && (group.variants.find((item) => item.variant === variant) || group.variants[0]);
  const photoPath = getPhotoMapImagePath(stage, rule);
  const imagePath = imageType === "photo" ? photoPath : (current && current.images.with);
  const favoriteKey = `${rule}|${stage}`;
  const markerKey = getMapMarkerKey(rule, stage);
  const selectedMarker = normalizeMapMarkerId(slot.marker);
  const markers = Array.isArray(state.mapMarkers?.[markerKey]) ? state.mapMarkers[markerKey].slice(0, MAP_MARKER_LIMIT) : [];
  const favoriteSet = new Set(state.favoriteMaps || []);

  const section = createElement("article", "map-set");
  const controls = createElement("div", "map-bar");
  const ruleSelect = createElement("select", "map-rule-select", { "aria-label": `ルール名を選択 ${slotIndex + 1}` });
  for (const item of MAP_DATA.rules) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.label;
    option.selected = item.id === rule;
    ruleSelect.append(option);
  }
  ruleSelect.addEventListener("change", (event) => actions.selectMapRule(event.target.value));

  const stageSelect = createElement("select", "map-stage-select", { "aria-label": `マップ名を選択 ${slotIndex + 1}` });
  const stageNumbers = new Map(groups.map((item, index) => [item.base, formatMapStageNumber(index)]));
  const favorites = (state.favoriteMaps || [])
    .map((key) => key.split("|"))
    .filter(([favRule, favStage]) => favRule === rule && groups.some((item) => item.base === favStage))
    .map(([, favStage]) => favStage);
  if (favorites.length) {
    const favGroup = document.createElement("optgroup");
    favGroup.label = "★ お気に入り";
    for (const name of favorites) favGroup.append(createMapOption(name, stage, true, stageNumbers.get(name)));
    stageSelect.append(favGroup);
  }
  const normalGroup = document.createElement("optgroup");
  normalGroup.label = "マップ";
  for (const item of groups) {
    if (!favorites.includes(item.base)) normalGroup.append(createMapOption(item.base, stage, false, stageNumbers.get(item.base)));
  }
  if (normalGroup.children.length) stageSelect.append(normalGroup);
  stageSelect.addEventListener("change", (event) => actions.selectMapStage(slotIndex, event.target.value));

  const star = createElement("button", `favorite-weapon-toggle ${favoriteSet.has(favoriteKey) ? "is-active" : ""}`.trim(), {
    type: "button",
    text: favoriteSet.has(favoriteKey) ? "★" : "☆",
    title: favoriteSet.has(favoriteKey) ? "お気に入りをはずす" : "お気に入りにする",
    "aria-label": favoriteSet.has(favoriteKey) ? "お気に入りをはずす" : "お気に入りにする",
  });
  star.addEventListener("click", () => actions.toggleFavoriteMap(rule, stage));
  controls.append(ruleSelect, stageSelect, star);

  const viewer = createElement("div", "map-viewer");
  if (imagePath) {
    const canvas = createElement("div", "map-canvas", { "data-marker-key": markerKey });
    canvas.addEventListener("contextmenu", (event) => {
      if (event.target?.closest?.(".map-gun-sector, .map-marker")) event.preventDefault();
    });
    if (imageType === "white") {
      canvas.addEventListener("click", (event) => {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        actions.placeMapMarker(
          markerKey,
          selectedMarker,
          ((event.clientX - rect.left) / rect.width) * 100,
          ((event.clientY - rect.top) / rect.height) * 100,
          {
            angle: -90,
            range: selectedMarker === "gun" ? getDefaultGunMarkerRange(stage) : undefined,
          }
        );
      });
    }
    const image = createElement("img", "map-image", {
      src: encodeURI(imagePath),
      alt: `${ruleLabel(rule)} ${stage}${variant && imageType === "white" ? ` ${variant}` : ""} ${imageType === "photo" ? "写真画像" : "白画像"}`,
      loading: "eager",
    });
    canvas.append(image);
    if (imageType === "white") {
      preloadWhiteMapVariants(group);
      for (const marker of markers) {
        if (normalizeMapMarkerId(marker.marker) === "gun") canvas.append(renderGunMarkerSector(markerKey, marker, actions));
        canvas.append(renderMapMarker(markerKey, marker, actions));
      }
      const refreshGunSectors = () => refreshGunSectorPaths(canvas, markers);
      image.addEventListener("load", refreshGunSectors, { once: true });
      requestAnimationFrame(refreshGunSectors);
    }
    viewer.append(canvas);
  } else {
    viewer.append(createElement("div", "map-empty", { text: "この条件のマップ画像がありません" }));
  }

  section.append(controls);
  if (imageType === "white") section.append(renderMapMarkerPalette(slotIndex, selectedMarker, markers.length, actions));
  section.append(viewer);
  if (group && imageType === "white") section.append(renderVariantChoices(group, selectedState, waterVisible, slotIndex, actions));
  return section;
}

function renderMapMarkerPalette(slotIndex, selectedMarker, markerCount, actions) {
  const wrap = createElement("div", "map-marker-palette", { role: "group", "aria-label": `マーカーパレット ${slotIndex + 1}` });
  const select = createElement("select", "map-marker-select", { "aria-label": `マーカーを選択 ${slotIndex + 1}` });
  for (const marker of MAP_MARKERS) {
    const option = document.createElement("option");
    option.value = marker.id;
    option.textContent = `${marker.symbol} ${marker.label}`;
    option.selected = selectedMarker === marker.id;
    select.append(option);
  }
  select.addEventListener("change", (event) => actions.selectMapMarker(slotIndex, event.target.value));
  const current = createElement("span", "map-marker-current");
  current.append(createMapMarkerImage(selectedMarker, ""));
  wrap.append(select, current);
  wrap.append(createElement("span", "map-marker-count", { text: `${markerCount}/${MAP_MARKER_LIMIT}` }));
  return wrap;
}

function renderMapMarker(markerKey, marker, actions) {
  const markerId = typeof marker.id === "string" ? marker.id : "";
  const markerType = normalizeMapMarkerId(marker.marker);
  const button = createElement("button", "map-marker", {
    type: "button",
    title: markerType === "gun" ? "左ドラッグで移動 / 右ドラッグで射線調整 / クリックで削除" : "ドラッグで移動 / クリックで削除",
    "aria-label": "マーカーを移動または削除",
    "data-marker-id": markerId,
  });
  button.append(createMapMarkerImage(marker.marker, "map-marker-img"));
  button.style.left = `${Math.max(0, Math.min(100, Number(marker.x) || 0))}%`;
  button.style.top = `${Math.max(0, Math.min(100, Number(marker.y) || 0))}%`;
  button.addEventListener("contextmenu", (event) => event.preventDefault());
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const canvas = button.closest(".map-canvas");
    if (!canvas) return;
    if (event.button === 2 && markerType === "gun") {
      transformGunMarker(canvas, button, markerKey, marker, actions, event);
      return;
    }
    if (event.button !== undefined && event.button !== 0) return;
    button.setPointerCapture?.(event.pointerId);
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    const update = (moveEvent) => {
      if (moveEvent.pointerId !== event.pointerId) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((moveEvent.clientY - rect.top) / rect.height) * 100));
      button.style.left = `${x}%`;
      button.style.top = `${y}%`;
      if (markerType === "gun") {
        updateGunSectorPath(canvas, markerId, { ...marker, x, y });
      }
    };
    const finish = (upEvent) => {
      if (upEvent.pointerId !== event.pointerId) return;
      button.removeEventListener("pointermove", update);
      button.removeEventListener("pointerup", finish);
      button.removeEventListener("pointercancel", cancel);
      button.releasePointerCapture?.(event.pointerId);
      if (!moved) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      button.dataset.dragged = "true";
      const x = Math.max(0, Math.min(100, ((upEvent.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((upEvent.clientY - rect.top) / rect.height) * 100));
      if (markerType === "gun") {
        updateGunSectorPath(canvas, markerId, { ...marker, x, y });
      }
      actions.moveMapMarker(
        markerKey,
        markerId,
        x,
        y
      );
    };
    const cancel = (cancelEvent) => {
      if (cancelEvent.pointerId !== event.pointerId) return;
      button.removeEventListener("pointermove", update);
      button.removeEventListener("pointerup", finish);
      button.removeEventListener("pointercancel", cancel);
      button.releasePointerCapture?.(event.pointerId);
    };
    button.addEventListener("pointermove", update);
    button.addEventListener("pointerup", finish);
    button.addEventListener("pointercancel", cancel);
  });
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (button.dataset.dragged === "true") {
      delete button.dataset.dragged;
      return;
    }
    actions.removeMapMarker(markerKey, marker.id);
  });
  return button;
}

function updateGunSectorPath(canvas, markerId, marker) {
  const paths = canvas.querySelectorAll(`.map-gun-sector[data-marker-id="${CSS.escape(markerId)}"] .map-gun-sector-shape`);
  for (const path of paths) path.setAttribute("d", buildGunSectorPath(marker, canvas));
}

function refreshGunSectorPaths(canvas, markers) {
  for (const marker of markers) {
    if (normalizeMapMarkerId(marker.marker) === "gun" && typeof marker.id === "string") {
      updateGunSectorPath(canvas, marker.id, marker);
    }
  }
}

function renderGunMarkerSector(markerKey, marker, actions) {
  const markerId = typeof marker.id === "string" ? marker.id : "";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "map-gun-sector");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("data-marker-id", markerId);
  const hitPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  hitPath.setAttribute("class", "map-gun-sector-shape map-gun-sector-hit");
  hitPath.setAttribute("d", buildGunSectorPath(marker));
  const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  linePath.setAttribute("class", "map-gun-sector-shape map-gun-sector-path");
  linePath.setAttribute("d", buildGunSectorPath(marker));
  hitPath.addEventListener("contextmenu", (event) => event.preventDefault());
  hitPath.addEventListener("pointerdown", (event) => {
    if (!isGunSectorTransformPointer(event)) return;
    event.preventDefault();
    event.stopPropagation();
    const canvas = svg.closest(".map-canvas");
    if (!canvas) return;
    transformGunMarker(canvas, hitPath, markerKey, marker, actions, event);
  });
  svg.append(hitPath, linePath);
  return svg;
}

function transformGunMarker(canvas, target, markerKey, marker, actions, event) {
  event.preventDefault();
  const markerId = typeof marker.id === "string" ? marker.id : "";
  const sensitivity = event.pointerType === "mouse" ? GUN_MARKER_DRAG_SENSITIVITY : 1;
  const startPoint = getMapCanvasPoint(canvas, event);
  if (!startPoint) return;
  const baseAngle = getGunAngle(marker);
  const baseRange = getGunRange(marker);
  const centerX = getGunX(marker);
  const centerY = getGunY(marker);
  const startVector = getGunSectorVector(canvas, startPoint, centerX, centerY);
  const startDistance = Math.max(1, Math.hypot(startVector.x, startVector.y));
  const startAngle = Math.atan2(startVector.y, startVector.x) * 180 / Math.PI;
  let mode = "";
  let angle = baseAngle;
  let range = baseRange;
  target.setPointerCapture?.(event.pointerId);
  const update = (moveEvent) => {
    if (moveEvent.pointerId !== event.pointerId) return;
    moveEvent.preventDefault();
    moveEvent.stopPropagation();
    const point = getMapCanvasPoint(canvas, moveEvent);
    if (!point) return;
    const currentVector = getGunSectorVector(canvas, point, centerX, centerY);
    const currentDistance = Math.max(1, Math.hypot(currentVector.x, currentVector.y));
    const currentAngle = Math.atan2(currentVector.y, currentVector.x) * 180 / Math.PI;
    const radialDelta = Math.abs(currentDistance - startDistance);
    const angularDelta = Math.abs(normalizeAngleDelta(currentAngle - startAngle)) * Math.PI / 180 * startDistance;
    if (!mode && Math.max(radialDelta, angularDelta) >= 2) mode = radialDelta >= angularDelta ? "range" : "angle";
    if (mode === "range") {
      range = Math.max(6, Math.min(80, baseRange + ((currentDistance - startDistance) * sensitivity)));
    } else if (mode === "angle") {
      angle = baseAngle + (normalizeAngleDelta(currentAngle - startAngle) * sensitivity);
    } else {
      return;
    }
    updateGunSectorPath(canvas, markerId, { ...marker, angle, range });
    if (target.dataset) target.dataset.dragged = "true";
  };
  const finish = (upEvent) => {
    if (upEvent.pointerId !== event.pointerId) return;
    upEvent.preventDefault();
    upEvent.stopPropagation();
    target.removeEventListener("pointermove", update);
    target.removeEventListener("pointerup", finish);
    target.removeEventListener("pointercancel", cancel);
    target.releasePointerCapture?.(event.pointerId);
    if (mode === "range") actions.updateMapMarker(markerKey, markerId, { range });
    if (mode === "angle") actions.updateMapMarker(markerKey, markerId, { angle });
  };
  const cancel = (cancelEvent) => {
    if (cancelEvent.pointerId !== event.pointerId) return;
    cancelEvent.preventDefault();
    cancelEvent.stopPropagation();
    target.removeEventListener("pointermove", update);
    target.removeEventListener("pointerup", finish);
    target.removeEventListener("pointercancel", cancel);
    target.releasePointerCapture?.(event.pointerId);
  };
  target.addEventListener("pointermove", update);
  target.addEventListener("pointerup", finish);
  target.addEventListener("pointercancel", cancel);
}

function isGunSectorTransformPointer(event) {
  if (event.pointerType === "mouse") return event.button === 2;
  return event.button === undefined || event.button === 0;
}

function renderVariantChoices(group, selectedState, waterVisible, slotIndex, actions) {
  const wrap = createElement("div", "map-variant-panel");
  const list = createElement("div", "map-variant-list", { role: "group", "aria-label": "マップバリエーション" });
  const stateVariants = getMapStateVariants(group);
  for (const variant of stateVariants) {
    const label = createElement("label", "map-variant-choice");
    const input = createElement("input", "", { type: "checkbox", value: variant });
    input.checked = variant === selectedState;
    input.disabled = stateVariants.length === 1;
    input.addEventListener("change", () => actions.selectMapVariant(slotIndex, variant));
    label.append(input, createElement("span", "", { text: variant || "標準" }));
    list.append(label);
  }
  const water = getMapWaterAvailability(group, selectedState);
  const waterLabel = createElement("label", "map-variant-choice");
  const waterInput = createElement("input", "", { type: "checkbox" });
  waterInput.checked = water.hasWater && waterVisible;
  waterInput.disabled = !water.hasWater || !water.hasWaterless;
  waterInput.addEventListener("change", () => actions.setMapWaterVisible(slotIndex, waterInput.checked));
  waterLabel.append(waterInput, createElement("span", "", { text: "水表示" }));
  list.append(waterLabel);
  wrap.append(list);
  return wrap;
}

function createMapOption(name, selectedName, favorite, number) {
  const option = document.createElement("option");
  const prefix = typeof number === "string" ? `${number} ` : "";
  option.value = name;
  option.textContent = favorite ? `★ ${prefix}${name}` : `${prefix}${name}`;
  option.selected = name === selectedName;
  return option;
}

function formatMapStageNumber(index) {
  return String(index).padStart(2, "0");
}

function getPhotoMapImagePath(stage, rule) {
  return window.SPL3_GAME8_MAP_DATA?.[stage]?.[rule] || "";
}

function preloadWhiteMapVariants(group) {
  if (!group || !Array.isArray(group.variants)) return;
  const paths = new Set(group.variants.map((item) => item.images?.with).filter(Boolean));
  for (const path of paths) {
    const image = new Image();
    image.decoding = "async";
    image.src = encodeURI(path);
  }
}

function getMapMarkerKey(rule, stage) {
  return `${rule}|${stage}`;
}

function normalizeMapMarkerId(marker) {
  const aliases = new Map([
    ["pin", "pin"], ["📍", "pin"],
    ["red", "red"], ["🔴", "red"],
    ["yellow", "yellow"], ["🟡", "yellow"],
    ["green", "green"], ["🟢", "green"],
    ["blue", "blue"], ["🔵", "blue"],
    ["star", "star"], ["⭐", "star"],
    ["gun", "gun"], ["🔫", "gun"],
    ["warning", "warning"], ["⚠", "warning"], ["⚠️", "warning"],
  ]);
  return aliases.get(marker) || "pin";
}

function getMapMarkerSymbol(marker) {
  const markerId = normalizeMapMarkerId(marker);
  return MAP_MARKERS.find((item) => item.id === markerId)?.symbol || "📍";
}

function getMapMarkerFile(marker) {
  const markerId = normalizeMapMarkerId(marker);
  return MAP_MARKERS.find((item) => item.id === markerId)?.file || "pin.png";
}

function createMapMarkerImage(marker, className) {
  return createElement("img", className, {
    src: `./asset/marker/${getMapMarkerFile(marker)}`,
    alt: getMapMarkerSymbol(marker),
    draggable: "false",
  });
}

function buildGunSectorPath(marker, canvas) {
  const x = getGunX(marker);
  const y = getGunY(marker);
  const range = getGunRange(marker);
  const angle = getGunAngle(marker);
  const scale = getGunSectorScale(canvas);
  const half = GUN_MARKER_SPREAD_DEGREES / 2;
  const start = (angle - half) * Math.PI / 180;
  const end = (angle + half) * Math.PI / 180;
  const rx = range * scale.x;
  const ry = range * scale.y;
  const x1 = x + Math.cos(start) * rx;
  const y1 = y + Math.sin(start) * ry;
  const x2 = x + Math.cos(end) * rx;
  const y2 = y + Math.sin(end) * ry;
  return `M ${x.toFixed(3)} ${y.toFixed(3)} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${rx.toFixed(3)} ${ry.toFixed(3)} 0 0 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
}

function getMapCanvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
    y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
  };
}

function getGunSectorScale(canvas) {
  const rect = canvas?.getBoundingClientRect?.();
  if (!rect || !rect.width || !rect.height) return { x: 1, y: 1 };
  const base = Math.min(rect.width, rect.height);
  return {
    x: base / rect.width,
    y: base / rect.height,
  };
}

function getGunSectorVector(canvas, point, centerX, centerY) {
  const scale = getGunSectorScale(canvas);
  return {
    x: (point.x - centerX) / Math.max(0.001, scale.x),
    y: (point.y - centerY) / Math.max(0.001, scale.y),
  };
}

function getDefaultGunMarkerRange(stage) {
  return MAP_GUN_MARKER_RANGES[stage] || DEFAULT_GUN_MARKER_RANGE;
}

function getGunX(marker) {
  return Math.max(0, Math.min(100, Number(marker.x) || 0));
}

function getGunY(marker) {
  return Math.max(0, Math.min(100, Number(marker.y) || 0));
}

function getGunAngle(marker) {
  return Number.isFinite(Number(marker.angle)) ? Number(marker.angle) : -90;
}

function getGunRange(marker) {
  return Math.max(6, Math.min(80, Number(marker.range) || DEFAULT_GUN_MARKER_RANGE));
}

function normalizeAngleDelta(degrees) {
  return ((Number(degrees) + 540) % 360) - 180;
}

function groupMapVariants(rule) {
  const items = MAP_DATA.maps[rule] || [];
  const groups = new Map();
  for (const item of items) {
    const parsed = parseMapVariant(item.label);
    if (!groups.has(parsed.base)) groups.set(parsed.base, { base: parsed.base, variants: [] });
    groups.get(parsed.base).variants.push({ ...item, variant: parsed.variant });
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      variants: uniqueMapVariants(group.variants)
        .sort((a, b) => variantRank(a.variant) - variantRank(b.variant) || a.variant.localeCompare(b.variant, "ja")),
    }))
    .sort((a, b) => a.base.localeCompare(b.base, "ja"));
}

function uniqueMapVariants(variants) {
  const seen = new Set();
  return variants.filter((item) => {
    const key = item.variant;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getMapStateVariants(group) {
  const seen = new Set();
  return group.variants
    .map((item) => getMapStateVariant(item.variant))
    .filter((variant) => variant !== "A3版")
    .filter((variant) => {
      if (seen.has(variant)) return false;
      seen.add(variant);
      return true;
    });
}

function getMapStateVariant(variant) {
  if (!variant || variant === "水表記なし") return "";
  return variant.replace("（水表記なし）", "");
}

function isWaterlessMapVariant(variant) {
  return variant === "水表記なし" || variant.includes("（水表記なし）");
}

function toWaterlessMapVariant(stateVariant) {
  return stateVariant ? `${stateVariant}（水表記なし）` : "水表記なし";
}

function getMapWaterAvailability(group, stateVariant) {
  const waterless = toWaterlessMapVariant(stateVariant);
  return {
    hasWater: group.variants.some((item) => getMapStateVariant(item.variant) === stateVariant && !isWaterlessMapVariant(item.variant)),
    hasWaterless: group.variants.some((item) => item.variant === waterless),
  };
}

function resolveMapVariant(group, stateVariant, waterVisible) {
  const stateVariants = getMapStateVariants(group);
  const normalizedState = stateVariants.includes(stateVariant) ? stateVariant : (stateVariants[0] || "");
  const waterless = toWaterlessMapVariant(normalizedState);
  if (!waterVisible && group.variants.some((item) => item.variant === waterless)) return waterless;
  if (group.variants.some((item) => item.variant === normalizedState)) return normalizedState;
  if (group.variants.some((item) => item.variant === waterless)) return waterless;
  return group.variants[0]?.variant || "";
}

function parseMapVariant(label) {
  const normalized = label.replace(/\s+/g, "　").trim();
  const patterns = [
    /^(.*?)　((?:カウント(?:ストップ時|進行時|進行時（自・敵共）|50未満|50経過後|50未満,経過後|60未満|60経過後|60未満,経過後)|カンモン突破(?:前|後|前,後))　水表記なし)$/,
    /^(.*?)　(その[１２12](?:,[２2])?)$/,
    /^(.*?)　(水表記なし)$/,
    /^(.*?)　(秒数表記(?:あり|なし))$/,
    /^(.*?)　(A3版|おまけ|上層|下層|上下層)$/,
    /^(.*?)　(干潮時|満潮時|満潮時,干潮時)$/,
    /^(.*?)　(カウント(?:ストップ時|進行時|進行時（自・敵共）|50未満|50経過後|50未満,経過後|60未満|60経過後|60未満,経過後))$/,
    /^(.*?)　(カンモン突破(?:前|後|前,後))$/,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) return { base: match[1], variant: normalizeVariantLabel(match[2]) };
  }
  return { base: normalized, variant: "" };
}

function normalizeVariantLabel(value) {
  return value
    .replace(/[１２]/g, (char) => char === "１" ? "1" : "2")
    .replace("　水表記なし", "（水表記なし）");
}

function variantRank(variant) {
  if (!variant) return 0;
  if (/カウント進行時/.test(variant)) return variant.includes("水表記なし") ? 2 : 1;
  if (/カウントストップ時/.test(variant)) return variant.includes("水表記なし") ? 4 : 3;
  if (/その1$|突破前$|未満$|干潮時$|下層$|カウント進行時$/.test(variant)) return 1;
  if (/その1,2|前,後|未満,経過後|満潮時,干潮時|上下層/.test(variant)) return 2;
  if (/その2$|突破後$|経過後$|満潮時$|上層$|ストップ時/.test(variant)) return 3;
  if (variant === "水表記なし") return 9;
  return 5;
}

function normalizeMapSlotState(slot = {}) {
  return {
    stage: typeof slot.stage === "string" && slot.stage ? slot.stage : "リュウグウターミナル",
    variant: typeof slot.variant === "string" ? slot.variant : "",
    waterVisible: typeof slot.waterVisible === "boolean" ? slot.waterVisible : true,
    marker: normalizeMapMarkerId(slot.marker),
  };
}

function normalizeMapRule(rule) {
  return MAP_DATA.rules.some((item) => item.id === rule) ? rule : "tower";
}

function normalizeMapImageType(type) {
  return type === "photo" ? "photo" : "white";
}

function ruleLabel(rule) {
  const item = MAP_DATA.rules.find((entry) => entry.id === rule);
  return item ? item.label : "ヤグラ";
}

function createWeaponCategorySelect(state, actions) {
  const select = createElement("select", "weapon-category-select", {
    "aria-label": "ブキ種を選択",
    title: weaponCategoryTitle(state.weaponCategory),
  });
  for (const item of weaponCategoryOptions()) {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.value === normalizeWeaponCategory(state.weaponCategory) ? item.code : `${item.code} ${item.label}`;
    option.dataset.code = item.code;
    option.dataset.label = item.label;
    option.selected = item.value === normalizeWeaponCategory(state.weaponCategory);
    option.title = item.label;
    select.append(option);
  }
  select.addEventListener("pointerdown", () => expandWeaponCategoryOptions(select));
  select.addEventListener("focus", () => expandWeaponCategoryOptions(select));
  select.addEventListener("change", (event) => {
    collapseWeaponCategoryOptions(select);
    actions.selectWeaponCategory(event.target.value);
  });
  select.addEventListener("blur", () => collapseWeaponCategoryOptions(select));
  return select;
}

function expandWeaponCategoryOptions(select) {
  for (const option of select.options) {
    option.textContent = `${option.dataset.code} ${option.dataset.label}`;
  }
}

function collapseWeaponCategoryOptions(select) {
  for (const option of select.options) {
    option.textContent = option.selected ? option.dataset.code : `${option.dataset.code} ${option.dataset.label}`;
  }
}

function weaponCategoryOptions() {
  const existing = new Set(Object.values(WEAPON_DATAS).map((data) => data.cat || "その他"));
  return [
    { value: "all", code: "All", label: "すべて" },
    { value: "fav", code: "Fav", label: "お気に入り" },
    { value: "シューター", code: "Sho", label: "シューター" },
    { value: "ローラー", code: "Rol", label: "ローラー" },
    { value: "チャージャー", code: "Cha", label: "チャージャー" },
    { value: "スロッシャー", code: "Slo", label: "スロッシャー" },
    { value: "スピナー", code: "Spi", label: "スピナー" },
    { value: "マニューバー", code: "Man", label: "マニューバー" },
    { value: "ブラスター", code: "Bla", label: "ブラスター" },
    { value: "シェルター", code: "She", label: "シェルター" },
    { value: "フデ", code: "Bru", label: "フデ" },
    { value: "ストリンガー", code: "Str", label: "ストリンガー" },
    { value: "ワイパー", code: "Wip", label: "ワイパー" },
    { value: "その他", code: "Oth", label: "その他" },
  ].filter((item) => item.value === "all" || item.value === "fav" || existing.has(item.value));
}

function normalizeWeaponCategory(category) {
  const values = new Set(weaponCategoryOptions().map((item) => item.value));
  return values.has(category) ? category : "all";
}

function weaponCategoryTitle(category) {
  const item = weaponCategoryOptions().find((entry) => entry.value === normalizeWeaponCategory(category));
  return item ? `${item.code}: ${item.label}` : "All: すべて";
}

function createWeaponOption(name, selectedName, favorite) {
  const option = document.createElement("option");
  option.value = name;
  option.textContent = favorite ? `★ ${name}` : name;
  option.selected = name === selectedName;
  return option;
}

function renderGearInput(state, actions) {
  const wrap = createElement("div", "gear-input");
  for (const part of PARTS) wrap.append(renderPartPanel(part, state, actions));
  return wrap;
}

function renderPartPanel(part, state, actions) {
  const panel = createElement("section", "part-panel", { "aria-label": part.label });
  const header = createElement("div", "part-header");
  header.append(createElement("strong", "part-title", { text: part.label }));
  const reset = createElement("button", "part-reset", { type: "button", text: "×", title: `${part.label}をリセット` });
  reset.addEventListener("click", () => actions.clearPart(part.id));
  header.append(reset);

  const main = renderSlot({ part: part.id, type: "main", index: 0 }, state, actions, "main-slot");
  const gearButton = createElement("button", "gear-link", { type: "button", text: "ギア", title: `${part.label}のギア一覧` });
  const subs = createElement("div", "sub-slots");
  for (let index = 0; index < 3; index++) subs.append(renderSlot({ part: part.id, type: "sub", index }, state, actions, "sub-slot"));
  panel.append(header, main, gearButton, subs);
  return panel;
}

function renderSlot(slot, state, actions, extraClass) {
  const powerName = getSlotValue(state.slots, slot);
  const disabled = Boolean(powerName) && isSlotDisabled(state.disabledSlots, slot);
  const slotEl = createElement("button", `gear-slot ${extraClass}`, {
    type: "button",
    "data-part": slot.part,
    "data-type": slot.type,
    "data-index": slot.index,
    title: powerName ? `${powerName}${disabled ? " (一時無効)" : ""}` : "ここにギアパワーを入れる",
  });
  slotEl.addEventListener("dragover", (event) => actions.dragOverSlot(event, slot));
  slotEl.addEventListener("dragleave", (event) => actions.dragLeaveSlot(event));
  slotEl.addEventListener("drop", (event) => actions.dropOnSlot(event, slot));
  slotEl.addEventListener("pointermove", (event) => actions.pointerMove(event));
  slotEl.addEventListener("pointerup", (event) => actions.pointerEnd(event));
  slotEl.addEventListener("pointercancel", (event) => actions.pointerCancel(event));
  slotEl.addEventListener("contextmenu", (event) => {
    if (!powerName) return;
    event.preventDefault();
    actions.toggleSlotDisabled(slot);
  });
  slotEl.addEventListener("dblclick", (event) => {
    if (!powerName) return;
    event.preventDefault();
    clearTimeout(slotEl.removeTimer);
    actions.toggleSlotDisabled(slot);
  });
  slotEl.addEventListener("click", (event) => {
    if (actions.wasPointerDropRecently()) return;
    if (!powerName || event.detail > 1) return;
    clearTimeout(slotEl.removeTimer);
    if (disabled) {
      actions.toggleSlotDisabled(slot);
      return;
    }
    slotEl.removeTimer = setTimeout(() => actions.removeSlot(slot), 240);
  });
  if (powerName) {
    if (disabled) slotEl.classList.add("is-disabled");
    slotEl.draggable = true;
    slotEl.addEventListener("dragstart", (event) => actions.dragStartFromSlot(event, slot, powerName));
    slotEl.addEventListener("dragend", actions.dragEnd);
    slotEl.addEventListener("pointerdown", (event) => {
      actions.pointerStart(event, { kind: "slot", slot }, powerName);
      if (event.pointerType !== "mouse") slotEl.setPointerCapture?.(event.pointerId);
    });
    slotEl.append(powerIcon(powerName));
    if (disabled) slotEl.append(createElement("span", "disabled-mark", { text: "×" }));
  } else {
    slotEl.append(createElement("span", "empty-mark", { text: "?" }));
  }
  return slotEl;
}

function renderPowerPool(state, actions) {
  const section = createElement("section", `power-pool ${state.poolVisible ? "" : "is-hidden"}`.trim());
  const pointers = createElement("div", "pool-pointers");
  for (const part of PARTS) pointers.append(createElement("span", `pool-pointer ${part.id}`));

  const contents = createElement("div", "pool-contents");
  if (state.poolVisible) {
    const { normal, mainOnly } = classifyPowers();
    const normalGrid = createElement("div", "normal-power-grid");
    for (const name of normal) normalGrid.append(renderPowerButton(name, actions));
    const mainGrid = createElement("div", "main-power-grid");
    for (const part of PARTS) {
      const column = createElement("div", "main-power-column", { "data-part": part.id });
      for (const name of mainOnly[part.id]) column.append(renderPowerButton(name, actions));
      mainGrid.append(column);
    }
    contents.append(normalGrid, mainGrid);
  }

  const toggle = createElement("button", "pool-toggle", { type: "button", text: state.poolVisible ? "ギアパワーリストを隠す" : "ギアパワーリストを表示" });
  toggle.addEventListener("click", actions.togglePool);
  section.append(pointers, contents, toggle);
  return section;
}

function renderPowerButton(powerName, actions) {
  const meta = getPowerMeta(powerName);
  const button = createElement("button", "power-button", { type: "button", title: powerName, "data-power": powerName });
  const allowedPart = getAllowedPart(powerName);
  if (allowedPart) button.dataset.allowedPart = allowedPart;
  button.draggable = true;
  button.addEventListener("click", () => {
    if (actions.wasPointerDropRecently()) return;
    actions.addPower(powerName);
  });
  button.addEventListener("dragstart", (event) => actions.dragStartFromPool(event, powerName));
  button.addEventListener("dragend", actions.dragEnd);
  button.addEventListener("pointerdown", (event) => {
    actions.pointerStart(event, { kind: "pool" }, powerName);
    if (event.pointerType !== "mouse") button.setPointerCapture?.(event.pointerId);
  });
  button.addEventListener("pointermove", (event) => actions.pointerMove(event));
  button.addEventListener("pointerup", (event) => actions.pointerEnd(event));
  button.addEventListener("pointercancel", (event) => actions.pointerCancel(event));
  button.append(iconImage(meta?.i, powerName, "power-icon"));
  return button;
}

function renderPinnedResults(results, state, actions) {
  const pinned = results
    .filter((result) => PINNED_RESULT_NAMES.has(result.name))
    .sort((a, b) => PINNED_RESULT_ORDER.indexOf(a.name) - PINNED_RESULT_ORDER.indexOf(b.name));
  const isOpen = state.weaponDetailsOpen !== false;
  const section = createElement("section", `pinned-result-group ${isOpen ? "" : "is-collapsed"}`.trim(), { "aria-label": "ブキ詳細" });
  if (!pinned.length) return section;

  const header = createElement("div", "pinned-result-header");
  header.append(createElement("strong", "", { text: "ブキ詳細" }));
  const summary = mainDetailSummary(pinned);
  if (summary) header.append(createElement("span", "detail-summary", { text: summary }));
  const toggle = createElement("button", "detail-toggle", {
    type: "button",
    text: isOpen ? "閉じる" : "開く",
    title: isOpen ? "ブキ詳細を閉じる" : "ブキ詳細を開く",
    "aria-expanded": String(isOpen),
  });
  toggle.addEventListener("click", actions.toggleWeaponDetails);
  header.append(toggle);
  section.append(header);

  if (isOpen) {
    const list = createElement("div", "pinned-result-list");
    for (const result of pinned) list.append(renderResultRow(result));
    section.append(list);
  }

  return section;
}

function mainDetailSummary(results) {
  const mainDamage = results.find((result) => result.name === "メイン");
  const mainInk = mainDamage && mainDamage.values && mainDamage.values.find((item) => item.label === "1発インク");
  const range = findRangeValue(mainDamage);
  return [
    mainInk ? `消費${mainInk.value}` : "",
    range ? compactRangeSummary(range.value) : "",
  ].filter(Boolean).join(" / ");
}

function compactRangeSummary(value) {
  return `射程${String(value || "")
    .replace(/有効射程/g, "")
    .replace(/確定数維持射程/g, "確定射程")
    .replace(/スライド後の/g, "SL後")
    .replace(/立ち撃ち時/g, "立ち")
    .replace(/\s+/g, "")}`;
}

function renderRangeComparison(state, actions) {
  const isOpen = state.rangeComparisonOpen !== false;
  const favorites = (state.favoriteWeapons || []).filter((name) => WEAPON_DATAS[name]);
  const section = createElement("section", `range-comparison ${isOpen ? "" : "is-collapsed"}`.trim(), { "aria-label": "射程対比" });
  const header = createElement("div", "range-comparison-header");
  header.append(createElement("strong", "", { text: "射程対比" }));
  const summary = favorites.length ? `${favorites.length}ブキ` : "お気に入りなし";
  header.append(createElement("span", "range-comparison-summary", { text: summary }));
  const toggle = createElement("button", "detail-toggle", {
    type: "button",
    text: isOpen ? "閉じる" : "開く",
    title: isOpen ? "射程対比を閉じる" : "射程対比を開く",
    "aria-expanded": String(isOpen),
  });
  toggle.addEventListener("click", actions.toggleRangeComparison);
  header.append(toggle);
  section.append(header);
  if (!isOpen) return section;

  const list = createElement("div", "range-comparison-list");
  if (!favorites.length) {
    list.append(createElement("div", "range-comparison-empty", { text: "お気に入りに登録したブキがここに表示されます" }));
  } else {
    for (const weaponName of favorites) list.append(renderRangeComparisonRow(state, weaponName));
  }
  section.append(list);
  return section;
}

function renderRangeComparisonRow(state, weaponName) {
  const results = buildResults(state.slots, weaponName, {
    ldeIntensity: state.ldeIntensity,
    drinkActive: state.drinkActive,
    ikaFlowActive: state.ikaFlowActive,
    comebackActive: state.comebackActive,
    disabledSlots: state.disabledSlots,
  });
  const mainDamage = results.find((result) => result.name === "メイン");
  const mainInk = mainDamage && mainDamage.values && mainDamage.values.find((item) => item.label === "1発インク");
  const range = findRangeValue(mainDamage);
  const row = createElement("article", "range-comparison-row");
  const weapon = WEAPON_DATAS[weaponName];
  row.append(iconImage(weapon && weapon.i, weaponName, "range-comparison-icon"));
  row.append(createElement("strong", "range-comparison-name", { text: weaponName }));
  row.append(createElement("span", "range-comparison-value", {
    text: `${mainInk ? mainInk.value : "-"} / ${range ? range.value : "射程未登録"}`,
  }));
  return row;
}

function findRangeValue(result) {
  return result && result.values && result.values.find((item) => item.label && item.label.includes("射程"));
}

function renderResults(results) {
  const normalResults = results.filter((result) => !PINNED_RESULT_NAMES.has(result.name));
  const list = createElement("section", "result-list", { "aria-live": "polite" });
  if (!normalResults.length) {
    const empty = createElement("div", "result-empty", { text: "ギアパワーをスロットに入れると効果が表示されます" });
    list.append(empty);
    return list;
  }
  for (const result of normalResults) list.append(renderResultRow(result));
  return list;
}

function renderResultRow(result) {
  const row = createElement("article", "result-row");
  const left = createElement("div", "result-left");
  left.append(iconImage(result.icon, result.name, "result-icon"), createElement("strong", "result-name", { text: result.name }));
  const body = createElement("div", "result-body");
  if (result.type === "text") {
    body.append(createElement("p", "result-text", { text: result.text }));
  } else if (result.type === "multi") {
    const multi = createElement("div", "result-multi");
    for (const item of result.values) {
      const canWrap = item.label === "他キル";
      const part = createElement("span", `result-chip ${canWrap ? "result-chip-wrap" : ""}`.trim());
      part.append(createElement("small", "", { text: item.label }));
      if (canWrap) part.append(renderSegmentedValue(item.value));
      else part.append(createElement("b", "", { text: item.value }));
      multi.append(part);
    }
    body.append(multi);
  } else {
    body.append(renderBar(result.ratio), createElement("b", "result-value", { text: result.value }));
  }
  row.append(left, body);
  return row;
}

function renderSegmentedValue(value) {
  const wrap = createElement("b", "segmented-value");
  const parts = String(value).split(" / ").filter(Boolean);
  parts.forEach((part, index) => {
    if (index) wrap.append(createElement("span", "segment-separator", { text: "/" }));
    wrap.append(createElement("span", "segment-item", { text: part }));
  });
  return wrap;
}

function renderBar(ratio = 0) {
  const bar = createElement("div", "result-bar");
  const fill = createElement("span", "result-bar-fill");
  fill.style.width = `${Math.max(0, Math.min(100, ratio))}%`;
  bar.append(fill);
  return bar;
}

function formatDisplayNumber(value, digits = 2) {
  return Number(value).toFixed(digits).replace(/\.?0+$/, "");
}

function powerIcon(powerName) {
  const meta = getPowerMeta(powerName);
  return iconImage(meta?.i, powerName, "power-icon in-slot");
}

function iconImage(file, alt, className) {
  const img = createElement("img", className, { alt: alt ?? "", draggable: "false" });
  img.src = assetPath(file || "gp27.png");
  img.onerror = () => { img.src = assetPath("gp27.png"); };
  return img;
}

function groupWeapons() {
  const groups = {};
  for (const [name, data] of Object.entries(WEAPON_DATAS)) {
    const category = data.cat || "その他";
    if (!groups[category]) groups[category] = [];
    groups[category].push(name);
  }
  return groups;
}

function markSlotValidity(root, powerName) {
  for (const el of root.querySelectorAll(".gear-slot")) {
    const slot = { part: el.dataset.part, type: el.dataset.type, index: Number(el.dataset.index) };
    el.classList.toggle("can-drop", canPlacePower(powerName, slot));
    el.classList.toggle("cannot-drop", !canPlacePower(powerName, slot));
  }
}

function clearSlotValidity(root) {
  for (const el of root.querySelectorAll(".gear-slot")) el.classList.remove("can-drop", "cannot-drop", "drop-hover");
}

function renderAppVersion(actions) {
  const footer = createElement("footer", "app-version");
  footer.append(createElement("span", "", { text: APP_VERSION }));
  const refresh = createElement("button", "app-refresh", {
    type: "button",
    text: "更新",
    title: "ギアセットを保存したまま最新版を読み込みます",
  });
  refresh.addEventListener("click", actions.refreshApp);
  footer.append(refresh);
  return footer;
}
  window.SPL3 = window.SPL3 || {};
  window.SPL3.renderer = { render, markSlotValidity, clearSlotValidity };
})();

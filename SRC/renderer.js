(function () {
  const { GEARPOWER_DATAS, WEAPON_DATAS, SUB_DATAS, SPECIAL_DATAS } = window.SPL3_DATA;
  const { PARTS, getSlotValue, isSlotDisabled } = window.SPL3.state;
  const { assetPath, createElement } = window.SPL3.utils;
  const { buildEfficiencyTest, buildResults, canPlacePower, classifyPowers, getAllowedPart, getPowerMeta } = window.SPL3.calculations;
  const PINNED_RESULT_NAMES = new Set(["メイン", "サブ", "スペシャル必要P", "スペシャル性能"]);
  const PINNED_RESULT_ORDER = ["メイン", "サブ", "スペシャル必要P", "スペシャル性能"];
  const APP_VERSION = "Ver1.14";

function render(root, state, actions) {
  const results = buildResults(state.slots, state.weaponName, {
    ldeIntensity: state.ldeIntensity,
    drinkActive: state.drinkActive,
    comebackActive: state.comebackActive,
    disabledSlots: state.disabledSlots,
  });
  root.replaceChildren();
  root.append(
    renderWeaponBar(state, actions),
    renderPinnedResults(results, state, actions),
    renderRangeComparison(state, actions),
    renderEfficiencyTest(state, actions),
    renderGearSetTabs(state, actions),
    renderGearInput(state, actions),
    renderPowerPool(state, actions),
    renderAnalyzerControls(state, actions),
    renderResults(results),
    renderAppVersion(actions)
  );
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
  const wrap = createElement("section", `analyzer-controls ${isOpen ? "" : "is-collapsed"}`.trim(), { "aria-label": "解析条件" });

  const header = createElement("div", "analyzer-header");
  header.append(createElement("strong", "", { text: "解析条件" }));
  const summary = createElement("span", "analyzer-summary", { text: analyzerSummaryText(state) });
  const toggle = createElement("button", "detail-toggle", {
    type: "button",
    text: isOpen ? "閉じる" : "開く",
    title: isOpen ? "解析条件を閉じる" : "解析条件を開く",
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

  const body = createElement("div", "analyzer-body");
  body.append(lde, drink);

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

  const select = createElement("select", "weapon-select", { "aria-label": "ブキを選択" });
  const favorites = (state.favoriteWeapons || []).filter((name) => WEAPON_DATAS[name]);
  const favoriteSet = new Set(favorites);
  if (favorites.length) {
    const favoriteGroup = document.createElement("optgroup");
    favoriteGroup.label = "★ お気に入り";
    for (const name of favorites) favoriteGroup.append(createWeaponOption(name, state.weaponName, true));
    select.append(favoriteGroup);
  }
  const groups = groupWeapons();
  for (const [category, names] of Object.entries(groups)) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = category;
    for (const name of names) {
      if (!favoriteSet.has(name)) optgroup.append(createWeaponOption(name, state.weaponName, false));
    }
    if (optgroup.children.length) select.append(optgroup);
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
  selectArea.append(select, star);
  wrap.append(icons, selectArea);
  return wrap;
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
    mainInk ? `メイン1発 ${mainInk.value}` : "",
    range ? `${range.label} ${range.value}` : "",
  ].filter(Boolean).join(" / ");
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
      const part = createElement("span", "result-chip");
      part.append(createElement("small", "", { text: item.label }), createElement("b", "", { text: item.value }));
      multi.append(part);
    }
    body.append(multi);
  } else {
    body.append(renderBar(result.ratio), createElement("b", "result-value", { text: result.value }));
  }
  row.append(left, body);
  return row;
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

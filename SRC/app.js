(function () {
  const { WEAPON_DATAS } = window.SPL3_DATA;
  const { createInitialGearSet, createState } = window.SPL3.state;
  const { canPlacePower } = window.SPL3.calculations;
  const { addPowerToFirstAvailable, clearPart, movePowerToSlot, removeSlotPower, toggleSlotDisabled } = window.SPL3.operations;
  const { clearSlotValidity, markSlotValidity, render } = window.SPL3.renderer;
  const STORAGE_KEY = "spl3gear-simulator-state-v1";
  const REFRESH_BACKUP_KEY = "spl3gear-simulator-refresh-backup-v1";
  const REFRESH_PENDING_KEY = "spl3gear-simulator-refresh-pending-v1";
  const DRAG_START_DELAY_MS = 110;
  const SLOT_LONG_PRESS_MS = 260;

  const root = document.querySelector("#gearSimulator");
  const defaultWeapon = WEAPON_DATAS["わかばシューター"] ? "わかばシューター" : Object.keys(WEAPON_DATAS)[0];
  const state = createState(defaultWeapon);
  restoreState(state);

  const actions = {
    setActiveTab(tab) { state.activeTab = tab === "map" ? "map" : "gear"; redraw(); },
    selectWeapon(name) { state.weaponName = name; state.pendingWeaponName = null; redraw(); },
    selectWeaponCategory(category) { state.weaponCategory = category || "all"; redraw(); },
    setPendingWeaponChoice(name) { state.pendingWeaponName = WEAPON_DATAS[name] ? name : null; redraw(); },
    toggleFavoriteWeapon(name) { toggleFavoriteWeapon(state, name || state.weaponName); state.pendingWeaponName = null; redraw(); },
    setLdeIntensity(value) { state.ldeIntensity = Number(value); redraw(); },
    setDrinkActive(value) { state.drinkActive = Boolean(value); redraw(); },
    setIkaFlowActive(value) { state.ikaFlowActive = Boolean(value); redraw(); },
    setComebackActive(value) { state.comebackActive = Boolean(value); redraw(); },
    toggleAnalyzerControls() { state.analyzerControlsOpen = !state.analyzerControlsOpen; redraw(); },
    toggleWeaponDetails() { state.weaponDetailsOpen = !state.weaponDetailsOpen; redraw(); },
    toggleRangeComparison() { state.rangeComparisonOpen = !state.rangeComparisonOpen; redraw(); },
    toggleEfficiencyTest() { state.efficiencyTestOpen = !state.efficiencyTestOpen; redraw(); },
    toggleOptions() { state.optionsOpen = !state.optionsOpen; redraw(); },
    setGroupVisible(group, value) { setGroupVisible(state, group, value); redraw(); },
    setMainShotCount(value) { state.mainShotCount = Math.max(1, Math.min(10, Number(value) || 5)); redraw(); },
    selectGearSet(index) { activateGearSet(state, index); redraw(); },
    addPower(powerName) { addPowerToFirstAvailable(state, powerName); redraw(); },
    clearPart(partId) { clearPart(state, partId); redraw(); },
    removeSlot(slot) { removeSlotPower(state, slot); redraw(); },
    toggleSlotDisabled(slot) { toggleSlotDisabled(state, slot); redraw(); },
    togglePool() { state.poolVisible = !state.poolVisible; redraw(); },
    selectMapRule(rule) { state.mapRule = rule || "tower"; redraw(); },
    setMapImageType(type) { state.mapImageType = type === "photo" ? "photo" : "white"; redraw(); },
    selectMapStage(slotIndex, stage) { updateMapSlot(state, slotIndex, { stage: stage || "", variant: "", waterVisible: true }); redraw(); },
    selectMapVariant(slotIndex, variant) { updateMapSlot(state, slotIndex, { variant: variant || "" }); redraw(); },
    setMapWaterVisible(slotIndex, value) { updateMapSlot(state, slotIndex, { waterVisible: Boolean(value) }); redraw(); },
    selectMapMarker(slotIndex, marker) { updateMapSlot(state, slotIndex, { marker: normalizeMarker(marker) }); redraw(); },
    placeMapMarker(key, marker, x, y) { placeMapMarker(state, key, marker, x, y); redraw(); },
    moveMapMarker(key, id, x, y) { moveMapMarker(state, key, id, x, y); redraw(); },
    removeMapMarker(key, id) { removeMapMarker(state, key, id); redraw(); },
    toggleFavoriteMap(rule, stage) { toggleFavoriteMap(state, rule, stage); redraw(); },
    refreshApp() { refreshApp(); },

    pointerStart(event, source, powerName) {
      if (!powerName || event.pointerType === "mouse" && event.button !== 0) return;
      clearPointerTimers();
      state.pointerDrag = {
        source,
        powerName,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        active: false,
        hover: null,
        handled: false,
      };
      if (source.kind === "pool") {
        state.pointerDrag.dragTimer = setTimeout(() => {
          const drag = state.pointerDrag;
          if (!drag || drag.pointerId !== event.pointerId || drag.handled) return;
          startPointerDrag(drag, event.clientX, event.clientY);
        }, DRAG_START_DELAY_MS);
      }
      if (source.kind === "slot") {
        state.pointerDrag.longPressTimer = setTimeout(() => {
          const drag = state.pointerDrag;
          if (!drag || drag.pointerId !== event.pointerId || drag.active || drag.handled) return;
          drag.handled = true;
          state.lastPointerDropAt = Date.now();
          actions.pointerCancel(event);
          toggleSlotDisabled(state, source.slot);
          redraw();
        }, SLOT_LONG_PRESS_MS);
      }
    },

    pointerMove(event) {
      const drag = state.pointerDrag;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      if (!drag.active && moved < 4) return;
      if (!drag.active) startPointerDrag(drag, event.clientX, event.clientY);
      event.preventDefault();
      updatePointerGhost(drag.powerName, event.clientX, event.clientY);
      const slotEl = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".gear-slot");
      if (drag.hover && drag.hover !== slotEl) drag.hover.classList.remove("drop-hover");
      drag.hover = slotEl || null;
      if (slotEl) {
        const slot = readSlotFromElement(slotEl);
        slotEl.classList.toggle("drop-hover", canPlacePower(drag.powerName, slot));
      }
    },

    pointerEnd(event) {
      const drag = state.pointerDrag;
      if (!drag || drag.pointerId !== event.pointerId) return;
      clearPointerTimers();
      const wasActive = Boolean(drag.active);
      const slotEl = wasActive ? document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".gear-slot") : null;
      state.pointerDrag = null;
      state.drag = null;
      root.classList.remove("is-touch-dragging");
      clearPointerGhost();
      clearSlotValidity(root);
      if (!wasActive) return;
      state.lastPointerDropAt = Date.now();
      if (!slotEl) {
        redraw();
        return;
      }
      const slot = readSlotFromElement(slotEl);
      movePowerToSlot(state, drag.source, slot, drag.powerName);
      redraw();
    },

    pointerCancel(event) {
      const drag = state.pointerDrag;
      if (!drag || drag.pointerId !== event.pointerId) return;
      clearPointerTimers();
      state.pointerDrag = null;
      state.drag = null;
      root.classList.remove("is-touch-dragging");
      clearPointerGhost();
      clearSlotValidity(root);
    },

    wasPointerDropRecently() {
      return Date.now() - Number(state.lastPointerDropAt || 0) < 400;
    },

    dragStartFromPool(event, powerName) {
      state.drag = { kind: "pool", powerName };
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("text/plain", powerName);
      markSlotValidity(root, powerName);
    },

    dragStartFromSlot(event, slot, powerName) {
      state.drag = { kind: "slot", slot, powerName };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", powerName);
      markSlotValidity(root, powerName);
    },

    dragOverSlot(event, slot) {
      const powerName = (state.drag && state.drag.powerName) || event.dataTransfer.getData("text/plain");
      if (!powerName || !canPlacePower(powerName, slot)) return;
      event.preventDefault();
      event.currentTarget.classList.add("drop-hover");
      event.dataTransfer.dropEffect = state.drag && state.drag.kind === "slot" ? "move" : "copy";
    },

    dragLeaveSlot(event) { event.currentTarget.classList.remove("drop-hover"); },

    dropOnSlot(event, slot) {
      const powerName = (state.drag && state.drag.powerName) || event.dataTransfer.getData("text/plain");
      event.preventDefault();
      clearSlotValidity(root);
      if (!powerName) return;
      movePowerToSlot(state, state.drag, slot, powerName);
      state.drag = null;
      redraw();
    },

    dragEnd() { state.drag = null; clearSlotValidity(root); },
  };

  function redraw() {
    saveState(state);
    render(root, state, actions);
  }

  function saveState(current) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(statePayload(current)));
    } catch (error) {
      console.warn("Failed to save simulator state", error);
    }
  }

  function restoreState(current) {
    try {
      const saved = readSavedState();
      if (!saved || typeof saved !== "object") return;
      if (saved.activeTab === "gear" || saved.activeTab === "map") current.activeTab = saved.activeTab;
      if (WEAPON_DATAS[saved.weaponName]) current.weaponName = saved.weaponName;
      if (typeof saved.weaponCategory === "string") current.weaponCategory = saved.weaponCategory;
      if (Array.isArray(saved.favoriteWeapons)) {
        current.favoriteWeapons = saved.favoriteWeapons.filter((name) => WEAPON_DATAS[name]);
      }
      current.gearSets = normalizeGearSets(saved);
      activateGearSet(current, Number.isFinite(Number(saved.gearSetIndex)) ? Number(saved.gearSetIndex) : 0, false);
      if (typeof saved.poolVisible === "boolean") current.poolVisible = saved.poolVisible;
      if (Number.isFinite(Number(saved.ldeIntensity))) current.ldeIntensity = Number(saved.ldeIntensity);
      if (typeof saved.drinkActive === "boolean") current.drinkActive = saved.drinkActive;
      if (typeof saved.ikaFlowActive === "boolean") current.ikaFlowActive = saved.ikaFlowActive;
      if (typeof saved.comebackActive === "boolean") current.comebackActive = saved.comebackActive;
      if (typeof saved.analyzerControlsOpen === "boolean") current.analyzerControlsOpen = saved.analyzerControlsOpen;
      if (typeof saved.weaponDetailsOpen === "boolean") current.weaponDetailsOpen = saved.weaponDetailsOpen;
      if (typeof saved.rangeComparisonOpen === "boolean") current.rangeComparisonOpen = saved.rangeComparisonOpen;
      if (typeof saved.efficiencyTestOpen === "boolean") current.efficiencyTestOpen = saved.efficiencyTestOpen;
      if (typeof saved.optionsOpen === "boolean") current.optionsOpen = saved.optionsOpen;
      if (saved.visibleGroups && typeof saved.visibleGroups === "object") {
        current.visibleGroups = normalizeVisibleGroups(saved.visibleGroups);
      }
      if (Number.isFinite(Number(saved.mainShotCount))) current.mainShotCount = Math.max(1, Math.min(10, Number(saved.mainShotCount)));
      if (typeof saved.mapRule === "string") current.mapRule = saved.mapRule;
      current.mapSlots = normalizeMapSlots(saved);
      if (Array.isArray(saved.favoriteMaps)) current.favoriteMaps = saved.favoriteMaps.filter((item) => typeof item === "string");
      current.mapMarkers = normalizeMapMarkers(saved.mapMarkers);
    } catch (error) {
      console.warn("Failed to restore simulator state", error);
    }
  }

  function statePayload(current) {
    return {
      savedAt: Date.now(),
      activeTab: current.activeTab,
      weaponName: current.weaponName,
      weaponCategory: current.weaponCategory,
      favoriteWeapons: current.favoriteWeapons,
      gearSetIndex: current.gearSetIndex,
      gearSets: current.gearSets,
      slots: current.slots,
      disabledSlots: current.disabledSlots,
      poolVisible: current.poolVisible,
      ldeIntensity: current.ldeIntensity,
      drinkActive: current.drinkActive,
      ikaFlowActive: current.ikaFlowActive,
      comebackActive: current.comebackActive,
      analyzerControlsOpen: current.analyzerControlsOpen,
      weaponDetailsOpen: current.weaponDetailsOpen,
      rangeComparisonOpen: current.rangeComparisonOpen,
      efficiencyTestOpen: current.efficiencyTestOpen,
      optionsOpen: current.optionsOpen,
      visibleGroups: normalizeVisibleGroups(current.visibleGroups),
      mainShotCount: current.mainShotCount,
      mapRule: current.mapRule,
      mapImageType: current.mapImageType === "photo" ? "photo" : "white",
      mapSlots: normalizeMapSlots(current),
      favoriteMaps: current.favoriteMaps,
      mapMarkers: normalizeMapMarkers(current.mapMarkers),
    };
  }

  function normalizeMapSlots(source) {
    const fallback = { stage: "リュウグウターミナル", variant: "", waterVisible: true, marker: "pin" };
    const sourceSlots = Array.isArray(source.mapSlots) ? source.mapSlots : [
      { stage: source.mapStage, variant: "" },
    ];
    const slots = sourceSlots.slice(0, 2).map((slot) => ({
      stage: typeof slot?.stage === "string" && slot.stage ? slot.stage : fallback.stage,
      variant: typeof slot?.variant === "string" ? slot.variant : "",
      waterVisible: typeof slot?.waterVisible === "boolean" ? slot.waterVisible : true,
      marker: normalizeMarker(slot?.marker),
    }));
    while (slots.length < 2) slots.push({ ...fallback });
    return slots;
  }

  function updateMapSlot(current, slotIndex, changes) {
    current.mapSlots = normalizeMapSlots(current);
    const index = Math.max(0, Math.min(1, Math.floor(Number(slotIndex) || 0)));
    current.mapSlots[index] = { ...current.mapSlots[index], ...changes };
  }

  function normalizeMarker(marker) {
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

  function normalizeMapMarkers(markers) {
    const normalized = {};
    if (!markers || typeof markers !== "object") return normalized;
    for (const [key, list] of Object.entries(markers)) {
      if (typeof key !== "string" || !Array.isArray(list)) continue;
      normalized[key] = list
        .filter((item) => item && typeof item === "object")
        .slice(0, 32)
        .map((item) => ({
          id: typeof item.id === "string" ? item.id : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          marker: normalizeMarker(item.marker),
          x: Math.max(0, Math.min(100, Number(item.x) || 0)),
          y: Math.max(0, Math.min(100, Number(item.y) || 0)),
        }));
    }
    return normalized;
  }

  function placeMapMarker(current, key, marker, x, y) {
    if (typeof key !== "string" || !key) return;
    current.mapMarkers = normalizeMapMarkers(current.mapMarkers);
    const list = current.mapMarkers[key] || [];
    if (list.length >= 32) return;
    current.mapMarkers[key] = [
      ...list,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        marker: normalizeMarker(marker),
        x: Math.max(0, Math.min(100, Number(x) || 0)),
        y: Math.max(0, Math.min(100, Number(y) || 0)),
      },
    ];
  }

  function removeMapMarker(current, key, id) {
    if (typeof key !== "string" || typeof id !== "string") return;
    current.mapMarkers = normalizeMapMarkers(current.mapMarkers);
    current.mapMarkers[key] = (current.mapMarkers[key] || []).filter((item) => item.id !== id);
  }

  function moveMapMarker(current, key, id, x, y) {
    if (typeof key !== "string" || typeof id !== "string") return;
    current.mapMarkers = normalizeMapMarkers(current.mapMarkers);
    current.mapMarkers[key] = (current.mapMarkers[key] || []).map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        x: Math.max(0, Math.min(100, Number(x) || 0)),
        y: Math.max(0, Math.min(100, Number(y) || 0)),
      };
    });
  }

  function normalizeVisibleGroups(groups) {
    return {
      weaponDetails: groups.weaponDetails !== false,
      rangeComparison: groups.rangeComparison !== false,
      efficiency: groups.efficiency !== false,
      gearSet: groups.gearSet !== false,
      analyzer: groups.analyzer !== false,
    };
  }

  function setGroupVisible(current, group, value) {
    current.visibleGroups = normalizeVisibleGroups(current.visibleGroups || {});
    if (Object.prototype.hasOwnProperty.call(current.visibleGroups, group)) {
      current.visibleGroups[group] = Boolean(value);
    }
  }

  function readSavedState() {
    const pending = localStorage.getItem(REFRESH_PENDING_KEY) === "1";
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    const backup = JSON.parse(localStorage.getItem(REFRESH_BACKUP_KEY) || "null");
    if (pending && backup && typeof backup === "object") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));
      localStorage.removeItem(REFRESH_PENDING_KEY);
      return backup;
    }
    return saved || backup;
  }

  function isValidSlots(slots) {
    const parts = ["head", "body", "leg"];
    return Boolean(slots)
      && parts.every((part) => slots[part]
        && Object.prototype.hasOwnProperty.call(slots[part], "main")
        && Array.isArray(slots[part].subs)
        && slots[part].subs.length === 3);
  }

  function isValidDisabledSlots(disabledSlots) {
    const parts = ["head", "body", "leg"];
    return Boolean(disabledSlots)
      && parts.every((part) => disabledSlots[part]
        && typeof disabledSlots[part].main === "boolean"
        && Array.isArray(disabledSlots[part].subs)
        && disabledSlots[part].subs.length === 3
        && disabledSlots[part].subs.every((value) => typeof value === "boolean"));
  }

  function normalizeGearSets(saved) {
    const sets = [];
    if (Array.isArray(saved.gearSets)) {
      for (const gearSet of saved.gearSets.slice(0, 5)) {
        sets.push({
          slots: isValidSlots(gearSet && gearSet.slots) ? gearSet.slots : createInitialGearSet().slots,
          disabledSlots: isValidDisabledSlots(gearSet && gearSet.disabledSlots) ? gearSet.disabledSlots : createInitialGearSet().disabledSlots,
        });
      }
    }
    if (!sets.length && isValidSlots(saved.slots)) {
      sets.push({
        slots: saved.slots,
        disabledSlots: isValidDisabledSlots(saved.disabledSlots) ? saved.disabledSlots : createInitialGearSet().disabledSlots,
      });
    }
    while (sets.length < 5) sets.push(createInitialGearSet());
    return sets.slice(0, 5);
  }

  function activateGearSet(current, index, syncCurrent = true) {
    if (syncCurrent && current.gearSets[current.gearSetIndex]) {
      current.gearSets[current.gearSetIndex].slots = current.slots;
      current.gearSets[current.gearSetIndex].disabledSlots = current.disabledSlots;
    }
    const nextIndex = Math.max(0, Math.min(4, Math.floor(Number(index) || 0)));
    current.gearSetIndex = nextIndex;
    if (!current.gearSets[nextIndex]) current.gearSets[nextIndex] = createInitialGearSet();
    current.slots = current.gearSets[nextIndex].slots;
    current.disabledSlots = current.gearSets[nextIndex].disabledSlots;
    current.drag = null;
  }

  function toggleFavoriteWeapon(current, weaponName) {
    if (!WEAPON_DATAS[weaponName]) return;
    const favorites = new Set(current.favoriteWeapons || []);
    if (favorites.has(weaponName)) favorites.delete(weaponName);
    else favorites.add(weaponName);
    current.favoriteWeapons = [...favorites].filter((name) => WEAPON_DATAS[name]);
  }

  function toggleFavoriteMap(current, rule, stage) {
    if (!rule || !stage) return;
    const key = `${rule}|${stage}`;
    const favorites = new Set(current.favoriteMaps || []);
    if (favorites.has(key)) favorites.delete(key);
    else favorites.add(key);
    current.favoriteMaps = [...favorites];
  }

  async function refreshApp() {
    try {
      const payload = statePayload(state);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem(REFRESH_BACKUP_KEY, JSON.stringify(payload));
      localStorage.setItem(REFRESH_PENDING_KEY, "1");
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if (navigator.serviceWorker) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.update().catch(() => registration.unregister())));
      }
    } catch (error) {
      console.warn("Failed to clear app cache", error);
    } finally {
      const url = new URL(location.href);
      url.searchParams.set("refresh", String(Date.now()));
      location.replace(url.toString());
    }
  }

  function startPointerDrag(drag, x, y) {
    clearPointerTimers();
    drag.active = true;
    state.drag = { ...drag.source, powerName: drag.powerName };
    root.classList.add("is-touch-dragging");
    markSlotValidity(root, drag.powerName);
    updatePointerGhost(drag.powerName, x, y);
  }

  function clearPointerTimers() {
    if (!state.pointerDrag) return;
    clearTimeout(state.pointerDrag.dragTimer);
    clearTimeout(state.pointerDrag.longPressTimer);
    state.pointerDrag.dragTimer = null;
    state.pointerDrag.longPressTimer = null;
  }

  function readSlotFromElement(el) {
    return { part: el.dataset.part, type: el.dataset.type, index: Number(el.dataset.index) };
  }

  function updatePointerGhost(powerName, x, y) {
    let ghost = root.querySelector(".touch-drag-ghost");
    if (!ghost) {
      const meta = window.SPL3.calculations.getPowerMeta(powerName);
      ghost = document.createElement("div");
      ghost.className = "touch-drag-ghost";
      const img = document.createElement("img");
      img.alt = powerName;
      img.draggable = false;
      img.src = window.SPL3.utils.assetPath((meta && meta.i) || "gp27.png");
      ghost.append(img);
      root.append(ghost);
    }
    ghost.style.transform = `translate(${x + 10}px, ${y + 10}px)`;
  }

  function clearPointerGhost() {
    root.querySelector(".touch-drag-ghost")?.remove();
  }

  redraw();
})();

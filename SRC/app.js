(function () {
  const { WEAPON_DATAS } = window.SPL3_DATA;
  const { createInitialGearSet, createState } = window.SPL3.state;
  const { canPlacePower } = window.SPL3.calculations;
  const { addPowerToFirstAvailable, clearPart, movePowerToSlot, removeSlotPower, toggleSlotDisabled } = window.SPL3.operations;
  const { clearSlotValidity, markSlotValidity, render } = window.SPL3.renderer;
  const STORAGE_KEY = "spl3gear-simulator-state-v1";

  const root = document.querySelector("#gearSimulator");
  const defaultWeapon = WEAPON_DATAS["わかばシューター"] ? "わかばシューター" : Object.keys(WEAPON_DATAS)[0];
  const state = createState(defaultWeapon);
  restoreState(state);

  const actions = {
    selectWeapon(name) { state.weaponName = name; state.pendingWeaponName = null; redraw(); },
    setPendingWeaponChoice(name) { state.pendingWeaponName = WEAPON_DATAS[name] ? name : null; redraw(); },
    toggleFavoriteWeapon(name) { toggleFavoriteWeapon(state, name || state.weaponName); state.pendingWeaponName = null; redraw(); },
    setLdeIntensity(value) { state.ldeIntensity = Number(value); redraw(); },
    setDrinkActive(value) { state.drinkActive = Boolean(value); redraw(); },
    setComebackActive(value) { state.comebackActive = Boolean(value); redraw(); },
    toggleWeaponDetails() { state.weaponDetailsOpen = !state.weaponDetailsOpen; redraw(); },
    toggleEfficiencyTest() { state.efficiencyTestOpen = !state.efficiencyTestOpen; redraw(); },
    setMainShotCount(value) { state.mainShotCount = Math.max(1, Math.min(10, Number(value) || 5)); redraw(); },
    selectGearSet(index) { activateGearSet(state, index); redraw(); },
    addPower(powerName) { addPowerToFirstAvailable(state, powerName); redraw(); },
    clearPart(partId) { clearPart(state, partId); redraw(); },
    removeSlot(slot) { removeSlotPower(state, slot); redraw(); },
    toggleSlotDisabled(slot) { toggleSlotDisabled(state, slot); redraw(); },
    togglePool() { state.poolVisible = !state.poolVisible; redraw(); },

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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        weaponName: current.weaponName,
        favoriteWeapons: current.favoriteWeapons,
        gearSetIndex: current.gearSetIndex,
        gearSets: current.gearSets,
        slots: current.slots,
        disabledSlots: current.disabledSlots,
        poolVisible: current.poolVisible,
        ldeIntensity: current.ldeIntensity,
        drinkActive: current.drinkActive,
        comebackActive: current.comebackActive,
        weaponDetailsOpen: current.weaponDetailsOpen,
        efficiencyTestOpen: current.efficiencyTestOpen,
        mainShotCount: current.mainShotCount,
      }));
    } catch (error) {
      console.warn("Failed to save simulator state", error);
    }
  }

  function restoreState(current) {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return;
      if (WEAPON_DATAS[saved.weaponName]) current.weaponName = saved.weaponName;
      if (Array.isArray(saved.favoriteWeapons)) {
        current.favoriteWeapons = saved.favoriteWeapons.filter((name) => WEAPON_DATAS[name]);
      }
      current.gearSets = normalizeGearSets(saved);
      activateGearSet(current, Number.isFinite(Number(saved.gearSetIndex)) ? Number(saved.gearSetIndex) : 0, false);
      if (typeof saved.poolVisible === "boolean") current.poolVisible = saved.poolVisible;
      if (Number.isFinite(Number(saved.ldeIntensity))) current.ldeIntensity = Number(saved.ldeIntensity);
      if (typeof saved.drinkActive === "boolean") current.drinkActive = saved.drinkActive;
      if (typeof saved.comebackActive === "boolean") current.comebackActive = saved.comebackActive;
      if (typeof saved.weaponDetailsOpen === "boolean") current.weaponDetailsOpen = saved.weaponDetailsOpen;
      if (typeof saved.efficiencyTestOpen === "boolean") current.efficiencyTestOpen = saved.efficiencyTestOpen;
      if (Number.isFinite(Number(saved.mainShotCount))) current.mainShotCount = Math.max(1, Math.min(10, Number(saved.mainShotCount)));
    } catch (error) {
      console.warn("Failed to restore simulator state", error);
    }
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

  redraw();
})();

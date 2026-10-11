(function () {
  const { WEAPON_DATAS } = window.SPL3_DATA;
  const { createInitialGearSet, createState } = window.SPL3.state;
  const { canPlacePower } = window.SPL3.calculations;
  const { addPowerToFirstAvailable, clearPart, movePowerToSlot, removeSlotPower, toggleSlotDisabled } = window.SPL3.operations;
  const { clearSlotValidity, markSlotValidity, render } = window.SPL3.renderer;
  const STORAGE_KEY = "spl3gear-simulator-state-v1";
  const DRAG_START_DELAY_MS = 110;
  const SLOT_LONG_PRESS_MS = 260;

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

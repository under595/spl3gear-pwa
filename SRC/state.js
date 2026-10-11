(function () {
  const PARTS = [
    { id: "head", label: "アタマ" },
    { id: "body", label: "フク" },
    { id: "leg", label: "クツ" },
  ];

  const SLOT_ORDER = PARTS.flatMap((part) => [
    { part: part.id, type: "main", index: 0 },
    { part: part.id, type: "sub", index: 0 },
    { part: part.id, type: "sub", index: 1 },
    { part: part.id, type: "sub", index: 2 },
  ]);

  function createInitialSlots() {
    const slots = {};
    for (const part of PARTS) slots[part.id] = { main: null, subs: [null, null, null] };
    return slots;
  }

  function createInitialDisabledSlots() {
    const disabled = {};
    for (const part of PARTS) disabled[part.id] = { main: false, subs: [false, false, false] };
    return disabled;
  }

  function createInitialGearSet() {
    return { slots: createInitialSlots(), disabledSlots: createInitialDisabledSlots() };
  }

  function createInitialGearSets(count = 5) {
    return Array.from({ length: count }, createInitialGearSet);
  }

  function createState(defaultWeaponName) {
    const gearSets = createInitialGearSets();
    return {
      weaponName: defaultWeaponName,
      pendingWeaponName: null,
      favoriteWeapons: [],
      gearSetIndex: 0,
      gearSets,
      slots: gearSets[0].slots,
      disabledSlots: gearSets[0].disabledSlots,
      poolVisible: true,
      drag: null,
      ldeIntensity: 35,
      drinkActive: false,
      comebackActive: false,
      weaponDetailsOpen: true,
      efficiencyTestOpen: true,
      mainShotCount: 5,
    };
  }

  function getSlotValue(slots, slot) {
    if (slot.type === "main") return slots[slot.part].main;
    return slots[slot.part].subs[slot.index];
  }

  function isSlotDisabled(disabledSlots, slot) {
    if (!disabledSlots || !disabledSlots[slot.part]) return false;
    if (slot.type === "main") return Boolean(disabledSlots[slot.part].main);
    return Boolean(disabledSlots[slot.part].subs && disabledSlots[slot.part].subs[slot.index]);
  }

  function setSlotValue(slots, slot, powerName) {
    if (slot.type === "main") slots[slot.part].main = powerName;
    else slots[slot.part].subs[slot.index] = powerName;
  }

  function setSlotDisabled(disabledSlots, slot, value) {
    if (!disabledSlots[slot.part]) disabledSlots[slot.part] = { main: false, subs: [false, false, false] };
    if (slot.type === "main") disabledSlots[slot.part].main = Boolean(value);
    else disabledSlots[slot.part].subs[slot.index] = Boolean(value);
  }

  function clearPart(slots, partId) {
    slots[partId] = { main: null, subs: [null, null, null] };
  }

  window.SPL3 = window.SPL3 || {};
  window.SPL3.state = { PARTS, SLOT_ORDER, createInitialSlots, createInitialDisabledSlots, createInitialGearSet, createInitialGearSets, createState, getSlotValue, isSlotDisabled, setSlotValue, setSlotDisabled, clearPart };
})();

(function () {
  const { SLOT_ORDER, getSlotValue, isSlotDisabled, setSlotDisabled, setSlotValue, clearPart: clearPartState } = window.SPL3.state;
  const { canPlacePower, getAllowedPart } = window.SPL3.calculations;

  function addPowerToFirstAvailable(state, powerName) {
    const forcedPart = getAllowedPart(powerName);
    if (forcedPart) {
      const slot = { part: forcedPart, type: "main", index: 0 };
      setSlotValue(state.slots, slot, powerName);
      setSlotDisabled(state.disabledSlots, slot, false);
      return true;
    }
    const slot = SLOT_ORDER.find((candidate) => !getSlotValue(state.slots, candidate) && canPlacePower(powerName, candidate));
    if (!slot) return false;
    setSlotValue(state.slots, slot, powerName);
    setSlotDisabled(state.disabledSlots, slot, false);
    return true;
  }

  function movePowerToSlot(state, source, target, powerName) {
    if (!canPlacePower(powerName, target)) return false;
    const sourceDisabled = source && source.kind === "slot" ? isSlotDisabled(state.disabledSlots, source.slot) : false;
    if (source && source.kind === "slot") {
      setSlotValue(state.slots, source.slot, null);
      setSlotDisabled(state.disabledSlots, source.slot, false);
    }
    setSlotValue(state.slots, target, powerName);
    setSlotDisabled(state.disabledSlots, target, sourceDisabled);
    return true;
  }

  function removeSlotPower(state, slot) {
    setSlotValue(state.slots, slot, null);
    setSlotDisabled(state.disabledSlots, slot, false);
  }
  function toggleSlotDisabled(state, slot) {
    if (!getSlotValue(state.slots, slot)) return;
    setSlotDisabled(state.disabledSlots, slot, !isSlotDisabled(state.disabledSlots, slot));
  }
  function clearPart(state, partId) {
    clearPartState(state.slots, partId);
    clearPartState(state.disabledSlots, partId);
    state.disabledSlots[partId] = { main: false, subs: [false, false, false] };
  }

  window.SPL3 = window.SPL3 || {};
  window.SPL3.operations = { addPowerToFirstAvailable, movePowerToSlot, removeSlotPower, toggleSlotDisabled, clearPart };
})();

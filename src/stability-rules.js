(function () {
  "use strict";

  function proposalValid(state, proposal) {
    const proposer = (state.rivals || []).find(function (civ) {
      return civ.civilizationId === proposal.civId;
    });
    const target = (state.rivals || []).find(function (civ) {
      return civ.civilizationId === proposal.targetId;
    });
    if (!proposer || proposer.defeated || (target && target.defeated)) return false;
    if (proposal.type !== "jointWar") return true;
    if (!target || proposer.diplomacy && proposer.diplomacy[target.civilizationId] === "war"
      || target.relation === "war") return false;
    return !(state.diplomaticProposals || []).some(function (other) {
      return other !== proposal && other.type === "jointWar" && other.status === "pending"
        && other.civId === proposal.civId && other.targetId === proposal.targetId;
    });
  }

  function cancelInvalidProposals(state) {
    if (!state) return 0;
    let cancelled = 0;
    (state.diplomaticProposals || []).forEach(function (proposal) {
      if (proposal.status !== "pending" || proposalValid(state, proposal)) return;
      proposal.status = "cancelled";
      cancelled++;
    });
    return cancelled;
  }

  window.EpohiStabilityRules = { proposalValid, cancelInvalidProposals };
})();

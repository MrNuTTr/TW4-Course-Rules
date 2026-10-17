import { findLeg, getDestinations, getOriginInputs } from '../routePlanner.js';

function restrict(inputs, fixed = {}, filter = {}) {
  return inputs
    .map((input) => {
      let options = input.options;
      if (fixed[input.id]) options = [fixed[input.id]];
      else if (filter[input.id]) options = options.filter((o) => filter[input.id].includes(o));
      return { ...input, options };
    })
    .filter((input) => input.options.length > 0);
}

function pick(inputs, chosen = {}) {
  return Object.fromEntries(
    inputs.map((input) => [
      input.id,
      input.options.includes(chosen[input.id]) ? chosen[input.id] : input.options[0],
    ]),
  );
}

// Resolves a wiki route (see structure.js) to its leg for the user's current picks.
export function resolveRoute(route, picks = {}) {
  const fromInputs = restrict(
    getOriginInputs(route.from).filter((input) => !input.explicitOnly),
    route.fixedFrom,
    route.filterFrom,
  ).map((input) => ({
    ...input,
    // Only offer origin options that actually have a leg to the destination.
    options: input.options.filter((option) =>
      getDestinations(route.from, { [input.id]: option }).some(({ node }) => node.id === route.to),
    ),
  })).filter((input) => input.options.length > 0);
  const fromChoices = pick(fromInputs, picks.from);
  const destination = getDestinations(route.from, fromChoices).find(
    ({ node }) => node.id === route.to,
  );
  const toInputs = restrict(destination?.inputs ?? [], route.fixedTo, route.filterTo);
  const toChoices = pick(toInputs, picks.to);
  const leg = destination ? findLeg(route.from, fromChoices, route.to, toChoices) : undefined;
  return { fromInputs, fromChoices, toInputs, toChoices, leg };
}

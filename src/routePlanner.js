const nodeFiles = import.meta.glob('./data/nodes/*.json', {
  eager: true,
  import: 'default',
});
const legFiles = import.meta.glob('./data/legs/*.json', {
  eager: true,
  import: 'default',
});

const partFiles = import.meta.glob('./data/parts/*.json', {
  eager: true,
  import: 'default',
});

function matches(condition = {}, choices = {}) {
  return Object.entries(condition).every(([key, value]) => choices[key] === value);
}

// Throws on dangling references so bad data files fail loudly.
export function buildGraph(nodeList, legList, partList = []) {
  const parts = new Map();
  for (const part of partList) {
    if (parts.has(part.id)) throw new Error(`Duplicate part id: ${part.id}`);
    parts.set(part.id, part);
  }
  const nodes = new Map();
  for (const node of nodeList) {
    if (nodes.has(node.id)) throw new Error(`Duplicate node id: ${node.id}`);
    nodes.set(node.id, node);
  }
  const legIds = new Set();
  for (const leg of legList) {
    if (legIds.has(leg.id)) throw new Error(`Duplicate leg id: ${leg.id}`);
    legIds.add(leg.id);
    for (const end of [leg.from, leg.to]) {
      if (!nodes.has(end)) throw new Error(`Leg ${leg.id} references unknown node: ${end}`);
    }
  }
  return { nodes, legs: legList, parts };
}

export const GRAPH = buildGraph(
  Object.values(nodeFiles),
  Object.values(legFiles),
  Object.values(partFiles),
);

export function getNode(nodeId, graph = GRAPH) {
  const node = graph.nodes.get(nodeId);
  if (!node) throw new Error(`Unknown node: ${nodeId}`);
  return node;
}

export function findLeg(from, fromChoices, to, toChoices, graph = GRAPH) {
  const candidates = graph.legs.filter(
    (leg) =>
      leg.from === from &&
      leg.to === to &&
      matches(leg.when?.from, fromChoices) &&
      matches(leg.when?.to, toChoices),
  );
  const specificity = (leg) =>
    Object.keys(leg.when?.from ?? {}).length + Object.keys(leg.when?.to ?? {}).length;
  const top = Math.max(...candidates.map(specificity), 0);
  const best = candidates.filter((leg) => specificity(leg) === top);
  if (best.length > 1) {
    throw new Error(`Ambiguous legs for ${from} -> ${to}: ${best.map((leg) => leg.id).join(', ')}`);
  }
  const leg = best[0];
  return leg && resolveLeg(leg, fromChoices, toChoices, graph);
}

// Replaces {from.input}, {to.input} and {to.input.detail} tokens in a leg, and
// {from.node} / {to.node} with the place name. Detail values live in the node's
// input definition under `details[option]`. Cards of the form {"use": "part-id"}
// are replaced by that part's cards (the id may itself contain tokens).
export function resolveLeg(leg, fromChoices = {}, toChoices = {}, graph = GRAPH) {
  const sides = {
    from: { node: getNode(leg.from, graph), choices: fromChoices },
    to: { node: getNode(leg.to, graph), choices: toChoices },
  };

  function lookup(side, inputId, detail) {
    const { node, choices } = sides[side];
    if (inputId === 'node' && !detail) return node.name;
    const value = choices[inputId];
    if (value === undefined) {
      throw new Error(`Leg ${leg.id} needs ${side}.${inputId}, which was not chosen`);
    }
    if (!detail) return value;
    const text = node.inputs?.find((input) => input.id === inputId)?.details?.[value]?.[detail];
    if (text === undefined) {
      throw new Error(`Leg ${leg.id}: no ${detail} for ${side}.${inputId}=${value}`);
    }
    return text;
  }

  function substitute(value) {
    if (typeof value === 'string') {
      return value.replace(/\{(from|to)\.(\w+)(?:\.(\w+))?\}/g, (_, side, id, detail) =>
        lookup(side, id, detail),
      );
    }
    if (Array.isArray(value)) return value.map(substitute);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, substitute(v)]));
    }
    return value;
  }

  // Parts may use other parts; the depth cap catches accidental cycles.
  function expandCards(cardList, depth = 0) {
    if (depth > 4) throw new Error(`Leg ${leg.id}: parts are nested too deeply`);
    return cardList.flatMap((card) => {
      if (!card.use) return [card];
      const partId = substitute(card.use);
      const part = graph.parts?.get(partId);
      if (!part) throw new Error(`Leg ${leg.id} uses unknown part: ${partId}`);
      return expandCards(part.cards, depth + 1);
    });
  }

  return substitute({ ...leg, cards: expandCards(leg.cards) });
}

// Every concrete (resolved) version of every leg, for validation.
export function expandLegs(graph = GRAPH) {
  const optionSets = (node, fixed = {}) => {
    const inputs = node.inputs ?? [];
    return inputs.reduce(
      (sets, input) =>
        sets.flatMap((set) =>
          (fixed[input.id] ? [fixed[input.id]] : input.options).map((option) => ({
            ...set,
            [input.id]: option,
          })),
        ),
      [{}],
    );
  };
  return graph.legs.flatMap((leg) => {
    const fromNode = getNode(leg.from, graph);
    const toNode = getNode(leg.to, graph);
    return optionSets(fromNode, leg.when?.from).flatMap((fromChoices) =>
      optionSets(toNode, leg.when?.to).map((toChoices) => ({
        fromChoices,
        toChoices,
        leg: resolveLeg(leg, fromChoices, toChoices, graph),
      })),
    );
  });
}

// Destinations reachable from a node given what is already chosen there.
export function getDestinations(from, fromChoices, graph = GRAPH) {
  const ids = [
    ...new Set(
      graph.legs
        .filter((leg) => leg.from === from && matches(leg.when?.from, fromChoices))
        .map((leg) => leg.to),
    ),
  ];
  return ids.map((id) => {
    const node = getNode(id, graph);
    return {
      node,
      // Only offer input values that have at least one leg loaded.
      inputs: (node.endsRoute ? [] : node.inputs ?? []).map((input) => ({
        ...input,
        options: input.options.filter((option) =>
          graph.legs.some(
            (leg) =>
              leg.from === from &&
              leg.to === id &&
              matches(leg.when?.from, fromChoices) &&
              (leg.when?.to?.[input.id] === undefined || leg.when.to[input.id] === option),
          ),
        ),
      })),
    };
  });
}

// Inputs for a starting node, limited to values that have a loaded leg.
export function getOriginInputs(nodeId, graph = GRAPH) {
  const node = getNode(nodeId, graph);
  const outgoing = graph.legs.filter((leg) => leg.from === nodeId);
  return (node.inputs ?? []).map((input) => ({
    ...input,
    options: input.options.filter((option) =>
      outgoing.some(
        (leg) =>
          leg.when?.from?.[input.id] === undefined || leg.when.from[input.id] === option,
      ),
    ),
  }));
}

export function optionLabel(input, value) {
  return input.optionLabel ? input.optionLabel.replace('{value}', value) : value;
}

export function describeChoices(node, choices = {}) {
  const parts = (node.inputs ?? [])
    .filter((input) => choices[input.id])
    .map((input) =>
      input.optionLabel
        ? optionLabel(input, choices[input.id])
        : `${input.label} ${choices[input.id]}`,
    );
  return parts.length ? `${node.name} · ${parts.join(' · ')}` : node.name;
}

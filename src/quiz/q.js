// Builds a curated multiple-choice question. choices is the answer plus the wrong options.
// `why` is an optional explanation shown after answering.
export const q = (topic, group, scenario, text, answer, wrong, why) => ({
  topic,
  group,
  scenario,
  text,
  answers: [answer],
  choices: [answer, ...wrong],
  ...(why ? { why } : {}),
});


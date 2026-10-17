// Builds a curated multiple-choice question. choices is the answer plus the wrong options.
export const q = (topic, group, scenario, text, answer, wrong) => ({
  curated: true,
  topic,
  group,
  scenario,
  text,
  answers: [answer],
  choices: [answer, ...wrong],
});


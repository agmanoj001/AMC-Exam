// Contest rules, answer-key parsing, scoring and the skip-strategy coach.
// Pure functions only: no DOM, no storage. Safe to import from Node tests.

export const CHOICES = ['A', 'B', 'C', 'D', 'E'];

export const CONTESTS = {
  AMC10: { id: 'AMC10', name: 'AMC 10', questions: 25, minutes: 75, correct: 6, blank: 1.5, wrong: 0 },
  AMC8: { id: 'AMC8', name: 'AMC 8', questions: 25, minutes: 40, correct: 1, blank: 0, wrong: 0 },
};

export function getContest(id) {
  const c = CONTESTS[id];
  if (!c) throw new Error(`Unknown contest: ${id}`);
  return c;
}

/**
 * Turn whatever a parent pastes ("BDACE...", "1. B 2. D", "b,d,a,c,e") into a
 * 25-letter key. Question numbers, spaces and punctuation are ignored.
 */
export function parseAnswerKey(text, expected = 25) {
  const cleaned = String(text ?? '').toUpperCase().replace(/[^A-Z]/g, '');
  const bad = cleaned.replace(/[A-E]/g, '');
  if (bad.length > 0) {
    return { ok: false, error: `Only the letters A–E belong in a key (found "${bad[0]}").` };
  }
  if (cleaned.length !== expected) {
    return { ok: false, error: `A key needs ${expected} letters; this one has ${cleaned.length}.` };
  }
  return { ok: true, key: cleaned };
}

/** answers: array of 'A'..'E' or null (blank). key: 25-letter string. */
export function scoreAttempt(contestId, answers, key) {
  const c = getContest(contestId);
  const statuses = [];
  let correct = 0;
  let blank = 0;
  let wrong = 0;
  for (let i = 0; i < c.questions; i++) {
    const a = answers[i] ?? null;
    if (a === null) {
      blank++;
      statuses.push('blank');
    } else if (a === key[i]) {
      correct++;
      statuses.push('correct');
    } else {
      wrong++;
      statuses.push('wrong');
    }
  }
  const score = correct * c.correct + blank * c.blank + wrong * c.wrong;
  return { correct, blank, wrong, score, max: c.questions * c.correct, statuses };
}

/** Expected points from a random guess after eliminating `eliminated` choices. */
export function guessExpectedValue(contestId, eliminated = 0) {
  const c = getContest(contestId);
  const remaining = CHOICES.length - eliminated;
  if (remaining < 1) throw new Error('Cannot eliminate every choice');
  return c.correct / remaining + (c.wrong * (remaining - 1)) / remaining;
}

/**
 * What-if scores for blank-vs-guess choices. Uses expected values for guesses,
 * since we can't know which letter would have been picked.
 */
export function skipScenarios(contestId, result) {
  const c = getContest(contestId);
  const { correct, blank, wrong, score } = result;
  const ev0 = guessExpectedValue(contestId, 0);
  const scenarios = [
    { id: 'actual', label: 'What you did', score },
    {
      id: 'blankWrong',
      label: `Left the ${wrong} missed question${wrong === 1 ? '' : 's'} blank instead`,
      score: score + wrong * (c.blank - c.wrong),
    },
    {
      id: 'guessBlanks',
      label: `Guessed randomly on the ${blank} blank${blank === 1 ? '' : 's'} (average)`,
      score: score + blank * (ev0 - c.blank),
    },
    {
      id: 'perfectSkip',
      label: 'Kept every correct answer and left all the rest blank',
      score: correct * c.correct + (c.questions - correct) * c.blank,
    },
  ];
  const eliminationTable = [0, 1, 2, 3].map((eliminated) => {
    const ev = guessExpectedValue(contestId, eliminated);
    return { eliminated, ev, vsBlank: ev - c.blank };
  });
  return { scenarios, eliminationTable };
}

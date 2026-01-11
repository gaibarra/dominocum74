export const MIN_PARTIDA_POINTS = 100;

export const sanitizeScore = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.trunc(parsed);
};

export const resolveWinningThreshold = (rawValue) => {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) return MIN_PARTIDA_POINTS;
  return parsed < MIN_PARTIDA_POINTS ? MIN_PARTIDA_POINTS : parsed;
};

export const sanitizeHands = (rawHands = []) => {
  const byKey = new Map();
  rawHands.forEach((hand, index) => {
    if (!hand) return;
    const key = hand.id ?? `hand-${hand.hand_number ?? index}`;
    const safeHandNumber = Number.isFinite(Number(hand.hand_number)) ? Number(hand.hand_number) : index + 1;
    const sanitized = {
      ...hand,
      hand_number: safeHandNumber,
      pair_1_score: sanitizeScore(hand.pair_1_score),
      pair_2_score: sanitizeScore(hand.pair_2_score),
    };
    if (sanitized.pair_1_score > 0 && sanitized.pair_2_score > 0) {
      if (sanitized.pair_1_score >= sanitized.pair_2_score) {
        sanitized.pair_2_score = 0;
      } else {
        sanitized.pair_1_score = 0;
      }
    }
    byKey.set(key, sanitized);
  });
  return Array.from(byKey.values()).sort((a, b) => (a.hand_number || 0) - (b.hand_number || 0));
};

export const computePairTotals = (table = {}) => {
  const hands = sanitizeHands(table?.hands || []);
  const totals = hands.reduce(
    (acc, hand) => {
      acc.pair1 += hand.pair_1_score || 0;
      acc.pair2 += hand.pair_2_score || 0;
      return acc;
    },
    { pair1: 0, pair2: 0 }
  );
  const target = resolveWinningThreshold(table?.points_to_win_partida);
  return {
    hands,
    pair1: totals.pair1,
    pair2: totals.pair2,
    target,
  };
};


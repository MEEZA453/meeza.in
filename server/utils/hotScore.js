export const calculateHotScore = ({
  views,
  uniqueViewers,
  drip,
  votes,
  createdAt,
}) => {
  const hoursSincePost =
    (Date.now() - new Date(createdAt).getTime()) / 36e5;

  const score =
    (
      views * 0.2 +
      uniqueViewers * 0.4 +
      drip * 0.3 +
      votes * 2
    ) /
    Math.pow(hoursSincePost + 2, 1.3);

  return Number(score.toFixed(6));
};

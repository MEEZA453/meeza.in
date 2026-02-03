export const calculateProductHotScore = ({
  views,
  uniqueViewers,
  drip,
  createdAt,
}) => {
  const hoursSinceCreated =
    (Date.now() - new Date(createdAt).getTime()) / 36e5;

  const score =
    (
      views * 0.35 +
      uniqueViewers * 0.45 +
      drip * 0.2
    ) /
    Math.pow(hoursSinceCreated + 3, 1.15); // slower decay than posts

  return Number(score.toFixed(6));
};
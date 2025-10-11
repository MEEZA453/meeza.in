export const calculateAverageScore = (post) => {
  if (!post.votes || post.votes.length === 0) return 0;
  const fields = ["creativity", "aesthetics", "composition", "emotion"];
  const total = fields.reduce((sum, f) =>
    sum + (post.votes.reduce((s, v) => s + (v[f] || 0), 0) / post.votes.length), 0);
  return parseFloat((total / fields.length).toFixed(1));
};
export const calculateAverageScore = (post) => {
  if (!post.votes || post.votes.length === 0) return 0;
  if (!post.voteFields || post.voteFields.length === 0) return 0;

  const total = post.voteFields.reduce((sum, field) => {
    const fieldTotal = post.votes.reduce((s, v) => s + (v[field] || 0), 0);
    return sum + fieldTotal / post.votes.length;
  }, 0);

  return parseFloat((total / post.voteFields.length).toFixed(1));
};

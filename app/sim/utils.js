module.exports.round = (number, decimals = 0) => {
  const multiplier = 10**decimals;
  return Math.round(number * multiplier) / multiplier;
};

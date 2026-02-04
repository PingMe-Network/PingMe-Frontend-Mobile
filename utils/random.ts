export const getRandomInt = (max: number): number => {
  if (max <= 0) {
    return 0;
  }
  // NOSONAR - Safe for non-cryptographic playlist shuffling
  return Math.floor(Math.random() * max);
};

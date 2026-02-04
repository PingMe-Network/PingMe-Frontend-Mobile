export const getRandomInt = (max: number): number => {
  if (max <= 0) {
    return 0;
  }
  return Math.floor(Math.random() * max); // NOSONAR - Safe for non-cryptographic playlist shuffling
};

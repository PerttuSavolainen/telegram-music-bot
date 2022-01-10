export const countToFetch = (length: number) => {
  const toBeFetched = Math.ceil(length / 10);
  return toBeFetched < 3 ? toBeFetched : 3;
};
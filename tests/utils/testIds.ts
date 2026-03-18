/**
 * Create a unique test ID
 * @param prefix - The prefix for the test ID
 * @example createTestId("user") => "user-1742263600000-abcdefg"
 * @returns The test ID
 */
export const createTestId = (prefix = "test") => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

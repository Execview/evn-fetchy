import addFive from './main';
import getFive from './getFive';

test('addFive should be add five', () => {
  expect(addFive(2)).toBe(7);
});

test('getFive should give 5', () => {
  expect(getFive()).toBe(5);
});

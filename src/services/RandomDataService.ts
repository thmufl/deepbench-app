export function getRandom(max: number = 1.0) {
  return Math.random() * max;
}

export function getRandomInt(max: number = 10) {
  return Math.floor(Math.random() * max) + 1;
}

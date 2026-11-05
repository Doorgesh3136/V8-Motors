/**
 * The Range Rover's two resting states: plain numbers that the home page animates and src/lib/rover3d.js draws.
 * They live in their own file so the home page can use them without loading three.js.
 *
 * az, el    camera angle around the car (az 0 is dead ahead of the bonnet)
 * near      camera distance in metres while frame is 0
 * frame     0: the close, hand-set shots. 1: the hero framing, worked out from the screen's shape
 * tx ty tz  what the camera looks at
 * env, key, sky   studio reflections, the lights on the bodywork, the night behind
 * drl, beam, high, red   running lights, dipped beam, high beam, tail lights
 * carZ      how far along the road the car is
 * road, roadGlow   distance driven while you scroll, and how bright the road markings are
 * rev, jolt   the engine's loudness, and the kick as it catches
 */
export const DARK = {
  az: 0.62, el: 0.02, near: 3, tx: 0.68, ty: 0.98, tz: -0.2, roll: -0.05, frame: 0,
  env: 0.015, key: 0, sky: 0, drl: 0, beam: 0, high: 0, red: 0, carZ: -2.4, road: 0, roadGlow: 0, rev: 0, jolt: 0,
};

export const HERO = {
  az: 0.66, el: 0.115, near: 3, tx: 0, ty: 0.78, tz: 0, roll: 0, frame: 1,
  env: 1, key: 1, sky: 1, drl: 0.95, beam: 0.32, high: 0, red: 0.5, carZ: 0, road: 0, roadGlow: 0, rev: 0, jolt: 0,
};

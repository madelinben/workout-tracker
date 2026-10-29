import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatTime,
  intervals,
  PRESETS,
  position,
  startOf,
  streak,
  totalSeconds,
} from "./workout.ts";

test("intervals: no trailing rest, set rest between sets", () => {
  const steps = intervals({
    warmup: 60,
    work: 20,
    rest: 10,
    rounds: 2,
    sets: 2,
    setRest: 30,
    cooldown: 0,
  });
  assert.deepEqual(
    steps.map((s) => [s.kind, s.seconds]),
    [
      ["warmup", 60],
      ["work", 20],
      ["rest", 10],
      ["work", 20],
      ["rest", 30],
      ["work", 20],
      ["rest", 10],
      ["work", 20],
    ]
  );
});

test("tabata lasts 1 + 4 minutes minus the last rest", () => {
  const tabata = PRESETS.find((p) => p.id === "tabata");
  assert.equal(totalSeconds(tabata?.steps ?? []), 60 + 8 * 20 + 7 * 10);
});

test("position and skip", () => {
  const steps = intervals({
    warmup: 0,
    work: 20,
    rest: 10,
    rounds: 2,
    sets: 1,
    setRest: 0,
    cooldown: 0,
  });
  assert.deepEqual(position(steps, 0), { index: 0, remaining: 20 });
  assert.deepEqual(position(steps, 25), { index: 1, remaining: 5 });
  assert.equal(position(steps, 999).index, 3);
  assert.equal(startOf(steps, 2), 30);
});

test("streak counts back from today or yesterday", () => {
  const log = ["2026-10-27", "2026-10-28"].map((date) => ({
    id: date,
    name: "",
    date,
    seconds: 1,
  }));
  assert.equal(streak(log, "2026-10-29"), 2);
  assert.equal(streak(log, "2026-10-28"), 2);
  assert.equal(streak(log, "2026-10-31"), 0);
  assert.equal(formatTime(65.2), "1:06");
});

import { expect } from 'chai';
import sinon from 'sinon';

import { IntervalScheduleProvider } from './interval-schedule-provider.js';

describe('IntervalScheduleProvider', function () {
  let clock: sinon.SinonFakeTimers;

  beforeEach(function () {
    clock = sinon.useFakeTimers();
  });

  afterEach(function () {
    clock.restore();
  });

  it('should provide times at the correct intervals', async function () {
    const interval = 2000;

    const provider = new IntervalScheduleProvider({ intervalMs: interval });

    const first = await provider.get();
    clock.tick(interval);
    const second = await provider.get();
    clock.tick(interval);
    const third = await provider.get();

    expect(second - first).to.equal(interval);
    expect(third - second).to.equal(interval);
  });

  it('should skip intervals if time has advanced significantly', async function () {
    const interval = 1000;

    const provider = new IntervalScheduleProvider({ intervalMs: interval });

    const first = await provider.get();
    clock.tick(4500); // Advance time by 4.5 intervals
    const second = await provider.get();

    expect(second - first).to.equal(4000); // Should jump to the next interval after 4.5 intervals
  });

  it('should handle multiple rapid calls correctly', async function () {
    const interval = 1500;

    const provider = new IntervalScheduleProvider({ intervalMs: interval });

    const first = await provider.get();
    const second = await provider.get();
    const third = await provider.get();

    expect(second).to.equal(first);
    expect(third).to.equal(first);
  });
});

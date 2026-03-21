import { expect } from 'chai';

import { sleep } from './sleep.js';

describe('sleep', function () {
  it('should resolve after the specified duration', async function () {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).to.be.greaterThanOrEqual(50);
  });

  it('should resolve immediately when given 0ms', async function () {
    const start = Date.now();
    await sleep(0);
    expect(Date.now() - start).to.be.lessThan(50);
  });

  it('should resolve early when cancelled', async function () {
    const start = Date.now();
    const nap = sleep(60_000);
    nap.cancel();
    await nap;
    expect(Date.now() - start).to.be.lessThan(500);
  });

  it('should be safe to cancel multiple times', async function () {
    const start = Date.now();
    const nap = sleep(60_000);
    nap.cancel();
    nap.cancel();
    await nap;
    expect(Date.now() - start).to.be.lessThan(500);
  });
});

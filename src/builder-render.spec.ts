import { expect } from 'chai';

import { builderRender } from './builder-render.js';

describe('builderRender', function () {
  it('should render a builder with data', async function () {
    const result = await builderRender({ value: 'test' });

    expect(result).to.deep.equal({ value: 'test' });
  });

  it('should render a builder with a function', async function () {
    const result = await builderRender({ value: () => 'test' });

    expect(result).to.deep.equal({ value: 'test' });
  });

  it('should render a builder with a function and data', async function () {
    const result = await builderRender({
      value: () => 'test',
      value2: 'test2',
    });

    expect(result).to.deep.equal({ value: 'test', value2: 'test2' });
  });
});

import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { CommandFn } from './types/command.js';
import { serialExecutionStrategy } from './execution-strategies/serial-execution-strategy.js';

import { CompositeCommand } from './composite-command.js';

use(chaiAsPromised);
use(sinonChai);

describe('CompositeCommand', function () {
  it('should execute commands provided directly', async function () {
    const command1 = sinon.fake();
    const command2 = sinon.fake();

    const compositeCommand = new CompositeCommand<void>({
      commands: [command1, command2],
    });

    await compositeCommand.execute();

    expect(command1).to.have.been.calledOnce;
    expect(command2).to.have.been.calledOnce;
  });

  it('should execute commands provided by a provider', async function () {
    const command1: CommandFn<void> = sinon.fake();
    const command2: CommandFn<void> = sinon.fake();

    const commandsProvider = async function* () {
      yield command1;
      yield command2;
    };

    const compositeCommand = new CompositeCommand<void>({
      commandsProvider: () => commandsProvider(),
    });

    await compositeCommand.execute();

    expect(command1).to.have.been.calledOnce;
    expect(command2).to.have.been.calledOnce;
  });

  it('should use the specified execution strategy', async function () {
    const command1 = sinon.fake();
    const command2 = sinon.fake();

    const compositeCommand = new CompositeCommand<void>({
      commands: [command1, command2],
      executionStrategy: {
        execute: serialExecutionStrategy,
      },
    });

    await compositeCommand.execute();

    expect(command1).to.have.been.calledOnce;
    expect(command2).to.have.been.calledOnce;
    expect(command1).to.have.been.calledBefore(command2);
  });
});

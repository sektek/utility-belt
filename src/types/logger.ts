export type LogEntry = Record<string, unknown> & {
  level: string;
  message: string;
};

type LogFn = (
  ...args:
    | [level: string, message: string, ...meta: unknown[]]
    | [entry: LogEntry]
) => void | unknown;

type LeveledLogMethod = (
  ...args:
    | [message: string, ...meta: unknown[]]
    | [entry: Omit<LogEntry, 'level'>]
) => void | unknown;

export type LoggerContext = Record<string, unknown>;

export interface Logger {
  log: LogFn;
  error: LeveledLogMethod;
  warn: LeveledLogMethod;
  info: LeveledLogMethod;
  debug: LeveledLogMethod;

  isLevelEnabled(level: string): boolean;
  isErrorEnabled(): boolean;
  isWarnEnabled(): boolean;
  isInfoEnabled(): boolean;
  isDebugEnabled(): boolean;

  child(context: LoggerContext): Logger;
}

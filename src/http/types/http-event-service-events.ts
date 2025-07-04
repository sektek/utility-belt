import { EventEmittingService } from '../../types/index.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type HttpEventServiceEvents<T> = {
  'request:created': (arg: T, request: Request) => void;
  'request:error': (arg: T, request: Request, error: Error) => void;
  'response:received': (arg: T, response: Response) => void;
  'response:error': (arg: T, response: Response, error: Error) => void;
};

export interface HttpEventService<T>
  extends EventEmittingService<HttpEventServiceEvents<T>> {}

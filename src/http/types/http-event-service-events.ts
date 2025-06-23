import { EventEmittingService } from '@sektek/utility-belt';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type HttpEventServiceEvents<T> = {
  'request:created': (arg: T, request: Request) => void;
  'response:received': (arg: T, response: Response) => void;
  'response:error': (arg: T, response: Response, error: Error) => void;
};

export interface HttpEventService<T>
  extends EventEmittingService<HttpEventServiceEvents<T>> {}

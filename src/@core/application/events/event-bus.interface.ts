import { DomainEvent } from '@core/domain/domain-event.base';
import { Result } from '@core/domain/result';

export interface IEventBus {
  publish(event: DomainEvent): Promise<Result<void>>;
  subscribe(eventName: string, handlerName: string): void;
}

export const EVENT_BUS = Symbol('IEventBus');

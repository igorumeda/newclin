import type { DomainEvent } from '@core/domain/domain-event.base';
import type { IEventHandler } from './event-handler.interface';

export type SubscribeParams<T extends DomainEvent> = {
  eventName: string;
  handler: IEventHandler<T>;
};

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
  subscribe<T extends DomainEvent>(params: SubscribeParams<T>): void;
}

export const EVENT_BUS = Symbol('IEventBus');

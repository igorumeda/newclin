import { DomainEvent } from '@core/domain/domain-event.base';
import { Result } from '@core/domain/result';

export type EventHandlerParams<Event extends DomainEvent> = { event: Event };

export interface IEventHandler<Event extends DomainEvent = DomainEvent> {
  handle(params: EventHandlerParams<Event>): Promise<Result<void>>;
}

export const EVENT_HANDLER = Symbol('IEventHandler');

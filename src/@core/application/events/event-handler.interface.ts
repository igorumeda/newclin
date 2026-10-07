import type { DomainEvent } from '@core/domain/domain-event.base';

export interface IEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

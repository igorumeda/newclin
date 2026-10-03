export type WithId = { id: string };

export type TimestampedEntity = {
  createdAt: Date;
  updatedAt: Date;
};

export type SelectOption = {
  value: string;
  label: string;
};

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

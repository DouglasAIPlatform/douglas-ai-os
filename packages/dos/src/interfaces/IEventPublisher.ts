export interface LifecycleEvent {
  topic: string;
  payload?: Record<string, string | number | boolean | null>;
  timestamp: string;
}

export interface IEventPublisher {
  publish(
    topic: string,
    payload?: Record<string, string | number | boolean | null>,
  ): LifecycleEvent;
  getHistory(): LifecycleEvent[];
  clear(): void;
}

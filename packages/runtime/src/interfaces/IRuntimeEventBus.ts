export interface IRuntimeEventBus {
  publish(topic: string, source: string, payload: Record<string, unknown>): void;
  subscribe(
    topic: string,
    handler: (payload: Record<string, unknown>) => void,
  ): () => void;
}

import { InMemoryMemoryRepository, type MemoryRepository } from "./MemoryRepository";
import type {
  MemoryBackendProvider,
  MemoryDomain,
  MemoryTier,
  MemoryWriteInput,
} from "./MemoryTypes";

export interface RegisteredMemoryBackend extends MemoryBackendProvider {
  repository: MemoryRepository;
}

export class MemoryStoreRegistry {
  private backends = new Map<string, RegisteredMemoryBackend>();
  private defaultBackendId: string | null = null;

  register(backend: RegisteredMemoryBackend, isDefault = false): void {
    this.backends.set(backend.id, backend);

    if (isDefault || !this.defaultBackendId) {
      this.defaultBackendId = backend.id;
    }
  }

  registerMany(backends: RegisteredMemoryBackend[], defaultBackendId?: string): void {
    backends.forEach((backend) => this.register(backend));
    if (defaultBackendId) {
      this.defaultBackendId = defaultBackendId;
    }
  }

  unregister(backendId: string): boolean {
    const removed = this.backends.delete(backendId);
    if (this.defaultBackendId === backendId) {
      this.defaultBackendId = this.backends.keys().next().value ?? null;
    }
    return removed;
  }

  get(backendId: string): RegisteredMemoryBackend | undefined {
    return this.backends.get(backendId);
  }

  getAll(): RegisteredMemoryBackend[] {
    return Array.from(this.backends.values());
  }

  resolveBackend(input: MemoryWriteInput): RegisteredMemoryBackend | undefined {
    if (input.backendId) {
      return this.backends.get(input.backendId);
    }

    const matches = this.getAll()
      .filter(
        (backend) =>
          backend.tiers.includes(input.tier) &&
          backend.domains.includes(input.domain),
      )
      .sort((a, b) => b.priority - a.priority);

    return matches[0] ?? this.getDefault();
  }

  resolveForRead(
    tier: MemoryTier,
    domain: MemoryDomain,
    backendId?: string,
  ): RegisteredMemoryBackend[] {
    if (backendId) {
      const backend = this.backends.get(backendId);
      return backend ? [backend] : [];
    }

    return this.getAll()
      .filter(
        (backend) => backend.tiers.includes(tier) && backend.domains.includes(domain),
      )
      .sort((a, b) => b.priority - a.priority);
  }

  getDefault(): RegisteredMemoryBackend | undefined {
    if (!this.defaultBackendId) return undefined;
    return this.backends.get(this.defaultBackendId);
  }

  createLocalBackend(
    provider: MemoryBackendProvider,
    isDefault = false,
  ): RegisteredMemoryBackend {
    const repository = new InMemoryMemoryRepository(provider.id);
    const registered: RegisteredMemoryBackend = {
      ...provider,
      repository,
    };

    this.register(registered, isDefault);
    return registered;
  }

  size(): number {
    return this.backends.size;
  }
}

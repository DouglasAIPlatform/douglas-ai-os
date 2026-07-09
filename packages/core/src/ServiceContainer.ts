export type ServiceFactory<T> = () => T;

export interface ServiceRegistration<T> {
  token: ServiceToken<T>;
  factory: ServiceFactory<T>;
  singleton: boolean;
}

export class ServiceToken<T> {
  readonly symbol: symbol;

  constructor(readonly name: string) {
    this.symbol = Symbol.for(`douglas:service:${name}`);
  }
}

export function createServiceToken<T>(name: string): ServiceToken<T> {
  return new ServiceToken<T>(name);
}

export class ServiceContainer {
  private factories = new Map<symbol, ServiceRegistration<unknown>>();
  private instances = new Map<symbol, unknown>();

  register<T>(
    token: ServiceToken<T>,
    factory: ServiceFactory<T>,
    singleton = true,
  ): void {
    this.factories.set(token.symbol, {
      token: token as ServiceToken<unknown>,
      factory: factory as ServiceFactory<unknown>,
      singleton,
    });
  }

  resolve<T>(token: ServiceToken<T>): T {
    const registration = this.factories.get(token.symbol);

    if (!registration) {
      throw new Error(`Service not registered: ${token.name}`);
    }

    if (registration.singleton && this.instances.has(token.symbol)) {
      return this.instances.get(token.symbol) as T;
    }

    const instance = registration.factory() as T;

    if (registration.singleton) {
      this.instances.set(token.symbol, instance);
    }

    return instance;
  }

  has(token: ServiceToken<unknown>): boolean {
    return this.factories.has(token.symbol);
  }

  unregister(token: ServiceToken<unknown>): boolean {
    this.instances.delete(token.symbol);
    return this.factories.delete(token.symbol);
  }

  clear(): void {
    this.factories.clear();
    this.instances.clear();
  }
}

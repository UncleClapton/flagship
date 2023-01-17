import { boundMethod } from 'autobind-decorator';
import type { Action, History as BrowserHistory, Location, TransitionPromptHook } from 'history';
import {
  LocationDescriptor,
  LocationDescriptorObject,
  LocationListener,
  UnregisterCallback,
  createBrowserHistory,
} from 'history';
import { uniqueId } from 'lodash-es';

import { promisedEntries } from '../../utils';
import type { ActivatedRoute, MatchingRoute, Routes } from '../types';

import { INTERNAL, queueMethod } from './queue.decorator';
import type { FSRouterHistory, HistoryOptions } from './types';
import { LoadingListener, RequiredTitle, ResolverListener } from './types';
import { createKey } from './utils.base';
import type { Matchers } from './utils.base';
import { buildMatchers, matchRoute, resolveRoute, stringifyLocation } from './utils.web';

export class History implements FSRouterHistory {
  constructor(private readonly routes: Routes, protected readonly options?: HistoryOptions) {
    void this.initialNavigation()
      .then(() => {
        this.observeNavigation();
      })
      .catch();
  }

  private get nextLoad(): Promise<void> {
    return new Promise((resolve) => {
      const remove = this.observeLoading(() => {
        resolve();
        remove();
      });
    });
  }

  public get length(): number {
    return this.browserHistory.length;
  }

  public get action(): Action {
    return this._action;
  }

  public get location(): Location {
    return this._location;
  }

  private readonly matchers: Matchers = buildMatchers(this.routes);
  private readonly browserHistory: BrowserHistory = createBrowserHistory({
    ...(this.options?.basename ? { basename: this.options.basename } : {}),
  });

  private readonly activationObservers = new Map<string, ResolverListener>();
  private readonly loadingObservers = new Map<string, LoadingListener>();
  private readonly locationObservers = new Map<string, LocationListener>();

  private _action: Action = this.browserHistory.action;

  private _location: Location = Object.freeze({
    pathname: '__SPLASH__',
    hash: '',
    search: '',
    state: {},
    key: createKey(),
  });

  public activatedRoute?: ActivatedRoute | undefined;

  private async initialNavigation(): Promise<void> {
    const matchingRoute = await matchRoute(this.matchers, stringifyLocation(location));

    if (matchingRoute) {
      await this.activateRoute(
        this.browserHistory.location.key,
        matchingRoute,
        this.browserHistory.location.state
      );
      this._action = this.browserHistory.action;
      this._location = this.browserHistory.location;
      for (const listener of this.locationObservers.values()) {
        listener(this.browserHistory.location, this.browserHistory.action);
      }
    }
    this.options?.markStable();
  }

  private async activateRoute(
    id: string | undefined,
    matchingRoute: MatchingRoute,
    state: unknown
  ): Promise<void> {
    this.setLoading(true);
    const activatedRoute = await this.resolveRouteDetails(id, matchingRoute, state);
    const observer = this.activationObservers.get(matchingRoute.id);
    observer?.(activatedRoute);

    const allObserver = this.activationObservers.get('all');
    allObserver?.(activatedRoute);
    this.activatedRoute = activatedRoute;

    const title =
      typeof matchingRoute.title === 'function'
        ? await matchingRoute.title(activatedRoute)
        : matchingRoute.title;

    if (title) {
      document.title = title;
    }

    this.setLoading(false);
  }

  private observeNavigation(): void {
    this.browserHistory.listen(async (location, action) => {
      const unblock = this.browserHistory.block(true);
      const matchingRoute = await matchRoute(this.matchers, stringifyLocation(location));
      if (matchingRoute) {
        await this.activateRoute(location.key, matchingRoute, location.state);
        this._action = action;
        this._location = location;
        for (const listener of this.locationObservers.values()) {
          listener(location, action);
        }
        window.scrollTo(0, 0);
        this.setLoading(false);
        unblock();
      } else {
        unblock();
      }
    });
  }

  private setLoading(loading: boolean): void {
    for (const callback of this.loadingObservers.values()) {
      callback(loading);
    }
  }

  private async resolveRouteDetails(
    id: string | undefined,
    matchingRoute: MatchingRoute,
    state: unknown
  ): Promise<ActivatedRoute> {
    const resolvedData = await promisedEntries(resolveRoute(id, matchingRoute));
    return {
      id,
      data: { ...resolvedData, ...(typeof state === 'object' ? state : {}) },
      query: matchingRoute.query,
      params: matchingRoute.params,
      url: matchingRoute.matchedPath,
      path: matchingRoute.path,
      isExact: matchingRoute.path === matchingRoute.matchedPath,
      loading: true,
    };
  }

  public open(path: string, state?: unknown): Promise<void>;
  public open(location: LocationDescriptor): Promise<void>;
  @boundMethod
  @queueMethod
  public async open(to: LocationDescriptor, state?: unknown): Promise<void> {
    if (typeof to === 'string') {
      return this.push(to, state, INTERNAL);
    }
    return this.push(to, INTERNAL);
  }

  public push(path: string, state?: unknown, _internal?: typeof INTERNAL): Promise<void>;
  public push(location: LocationDescriptor, _internal?: typeof INTERNAL): Promise<void>;
  @boundMethod
  @queueMethod
  public async push(
    to: LocationDescriptor,
    state?: unknown,
    _internal?: typeof INTERNAL
  ): Promise<void> {
    if (typeof to === 'string') {
      if (/^\w+:\/\//.test(to)) {
        window.location.href = to;
      } else {
        this.browserHistory.push(to, state);
        await this.nextLoad;
      }
    } else if (to.pathname && /^\w+:\/\//.test(to.pathname)) {
      window.location.href = to.pathname;
    } else if (to) {
      this.browserHistory.push(to);
      await this.nextLoad;
    }
  }

  @boundMethod
  @queueMethod
  async pushTo(path: string): Promise<void> {
    await this.push(path, {}, INTERNAL);
  }

  public replace(path: string, state?: unknown): Promise<void>;
  public replace(location: LocationDescriptor): Promise<void>;
  @boundMethod
  @queueMethod
  public async replace(
    pathOrLocation: LocationDescriptor | string,
    state?: unknown
  ): Promise<void> {
    if (typeof pathOrLocation === 'string') {
      this.browserHistory.replace(pathOrLocation, state);
    } else {
      this.browserHistory.replace(pathOrLocation);
    }
    await this.nextLoad;
  }

  @boundMethod
  @queueMethod
  public async go(n: number): Promise<void> {
    this.browserHistory.go(n);
    await this.nextLoad;
  }

  @boundMethod
  @queueMethod
  public async pop(): Promise<void> {
    this.browserHistory.goBack();
    await this.nextLoad;
  }

  @boundMethod
  @queueMethod
  public popTo(): void {
    throw new Error(
      `${History.name}: ${this.popTo.name}() is not implemented for web. Please use push() instead...`
    );
  }

  @boundMethod
  @queueMethod
  public async popToRoot(): Promise<void> {
    await this.push('/', {}, INTERNAL);
  }

  @boundMethod
  @queueMethod
  public async goBack(): Promise<void> {
    this.browserHistory.goBack();
    await this.nextLoad;
  }

  @boundMethod
  @queueMethod
  public async goForward(): Promise<void> {
    this.browserHistory.goForward();
    await this.nextLoad;
  }

  @boundMethod
  public block(prompt?: TransitionPromptHook | boolean | string): UnregisterCallback {
    return this.browserHistory.block(prompt);
  }

  @boundMethod
  public listen(listener: LocationListener): UnregisterCallback {
    const id = uniqueId('resolver-listeners');
    this.locationObservers.set(id, listener);
    return () => {
      this.locationObservers.delete(id);
    };
  }

  @boundMethod
  public observeLoading(listener: LoadingListener): UnregisterCallback {
    const id = uniqueId('loading-subscriber');
    this.loadingObservers.set(id, listener);
    return () => {
      this.loadingObservers.delete(id);
    };
  }

  @boundMethod
  public registerResolver(id: string, listener: ResolverListener): UnregisterCallback {
    this.activationObservers.set(id, listener);
    return () => {
      this.activationObservers.delete(id);
    };
  }

  @boundMethod
  public createHref(location: LocationDescriptorObject): string {
    return this.browserHistory.createHref(location);
  }

  @boundMethod
  @queueMethod
  public async updateTitle(title: RequiredTitle): Promise<void> {
    document.title = typeof title === 'string' ? title : title.text;
  }
}

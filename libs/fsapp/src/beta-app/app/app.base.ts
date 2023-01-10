import { ReactReduxContext } from 'react-redux';

import type { IStore as CargoHoldStore } from '@brandingbrand/cargo-hold';
import type { Attribute, EngagementService } from '@brandingbrand/engagement-utils';
import { InjectionToken, Injector } from '@brandingbrand/fslinker';
import { FSNetwork } from '@brandingbrand/fsnetwork';

import { boundMethod } from 'autobind-decorator';
import type { Action, Store } from 'redux';

import type { GenericState } from '../legacy/store';
import { StoreManager } from '../legacy/store';
import { FSRouter } from '../router';
import type { FSRouterType, Routes } from '../router';
import { initializeCargoHold } from '../store';

import {
  APIContext,
  API_CONTEXT_TOKEN,
  APP_CONTEXT_TOKEN,
  AppContext,
  REDUX_CONTEXT_TOKEN,
  REDUX_STORE_TOKEN,
} from './context';
import { makeScreenWrapper } from './screen.wrapper';
import type { AppConfig, AppConstructor, IApp } from './types';
import { getVersion } from './utils';

export const APP_VERSION_TOKEN = new InjectionToken<string>('APP_VERSION_TOKEN');
export const APP_CONFIG_TOKEN = new InjectionToken<AppConfig>('APP_CONFIG_TOKEN');
export const API_TOKEN = new InjectionToken<FSNetwork>('API_TOKEN');

export abstract class FSAppBase implements IApp {
  public static async bootstrap<S extends GenericState, A extends Action, T extends FSAppBase, C>(
    this: AppConstructor<T>,
    config: AppConfig<S, A, C>
  ): Promise<T> {
    const version = await getVersion(config);
    const { engagementService, remote, state } = config;
    const api = remote ? new FSNetwork(remote) : undefined;
    const storeManager = state ? new StoreManager(state) : undefined;
    const store = !config.serverSide
      ? await storeManager?.getReduxStore(await storeManager.updatedInitialState())
      : undefined;
    const cargoHold = config.cargoHold ? initializeCargoHold(config.cargoHold) : undefined;

    // eslint-disable-next-line prefer-const
    let app: T | undefined;
    const router = await FSRouter.register({
      api,
      shell: config.webShell,
      analytics: config.analytics,
      screenWrap: await makeScreenWrapper({
        store,
        app: () => app,
        provider: config.provider,
        cargoHold,
      }),
      ...config.router,
    });

    app = new this(
      version,
      config,
      router,
      api,
      cargoHold,
      store as S extends GenericState ? (A extends Action ? Store<S, A> : undefined) : undefined,
      engagementService
    );
    if (!config.serverSide) {
      await app.startApplication();
      await app.getProfile();
    }
    return app;
  }

  constructor(
    public readonly version: string,
    public readonly config: AppConfig,
    protected readonly router: FSRouterType,
    public readonly api?: FSNetwork,
    public readonly cargoHold?: CargoHoldStore,
    public readonly store?: Store,
    public readonly engagementService?: EngagementService
  ) {
    Injector.provide({ provide: API_TOKEN, useValue: api });
    Injector.provide({ provide: REDUX_STORE_TOKEN, useValue: store });
    Injector.provide({ provide: APP_CONFIG_TOKEN, useValue: config });
    Injector.provide({ provide: APP_VERSION_TOKEN, useValue: version });
    Injector.provide({ provide: API_CONTEXT_TOKEN, useValue: APIContext });
    Injector.provide({ provide: APP_CONTEXT_TOKEN, useValue: AppContext });
    Injector.provide({ provide: REDUX_CONTEXT_TOKEN, useValue: ReactReduxContext });
  }

  public readonly routes: Routes = this.router.routes;

  @boundMethod
  public async openUrl(url: string): Promise<void> {
    await this.router.open(url);
  }

  @boundMethod
  public async updateProfile(attributes: Attribute[]): Promise<boolean> {
    if (!this.engagementService) {
      return false;
    }
    this.store?.dispatch({ type: 'PROFILE_UPDATE', value: attributes });
    return this.engagementService.setProfileAttributes(attributes);
  }

  @boundMethod
  public async getProfile(accountId?: string): Promise<string | undefined> {
    if (!this.engagementService) {
      return undefined;
    }
    return this.engagementService.getProfile(accountId);
  }

  @boundMethod
  public async updateAccountId(accountId: string): Promise<void> {
    // TODO: implement api route to update user account
  }

  public abstract startApplication(): Promise<void>;
  public abstract stopApplication(): Promise<void>;
}

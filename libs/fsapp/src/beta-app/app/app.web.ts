import { AppRegistry } from 'react-native';

import { StaticImplements } from '../utils';

import { FSAppBase } from './app.base';
import type { AppConstructor } from './types';

export {
  APP_CONFIG_TOKEN, APP_VERSION_TOKEN, API_TOKEN, ENGAGEMENT_COMPONENT, ENGAGEMENT_SERVICE
} from './app.base';

@StaticImplements<AppConstructor>()
export class FSAppBeta extends FSAppBase {
  private readonly root: Element | null =
    (typeof this.config.root === 'string'
      ? document.querySelector(this.config.root)
      : this.config.root) ?? document.querySelector('#root');

  public async startApplication(): Promise<void> {
    AppRegistry.runApplication('Flagship', {
      rootTag: this.root,
      hydrate: this.config.hydrate,
      initialProps: {},
    });
  }

  public async stopApplication(): Promise<void> {
    this.config.onDestroy?.();
    if (this.root) {
      // React Native Web hack due to unmatched Type Definitions
      // React Native Web aliases `unmountComponentAtNode` from `react-dom`
      AppRegistry.unmountApplicationComponentAtRootTag(this.root as unknown as number);
    }
  }
}

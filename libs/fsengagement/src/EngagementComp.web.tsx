import type { ComponentClass } from 'react';
import React, { Component } from 'react';

import type { ListRenderItem, StyleProp, TextStyle, ViewStyle } from 'react-native';
import {
  Animated,
  DeviceEventEmitter,
  Dimensions,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Navigation } from 'react-native-navigation';

import type { EngagementService } from '@brandingbrand/engagement-utils';
import { NAVIGATOR_TOKEN } from '@brandingbrand/fsapp';
import type { Navigator } from '@brandingbrand/fsapp/legacy';
import { Injector } from '@brandingbrand/fslinker';

import { debounce } from 'lodash-es';

import closeBronze from '../assets/images/closeBronze.png';

import EngagementWebView from './WebView';
import { BackButton } from './components/BackButton';
import { EngagementContext } from './lib/contexts';
import type { Action, BlockItem, ComponentList, EmitterProps, JSON, ScreenProps } from './types';

Navigation.registerComponent('EngagementWebView', () => EngagementWebView);

const win = Dimensions.get('window');
const imageAspectRatio = 0.344;
const WHITE_INBOX_WRAPPER = 'WhiteInboxWrapper';
const INBOX_WRAPPER = 'InboxWrapper';
const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    zIndex: 10,
    top: 50,
    left: 8,
    padding: 12,
  },
  fullScreen: {
    width: Dimensions.get('screen').width + 45,
    height: Dimensions.get('screen').height + 60,
  },
  backIconCloseX: {
    width: 44,
    height: 44,
  },
  progressBar: {
    position: 'absolute',
    flexDirection: 'row',
    top: 67,
    flex: 1,
    marginLeft: 65,
    marginRight: 33,
  },
  progressItem: {
    flex: 1,
    marginHorizontal: 3,
    backgroundColor: 'rgba(79, 79, 79, .3)',
    height: 2,
  },
  activeProgress: {
    backgroundColor: 'rgba(79, 79, 79, .8)',
  },
  closeModalButton: {
    position: 'absolute',
    zIndex: 10,
    bottom: -60,
    left: win.width / 2 - 35,
    padding: 0,
  },
  growAndCenter: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  editorial: {
    marginTop: 0,
    backgroundColor: 'transparent',
  },
  backIcon: {
    width: 14,
    height: 25,
  },
  appleCloseIcon: {
    width: 60,
    height: 60,
  },
  fullScreenDeeplink: {
    width: Dimensions.get('screen').width + 45,
    height: Dimensions.get('screen').height + 60,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  headerName: {
    fontFamily: 'HelveticaNeue-Bold',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: '#000',
    fontSize: 26,
    marginBottom: 0,
    marginTop: 70,
    paddingHorizontal: 25,
  },
  pageCounter: {
    position: 'absolute',
    top: 70,
    left: 20,
  },
  pageNum: {
    color: '#ffffff',
    fontWeight: '500',
  },
  navBarTitle: {
    color: '#000000',
    fontSize: 14,
    textAlign: 'center',
    position: 'absolute',
    top: 60,
    width: '100%',
  },
  emptyMessage: {
    textAlign: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  growStretch: {
    alignSelf: 'stretch',
    flexGrow: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
  },
  headerImage: {
    width: win.width,
    height: win.width * imageAspectRatio,
  },
  imageStyle: {
    transform: [{ scale: 1.06 }],
    opacity: 0.8,
    marginTop: 20,
  },
  deeplinkStory: {
    marginTop: -(Dimensions.get('screen').height + 60),
  },
  storyFooter: {
    marginBottom: -35,
    height: 40,
    backgroundColor: '#fff',
  },
});

type DeeplinkMethod = 'open' | 'push';
export interface EngagementScreenProps extends ScreenProps, EmitterProps {
  json: JSON;
  backButton?: boolean;
  noScrollView?: boolean;
  navBarTitle?: string;
  renderType?: string;
  refreshControl?: () => void;
  isLoading: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  autoplayInterval?: number;
  storyType?: string;
  tabbedItems?: unknown[];
  lastUpdate?: number;
  containerStyle?: StyleProp<ViewStyle>;
  onBack?: () => void;
  language?: string;
  welcomeHeader?: boolean;
  headerName?: string;
  cardPosition?: number;
  windowWidth?: number;
  navigator?: Navigator;
  renderHeader?: () => void;
  discoverPath?: string;
  deepLinkMethod?: DeeplinkMethod;
  renderBackButton?: (navigation?: Navigator) => void;
}
export interface EngagementState {
  scrollY: Animated.Value;
  pageNum: number;
  showCarousel: boolean;
  showDarkX: boolean;
  slideBackground: boolean;
  activeProgressBarIndex: number;
  scrollEnabled: boolean;
  isLoading: boolean;
}

/**
 *
 * @param api
 * @param layoutComponents
 */
// eslint-disable-next-line max-lines-per-function, import/no-anonymous-default-export
export default function (
  api: EngagementService,
  layoutComponents: ComponentList
): ComponentClass<EngagementScreenProps> {
  return class EngagementComp extends Component<EngagementScreenProps, EngagementState> {
    constructor(props: EngagementScreenProps) {
      super(props);
      this.state = {
        scrollY: new Animated.Value(0),
        pageNum: 1,
        isLoading: true,
        showCarousel: false,
        showDarkX: false,
        slideBackground: false,
        activeProgressBarIndex: 0,
        scrollEnabled: true,
      };
    }

    private pageCounterStyle: StyleProp<ViewStyle>;
    private pageNumberStyle: StyleProp<TextStyle>;
    public flatListRef: FlatList | null = null;

    private readonly handleAction = debounce(async (actions: Action) => {
      if (!(actions && actions.type && actions.value)) {
        return false;
      }
      DeviceEventEmitter.emit('viewLink', {
        title: actions.name,
        id: actions.id,
        type: actions.type,
        value: actions.value,
        position: actions.position,
      });
      switch (actions.type) {
        case 'blog-url':
          await this.props.navigator?.push({
            component: {
              name: 'EngagementWebView',
              options: {
                topBar: {
                  visible: false,
                },
              },
              passProps: {
                actions,
                isBlog: true,
                backButton: true,
              },
            },
          });
          break;
        case 'web-url':
          await this.props.navigator?.showModal({
            component: {
              name: 'EngagementWebView',
              passProps: { actions },
              options: {
                statusBar: {
                  style: 'dark' as const,
                },
                topBar: {
                  background: { color: '#f5f2ee' },
                  rightButtons: [
                    {
                      color: '#866d4b',
                      // This is a fix for building from source with
                      // `ImageURISource` image imports
                      icon: closeBronze as unknown as number,
                      id: 'close',
                    },
                  ],
                },
              },
            },
          });
          break;
        case 'deep-link':
          if (this.props.discoverPath && actions.value) {
            const navigator = Injector.require(NAVIGATOR_TOKEN);
            const method = this.props.deepLinkMethod || 'open';
            navigator[method](actions.value);
            break;
          }
          const separator = ~actions.value.indexOf('?') ? '&' : '?';
          const query = `${separator}engagementDeeplink=true`;
          const url = actions.value + query;
          Linking.canOpenURL(actions.value)
            .then((supported) => {
              if (!supported) {
                alert(`An error occurred: can't handle url ${url}`);
                return false;
              }
              return Linking.openURL(url);
            })
            .catch((error) => {
              alert(`An error occurred: ${error}`);
            });
          break;
        case 'phone':
          Linking.openURL(`tel:${actions.value}`).catch((error) => {
            alert(`An error occurred: ${error}`);
          });
          break;
        case 'email':
          let mailUrl = `mailto:${actions.value}`;
          if (actions.subject) {
            const subject = actions.subject.replace(/ /g, '%20');
            mailUrl += `?subject=${subject}`;
          }
          if (actions.body) {
            const separator = ~mailUrl.indexOf('?') ? '&' : '?';
            const body = actions.body.replace(/ /g, '%20');
            mailUrl += `${separator}body=${body}`;
          }
          Linking.openURL(mailUrl).catch((error) => {
            alert(`An error occurred when trying to send email to ${actions.value}: ${error}`);
          });
          break;
        default:
          break;
      }
    }, 300);

    private readonly renderBlockItem: ListRenderItem<BlockItem> = ({ index, item }) => {
      item.index = index;
      return this.renderBlock(item);
    };

    private readonly renderBlockWrapper = (item: BlockItem): React.ReactElement | null => {
      const { private_type } = item;
      if (!layoutComponents[private_type]) {
        return null;
      }

      return React.createElement(
        layoutComponents[WHITE_INBOX_WRAPPER] ?? '',
        {
          key: this.dataKeyExtractor(item),
          navigator: this.props.navigator,
          discoverPath: this.props.discoverPath,
        },
        this.renderBlock(item)
      );
    };

    private readonly addParentCardProps = (
      type: string,
      blocks: BlockItem[],
      parentStyle: StyleProp<ViewStyle>
    ): any => {
      if (type === 'Card') {
        return (blocks || []).map((b) => ({
          ...b,
          cardContainerStyle: parentStyle,
        }));
      }
      return blocks;
    };

    private readonly renderBlock = (item: BlockItem): React.ReactElement | null => {
      const { private_blocks, private_type, ...restProps } = item;
      const { id, name } = this.props;
      const props = {
        id,
        name,
        ...restProps,
      };
      if (!layoutComponents[private_type]) {
        return null;
      }

      if (item.wrapper) {
        delete item.wrapper;
        return React.createElement(
          layoutComponents[INBOX_WRAPPER] ?? '',
          {
            key: this.dataKeyExtractor(item),
            navigator: this.props.navigator,
            discoverPath: this.props.discoverPath,
          },
          this.renderBlock(item)
        );
      }

      return React.createElement(
        layoutComponents[private_type] ?? '',
        {
          ...props,
          navigator: this.props.navigator,
          discoverPath: this.props.discoverPath,
          api,
          key: this.dataKeyExtractor(item),
        },
        private_blocks &&
          this.addParentCardProps(private_type, private_blocks, item.containerStyle).map(
            this.renderBlock
          )
      );
    };

    private renderBlocks(): JSX.Element {
      const { json } = this.props;
      const empty: any = (json && json.empty) || {};
      return (
        <>
          {((json && json.private_blocks) || []).map(this.renderBlock)}
          {empty && !(json && json.private_blocks && json.private_blocks.length > 0) && (
            <Text style={[styles.emptyMessage, empty.textStyle]}>
              {empty.message || 'No content found.'}
            </Text>
          )}
        </>
      );
    }

    private renderContent(): JSX.Element {
      const { backButton, containerStyle, json } = this.props;
      return (
        <View style={[styles.container, containerStyle, json.containerStyle]}>
          {this.renderScrollView()}
          {backButton &&
            (this.props.renderBackButton ? (
              this.props.renderBackButton(this.props.navigator)
            ) : (
              <BackButton
                navigator={this.props.navigator}
                discoverPath={this.props.discoverPath}
                style={json.backArrow}
              />
            ))}
        </View>
      );
    }

    private renderScrollView(): JSX.Element {
      const { json } = this.props;
      const empty: any = (json && json.empty) || {};

      if (this.props.noScrollView) {
        return <>{this.renderBlocks()}</>;
      }
      return (
        <>
          <FlatList
            data={this.props.json.private_blocks || []}
            keyExtractor={this.dataKeyExtractor}
            renderItem={this.renderBlockItem}
            ref={(ref) => {
              this.flatListRef = ref;
            }}
            ListEmptyComponent={
              <Text style={[styles.emptyMessage, empty.textStyle]}>
                {empty.message || 'No content found.'}
              </Text>
            }
            refreshControl={
              this.props.refreshControl && (
                <RefreshControl
                  refreshing={this.props.isLoading}
                  onRefresh={this.props.refreshControl}
                />
              )
            }
          >
            {this.renderBlocks()}
          </FlatList>
        </>
      );
    }

    private readonly dataKeyExtractor = (item: BlockItem): string =>
      item.id || item.key || Math.floor(Math.random() * 1000000).toString();

    public readonly setScrollEnabled = (enabled: boolean): void => {
      this.setState({
        scrollEnabled: enabled,
      });
    };

    public render(): JSX.Element {
      const { json, navBarTitle } = this.props;
      this.pageCounterStyle =
        json && json.pageCounterStyle ? json.pageCounterStyle : this.pageCounterStyle;
      this.pageNumberStyle =
        json && json.pageNumberStyle ? json.pageNumberStyle : this.pageNumberStyle;
      const navBarTitleStyle = (json && json.navBarTitleStyle) || {};

      return (
        <EngagementContext.Provider
          value={{
            handleAction: this.handleAction,
            story: this.props.backButton ? this.props.json : undefined,
            language: this.props.language,
            cardPosition: this.props.cardPosition || 0,
            windowWidth: this.props.windowWidth,
          }}
        >
          <>
            {this.props.renderHeader && this.props.renderHeader()}
            {this.renderContent()}
            {navBarTitle && (
              <Text style={[styles.navBarTitle, navBarTitleStyle]}>{navBarTitle}</Text>
            )}
          </>
        </EngagementContext.Provider>
      );
    }
  };
}

/* eslint-disable max-lines */
import type { ComponentClass } from 'react';
import React, { Component } from 'react';

import type { ListRenderItem, StyleProp, TextStyle, ViewStyle } from 'react-native';
import {
  ActivityIndicator,
  Animated,
  DeviceEventEmitter,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Navigation } from 'react-native-navigation';
import Carousel from 'react-native-snap-carousel';

import type { EngagementService } from '@brandingbrand/engagement-utils';
import { NAVIGATOR_TOKEN } from '@brandingbrand/fsapp';
import type { Navigator } from '@brandingbrand/fsapp/legacy';
import { Injector } from '@brandingbrand/fslinker';

import { debounce } from 'lodash-es';

import appleCloseIcon from '../assets/images/apple-close-icn.png';
import closeBronze from '../assets/images/closeBronze.png';
import gradientImage from '../assets/images/gradient.png';
import iconCloseXDark from '../assets/images/iconCloseXDark.png';
import iconCloseXLight from '../assets/images/iconCloseXLight.png';

import EngagementWebView from './WebView';
import { BackButton } from './components/BackButton';
import TabbedStory from './inboxblocks/TabbedStory';
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
  animatedClose: {
    position: 'absolute',
    zIndex: 10,
    top: Platform.OS === 'ios' ? 44 : 64,
    left: 19,
    padding: 0,
  },
  animatedList: {
    marginBottom: 100,
    marginTop: -100,
    backgroundColor: 'rgba(255, 255, 255, 0)',
  },
  fullScreen: {
    width: Dimensions.get('screen').width + 45,
    height: Dimensions.get('screen').height + 60,
  },
  backIconCloseX: {
    width: 44,
    height: 44,
  },
  animatedContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0)',
    flex: 1,
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

const topOffset = Platform.OS === 'ios' ? -40 : 1;

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
  animateScroll?: boolean;
  onBack?: () => void;
  language?: string;
  AnimatedImage?: unknown;
  welcomeHeader?: boolean;
  headerName?: string;
  displayName?: string;
  animate?: boolean;
  cardPosition?: number;
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
  isClosingAnimation: boolean;
  showDarkX: boolean;
  slideBackground: boolean;
  activeProgressBarIndex: number;
  scrollEnabled: boolean;
}

// eslint-disable-next-line max-lines-per-function
const WithEngagement = (
  api: EngagementService,
  layoutComponents: ComponentList
): ComponentClass<EngagementScreenProps> =>
  class EngagementComp extends Component<EngagementScreenProps, EngagementState> {
    public state = {
      scrollY: new Animated.Value(0),
      pageNum: 1,
      isLoading: true,
      showCarousel: false,
      showDarkX: false,
      slideBackground: false,
      isClosingAnimation: false,
      activeProgressBarIndex: 0,
      scrollEnabled: true,
    };

    private AnimatedStory: any;
    private AnimatedCloseIcon: any;
    private AnimatedPageCounter: any;
    private AnimatedNavTitle: any;
    private AnimatedAppleClose: any;
    private AnimatedWelcome: any;

    private flatListRef: any;

    private pageCounterStyle: StyleProp<ViewStyle>;
    private pageNumberStyle: StyleProp<TextStyle>;
    private readonly cardMove: unknown;
    private scrollPosition = 0;

    private componentIsMounted = false;

    private readonly handleCloseIconRef = (ref: unknown) => (this.AnimatedCloseIcon = ref);
    private readonly handleAnimatedRef = (ref: unknown) => (this.AnimatedStory = ref);
    private readonly handlePageCounterRef = (ref: unknown) => (this.AnimatedPageCounter = ref);
    private readonly handleNavTitleRef = (ref: unknown) => (this.AnimatedNavTitle = ref);
    private readonly handleWelcomeRef = (ref: unknown) => (this.AnimatedWelcome = ref);
    private readonly handleAppleCloseRef = (ref: unknown) => (this.AnimatedAppleClose = ref);

    private readonly scrollToTop = () => {
      this.flatListRef.scrollToOffset({ animated: true, offset: 0 });
    };

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

      return undefined;
    }, 300);

    private readonly renderBlockItem: ListRenderItem<BlockItem> = ({ index, item }) => {
      item.index = index;
      if (this.props.animate || (this.props.json && this.props.json.fullScreenCardImage)) {
        item.wrapper = true;
        item.animateIndex = index;
      }
      if (this.props.renderType && this.props.renderType === 'carousel') {
        item.fullScreenCard = true;
        item.position = index + 1;
      }
      if (this.props.animateScroll) {
        return this.renderBlockWrapper(item);
      }
      return this.renderBlock(item);
    };

    private readonly renderHeaderName = () => {
      const { headerName, json } = this.props;
      const name = headerName || '';
      const headerTitleStyle = (json && json.headerTitleStyle) || {};
      const comma = name ? ', ' : '';
      return (
        <Text style={[styles.headerName, headerTitleStyle]}>
          Hello{comma}
          {name}
        </Text>
      );
    };

    private readonly renderFlatlistFooter = () => {
      if (this.props.welcomeHeader) {
        return (
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0)',
              height: 20,
            }}
          />
        );
      }
      if (!this.props.animateScroll) {
        return <View />;
      }
      return (
        <View
          style={{
            backgroundColor: '#fff',
            height: 100,
          }}
        />
      );
    };

    private readonly renderFlatlistHeader = () => {
      if (!(this.props.animateScroll || this.props.welcomeHeader) || this.props.renderHeader) {
        return <View />;
      }

      const welcomeOpacity = this.state.scrollY.interpolate({
        inputRange: [0, 70],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      });
      const welcomeFont = this.state.scrollY.interpolate({
        inputRange: [-70, 70],
        outputRange: [1.2, 0.8],
        extrapolate: 'clamp',
      });
      const welcomeY = this.state.scrollY.interpolate({
        inputRange: [0, 70],
        outputRange: [0, 50],
        extrapolate: 'clamp',
      });
      const welcomeX = this.state.scrollY.interpolate({
        inputRange: [-70, 70],
        outputRange: [30, -30],
        extrapolate: 'clamp',
      });

      if (this.props.welcomeHeader) {
        return (
          <Animatable.View
            ref={this.handleWelcomeRef}
            useNativeDriver={false}
            style={{
              transform: [{ translateY: -100 }],
            }}
          >
            <Animated.View
              style={{
                opacity: welcomeOpacity,
                transform: [
                  { translateY: welcomeY },
                  { translateX: welcomeX },
                  { scale: welcomeFont },
                ],
              }}
            >
              {this.renderHeaderName()}
            </Animated.View>
          </Animatable.View>
        );
      }
      return (
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0)',
            height: 450,
          }}
        />
      );
    };

    private readonly renderBlockWrapper = (item: BlockItem): React.ReactElement | null => {
      const { private_type } = item;
      if (!layoutComponents[private_type]) {
        return null;
      }

      const layoutComponent = layoutComponents[WHITE_INBOX_WRAPPER];
      if (!layoutComponent) {
        return null;
      }
      return React.createElement(
        layoutComponent,
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
      const { id, json, name } = this.props;
      const props = {
        id,
        name,
        ...restProps,
      };
      if (!layoutComponents[private_type]) {
        return null;
      }
      if (item.fullScreenCard) {
        delete item.fullScreenCard;
        props.AnimatedPageCounter = this.AnimatedPageCounter;
        props.AnimatedNavTitle = this.AnimatedNavTitle;
        props.setScrollEnabled = this.setScrollEnabled;
      }
      if (item.animateIndex) {
        props.animateIndex = item.animateIndex;
        props.onBack = this.onAnimatedClose;
      }
      if (item.wrapper) {
        delete item.wrapper;
        const layoutComponent = layoutComponents[INBOX_WRAPPER];
        if (!layoutComponent) {
          return null;
        }

        return React.createElement(
          layoutComponent,
          {
            key: this.dataKeyExtractor(item),
            animateIndex: item.animateIndex,
            navigator: this.props.navigator,
            discoverPath: this.props.discoverPath,
            slideBackground:
              item.animateIndex && item.animateIndex <= 2 ? this.state.slideBackground : false,
          },
          this.renderBlock(item)
        );
      }

      const layoutComponent = layoutComponents[private_type];
      if (!layoutComponent) {
        return null;
      }

      return React.createElement(
        layoutComponent,
        {
          ...props,
          navigator: this.props.navigator,
          discoverPath: this.props.discoverPath,
          storyGradient: props.story ? json.storyGradient : null,
          api,
          key: this.dataKeyExtractor(item),
        },
        private_blocks &&
          this.addParentCardProps(private_type, private_blocks, item.containerStyle).map(
            this.renderBlock
          )
      );
    };

    private readonly onAnimatedClose = (): void => {
      if (this.state.isClosingAnimation) {
        return;
      }
      this.setState({
        isClosingAnimation: true,
      });
      const { json } = this.props;
      const tabbedItems = json && json.tabbedItems;
      const timeout = this.scrollPosition < 1400 ? this.scrollPosition / 7 : 200;
      const outYPositon = tabbedItems && tabbedItems.length > 0 ? 1020 : 700;
      if (this.scrollPosition > 0) {
        this.scrollToTop();
      }
      setTimeout(() => {
        if (this.AnimatedCloseIcon) {
          this.AnimatedCloseIcon.transition({ opacity: 1 }, { opacity: 0 }, 400, 'linear');
        }
      }, 200);

      if (this.AnimatedAppleClose) {
        this.AnimatedAppleClose.transition(
          { translateY: -85 },
          { translateY: 0 },
          500,
          'ease-in-out-back'
        );
      }

      setTimeout(() => {
        if (this.AnimatedStory) {
          if (this.props.renderType && this.props.renderType === 'carousel') {
            this.AnimatedStory.transition(
              { translateY: 100 },
              { translateY: outYPositon },
              timeout + 550,
              'ease-out'
            );
          } else {
            this.AnimatedStory.transitionTo({ translateY: outYPositon }, timeout + 550, 'ease-out');
          }
        }
        if (this.props.onBack) {
          this.props.onBack();
        }
      }, timeout);
      // setTimeout(async () => {
      //   return this.props.navigator.dismissModal();
      // }, 550);
    };

    private readonly setScrollEnabled = (enabled: boolean): void => {
      this.setState({
        scrollEnabled: enabled,
      });
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

    private renderStoryGradient(): JSX.Element {
      const {
        json: { storyGradient, tabbedItems },
      } = this.props;
      const { scrollY } = this.state;
      const empty: any = this.props.json.empty || {};
      const { endFadePosition = 250, startFadePosition = 0 } = storyGradient || {};
      const headerOpacity = scrollY.interpolate({
        inputRange: [startFadePosition, endFadePosition],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      });
      if (tabbedItems && tabbedItems.length > 0) {
        return (
          <TabbedStory
            items={tabbedItems}
            activeIndex={this.state.activeProgressBarIndex}
            onCardPress={this.onTabbedCardPress}
          />
        );
      } else if (this.props.animate) {
        return (
          <FlatList
            data={(this.props.json && this.props.json.private_blocks) || []}
            keyExtractor={this.dataKeyExtractor}
            renderItem={this.renderBlockItem}
            ref={(ref) => {
              this.flatListRef = ref;
            }}
            style={[styles.growStretch, styles.animatedList]}
            onScroll={this.onScrollFlatList}
            ListEmptyComponent={
              <Text style={[styles.emptyMessage, empty && empty.textStyle]}>
                {(empty && empty.message) || 'No content found.'}
              </Text>
            }
          >
            {this.renderBlocks()}
          </FlatList>
        );
      }
      return (
        <>
          <FlatList
            data={this.props.json.private_blocks || []}
            renderItem={this.renderBlockItem}
            ListEmptyComponent={
              <Text style={[styles.emptyMessage, empty.textStyle]}>
                {empty.message || 'No content found.'}
              </Text>
            }
            style={styles.growStretch}
            scrollEventThrottle={16}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }])}
          >
            {this.renderBlocks()}
          </FlatList>
          <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
            <Image style={styles.headerImage} source={gradientImage} resizeMode={'cover'} />
          </Animated.View>
        </>
      );
    }

    private readonly onTabbedCardPress = () => {
      const { json } = this.props;
      if (json.tabbedItems && this.state.activeProgressBarIndex >= json.tabbedItems.length - 1) {
        this.onAnimatedClose();
      } else {
        this.setState({
          activeProgressBarIndex: this.state.activeProgressBarIndex + 1,
        });
      }
    };

    private renderContent(): JSX.Element {
      const { animate, animateScroll, backButton, containerStyle, json } = this.props;
      if (animateScroll) {
        return (
          <>
            <Animatable.View
              ref={this.handleAnimatedRef}
              useNativeDriver={false}
              style={[styles.animatedContainer]}
            >
              {this.renderScrollView()}
            </Animatable.View>
            {backButton && (
              <Animatable.View
                ref={this.handleAppleCloseRef}
                useNativeDriver={false}
                style={styles.closeModalButton}
              >
                <TouchableOpacity activeOpacity={1} onPress={this.onAnimatedClose}>
                  <Image
                    resizeMode="contain"
                    source={appleCloseIcon}
                    style={styles.appleCloseIcon}
                  />
                </TouchableOpacity>
              </Animatable.View>
            )}
          </>
        );
      }
      if (animate) {
        return (
          <>
            <Animatable.View
              ref={this.handleAnimatedRef}
              useNativeDriver={false}
              style={[styles.animatedContainer]}
            >
              {this.renderScrollView()}
            </Animatable.View>
            {json && json.tabbedItems && json.tabbedItems.length && (
              <View style={styles.progressBar}>
                {(json.tabbedItems || []).map((item: any, index: number) => (
                  <View
                    key={item.key}
                    style={[
                      styles.progressItem,
                      this.state.activeProgressBarIndex === index && styles.activeProgress,
                    ]}
                  />
                ))}
              </View>
            )}
            {backButton && (
              <TouchableOpacity
                onPress={this.onAnimatedClose}
                style={styles.animatedClose}
                activeOpacity={1}
              >
                <Animatable.Image
                  resizeMode="contain"
                  ref={this.handleCloseIconRef}
                  source={this.state.showDarkX ? iconCloseXDark : iconCloseXLight}
                  style={[styles.backIconCloseX]}
                />
              </TouchableOpacity>
            )}
          </>
        );
      }
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

    private readonly onScrollFlatList = (event: any) => {
      this.scrollPosition = event.nativeEvent.contentOffset.y;
      if (this.scrollPosition < topOffset) {
        this.onAnimatedClose();
      }
    };

    private readonly onSnapToItem = (index: number): void => {
      const pageNum = index + 1;
      if (
        this.props.json &&
        this.props.json.private_blocks &&
        this.props.json.private_blocks.length > 0 &&
        this.props.json.private_blocks[index]
      ) {
        DeviceEventEmitter.emit('swipeCard', {
          title: this.props.json.private_blocks[index]?.name,
          id: this.props.json.private_blocks[index]?.id,
          position: pageNum,
        });
      }
      this.setState({
        pageNum,
      });
    };

    private readonly renderFlatlistFooterPadding = (): JSX.Element => (
      <View style={styles.storyFooter} />
    );

    private renderScrollView(): JSX.Element {
      const { json } = this.props;
      const storyGradient = json && json.storyGradient;
      const tabbedItems = json && json.tabbedItems;
      const empty: any = (json && json.empty) || {};
      const fullScreenCardImage = json && json.fullScreenCardImage;

      if (this.props.renderType && this.props.renderType === 'carousel') {
        const autoplay = this.props.autoplay || false;
        const autoplayDelay = this.props.autoplayDelay || 1000;
        const autoplayInterval = this.props.autoplayInterval || 3000;
        return (
          <>
            {empty && !(json && json.private_blocks && json.private_blocks.length > 0) && (
              <Text style={[styles.emptyMessage, empty && empty.textStyle]}>
                {(empty && empty.message) || 'No content found.'}
              </Text>
            )}

            {this.state.showCarousel && (
              <Carousel
                data={(json && json.private_blocks) || []}
                layout={'default'}
                autoplay={autoplay}
                autoplayDelay={autoplayDelay}
                autoplayInterval={autoplayInterval}
                sliderWidth={Dimensions.get('screen').width}
                itemWidth={Dimensions.get('screen').width}
                renderItem={this.renderBlockItem}
                inactiveSlideOpacity={1}
                inactiveSlideScale={1}
                onSnapToItem={this.onSnapToItem}
                useScrollView={Platform.OS === 'ios'}
              />
            )}
            {!this.state.showCarousel && <ActivityIndicator style={styles.growAndCenter} />}
          </>
        );
      } else if (fullScreenCardImage) {
        return (
          <>
            <ImageBackground
              source={fullScreenCardImage}
              imageStyle={styles.imageStyle}
              style={styles.fullScreenDeeplink}
            />
            <FlatList
              data={(this.props.json && this.props.json.private_blocks) || []}
              keyExtractor={this.dataKeyExtractor}
              renderItem={this.renderBlockItem}
              style={[styles.growStretch, styles.deeplinkStory]}
              ListFooterComponent={this.renderFlatlistFooterPadding}
              ListEmptyComponent={
                <Text style={[styles.emptyMessage, empty && empty.textStyle]}>
                  {(empty && empty.message) || 'No content found.'}
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
      } else if (this.props.noScrollView) {
        return <>{this.renderBlocks()}</>;
      } else if (this.props.backButton && storyGradient && storyGradient.enabled) {
        return this.renderStoryGradient();
      } else if (tabbedItems && tabbedItems.length > 0) {
        return (
          <TabbedStory
            items={tabbedItems}
            activeIndex={this.state.activeProgressBarIndex}
            onCardPress={this.onTabbedCardPress}
          />
        );
      } else if (this.props.welcomeHeader) {
        return (
          <>
            <Animated.FlatList
              data={(this.props.json && this.props.json.private_blocks) || []}
              keyExtractor={this.dataKeyExtractor}
              renderItem={this.renderBlockItem}
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: this.state.scrollY } } }],
                { useNativeDriver: false }
              )}
              ListHeaderComponent={this.renderFlatlistHeader}
              ListFooterComponent={this.renderFlatlistFooter}
              ListEmptyComponent={
                <Text style={[styles.emptyMessage, empty && empty.textStyle]}>
                  {(empty && empty.message) || 'No content found.'}
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
            </Animated.FlatList>
          </>
        );
      }
      return (
        <>
          <FlatList
            data={this.props.json.private_blocks || []}
            keyExtractor={this.dataKeyExtractor}
            renderItem={this.renderBlockItem}
            ref={(ref: unknown) => {
              this.flatListRef = ref;
            }}
            onScroll={this.onScrollFlatList}
            ListHeaderComponent={this.renderFlatlistHeader}
            ListFooterComponent={this.renderFlatlistFooter}
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

    public componentWillUnmount(): void {
      // Check if closing because of navigation change or ui
      if (
        !this.state.isClosingAnimation && // If navigation change also try to return back out of the story
        this.props.onBack
      ) {
        this.props.onBack();
      }

      this.componentIsMounted = false;
    }

    public componentDidMount(): void {
      this.componentIsMounted = true;

      if (this.props.animate) {
        if (
          this.props.json &&
          this.props.json.tabbedItems &&
          this.props.json.tabbedItems.length > 0
        ) {
          this.setState({ showDarkX: true });
        }
        this.AnimatedStory.transition(
          { translateY: 700 },
          { translateY: 100 },
          700,
          'ease-out-cubic'
        );
        this.AnimatedCloseIcon.transition({ opacity: 0 }, { opacity: 1 }, 400, 'linear');
      }
      if (this.props.animateScroll) {
        if (this.AnimatedStory) {
          this.AnimatedStory.transition(
            { translateY: 700 },
            { translateY: 0 },
            700,
            'ease-out-cubic'
          );
        }
        if (this.AnimatedAppleClose) {
          setTimeout(() => {
            this.AnimatedAppleClose.transition(
              { translateY: 0 },
              { translateY: -85 },
              800,
              'ease-in-out-back'
            );
          }, 300);
        }
      }
      if (!(this.props.json && this.props.json.private_type === 'story')) {
        setTimeout(() => {
          if (this.componentIsMounted) {
            this.setState({ showCarousel: true });
          }
        }, 500);
      }
    }

    public componentDidUpdate(prevProps: EngagementScreenProps): void {
      const PRIVATE_BLOCKS = 'private_blocks';
      const prevBlocks = (prevProps.json && prevProps.json[PRIVATE_BLOCKS]) || [];
      const blocks = (this.props.json && this.props.json[PRIVATE_BLOCKS]) || [];

      if (
        prevBlocks.length === 0 &&
        blocks.length > 0 &&
        this.props.welcomeHeader &&
        this.AnimatedWelcome
      ) {
        this.AnimatedWelcome.transition(
          { translateY: -100 },
          { translateY: 0 },
          600,
          'ease-out-cubic'
        );
      }
    }

    public render(): JSX.Element {
      const { json, navBarTitle } = this.props;
      this.pageCounterStyle = json?.pageCounterStyle
        ? json.pageCounterStyle
        : this.pageCounterStyle;
      this.pageNumberStyle = json.pageNumberStyle ? json.pageNumberStyle : this.pageNumberStyle;
      const navBarTitleStyle = (json && json.navBarTitleStyle) || {};

      return (
        <EngagementContext.Provider
          value={{
            handleAction: this.handleAction,
            story: this.props.backButton ? this.props.json : undefined,
            language: this.props.language,
            cardPosition: this.props.cardPosition || 0,
            displayName: this.props.displayName,
          }}
        >
          <>
            {this.props.renderHeader && this.props.renderHeader()}
            {this.renderContent()}
            {this.props.renderType &&
              this.props.renderType === 'carousel' &&
              json &&
              json.private_blocks &&
              json.private_blocks.length > 0 && (
                <Animatable.View
                  ref={this.handlePageCounterRef}
                  useNativeDriver={false}
                  style={[styles.pageCounter, this.pageCounterStyle]}
                >
                  <Text style={[styles.pageNum, this.pageNumberStyle]}>
                    {this.state.pageNum} / {json.private_blocks.length}
                  </Text>
                </Animatable.View>
              )}
            {navBarTitle && (
              <Animatable.Text
                style={[styles.navBarTitle, navBarTitleStyle]}
                ref={this.handleNavTitleRef}
                useNativeDriver={false}
              >
                {navBarTitle}
              </Animatable.Text>
            )}
          </>
        </EngagementContext.Provider>
      );
    }
  };

export default WithEngagement;

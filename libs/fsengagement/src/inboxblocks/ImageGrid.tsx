import React, { Component, useContext } from 'react';

import type { ImageURISource, ViewStyle } from 'react-native';
import { Dimensions, View } from 'react-native';

import RenderImageTextItem from '../carousel/RenderImageTextItem';
import { EngagementContext } from '../lib/contexts';

const { width: viewportWidth } = Dimensions.get('window');

export interface GridItem {
  link: string;
  ratio: string;
  resizeMode: string;
  size: any;
  source: any;
  text: any;
}

export interface ImageGridState {
  tallestTextHeight: number;
}
export interface ImageGridProps {
  link: string;
  ratio?: string;
  resizeMode?: any;
  source: ImageURISource;
  size: any;
  text: any;
  headerStyle?: any;
  cardContainerStyle?: ViewStyle;
  textStyle?: any;
  eyebrowStyle?: any;
  items: GridItem[];
  options: any;
  containerStyle?: any;
}
type ImageGridContextProps = ImageGridProps & { context: any };
class ImageGrid extends Component<ImageGridContextProps, ImageGridState> {
  constructor(props: ImageGridContextProps) {
    super(props);
    this.state = {
      tallestTextHeight: 0,
    };
  }

  private wp(percentage: any): any {
    const { windowWidth } = this.props.context;
    const value = (percentage * (windowWidth || viewportWidth)) / 100;
    return Math.round(value);
  }

  private _renderItem(item: any, index: number): JSX.Element {
    const { eyebrowStyle, headerStyle, options, textStyle } = this.props;
    const { numColumns = 2 } = options;
    const totalItemWidth =
      this.calculateGridWidth() - options.spaceBetweenHorizontal * (numColumns - 1);
    const itemWidth = Math.round(totalItemWidth / numColumns);
    const { spaceBetweenHorizontal } = options;
    const { spaceBetweenVertical } = options;

    return (
      <RenderImageTextItem
        data={item}
        key={index}
        itemWidth={itemWidth}
        numColumns={numColumns}
        totalItemWidth={totalItemWidth}
        verticalSpacing={spaceBetweenVertical}
        horizPadding={spaceBetweenHorizontal}
        options={options}
        eyebrowStyle={eyebrowStyle}
        headerStyle={headerStyle}
        textStyle={textStyle}
        grid={true}
        noMargin={(index + 1) % numColumns === 0}
        even={(index + 1) % 2 === 0}
      />
    );
  }

  private parentCardStyles(): number {
    const { cardContainerStyle } = this.props;

    if (!cardContainerStyle) {
      return 0;
    }
    const ml = Number(cardContainerStyle.marginLeft || 0);
    const mr = Number(cardContainerStyle.marginRight || 0);
    const pr = Number(cardContainerStyle.paddingRight || 0);
    const pl = Number(cardContainerStyle.paddingLeft || 0);
    return ml + mr + pr + pl;
  }

  private horizontalMarginPadding(): number {
    const { containerStyle } = this.props;
    const ml = containerStyle.marginLeft || 0;
    const mr = containerStyle.marginRight || 0;
    const pr = containerStyle.paddingRight || 0;
    const pl = containerStyle.paddingLeft || 0;
    return ml + mr + pr + pl;
  }

  private calculateGridWidth(): number {
    const { windowWidth } = this.props.context;
    const sliderWidth = windowWidth || viewportWidth;
    return sliderWidth - this.horizontalMarginPadding() - this.parentCardStyles();
  }

  private createGrid(): JSX.Element {
    return (
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
      >
        {(this.props.items || []).map((product: any, index: number) =>
          this._renderItem(product, index)
        )}
      </View>
    );
  }

  public shouldComponentUpdate(
    nextProps: ImageGridContextProps,
    nextState: ImageGridState
  ): boolean {
    return (
      this.props.containerStyle !== nextProps.containerStyle ||
      this.props.items !== nextProps.items ||
      this.props.ratio !== nextProps.ratio ||
      this.props.options !== nextProps.options ||
      this.props.resizeMode !== nextProps.resizeMode ||
      this.props.source !== nextProps.source ||
      this.props.headerStyle !== nextProps.headerStyle ||
      this.props.textStyle !== nextProps.textStyle ||
      this.props.eyebrowStyle !== nextProps.eyebrowStyle ||
      this.props.context !== nextProps.context ||
      this.state.tallestTextHeight !== nextState.tallestTextHeight
    );
  }

  public render(): JSX.Element {
    const { containerStyle } = this.props;
    const grid = this.createGrid();
    return <View style={containerStyle}>{grid}</View>;
  }
}

export default (props: ImageGridProps) => {
  const context = useContext(EngagementContext);
  return <ImageGrid {...props} context={context} />;
};
import type { RefObject } from 'react';
import React, { Component } from 'react';

import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { Image, Text, TextInput, View } from 'react-native';

import { memoize } from 'lodash-es';

import errorIcon from '../../../../assets/images/alert.png';
import successIcon from '../../../../assets/images/checkmarkValidation.png';

import { FormLabelPosition } from './fieldTemplates';
import { defaultTextboxStyle, getColor } from './formStyles';

export interface StatefulTextboxProps {
  labelPosition: FormLabelPosition;
  locals: Record<string, any>;
  // for use w/ custom field templates
  componentFactory?: unknown;
}

export interface StatefulTextboxState {
  active: boolean;
  validated: boolean;
}

export type ComputeFieldType = (prevField: unknown) => () => void;

export default class StatefulTextbox extends Component<StatefulTextboxProps, StatefulTextboxState> {
  constructor(props: StatefulTextboxProps) {
    super(props);

    this.input = React.createRef<TextInput>();

    this.defaultStyle = defaultTextboxStyle(props.locals);

    this.activeErrorField = this.defaultStyle.activeErrorField;
    this.alertStyle = this.defaultStyle.alertStyle;
    this.checkStyle = this.defaultStyle.checkStyle;
    this.controlLabelStyle = this.defaultStyle.controlLabelStyle;
    this.errorBlockStyle = this.defaultStyle.errorBlockStyle;
    this.help = this.defaultStyle.help;
    this.rightTextboxIconStyle = this.defaultStyle.rightTextboxIconStyle;
    this.textboxViewStyle = this.defaultStyle.textboxViewStyle;

    switch (props.labelPosition) {
      case FormLabelPosition.Inline:
        this.groupStyle = this.defaultStyle.inlineFormGroupStyle;
        this.textboxStyle = this.defaultStyle.textboxInlineStyle;
        this.labelViewStyle = this.defaultStyle.inlineLabelViewStyle;
        break;
      case FormLabelPosition.Above:
        this.groupStyle = this.defaultStyle.formGroupStyle;
        this.textboxStyle = this.defaultStyle.textboxFullBorderStyle;
        this.labelViewStyle = this.defaultStyle.inlineLabelViewStyle;
        break;
      case FormLabelPosition.Floating:
        this.groupStyle = this.defaultStyle.formGroupStyle;
        this.textboxStyle = this.defaultStyle.textboxUnderlineStyle;
        this.labelViewStyle = this.defaultStyle.floatingLabelViewStyle;
        break;
      case FormLabelPosition.Hidden:
        this.groupStyle = this.defaultStyle.formGroupStyle;
        this.textboxStyle = this.defaultStyle.textboxFullBorderStyle;
        this.labelViewStyle = { display: 'none' };
        break;
      default:
        this.groupStyle = this.defaultStyle.inlineFormGroupStyle;
        this.textboxStyle = this.defaultStyle.textboxInlineStyle;
        this.labelViewStyle = this.defaultStyle.inlineLabelViewStyle;
    }
  }

  private readonly activeErrorField: JSX.Element;
  private readonly alertStyle: StyleProp<ImageStyle>;
  private readonly checkStyle: StyleProp<ImageStyle>;
  private readonly controlLabelStyle: StyleProp<ViewStyle>;
  private readonly defaultStyle: any;
  private readonly errorBlockStyle: StyleProp<ViewStyle>;
  private readonly groupStyle: StyleProp<ViewStyle>;
  private readonly help: JSX.Element;
  private readonly labelViewStyle: StyleProp<ViewStyle>;
  private readonly rightTextboxIconStyle: StyleProp<ViewStyle>;
  private readonly textboxStyle: StyleProp<ViewStyle>;
  private readonly textboxViewStyle: StyleProp<ViewStyle>;

  public state: StatefulTextboxState = {
    active: false,
    validated: false,
  };

  // memoizes returned function so as not to recompute on each rerender
  private readonly computeBlur: ComputeFieldType = memoize((prevOnBlur) => () => {
    this.onBlur();

    if (typeof prevOnBlur === 'function') {
      prevOnBlur();
    }
  });

  private readonly computeFocus: ComputeFieldType = memoize((prevOnFocus) => () => {
    this.onFocus();

    if (typeof prevOnFocus === 'function') {
      prevOnFocus();
    }
  });

  private readonly onFocus = () => {
    this.setState({
      active: true,
      validated: false,
    });
  };

  private readonly onBlur = () => {
    this.setState({
      active: false,
      validated: true,
    });
  };

  private readonly input: RefObject<TextInput>;

  public componentDidMount(): void {
    console.warn(
      'StatefulTextbox is deprecated and will be removed in the next version of Flagship.'
    );
  }

  public render(): JSX.Element {
    const { componentFactory, labelPosition, locals } = this.props;

    const prevOnBlur = locals.onBlur;
    const prevOnFocus = locals.onFocus;

    locals.onBlur = this.computeBlur(prevOnBlur);
    locals.onFocus = this.computeFocus(prevOnFocus);

    const color = getColor(this.state, locals);

    let label: JSX.Element;
    let error: JSX.Element;

    // eslint-disable-next-line prefer-const
    error = locals.error ? (
      <Text accessibilityLiveRegion="polite" style={this.errorBlockStyle}>
        {locals.error}
      </Text>
    ) : (
      this.activeErrorField
    );

    if (labelPosition === FormLabelPosition.Inline) {
      locals.placeholder = this.state.active ? null : locals.error;
      locals.placeholderTextColor = locals.stylesheet.colors.error;
    }

    if (labelPosition === FormLabelPosition.Floating) {
      label = locals.value ? (
        <Text style={[this.controlLabelStyle, { color }]}>{locals.label}</Text>
      ) : (
        <Text style={this.controlLabelStyle}>&nbsp;</Text>
      );
    } else {
      label = <Text style={[this.controlLabelStyle, { color }]}>{locals.label}</Text>;
    }

    if (labelPosition === FormLabelPosition.Above) {
      locals.placeholder = '';
    }

    const getIcon = () =>
      this.props.locals.hasError ? (
        <Image source={errorIcon} style={this.alertStyle} />
      ) : (
        <Image source={successIcon} style={this.checkStyle} />
      );

    return (
      <View>
        <View style={[this.groupStyle, { borderColor: color }]}>
          <View style={this.labelViewStyle}>{label}</View>
          <View style={this.textboxViewStyle}>
            {componentFactory instanceof Function ? (
              componentFactory(locals, this.textboxStyle, color)
            ) : (
              <TextInput
                accessibilityLabel={locals.label}
                onChange={locals.onChangeNative}
                onChangeText={locals.onChange}
                ref={this.input}
                style={[this.textboxStyle, { borderColor: color }]}
                {...locals}
              />
            )}
            <View style={this.rightTextboxIconStyle}>
              {this.state.validated ? getIcon() : null}
            </View>
          </View>
          {labelPosition !== FormLabelPosition.Inline
            ? this.state.active
              ? this.activeErrorField
              : error
            : null}
        </View>
        <View>{this.help}</View>
      </View>
    );
  }
}

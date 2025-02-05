import React from 'react';

import { Text } from 'react-native';

export const getColor = (state: Record<string, any>, locals: Record<string, any>): string => {
  const { colors } = locals.stylesheet;
  if (state.active) {
    return colors.active;
  }
  return locals.hasError ? colors.error : colors.inactive;
};

// eslint-disable-next-line max-statements
export const defaultTextboxStyle = (locals: Record<string, any>): Record<string, any> => {
  const { stylesheet } = locals;

  let controlLabelStyle = stylesheet.controlLabel.normal;
  let formGroupStyle = stylesheet.formGroup.normal;
  let helpBlockStyle = stylesheet.helpBlock.normal;
  let inlineFormGroupStyle = stylesheet.inlineFormGroup.normal;
  let textboxFullBorderStyle = stylesheet.textboxFullBorder.normal;
  let textboxInlineStyle = stylesheet.textboxInline.normal;
  let textboxUnderlineStyle = stylesheet.textboxUnderline.normal;
  let textboxViewStyle = stylesheet.textboxView.normal;

  const alertStyle = stylesheet.alert;
  const checkStyle = stylesheet.check;
  const errorBlockStyle = stylesheet.errorBlock;
  const floatingLabelViewStyle = stylesheet.floatingLabelView;
  const inlineLabelViewStyle = stylesheet.inlineLabelView;
  const rightTextboxIconStyle = stylesheet.rightTextboxIcon;

  if (locals.hasError) {
    controlLabelStyle = stylesheet.controlLabel.error;
    formGroupStyle = stylesheet.formGroup.error;
    helpBlockStyle = stylesheet.helpBlock.error;
    inlineFormGroupStyle = stylesheet.inlineFormGroup.error;
    textboxFullBorderStyle = stylesheet.textboxFullBorder.error;
    textboxInlineStyle = stylesheet.textboxInline.error;
    textboxUnderlineStyle = stylesheet.textboxUnderline.error;
    textboxViewStyle = stylesheet.textboxView.error;
  }

  if (locals.editable === false) {
    textboxFullBorderStyle = stylesheet.textboxFullBorder.notEditable;
    textboxInlineStyle = stylesheet.textboxInline.notEditable;
    textboxUnderlineStyle = stylesheet.textboxUnderline.notEditable;
    textboxViewStyle = stylesheet.textboxView.notEditable;
  }

  let help;

  if (typeof locals.help === 'string') {
    help = <Text style={helpBlockStyle}>{locals.help}</Text>;
  } else if (React.isValidElement(locals.help)) {
    // eslint-disable-next-line prefer-destructuring
    help = locals.help;
  }

  const activeErrorField = (
    <Text accessibilityLiveRegion="polite" style={errorBlockStyle}>
      &nbsp;
    </Text>
  );

  return {
    alertStyle,
    checkStyle,
    controlLabelStyle,
    activeErrorField,
    errorBlockStyle,
    floatingLabelViewStyle,
    formGroupStyle,
    help,
    helpBlockStyle,
    inlineFormGroupStyle,
    inlineLabelViewStyle,
    rightTextboxIconStyle,
    textboxFullBorderStyle,
    textboxInlineStyle,
    textboxUnderlineStyle,
    textboxViewStyle,
  };
};

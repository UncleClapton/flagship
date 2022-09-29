import React from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { CommerceTypes } from '@brandingbrand/fscommerce';
import FSI18n, { translationKeys } from '@brandingbrand/fsi18n';

import { action } from '@storybook/addon-actions';
import { object } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';
import Decimal from 'decimal.js';

import { CartItem, VariantCartItem } from '../src/components/CartItem';
import { Stepper } from '../src/components/Stepper';

const noopPromise = async () => {};

const styles = StyleSheet.create({
  quantityRowStyle: {
    justifyContent: 'space-between',
  },
  removeButtonStyle: {
    marginRight: 20,
  },
  removeButtonTextStyle: {
    color: 'red',
  },
  rightColumnStyle: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  stepperStyle: {
    alignItems: 'center',
    borderWidth: 0,
    flexDirection: 'row',
  },
});

const testCartItem: CommerceTypes.CartItem = {
  title: 'Kingsford 24',
  itemId: '153141',
  productId: '1534131',
  itemText: 'Test text',
  quantity: 3,
  totalPrice: {
    value: new Decimal(30),
    currencyCode: 'USD',
  },
  price: {
    value: new Decimal(10),
    currencyCode: 'USD',
  },
  originalPrice: {
    value: new Decimal(20),
    currencyCode: 'USD',
  },
  handle: 'Kingsford-24-Charcoal-Grill',
  images: [{ uri: 'https://placehold.it/100x100' }],
  options: [
    {
      id: 'size',
      name: 'Size',
      values: [
        {
          name: 'Small',
          value: 'S',
          available: true,
        },
        {
          name: 'Large',
          value: 'L',
          available: true,
        },
      ],
    },
  ],
  variants: [
    {
      id: '1534131',
      available: true,
      optionValues: [
        {
          name: 'size',
          value: 'L',
        },
      ],
    },
  ],
};

const renderStepper = () => (
  <Stepper
    count={testCartItem.quantity}
    countUpperLimit={10}
    onDecreaseButtonPress={action('Stepper onDecreaseButtonPress')}
    onIncreaseButtonPress={action('Stepper onIncreaseButtonPress')}
    stepperStyle={styles.stepperStyle}
  />
);

const renderRemoveButton = (): React.ReactNode => (
  <TouchableOpacity onPress={action('RemoveButton onPress')}>
    <View style={styles.removeButtonStyle}>
      <Text style={styles.removeButtonTextStyle}>
        {FSI18n.string(translationKeys.flagship.cart.actions.remove.actionBtn)}
      </Text>
    </View>
  </TouchableOpacity>
);

storiesOf('CartItem', module)
  .add('basic usage', () => (
    <CartItem
      {...object('CartItem', testCartItem)}
      quantityRowStyle={styles.quantityRowStyle}
      removeButtonStyle={styles.removeButtonStyle}
      removeButtonTextStyle={styles.removeButtonTextStyle}
      removeItem={noopPromise}
      renderRemoveButton={renderRemoveButton}
      renderStepper={renderStepper}
      rightColumnStyle={styles.rightColumnStyle}
      stepperStyle={styles.stepperStyle}
      updateQty={noopPromise}
    />
  ))
  .add('variant cart item', () => (
    <VariantCartItem {...object('CartItem', testCartItem)} onQtyChange={noopPromise} />
  ));
import type { Action, Middleware, PreloadedState, ReducersMapObject, Store } from 'redux';
import { applyMiddleware, compose, createStore } from 'redux';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';

import setupReducers from '../reducers';

const anyWindow: any = window;
let standardMiddleware = [thunk];

if (__DEV__) {
  const reduxImmutableStateInvariant = require('redux-immutable-state-invariant').default();
  const logger = createLogger({ collapsed: true });
  standardMiddleware = [...standardMiddleware, reduxImmutableStateInvariant, logger];
}
const composeEnhancers =
  (typeof anyWindow !== 'undefined' && anyWindow.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

const configureStore = <S, A extends Action, Ext, StateExt>(
  initialState: PreloadedState<S> = {} as PreloadedState<S>,
  reducers: ReducersMapObject<S, A>,
  middleware: Middleware[]
): Ext & Store<S & StateExt, A> =>
  createStore<S, A, Ext, StateExt>(
    setupReducers<S, A>(reducers),
    initialState,
    composeEnhancers(applyMiddleware(...middleware, ...standardMiddleware))
  );

export default configureStore;
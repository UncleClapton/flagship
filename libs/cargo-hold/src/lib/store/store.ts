import type { AnyActionReducer, Effect, IStore } from './store.types';
import { asapScheduler, BehaviorSubject, Observable, ReplaySubject, Subscription } from 'rxjs';
import { observeOn, scan, switchMap } from 'rxjs/operators';
import { ActionBus } from '../action-bus';
import { accumulateToArray } from '../internal/util/operators';

/**
 * `Store` provides the state container and facilitates effects & reducers upon state.
 *
 * @param initialState The initial state intended for the store.
 */
export class Store<State> extends ActionBus implements IStore<State> {
  private readonly _state$: BehaviorSubject<State>;
  private readonly _reducer$ = new ReplaySubject<AnyActionReducer<State>>();

  constructor(initialState: State) {
    super();
    const allReducers$ = this._reducer$.pipe(accumulateToArray());
    this._state$ = new BehaviorSubject(initialState);
    const reducerSubscription = allReducers$
      .pipe(
        switchMap((reducers) =>
          this._action$.pipe(
            scan(
              (currentState, action) =>
                reducers.reduce((state, reducer) => reducer(action)(state), currentState),
              initialState
            )
          )
        )
      )
      .subscribe(this._state$);

    this.subscriptions.add(reducerSubscription);
  }

  public get state(): State {
    return this._state$.value;
  }

  public get state$(): Observable<State> {
    return this._state$;
  }

  public registerReducer = (reducer: AnyActionReducer<State>): void => {
    this._reducer$.next(reducer);
  };

  public registerEffect = (effect: Effect<State>): Subscription => {
    const subscription = effect(this._action$, this._state$)
      .pipe(
        // allow reducers to run before more actions are piled onto action$
        observeOn(asapScheduler)
      )
      .subscribe(this._action$);
    this.subscriptions.add(subscription);
    return subscription;
  };
}

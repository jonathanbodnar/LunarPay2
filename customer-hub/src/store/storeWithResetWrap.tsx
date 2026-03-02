/**
 * A wrapper for zustand's create function that adds a reset functionality to the store. i.e when login in or logout, we need full reset
 * The reset functionality is accessible through the `resetAllStores` function.
 *
 * @example
 * const useMyStore = createWithReset((set, get) => ({
 *   myState: 'initial value',
 *   setMyState: (newState) => set({ myState: newState }),
 * }));
 *
 * // Later in the code, you can reset the store to its initial state
 * resetAllStores();
 */

import type { StateCreator } from 'zustand'
import { create as actualCreate } from 'zustand'

const storeResetFns = new Set<() => void>()

export const resetAllStatusStores = () => {
  storeResetFns.forEach((resetFn) => resetFn())
}

type WithReset = {
  resetState: () => void;
};

function create<T extends WithReset>(stateCreator: StateCreator<T>) {
  const store = actualCreate(stateCreator)
  const initialState = store.getState()

  storeResetFns.add(() => {
    store.setState(initialState, true)
  })
  
  return store
}

export const createWithReset = create;


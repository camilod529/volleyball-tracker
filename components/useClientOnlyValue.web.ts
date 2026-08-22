import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

// `getServerSnapshot` only runs during server rendering, meaning
// we can use this to determine if we're on the server or not.
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  return useSyncExternalStore<S | C>(
    emptySubscribe,
    () => client,
    () => server
  );
}

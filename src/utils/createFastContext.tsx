import React, {
	useRef,
	createContext,
	useContext,
	useCallback,
	useSyncExternalStore
} from 'react';

export default function createFastContext<TableStore>(
	initialState: TableStore
) {
	function useStoreData(passedInitialState?: Partial<TableStore>) {
		const store = useRef(
			typeof passedInitialState !== 'undefined'
				? { ...initialState, ...passedInitialState }
				: initialState
		);

		const get = useCallback(() => store.current, []);

		const subscribers = useRef(new Set<() => void>());

		const set = useCallback((value: Partial<TableStore>) => {
			store.current = { ...store.current, ...value };
			subscribers.current.forEach((callback) => callback());
		}, []);

		const subscribe = useCallback((callback: () => void) => {
			subscribers.current.add(callback);
			return () => subscribers.current.delete(callback);
		}, []);

		return {
			get,
			set,
			subscribe
		} as const;
	}

	type UseStoreDataReturnType = ReturnType<typeof useStoreData>;

	const StoreContext = createContext<UseStoreDataReturnType | null>(null);

	function Provider({
		children,
		passedInitialState
	}: {
		children: React.ReactNode;
		passedInitialState?: Partial<TableStore>;
	}) {
		return (
			<StoreContext.Provider value={useStoreData(passedInitialState)}>
				{children}
			</StoreContext.Provider>
		);
	}

	function useStore<SelectorOutput>(
		selector: (store: TableStore) => SelectorOutput
	) {
		const store = useContext(StoreContext);
		if (!store) {
			throw new Error('TableStore not found');
		}

		const state = useSyncExternalStore(
			store.subscribe,
			() => selector(store.get()),
			() => selector(initialState)
		);

		const getState = () => selector(store.get());

		const setState = (
			value: Partial<TableStore> | ((prevData: TableStore) => TableStore)
		) => {
			if (typeof value === 'function') {
				value(store.get());
				return undefined;
			}

			store.set(value);
			return undefined;
		};

		return [state, setState, getState] as const;
	}

	return {
		Provider,
		useStore
	};
}

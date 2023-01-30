import type {
	GetNextPageParamFunction,
	QueryKey,
	UseInfiniteQueryOptions
} from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';

import { useEffect, useMemo, useRef, useState } from 'react';

export type CustomGetNextPageParam<TData, TQueryKey> =
	| GetNextPageParamFunction<{
			data: TData;
			cursor?: TQueryKey | undefined;
	  }>
	| undefined;

export const useCustomInfiniteQuery = <
	TData,
	TQueryKey extends [string, { cursor: unknown; filterBy?: unknown }]
>({
	initialCursor,
	queryMainKey,
	fetchFn,
	getNextPageParam,
	onQueryKeyChange,
	options = {},
	filterBy = {}
}: {
	initialCursor: TQueryKey[1]['cursor'];
	queryMainKey: TQueryKey[0];
	filterBy?: NonNullable<TQueryKey[1]['filterBy']>;
	fetchFn: (query: TQueryKey[1]) => Promise<TData>;
	/**
	 * Don't forget to memoize it
	 * @param queryKey
	 * @returns
	 */
	onQueryKeyChange?: (
		queryKey: readonly [
			TQueryKey[0],
			{
				readonly initialCursor: TQueryKey[1]['cursor'];
				readonly filterBy: NonNullable<TQueryKey[1]['filterBy']>;
			}
		]
	) => void;
	getNextPageParam?:
		| GetNextPageParamFunction<{
				data: TData;
				cursor?: TQueryKey[1]['cursor'] | undefined;
		  }>
		| undefined;

	options?:
		| Partial<
				Omit<
					UseInfiniteQueryOptions<
						{ data: TData; cursor?: TQueryKey[1]['cursor'] | undefined },
						{ message: string },
						{ data: TData; cursor?: TQueryKey[1]['cursor'] | undefined },
						{ data: TData; cursor?: TQueryKey[1]['cursor'] | undefined },
						QueryKey
					>,
					'queryKey' | 'queryFn' | 'getNextPageParam'
				>
		  >
		| undefined;
}) => {
	const queryKey = useMemo(
		() => [queryMainKey, { initialCursor, filterBy }] as const,
		[initialCursor, filterBy, queryMainKey]
	);
	const config = useRef<{
		queryKey: typeof queryKey | null;
	}>({
		queryKey
	});
	const infiniteQuery = useInfiniteQuery<
		{
			data: TData;
			cursor?: TQueryKey[1]['cursor'];
		},
		{ message: string }
	>(
		queryKey,
		async ({ pageParam }) => {
			const cursor: TQueryKey[1]['cursor'] = pageParam || initialCursor;

			const query = { cursor, filterBy } as TQueryKey[1];

			return {
				data: await fetchFn(query),
				cursor: cursor
			};
		},
		{
			...options,
			getNextPageParam
		}
	);

	const infiniteQueryData = infiniteQuery.data || {
		pageParams: [],
		pages: []
	};

	const [currentIndex, setCurrentIndex] = useState(0);

	const isNextPageDisabled =
		(!infiniteQuery.hasNextPage &&
			currentIndex + 1 === infiniteQuery.data?.pages.length) ||
		infiniteQuery.isFetching;

	const isPreviousPageDisabled = currentIndex === 0 || infiniteQuery.isFetching;

	useEffect(() => {
		const configCurrent = config.current;
		if (configCurrent.queryKey !== queryKey) {
			setCurrentIndex(0);
			onQueryKeyChange && setTimeout(() => onQueryKeyChange?.(queryKey), 0);
			configCurrent.queryKey = queryKey;
		}

		return () => {
			configCurrent.queryKey = null;
		};
	}, [onQueryKeyChange, queryKey]);

	return {
		infiniteQuery,
		infiniteQueryData,
		isNextPageDisabled,
		isPreviousPageDisabled,
		currentIndex,
		setCurrentIndex,
		queryKey
	};
};

export const useDebounce = <TData>(initValue: TData, delay?: number) => {
	const [value, setValue] = useState(initValue);
	const [debouncedValue, setDebouncedValue] = useState(initValue);

	useEffect(() => {
		if (!delay) return;

		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return {
		value,
		setValue,
		debouncedValue
	};
};

import type {
	GetNextPageParamFunction,
	QueryKey,
	UseInfiniteQueryOptions
} from 'react-query';
import { useInfiniteQuery } from 'react-query';

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
	defaultCursor,
	queryMainKey,
	fetchFn,
	getNextPageParam,
	options = {},
	filterBy = {}
}: {
	// defaultCursor: TQueryKey;
	defaultCursor: TQueryKey[1]['cursor'];
	queryMainKey: TQueryKey[0];
	filterBy?: NonNullable<TQueryKey[1]['filterBy']>;
	fetchFn: (query: TQueryKey[1]) => Promise<TData>;
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
		() => [queryMainKey, { defaultCursor, filterBy }],
		[defaultCursor, filterBy, queryMainKey]
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
			// console.log('pageParam', pageParam);
			const cursor: TQueryKey[1]['cursor'] = pageParam || defaultCursor;

			// Type '{ cursor: TQueryKey[1]["cursor"]; filterBy: filterBy | undefined; }' does not satisfy the expected type 'TQueryKey[1]'.
			// '{ cursor: TQueryKey[1]["cursor"]; filterBy: filterBy | undefined; }' is assignable to the constraint of type 'TQueryKey[1]', but 'TQueryKey[1]' could be instantiated with a different subtype of constraint '{ cursor: unknown; filterBy?: filterBy | undefined; }'.ts(1360)
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

	// console.log('infiniteQuery', infiniteQuery);

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
		if (configCurrent.queryKey !== queryKey) setCurrentIndex(0);

		return () => {
			configCurrent.queryKey = null;
		};
	}, [queryKey]);

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

export const useDebounce = <TData>(initValue: TData, delay: number) => {
	const [value, setValue] = useState(initValue);
	const [debouncedValue, setDebouncedValue] = useState(initValue);

	useEffect(() => {
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

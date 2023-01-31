import type {
	TFilters,
	TableStore,
	TStringFilter
} from '@/components/utils/types';
import type { StoreApi } from 'zustand';
import type { Table, Column } from '@tanstack/react-table';
import type { InputHTMLAttributes, ChangeEvent } from 'react';

import { useStore } from 'zustand';
import { useCallback, useEffect, useState, useMemo } from 'react';

function DebouncedInput({
	value: initialValue,
	onChange,
	debounce = 500,
	...props
}: {
	value: string | number;
	onChange: (value: string) => void;
	debounce?: number;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
	const [value, setValue] = useState(initialValue);

	useEffect(() => {
		setValue(initialValue);
	}, [initialValue]);

	useEffect(() => {
		const timeout = setTimeout(() => {
			onChange(value.toString());
		}, debounce);

		return () => clearTimeout(timeout);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debounce, value]);

	return (
		<input
			{...props}
			value={value}
			onChange={(e) => setValue(e.target.value)}
		/>
	);
}

const isAFilter = (item: any): item is { [key: string]: TFilters } =>
	typeof item === 'object' && item;

function Filter<TData extends Record<string, unknown>>({
	column,
	table,
	store
}: {
	column: Column<TData, unknown>;
	table: Table<TData>;
	store: StoreApi<TableStore<TData>>;
}) {
	const firstValue = useMemo(
		() => table.getPreFilteredRowModel().flatRows[0]?.getValue(column.id),
		[column.id, table]
	);
	const filterByFormValues = useStore(
		store,
		(state: TableStore<TData>) => state.filterByFormValues
	);

	const columnFilterValue = useMemo(() => column.getFilterValue(), [column]);
	const remoteFilter = useStore(
		store,
		(state: TableStore<TData>) => state.remoteFilter
	);
	const setFilterByFormValues = useStore(
		store,
		(state: TableStore<TData>) => state.setFilterByFormValues
	);

	const _filterByFormValues = isAFilter(filterByFormValues)
		? column.id in filterByFormValues &&
		  typeof filterByFormValues[column.id] === 'object' &&
		  filterByFormValues[column.id]
			? (filterByFormValues[column.id] as TFilters | undefined)
			: undefined
		: undefined;

	if (!_filterByFormValues) return <></>;

	if (_filterByFormValues.dataType === 'text')
		return (
			<StringFilter
				column={column}
				filterByFormValues={_filterByFormValues}
				store={store}
				columnFilterValue={columnFilterValue}
				remoteFilter={remoteFilter}
				setFilterByFormValues={setFilterByFormValues}
			/>
		);

	return <></>;

	/*
	return typeof firstValue === 'number' ? (
		<div>
			<div className='flex space-x-2'>
				<DebouncedInput
					type='number'
					min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
					max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
					value={(columnFilterValue as [number, number])?.[0] ?? ''}
					onChange={(value) =>
						column.setFilterValue((old: [number, number]) => [value, old?.[1]])
					}
					placeholder={`Min`}
					className='w-24 border shadow rounded px-2 py-1'
					name={`${column.id}-min`}
				/>
				<DebouncedInput
					type='number'
					min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
					max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
					value={(columnFilterValue as [number, number])?.[1] ?? ''}
					onChange={(value) =>
						column.setFilterValue((old: [number, number]) => [old?.[0], value])
					}
					placeholder={`Max`}
					className='w-24 border shadow rounded px-2 py-1'
					name={`${column.id}-max`}
				/>
			</div>
			<div className='h-1' />
		</div>
	) : (
		<>
			<DebouncedInput
				type='text'
				value={(columnFilterValue ?? '') as string}
				onChange={(value) => column.setFilterValue(value)}
				placeholder={`Search...`}
				className='w-36 border shadow rounded px-2 py-1'
				list={column.id + 'list'}
				name={column.id}
			/>
			<div className='h-1' />
		</>
	);
	*/
}

const StringFilter = <TData extends Record<string, unknown>>({
	column,
	filterByFormValues,
	store,
	columnFilterValue,
	remoteFilter,
	setFilterByFormValues
}: {
	column: Column<TData, unknown>;
	filterByFormValues: TStringFilter;
	store: StoreApi<TableStore<TData>>;
	columnFilterValue: unknown;
	remoteFilter: TableStore<TData>['remoteFilter'];
	setFilterByFormValues: TableStore<TData>['setFilterByFormValues'];
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'>) => {
	// const columnFilterValue = useMemo(() => column.getFilterValue(), [column]);
	// const columnFilterValue = useMemo(() => column.getFilterValue(), [column]);
	const value =
		remoteFilter && column.id && filterByFormValues
			? filterByFormValues.value ?? ''
			: ((columnFilterValue ?? '') as string);

	const onChange = useCallback(
		(value: string) => {
			console.log('remoteFilter', remoteFilter);
			if (remoteFilter)
				return setFilterByFormValues((prevData) => {
					console.log('prevData', prevData);
					console.log('column.id', column.id);
					if (!prevData) return prevData;
					const filter = prevData[column.id];
					return {
						...prevData,
						[column.id]:
							!filter || filter?.dataType !== 'text'
								? filter
								: { ...filter, value }
					};
				});

			column.setFilterValue(value);
		},
		[column, remoteFilter, setFilterByFormValues]
	);

	return (
		<DebouncedInput
			type='text'
			value={value}
			onChange={onChange}
			className='w-36 border shadow rounded px-2 py-1'
			list={column.id + 'list'}
			name={column.id}
		/>
	);
};

export default Filter;

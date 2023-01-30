import { createStore } from 'zustand';

import type { TableStore, StoreUpdaterOrValue } from './types';

export const handleCreateStore = <TData extends Record<string, any>[]>({
	filterByFormValues
}: {
	filterByFormValues?: TableStore<TData[number]>['filterByFormValues'];
}) =>
	createStore<TableStore<TData[number]>>((set: any) => ({
		columnFilters: [],
		rowSelection: {},
		filterByFormValues,
		debouncedValue: {},
		currentPageIndex: 0,
		remoteFilter: true,

		incrementCurrentPageIndex: () =>
			set((state: TableStore<TData[number]>) => ({
				currentPageIndex: state.currentPageIndex + 1
			})),
		decrementCurrentPageIndex: () =>
			set((state: TableStore<TData[number]>) => ({
				currentPageIndex: state.currentPageIndex - 1
			})),
		setRowSelection: (updaterOrValue: StoreUpdaterOrValue<'rowSelection'>) =>
			set((prevData: TableStore<TData[number]>) => ({
				rowSelection:
					typeof updaterOrValue === 'function'
						? updaterOrValue(prevData.rowSelection)
						: updaterOrValue
			})),
		setColumnFilters: (updaterOrValue: StoreUpdaterOrValue<'columnFilters'>) =>
			set((prevData: TableStore<TData[number]>) => ({
				columnFilters:
					typeof updaterOrValue === 'function'
						? updaterOrValue(prevData.columnFilters)
						: updaterOrValue
			})),
		setFilterByFormValues: (
			updaterOrValue: StoreUpdaterOrValue<'filterByFormValues'>
		) =>
			set((prevData: TableStore<TData[number]>) => ({
				filterByFormValues: !prevData.filterByFormValues
					? prevData.filterByFormValues
					: typeof updaterOrValue === 'function'
					? updaterOrValue(prevData.filterByFormValues)
					: updaterOrValue
			}))
	}));

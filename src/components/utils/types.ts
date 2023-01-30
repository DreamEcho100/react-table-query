import type {
	ColumnFiltersState,
	RowSelectionState
} from '@tanstack/react-table';
import type { DeepKeys } from '@tanstack/react-table';

export type TStringFilter = {
	dataType: 'text';
	filterType: 'EQUAL';
	// | 'NOT_EQUAL'
	// | 'CONTAINS'
	// | 'START_WITH'
	// | 'END_WITH';
	value?: string;
	constraints?: { min?: number; max?: number };
	// valueTransformer?: (value: string) => any;
};
type TNumberFilter = {
	dataType: 'number';
	// valueTransformer?: (value: string) => any;
	constraints?: { min?: number; max?: number };
} & (
	| {
			filterType:
				| 'EQUAL'
				| 'NOT_EQUAL'
				| 'GREATER_THAN'
				| 'GREATER_THAN_OR_EQUAL'
				| 'LESS_THAN'
				| 'LESS_THAN_OR_EQUAL';
			value?: number;
	  }
	| {
			filterType: 'RANGE';
			value?: { min?: number; max?: number };
	  }
);

export type TFilters = TStringFilter | TNumberFilter;

export type StoreUpdaterOrValue<
	T extends keyof TableStore<Record<string, unknown>>
> =
	| TableStore<Record<string, unknown>>[T]
	| ((
			prevData: TableStore<Record<string, unknown>>[T]
	  ) => TableStore<Record<string, unknown>>[T]);

export type TableStore<TData extends Record<string, any>> = {
	rowSelection: RowSelectionState;
	columnFilters: ColumnFiltersState;
	filterByFormValues?: Partial<Record<DeepKeys<TData>, TFilters>>;
	remoteFilter?: boolean;
	// Partial<{
	// 	[key in DeepKeys<TData>]: Filters;
	// }>;

	debouncedValue: Record<string, unknown>;
	currentPageIndex: number;

	incrementCurrentPageIndex: () => any;
	decrementCurrentPageIndex: () => any;
	setRowSelection: (updaterOrValue: StoreUpdaterOrValue<'rowSelection'>) => any;
	setColumnFilters: (
		updaterOrValue: StoreUpdaterOrValue<'columnFilters'>
	) => any;
	setFilterByFormValues: (
		updaterOrValue: StoreUpdaterOrValue<'filterByFormValues'>
	) => any;
};

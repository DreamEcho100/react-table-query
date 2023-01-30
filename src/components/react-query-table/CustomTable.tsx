import type { ColumnDef } from '@tanstack/react-table';
import type { HTMLProps, Dispatch, SetStateAction } from 'react';

import { IoIosArrowBack, IoIosArrowForward, IoMdRefresh } from 'react-icons/io';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	useReactTable
} from '@tanstack/react-table';

import { UseInfiniteQueryResult } from '@tanstack/react-query';
import { useStore } from 'zustand';
import { StoreApi } from 'zustand/vanilla';
import { TableStore } from '../utils/types';
import Filter from './components/Filter';

function IndeterminateCheckbox({
	indeterminate,
	className = '',
	...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
	const ref = useRef<HTMLInputElement>(null!);

	useEffect(() => {
		if (typeof indeterminate === 'boolean') {
			ref.current.indeterminate = !rest.checked && indeterminate;
		}
	}, [indeterminate, rest.checked]);

	return (
		<input
			type='checkbox'
			ref={ref}
			className={className + ' cursor-pointer'}
			{...rest}
		/>
	);
}

const CustomTable = <TData extends Record<string, any>>({
	infiniteQuery,
	setOnQueryKeyChange,
	store,
	...props
}: {
	infiniteQuery: UseInfiniteQueryResult<
		{
			data: TData[];
		} & Record<string, unknown>,
		{
			message: string;
		} & Record<string, unknown>
	>;
	columns: ColumnDef<TData, any>[];
	setOnQueryKeyChange: Dispatch<
		SetStateAction<(() => void) | null | undefined>
	>;
	store: StoreApi<TableStore<TData>>;
}) => {
	const currentPageIndex = useStore(
		store,
		(state: TableStore<TData>) => state.currentPageIndex
	);
	const rowSelection = useStore(
		store,
		(state: TableStore<TData>) => state.rowSelection
	);
	const columnFilters = useStore(
		store,
		(state: TableStore<TData>) => state.columnFilters
	);
	const filterByFormValues = useStore(
		store,
		(state: TableStore<TData>) => state.filterByFormValues
	);

	const [filterersKeysMap, setFilterersKeys] = useState(
		Object.fromEntries(
			Object.keys(filterByFormValues || {}).map((key) => [key, true])
		)
	);

	useEffect(() => {
		const _filterersKeys = Object.keys(filterByFormValues || {});
		// use useRef to reduce computation
		const filteredKeys = Object.keys(filterersKeysMap || {});

		if (_filterersKeys.join() !== filteredKeys.join())
			setFilterersKeys(
				Object.fromEntries(_filterersKeys.map((key) => [key, true]))
			);
	}, [filterByFormValues, filterersKeysMap]);

	const incrementCurrentPageIndex = useStore(
		store,
		(state: TableStore<TData>) => state.incrementCurrentPageIndex
	);
	const decrementCurrentPageIndex = useStore(
		store,
		(state: TableStore<TData>) => state.decrementCurrentPageIndex
	);
	const setRowSelection = useStore(
		store,
		(state: TableStore<TData>) => state.setRowSelection
	);
	const setColumnFilters = useStore(
		store,
		(state: TableStore<TData>) => state.setColumnFilters
	);

	const columns: ColumnDef<TData, any>[] = useMemo(
		() => [
			{
				id: 'select',
				enableHiding: true,
				header: ({ table }) => (
					<div className='px-1 flex items-center justify-center'>
						<IndeterminateCheckbox
							{...{
								checked: table.getIsAllRowsSelected(),
								indeterminate: table.getIsSomeRowsSelected(),
								onChange: table.getToggleAllRowsSelectedHandler()
							}}
						/>
					</div>
				),
				cell: ({ row }) => (
					<div className='w-full px-1 flex items-center justify-center'>
						<IndeterminateCheckbox
							{...{
								checked: row.getIsSelected(),
								indeterminate: row.getIsSomeSelected(),
								onChange: row.getToggleSelectedHandler()
							}}
						/>
					</div>
				)
			},
			...props.columns.map((column) => ({
				...column,
				enableColumnFilter: !!(
					(column as { accessorKey?: string }).accessorKey &&
					filterersKeysMap[(column as { accessorKey: string }).accessorKey]
				)
			}))
		],
		[filterersKeysMap, props.columns]
	);

	const currentPage = useMemo(
		() => infiniteQuery?.data?.pages?.[currentPageIndex]?.data || [],
		[currentPageIndex, infiniteQuery.data?.pages]
	);

	const table = useReactTable({
		data: currentPage,
		columns,
		state: { columnFilters, rowSelection },
		onRowSelectionChange: setRowSelection,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		enableColumnResizing: true,
		columnResizeMode: 'onChange',
		debugAll: process.env.NODE_ENV === 'development'
		// debugTable: process.env.NODE_ENV === 'development',
		// debugHeaders: process.env.NODE_ENV === 'development',
		// debugColumns: process.env.NODE_ENV === 'development',
		// debugRows: process.env.NODE_ENV === 'development',
	});

	const isNextPageDisabled = useMemo(
		() =>
			(!infiniteQuery.hasNextPage &&
				currentPageIndex + 1 === infiniteQuery.data?.pages.length) ||
			infiniteQuery.isFetching,
		[
			currentPageIndex,
			infiniteQuery.data?.pages.length,
			infiniteQuery.hasNextPage,
			infiniteQuery.isFetching
		]
	);

	const isPreviousPageDisabled = useMemo(
		() => currentPageIndex === 0 || infiniteQuery.isFetching,
		[currentPageIndex, infiniteQuery.isFetching]
	);

	const onPageChange = useCallback(() => {
		setRowSelection({});
	}, [setRowSelection]);

	useEffect(() => {
		if (infiniteQuery.isFetching && !infiniteQuery.isFetchingNextPage)
			setRowSelection({});
	}, [
		infiniteQuery.isFetching,
		infiniteQuery.isFetchingNextPage,
		setRowSelection
	]);

	useEffect(() => {
		setOnQueryKeyChange(() => {
			setRowSelection({});
		});
	}, [setOnQueryKeyChange, setRowSelection]);

	return (
		<>
			<div className='flex flex-wrap gap-2'>
				<button
					disabled={infiniteQuery.isFetching}
					onClick={() => {
						if (infiniteQuery.isFetching) return;
						infiniteQuery.refetch();
					}}
					className='capitalize bg-transparent text-current disabled:grayscale disabled:cursor-not-allowed disabled:brightness-50'
				>
					<IoMdRefresh className='bg-transparent' />
				</button>
				<p>page: {currentPageIndex + 1}</p>
				<button
					disabled={isPreviousPageDisabled}
					onClick={() => {
						if (isPreviousPageDisabled) return;
						decrementCurrentPageIndex();
						onPageChange();
					}}
					className='capitalize bg-transparent text-current disabled:grayscale disabled:cursor-not-allowed disabled:brightness-50'
				>
					<IoIosArrowBack className='bg-transparent' />
				</button>
				<button
					disabled={isNextPageDisabled}
					onClick={() => {
						if (isNextPageDisabled) return;

						infiniteQuery.fetchNextPage().then((res) => {
							if (res.data && Array.isArray(res.data?.pages)) {
								const lastPage = res.data.pages[res.data.pages.length - 1];
								if (lastPage.data.length < 0) return;
							}

							incrementCurrentPageIndex();
							onPageChange();
						});
					}}
					className='capitalize bg-transparent text-current disabled:grayscale disabled:cursor-not-allowed disabled:brightness-50'
				>
					<IoIosArrowForward className='bg-transparent' />
				</button>
			</div>
			<table className='table-fixed text-base text-gray-100'>
				<thead className='p-2'>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr
							key={headerGroup.id}
							className='sticky top-0 border border-green-500'
						>
							{headerGroup.headers.map((header) => (
								<th
									key={header.id}
									className='border border-green-500 p-2 group'
									style={{ position: 'relative', width: header.getSize() }}
								>
									<div className='flex flex-col gap-1'>
										{header.isPlaceholder ? null : (
											<>
												{flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
												{header.column.getCanFilter() ? (
													<div>
														<Filter<TData>
															column={header.column}
															table={table}
															store={store}
														/>
													</div>
												) : null}
											</>
										)}
									</div>
									{header.column.getCanResize() && (
										<div
											onMouseDown={header.getResizeHandler()}
											onTouchStart={header.getResizeHandler()}
											className={`resizer group-hover:bg-indigo-400 hover:opacity-0 group-hover:opacity-100 cursor-col-resize absolute right-0 top-0 h-full w-1 select-none bg-black/50 touch-none ${
												header.column.getIsResizing()
													? 'isResizing bg-indigo-700 opacity-100'
													: ''
											}`}
										/>
									)}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map((row) => (
						<tr key={row.id} className='border border-green-500'>
							{row.getVisibleCells().map((cell) => (
								<td
									key={cell.id}
									className='border border-green-500 p-5'
									style={{ width: cell.column.getSize() }}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</td>
							))}
						</tr>
					))}
				</tbody>
				<tfoot>
					{table.getFooterGroups().map((footerGroup) => (
						<tr key={footerGroup.id} className='border border-green-500'>
							{footerGroup.headers.map((header) => (
								<th
									key={header.id}
									className='border border-green-500 p-2'
									style={{ width: header.column.getSize() }}
								>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.footer,
												header.getContext()
										  )}
								</th>
							))}
						</tr>
					))}
				</tfoot>
			</table>
		</>
	);
};

export default CustomTable;

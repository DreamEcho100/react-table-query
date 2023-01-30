import type {
	ColumnDef,
	RowSelectionState,
	Table,
	Column
} from '@tanstack/react-table';
import type { ProductsAPIInput, ProductsAPIOutput } from './api/products';
import { useDebounce } from '@/utils/hooks';
import { HTMLProps, useCallback } from 'react';

import Head from 'next/head';
import { Inter } from '@next/font/google';
import { useEffect, useId, useRef, useState, useMemo } from 'react';
import { useCustomInfiniteQuery } from '@/utils/hooks';
import { Products } from '@/ts';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	useReactTable
} from '@tanstack/react-table';

type FilterBy = NonNullable<ProductsAPIInput['filterBy']>;

const inter = Inter({ subsets: ['latin'] });

const initialCursor: {
	offset: ProductsAPIInput['offset'];
	limit: ProductsAPIInput['limit'];
} = {
	limit: 5,
	offset: 0
};

const columnHelper = createColumnHelper<Products>();

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
	}, [ref, indeterminate, rest.checked]);

	return (
		<input
			type='checkbox'
			ref={ref}
			className={className + ' cursor-pointer'}
			{...rest}
		/>
	);
}

function Filter({
	column,
	table
}: {
	column: Column<any, any>;
	table: Table<any>;
}) {
	const firstValue = table
		.getPreFilteredRowModel()
		.flatRows[0]?.getValue(column.id);

	return typeof firstValue === 'number' ? (
		<div className='flex space-x-2'>
			<input
				type='number'
				value={((column.getFilterValue() as any)?.[0] ?? '') as string}
				onChange={(e) =>
					column.setFilterValue((old: any) => [e.target.value, old?.[1]])
				}
				placeholder={`Min`}
				className='w-24 max-w-full px-2 py-1 border shadow rounded'
			/>
			<input
				type='number'
				value={((column.getFilterValue() as any)?.[1] ?? '') as string}
				onChange={(e) =>
					column.setFilterValue((old: any) => [old?.[0], e.target.value])
				}
				placeholder={`Max`}
				className='w-24 max-w-full px-2 py-1 border shadow rounded'
			/>
		</div>
	) : (
		<input
			type='text'
			value={(column.getFilterValue() ?? '') as string}
			onChange={(e) => column.setFilterValue(e.target.value)}
			placeholder={`Search...`}
			className='w-36 max-w-full px-2 py-1 border shadow rounded'
		/>
	);
}

export default function Home() {
	const id = useId();
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

	const {
		value: filterByFormValues,
		debouncedValue: filterByFormValuesDebounced,
		setValue: setFilterByFormValues
	} = useDebounce<FilterBy>(
		{
			category: undefined,
			priceGTE: undefined,
			title: undefined
		},
		300
	);

	const formFields: {
		name: keyof FilterBy;
		value: FilterBy[keyof FilterBy];
		type?: 'number';
	}[] = [
		{ name: 'category', value: undefined },
		{ name: 'priceGTE', value: undefined, type: 'number' },
		{ name: 'title', value: undefined }
	];

	const onPageChange = useCallback(() => {
		setRowSelection({});
	}, []);

	const {
		infiniteQuery,
		infiniteQueryData,
		isNextPageDisabled,
		isPreviousPageDisabled,
		currentIndex,
		setCurrentIndex
	} = useCustomInfiniteQuery<
		ProductsAPIOutput,
		['products', { cursor: typeof initialCursor; filterBy?: FilterBy }]
	>({
		initialCursor,
		queryMainKey: 'products',
		fetchFn: async (query): Promise<ProductsAPIOutput> => {
			console.log('query.filterBy', query.filterBy);
			return await fetch(
				`/api/products/?limit=${query.cursor.limit}&offset=${
					query.cursor.offset
				}${
					query.filterBy && Object.keys(query.filterBy).length !== 0
						? `&filterBy=${decodeURIComponent(JSON.stringify(query.filterBy))}`
						: ''
				}`
			).then((response) => {
				if (response.status === 404) throw new Error('Not Found');
				if (response.status === 400) throw new Error('Bad Request');

				return response.json();
			});
		},
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage?.cursor) {
				if (lastPage.data.products.length < lastPage.cursor.limit)
					return undefined;

				return {
					...lastPage.cursor,
					offset: lastPage.cursor.offset + lastPage.cursor.limit
				};
			}

			return initialCursor;
		},
		filterBy: filterByFormValuesDebounced,
		onQueryKeyChange: onPageChange
	});
	const pages = infiniteQueryData.pages || [];
	const currentPage = useMemo(
		() => infiniteQuery.data?.pages?.[currentIndex]?.data.products || [],
		[currentIndex, infiniteQuery.data?.pages]
	);

	const columns: ColumnDef<Products, any>[] = useMemo(
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
					<div className='px-1 flex items-center justify-center'>
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
			columnHelper.accessor('id', {
				cell: (info) => info.getValue(),
				header: (info) => <span className='capitalize'>{info.column.id}</span>,
				footer: (info) => <span className='capitalize'>{info.column.id}</span>,
				enableColumnFilter: false
			}),
			columnHelper.accessor('title', {
				cell: (info) => info.getValue(),
				header: (info) => <span className='capitalize'>{info.column.id}</span>,
				footer: (info) => <span className='capitalize'>{info.column.id}</span>
			}),
			columnHelper.accessor('description', {
				cell: (info) => info.getValue(),
				header: (info) => <span className='capitalize'>{info.column.id}</span>,
				footer: (info) => <span className='capitalize'>{info.column.id}</span>
			}),
			columnHelper.accessor('price', {
				cell: (info) => info.getValue(),
				header: (info) => {
					console.log('infoinfoinfo', info);
					return <span className='capitalize'>{info.column.id}</span>;
				},
				footer: (info) => <span className='capitalize'>{info.column.id}</span>
			})
		],
		[]
	);

	const table = useReactTable({
		data: currentPage,
		columns,
		state: { rowSelection },
		onRowSelectionChange: setRowSelection,
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

	return (
		<>
			<Head>
				<title>Create Next App</title>
				<meta name='description' content='Generated by create next app' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<link rel='icon' href='/favicon.ico' />
			</Head>
			<main className={`bg-black text-white p-8 max-w-full`}>
				<div>
					<form className='flex flex-col gap-2 max-w-screen-sm mx-auto'>
						{formFields.map((field) => (
							<div key={field.name} className='flex flex-wrap gap-2'>
								<label htmlFor={`${field.name}-${id}`} className='capitalize'>
									{field.name}
								</label>
								<input
									id={`${field.name}-${id}`}
									{...field}
									value={filterByFormValues[field.name] || ''}
									onChange={(event) =>
										setFilterByFormValues((prevData) => ({
											...prevData,
											[field.name]: !event.target.value
												? undefined
												: field.type === 'number'
												? event.target.valueAsNumber
												: event.target.value
										}))
									}
									className='px-2 py-1'
								/>
								<button
									type='button'
									onClick={() =>
										setFilterByFormValues((prevData) => ({
											...prevData,
											[field.name]: undefined
										}))
									}
								>
									reset
								</button>
							</div>
						))}
					</form>
				</div>
				<div className='flex flex-col gap-2'>
					<div className='flex flex-wrap gap-2'>
						<button
							disabled={isPreviousPageDisabled}
							onClick={() => {
								if (!isPreviousPageDisabled) {
									setCurrentIndex((prevData) => prevData - 1);
									onPageChange();
								}
							}}
							className='disabled:grayscale disabled:cursor-not-allowed disabled:brightness-50'
						>
							Previous Page
						</button>
						<button
							disabled={isNextPageDisabled}
							onClick={() =>
								!isNextPageDisabled &&
								infiniteQuery.fetchNextPage().then((res) => {
									if (res.data && Array.isArray(res.data?.pages)) {
										const lastPage = res.data.pages[res.data.pages.length - 1];
										if (lastPage.data.products.length < 0) return;
									}

									setCurrentIndex((prevData) => prevData + 1);
									onPageChange();
								})
							}
							className='disabled:grayscale disabled:cursor-not-allowed disabled:brightness-50'
						>
							Next Page
						</button>
					</div>
					<div
						className={`${inter.className} overflow-auto max-w-full flex flex-col gap-2`}
					>
						<p>Filters: {JSON.stringify(filterByFormValues)}</p>
						<p>
							Pages:{' '}
							{JSON.stringify(
								pages.map((item) =>
									item.data.products.flat().map((product) => product.id)
								)
							)}
						</p>
						<p>Current index: {JSON.stringify(currentIndex)}</p>
						<p>
							Current Page:{' '}
							{JSON.stringify(
								currentPage.map(
									(product) => `${product.title}, ${product.price}` + '\n'
								)
							)}
						</p>
					</div>
				</div>
				<div className='max-w-full overflow-auto'>
					<ProductsTable table={table} />
				</div>
			</main>
		</>
	);
}

const ProductsTable = <TData extends Record<string, any>>({
	table
}: {
	table: Table<TData>;
}) => {
	return (
		<table className='table-fixed text-base text-gray-100'>
			<thead className='p-2'>
				{table.getHeaderGroups().map((headerGroup) => (
					<tr key={headerGroup.id} className='border border-green-500 group:'>
						{headerGroup.headers.map((header) => (
							<th
								key={header.id}
								className='border border-green-500 p-2'
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
													<Filter column={header.column} table={table} />
												</div>
											) : null}
										</>
									)}
								</div>
								{header.column.getCanResize() && (
									<div
										onMouseDown={header.getResizeHandler()}
										onTouchStart={header.getResizeHandler()}
										className={`resizer hover:opacity-0 group-hover:opacity-100 cursor-col-resize absolute right-0 top-0 h-full w-1 select-none bg-black/50 touch-none ${
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
	);
};

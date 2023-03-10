import type { ColumnDef } from '@tanstack/react-table';
import type { ProductsAPIInput, ProductsAPIOutput } from './api/products';

import Head from 'next/head';
import { Inter } from '@next/font/google';
import { useCustomInfiniteQuery } from '@/utils/hooks';
import { Products } from '@/ts';
import { createColumnHelper } from '@tanstack/react-table';
import { handleCreateStore } from '@/components/utils';
import CustomTable, {
	TableMetaData
} from '@/components/react-query-table/CustomTable';
import { useStore } from 'zustand';
import { TableStore } from '@/components/utils/types';
import { useMemo } from 'react';

const inter = Inter({ subsets: ['latin'] });

const initialCursor: {
	offset: ProductsAPIInput['offset'];
	limit: ProductsAPIInput['limit'];
} = {
	limit: 5,
	offset: 0
};

const columnHelper = createColumnHelper<Products>();

const initialFilterByFormValues = {
	category: { dataType: 'text', filterType: 'CONTAINS', value: 'jewelery' },
	title: { dataType: 'text', filterType: 'CONTAINS', value: 'John Hardy' }
	// price: {
	// 	dataType: 'number',
	// 	filterType: 'RANGE',
	// 	value: { min: 0 },
	// 	constraints: { min: 0 }
	// }
} satisfies TableStore<Products>['filterByFormValues'];

const tableStore = handleCreateStore<ProductsAPIOutput['products']>({
	filterByFormValues: initialFilterByFormValues
});

export default function Home() {
	const filterByFormValues = useStore(
		tableStore,
		(state) => state.filterByFormValues
	);

	const { infiniteQuery, setOnQueryKeyChange } = useCustomInfiniteQuery<
		ProductsAPIOutput['products'],
		[
			'products',
			{
				cursor: typeof initialCursor;
				filterBy?: typeof initialFilterByFormValues;
			}
		]
	>({
		initialCursor,
		queryMainKey: 'products',
		fetchFn: async (query): Promise<ProductsAPIOutput['products']> => {
			let filterBy: ProductsAPIInput['filterBy'] = {};

			if (query.filterBy) {
				let key: keyof typeof query.filterBy;
				for (key in query.filterBy) {
					switch (key) {
						case 'title':
						case 'category': {
							const element = query.filterBy[key];
							if (element.value.trim()) filterBy[key] = element.value;
						}
					}
				}
			}

			return await fetch(
				`/api/products/?limit=${query.cursor.limit}&offset=${
					query.cursor.offset
				}${
					Object.keys(filterBy).length === 0
						? ''
						: `&filterBy=${JSON.stringify(filterBy)}`
				}`
			)
				.then((response) => {
					if (response.status === 404) throw new Error('Not Found');
					if (response.status === 400) throw new Error('Bad Request');

					return response.json();
				})
				.then((result: ProductsAPIOutput) => result.products);
		},
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage?.cursor) {
				if (lastPage.data.length < lastPage.cursor.limit) return undefined;

				return {
					...lastPage.cursor,
					offset: lastPage.cursor.offset + lastPage.cursor.limit
				};
			}

			return initialCursor;
		},
		filterBy: filterByFormValues as any
	});

	const columns: ColumnDef<Products, any>[] = useMemo(
		() => [
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
				cell: (info) => (
					<div className='aspect-video w-64 max-w-fit'>{info.getValue()}</div>
				),
				header: (info) => <span className='capitalize'>{info.column.id}</span>,
				footer: (info) => <span className='capitalize'>{info.column.id}</span>
			}),
			columnHelper.accessor('category', {
				cell: (info) => info.getValue(),
				header: (info) => <span className='capitalize'>{info.column.id}</span>,
				footer: (info) => <span className='capitalize'>{info.column.id}</span>
			}),
			columnHelper.accessor('price', {
				cell: (info) => info.getValue(),
				header: (info) => {
					return <span className='capitalize'>{info.column.id}</span>;
				},
				footer: (info) => <span className='capitalize'>{info.column.id}</span>
			})
		],
		[]
	);

	return (
		<>
			<Head>
				<title>Create Next App</title>
				<meta name='description' content='Generated by create next app' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<link rel='icon' href='/favicon.ico' />
			</Head>
			<main
				className={`dark:bg-black dark:text-white bg-white text-black p-8 max-w-full`}
			>
				<div className='max-w-full overflow-auto'>
					<TableMetaData infiniteQuery={infiniteQuery} store={tableStore} />
					<CustomTable
						columns={columns}
						setOnQueryKeyChange={setOnQueryKeyChange}
						infiniteQuery={infiniteQuery}
						store={tableStore}
					/>
					<TableMetaData infiniteQuery={infiniteQuery} store={tableStore} />
				</div>
			</main>
		</>
	);
}

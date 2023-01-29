// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import products from '@/appData/products.json';
import type { Products } from '@/ts/index';

import type { NextApiRequest, NextApiResponse } from 'next';

import { z } from 'zod';

const queryValidator = (item: unknown) =>
	z
		.object({
			offset: z.number().min(0).default(0),
			limit: z.literal(5).or(z.literal(10)).or(z.literal(20)).default(5),
			filterBy: z
				.object({
					category: z.string().optional(),
					title: z.string().optional(),
					priceGTE: z.number().optional()
				})
				.optional()
				.default({})
		})
		.parse(item);

export type ProductsAPIInput = ReturnType<typeof queryValidator>;
export type ProductsAPIOutput = { products: Products[] };

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<ProductsAPIOutput>
) {
	if (req.method !== 'GET') return res.status(404);

	let query: ProductsAPIInput;
	try {
		query = queryValidator({
			limit: Number(req.query.limit),
			offset: Number(req.query.offset),
			filterBy:
				typeof req.query.filterBy === 'string'
					? JSON.parse(req.query.filterBy)
					: undefined
		});
	} catch (err) {
		err instanceof Error && console.error('err.message', err.message);
		return res.status(400);
	}

	const filterBy = query.filterBy;

	const selectedProducts: Products[] = (
		filterBy && typeof filterBy === 'object'
			? products.filter((product) => {
					return (
						(!filterBy.category ||
							product.category
								.toLowerCase()
								.search(filterBy.category.toLowerCase()) !== -1) &&
						(!filterBy.title ||
							product.title
								.toLowerCase()
								.search(filterBy.title.toLowerCase()) !== -1) &&
						(!filterBy.priceGTE || product.price >= filterBy.priceGTE)
					);
			  })
			: products
	).slice(query.offset, query.offset + query.limit);

	return res.status(200).json({ products: selectedProducts });
}

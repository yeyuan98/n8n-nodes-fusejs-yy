import { INodeType, INodeTypeDescription, IExecuteFunctions, NodeConnectionType, INodeExecutionData, IDataObject, GenericValue } from 'n8n-workflow';
import Fuse, { IFuseOptions, FuseResult } from 'fuse.js';

export class FuseJs implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Fuse.js',
		name: 'fuseJs',
		icon: 'file:logo.png',
		group: ['transform'],
		version: 1,
		description: 'Fuzzy search using Fuse.js',
		defaults: {
			name: 'Fuse.js',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'The search query',
			},
			{
				displayName: 'Item List (JSON)',
				name: 'items',
				type: 'json',
				default: '[]',
				description: 'The array of items to search. Can be a JSON string or an array of objects.',
			},
			{
				displayName: 'Keys',
				name: 'keys',
				type: 'string',
				default: 'value',
				placeholder: 'title,author.name',
				description: 'Keys to search in. Separate multiple keys with commas.',
			},
			{
				displayName: 'Advanced Options (JSON)',
				name: 'options',
				type: 'json',
				default: '{}',
				description: 'Optional Fuse.js options in JSON format',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[][] = [];

		for (let i = 0; i < items.length; i++) {
			const itemsJson = JSON.parse(this.getNodeParameter('items', i) as string);
			const query = this.getNodeParameter('query', i) as string;
			const keys = (this.getNodeParameter('keys', i) as string).split(',').map(key => key.trim()).filter(key => key.length > 0);
			const options = JSON.parse(this.getNodeParameter('options', i) as unknown as string) as IFuseOptions<IDataObject>;

			const itemsToFuse: IDataObject[] = (Array.isArray(itemsJson) ? itemsJson : [itemsJson]).map((item: unknown) => {
				if (typeof item === 'object' && item !== null) {
					return item as IDataObject;
				} else {
					return { value: item as GenericValue } as IDataObject;
				}
			});

			const fuse = new Fuse<IDataObject>(itemsToFuse, { ...options, keys });
			console.log("items:", itemsToFuse);
			console.log("fuse:", fuse);
			const result = fuse.search(query);

			returnData.push(this.helpers.returnJsonArray(result.map((r: FuseResult<IDataObject>) => {
				const output: IDataObject = {};
				if (typeof r.item === 'object' && r.item !== null) {
					Object.assign(output, r.item);
				} else {
					output.value = r.item as GenericValue;
				}
				output.score = r.score as GenericValue;
				return output;
			})));
		}

		return returnData;
	}
}

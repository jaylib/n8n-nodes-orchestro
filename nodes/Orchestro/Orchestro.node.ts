import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

// Generate UUID v4
function generateUUID(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export class Orchestro implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Orchestro',
		name: 'orchestro',
		icon: { light: 'file:orchestro.v2.svg', dark: 'file:orchestro.dark.v2.svg' },
		group: ['input'],
		version: 1,
		description: 'Orchestro node for n8n',
		defaults: {
			name: 'Orchestro',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				placeholder: 'Enter title',
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				default: '',
				placeholder: 'Enter body text',
				description: 'The body text (multiline)',
			},
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Enter user ID',
			},
			{
				displayName: 'Payload Type',
				name: 'payloadType',
				type: 'options',
				options: [
					{
						name: 'No Payload',
						value: 'none',
					},
					{
						name: 'Markdown',
						value: 'markdown',
					},
					{
						name: 'List of Elements',
						value: 'list',
					},
				],
				default: 'none',
			},
			{
				displayName: 'Payload Markdown',
				name: 'payloadMarkdown',
				type: 'string',
				typeOptions: {
					rows: 10,
				},
				default: '',
				placeholder: 'Enter markdown content',
				displayOptions: {
					show: {
						payloadType: ['markdown'],
					},
				},
			},
			{
				displayName: 'Elements',
				name: 'elements',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Element',
				},
				default: {
					element: [
						{
							type: 'text',
							text: '',
						},
					],
				},
				displayOptions: {
					show: {
						payloadType: ['list'],
					},
				},
				options: [
					{
						displayName: 'Element',
						name: 'element',
						typeOptions: {
							multipleValueButtonText: 'Add Element',
						},
						values: [
							{
								displayName: 'Element Type',
								name: 'type',
								type: 'options',
								options: [
									{
										name: 'Text',
										value: 'text',
									},
									{
										name: 'Headline',
										value: 'headline',
									},
									{
										name: 'Markdown',
										value: 'markdown',
									},
									{
										name: 'URL',
										value: 'url',
									},
								],
								default: 'text',
							},
							{
								displayName: 'Link Text',
								name: 'linkText',
								type: 'string',
								required: true,
								default: '',
								placeholder: 'Enter link text',
								displayOptions: {
									show: {
										type: ['url'],
									},
								},
							},
							{
								displayName: 'Markdown Text',
								name: 'markdown',
								type: 'string',
								typeOptions: {
									rows: 5,
								},
								required: true,
								default: '',
								placeholder: 'Enter markdown text',
								displayOptions: {
									show: {
										type: ['markdown'],
									},
								},
							},
							{
								displayName: 'Text',
								name: 'text',
								type: 'string',
								required: true,
								default: '',
								placeholder: 'Enter text',
								displayOptions: {
									show: {
										type: ['text'],
									},
								},
							},
							{
								displayName: 'Text',
								name: 'text',
								type: 'string',
								required: true,
								default: '',
								placeholder: 'Enter headline text',
								displayOptions: {
									show: {
										type: ['headline'],
									},
								},
							},
							{
								displayName: 'URL',
								name: 'url',
								type: 'string',
								required: true,
								default: '',
								placeholder: 'Enter URL',
								displayOptions: {
									show: {
										type: ['url'],
									},
								},
							},
					],
					},
				],
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. It sends an HTTP request to the Orchestro API with title, body, and elements data.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;
		let title: string;
		let body: string;
		let userId: string;
		let payloadType: string;
		let elements: Array<{ type: string; text?: string; title?: string; url?: string; linkText?: string; markdown?: string }>;

		// Iterates over all input items and send HTTP request for each item
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				title = this.getNodeParameter('title', itemIndex, '') as string;
				body = this.getNodeParameter('body', itemIndex, '') as string;
				userId = this.getNodeParameter('userId', itemIndex, '') as string;
				payloadType = this.getNodeParameter('payloadType', itemIndex, 'none') as string;
				item = items[itemIndex];

				// Get elements based on payload type
				if (payloadType === 'list') {
					const elementsParam = this.getNodeParameter('elements', itemIndex, { element: [] }) as {
						element?: Array<{ type: string; text?: string; title?: string; url?: string; linkText?: string; markdown?: string }>;
					};
					// fixedCollection stores data under the option name (element)
					elements = elementsParam?.element || [];
				} else if (payloadType === 'markdown') {
					const payloadMarkdown = this.getNodeParameter('payloadMarkdown', itemIndex, '') as string;
					// Create a single markdown element
					elements = [
						{
							type: 'markdown',
							markdown: payloadMarkdown,
						},
					];
				} else {
					elements = [];
				}

				// Add UUID to each element (not exposed in UI)
				elements = elements.map((element) => ({
					...element,
					id: generateUUID(),
				}));

				// Log elements (included in output for debugging)
				const elementsLog = JSON.stringify(elements, null, 2);
				// Note: Elements are logged in the output JSON below

				// Prepare request body
				const requestBody = {
					title,
					body,
					data: { elements: elements },
				};

				// Send HTTP request
				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: `https://sendpushtouser-ucirriqfma-ew.a.run.app/${userId}`,
					body: requestBody,
					json: true,
				});

				// Add response to output
				item.json = {
					...item.json,
					title,
					body,
					payload: payloadType === 'list' ? { type: 'list', elements } : null,
					_elementsLog: elementsLog, // Log elements for debugging
					response,
				};
			} catch (error) {
				// Handle errors
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [items];
	}
}



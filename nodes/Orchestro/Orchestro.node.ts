import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
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

// Recursively add UUID id to array elements that don't have one
function addIdsToArrayElements(data: unknown): unknown {
	if (Array.isArray(data)) {
		return data.map((item) => {
			if (typeof item === 'object' && item !== null) {
				const itemWithId = { ...item } as Record<string, unknown>;
				// Add id if missing
				if (!itemWithId.id) {
					itemWithId.id = generateUUID();
				}
				// Recursively process nested objects and arrays
				for (const key in itemWithId) {
					itemWithId[key] = addIdsToArrayElements(itemWithId[key]);
				}
				return itemWithId;
			}
			return item;
		});
	} else if (typeof data === 'object' && data !== null) {
		const obj = { ...data } as Record<string, unknown>;
		// Recursively process all properties
		for (const key in obj) {
			obj[key] = addIdsToArrayElements(obj[key]);
		}
		return obj;
	}
	return data;
}

// Type for workflow node structure

export const respondWithOptions: INodeProperties = {
	displayName: 'Form Response',
	name: 'respondWithOptions',
	type: 'fixedCollection',
	placeholder: 'Add option',
	default: { values: { respondWith: 'text' } },
	options: [
		{
			displayName: 'Values',
			name: 'values',
			values: [
				{
					displayName: 'Respond With',
					name: 'respondWith',
					type: 'options',
					default: 'text',
					options: [
						{
							name: 'Form Submitted Text',
							value: 'text',
							description: 'Show a response text to the user',
						},
						{
							name: 'Redirect URL',
							value: 'redirect',
							description: 'Redirect the user to a URL',
						},
					],
				},
				{
					displayName: 'Text to Show',
					name: 'formSubmittedText',
					description:
						"The text displayed to users after they fill the form. Leave it empty if don't want to show any additional text.",
					type: 'string',
					default: 'Your response has been recorded',
					displayOptions: {
						show: {
							respondWith: ['text'],
						},
					},
				},
				{
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					displayName: 'URL to Redirect to',
					name: 'redirectUrl',
					description:
						'The URL to redirect users to after they fill the form. Must be a valid URL.',
					type: 'string',
					default: '',
					validateType: 'url',
					placeholder: 'e.g. http://www.n8n.io',
					displayOptions: {
						show: {
							respondWith: ['redirect'],
						},
					},
				},
			],
		},
	],
};
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
						name: 'JSON',
						value: 'json',
					},
					{
						name: 'List of Elements',
						value: 'list',
					},
					{
						name: 'Markdown',
						value: 'markdown',
					},
					{
						name: 'No Payload',
						value: 'none',
					},
				],
				default: 'none',
			},
			{
				displayName: 'Payload JSON',
				name: 'payloadJson',
				type: 'string',
				typeOptions: {
					rows: 10,
				},
				default: '',
				placeholder: 'Enter JSON content',
				displayOptions: {
					show: {
						payloadType: ['json'],
					},
				},
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
				placeholder: 'Add Element',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Element',
					sortable: true
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
						/* eslint-disable -- Custom field order for workflowTrigger fields */
						values: [
							{
								displayName: 'Element Type',
								name: 'type',
								type: 'options',
								options: [
									{
										name: 'Headline',
										value: 'headline',
									},
									{
										name: 'Image',
										value: 'image',
									},
									{
										name: 'Link',
										value: 'url',
									},
									{
										name: 'Markdown',
										value: 'markdown',
									},
									{
										name: 'Text',
										value: 'text',
									},
									{
										name: 'Workflow Trigger',
										value: 'workflowTrigger',
									},
								],
								default: 'text',
							},
							{
								displayName: 'Image Source Type',
								name: 'imageSourceType',
								type: 'options',
								required: true,
								default: 'url',
								options: [
									{
										name: 'Base64',
										value: 'base64',
									},
									{
										name: 'URL',
										value: 'url',
									},
								],
								displayOptions: {
									show: {
										type: ['image'],
									},
								},
							},
							{
								displayName: 'Base64',
								name: 'base64',
								type: 'string',
								typeOptions: {
									rows: 5,
								},
								required: true,
								default: '',
								placeholder: 'Enter base64 encoded image',
								displayOptions: {
									show: {
										type: ['image'],
										imageSourceType: ['base64'],
									},
								},
							},
							{
								displayName: 'Image URL',
								name: 'imageUrl',
								type: 'string',
								required: true,
								default: '',
								placeholder: 'Enter image URL',
								displayOptions: {
									show: {
										type: ['image'],
										imageSourceType: ['url'],
									},
								},
							},
							{
								displayName: 'Title',
								name: 'title',
								type: 'string',
								default: '',
								placeholder: 'Enter a title for the workflow trigger usage',
								displayOptions: {
									show: {
										type: ['workflowTrigger'],
									},
								},
							},
							{
								displayName: 'Description',
								name: 'description',
								type: 'string',
								default: '',
								placeholder: 'Enter a description for the workflow trigger usage',
								displayOptions: {
									show: {
										type: ['workflowTrigger'],
									},
								},
							},
							{
								displayName: 'Primary',
								name: 'primary',
								type: 'boolean',
								default: true,
								displayOptions: {
									show: {
										type: ['workflowTrigger'],
									},
								},
							},
							{
								displayName: 'Execution Button Label',
								name: 'executionButtonLabel',
								type: 'string',
								default: '',
								placeholder: 'Enter execution button label',
								displayOptions: {
									show: {
										type: ['workflowTrigger'],
									},
								},
							},
							{
								displayName: 'Show execution button only',
								name: 'showExecutionButtonOnly',
								type: 'boolean',
								default: false,
								displayOptions: {
									show: {
										type: ['workflowTrigger'],
									},
								},
							},
							{
								displayName: 'URL',
								name: 'url',
								type: 'string',
								required: true,
								default: '',
								placeholder: 'Enter workflowTrigger URL',
								displayOptions: {
									show: {
										type: ['workflowTrigger'],
									},
								},
							},
							{
								displayName: 'HTTP Method',
								name: 'httpMethod',
								type: 'options',
								required: true,
								default: 'GET',
								options: [
									{
										name: 'DELETE',
										value: 'DELETE',
									},
									{
										name: 'GET',
										value: 'GET',
									},
									{
										name: 'HEAD',
										value: 'HEAD',
									},
									{
										name: 'OPTIONS',
										value: 'OPTIONS',
									},
									{
										name: 'PATCH',
										value: 'PATCH',
									},
									{
										name: 'POST',
										value: 'POST',
									},
									{
										name: 'PUT',
										value: 'PUT',
									},
								],
								displayOptions: {
									show: {
										type: ['workflowTrigger'],
									},
								},
							},
							{
								displayName: 'Body Type',
								name: 'bodyType',
								type: 'options',
								required: true,
								default: 'jsonBody',
								options: [
									{
										name: 'Custom Fields',
										value: 'customFields',
									},
									{
										name: 'JSON Body',
										value: 'jsonBody',
									},
									{
										name: 'None',
										value: 'none',
									},
								],
								displayOptions: {
									show: {
										type: ['workflowTrigger'],
										httpMethod: ['POST', 'PUT', 'PATCH'],
									},
								},
							},
							{
								displayName: 'Fields',
								name: 'fields',
								type: 'fixedCollection',
								placeholder: 'Add Field',
								typeOptions: {
									multipleValues: true,
									sortable: true,
								},
								default: {
									field: [
										{
											key: '',
											valueType: 'text',
											value: '',
										},
									],
								},
								displayOptions: {
									show: {
										type: ['workflowTrigger'],
										httpMethod: ['POST', 'PUT', 'PATCH'],
										bodyType: ['customFields'],
									},
								},
								options: [
									{
										displayName: 'Field',
										name: 'field',
										typeOptions: {
											multipleValueButtonText: 'Add Field',
										},
										values: [
											{
												displayName: 'Key',
												name: 'key',
												type: 'string',
												required: true,
												default: '',
												placeholder: 'Enter field key',
											},
											{
												displayName: 'Value Type',
												name: 'valueType',
												type: 'options',
												required: true,
												default: 'text',
												options: [
													{
														name: 'Boolean',
														value: 'boolean',
													},
													{
														name: 'Number',
														value: 'number',
													},
													{
														name: 'Text',
														value: 'text',
													},
												],
											},
											{
												displayName: 'Value',
												name: 'value',
												type: 'string',
												default: '',
												placeholder: 'Enter field value',
												displayOptions: {
													show: {
														valueType: ['text'],
													},
												},
											},
											{
												displayName: 'Value',
												name: 'value',
												type: 'number',
												default: 0,
												placeholder: 'Enter field value',
												displayOptions: {
													show: {
														valueType: ['number'],
													},
												},
											},
											{
												displayName: 'Value',
												name: 'value',
												type: 'boolean',
												default: false,
												displayOptions: {
													show: {
														valueType: ['boolean'],
													},
												},
											},
										],
									},
								],
							},
							{
								displayName: 'JSON Body',
								name: 'jsonBody',
								type: 'string',
								typeOptions: {
									rows: 5,
								},
								default: '',
								placeholder: 'Enter JSON body',
								description: 'The JSON body to send with the request',
								displayOptions: {
									show: {
										type: ['workflowTrigger'],
										httpMethod: ['POST', 'PUT', 'PATCH'],
										bodyType: ['jsonBody'],
									},
								},
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
					/* eslint-enable */
					},
				],
			}
		],
	};

	methods = {
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. It sends an HTTP request to the Orchestro API with title, body, and elements data.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const executionId = this.getExecutionId();
		let item: INodeExecutionData;
		let title: string;
		let body: string;
		let userId: string;
		let payloadType: string;
		let elements: Array<{ type: string; text?: string; title?: string; url?: string; linkText?: string; markdown?: string; httpMethod?: string; bodyType?: string; jsonBody?: string; fields?: { field?: Array<{ key: string; valueType?: string; value: string | number | boolean }> }; name?: string; description?: string; primary?: boolean; executionButtonLabel?: string; imageSourceType?: string; base64?: string; imageUrl?: string }>;

		// Iterates over all input items and send HTTP request for each item
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				title = this.getNodeParameter('title', itemIndex, '') as string;
				body = this.getNodeParameter('body', itemIndex, '') as string;
				userId = this.getNodeParameter('userId', itemIndex, '') as string;
				payloadType = this.getNodeParameter('payloadType', itemIndex, 'none') as string;
				item = items[itemIndex];

				// Prepare request body based on payload type
				let requestBody: { title: string; body: string; data: Record<string, unknown> };
				
				if (payloadType === 'json') {
					const payloadJson = this.getNodeParameter('payloadJson', itemIndex, '') as string;
					let jsonData: unknown;
					try {
						jsonData = JSON.parse(payloadJson);
					} catch {
						throw new NodeOperationError(this.getNode(), 'Invalid JSON in Payload JSON field', {
							itemIndex,
						});
					}
					// Add UUID id to every element in arrays that don't have one
					const jsonDataWithIds = addIdsToArrayElements(jsonData);
					const processedData = typeof jsonDataWithIds === 'object' && jsonDataWithIds !== null && !Array.isArray(jsonDataWithIds)
						? { ...jsonDataWithIds as Record<string, unknown>, executionId }
						: { data: jsonDataWithIds, executionId };
					requestBody = {
						title,
						body,
						data: processedData,
					};
					elements = []; // Initialize elements for JSON payload type
				} else {
					// Get elements based on payload type
					if (payloadType === 'list') {
						const elementsParam = this.getNodeParameter('elements', itemIndex, { element: [] }) as {
							element?: Array<{ type: string; text?: string; title?: string; url?: string; linkText?: string; markdown?: string; httpMethod?: string; bodyType?: string; jsonBody?: string; fields?: { field?: Array<{ key: string; valueType?: string; value: string | number | boolean }> }; name?: string; description?: string; primary?: boolean; executionButtonLabel?: string; imageSourceType?: string; base64?: string; imageUrl?: string }>;
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

					// Add UUID to each element and flatten fields structure
					elements = elements.map((element) => {
						const flattenedElement = {
							...element,
							id: generateUUID(),
						} as typeof element & { id: string };
						
						// Flatten fields structure: { fields: { field: [] } } -> { fields: [] }
						if (flattenedElement.fields && typeof flattenedElement.fields === 'object' && 'field' in flattenedElement.fields) {
							const fieldsObj = flattenedElement.fields as { field?: Array<{ key: string; valueType?: string; value: string | number | boolean }> };
							(flattenedElement as Record<string, unknown>).fields = fieldsObj.field || [];
						}
						
						return flattenedElement;
					});


					requestBody = {
						title,
						body,
						data: { 
							executionId,
							elements: elements 
						},
					};
				}

				// Send HTTP request
				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: `https://orchestro.app/api/push/${userId}`,
					body: requestBody,
					json: true,
				});

				// Add response to output
				item.json = {
					...item.json,
					title,
					body,
					executionId,
					payload: payloadType === 'list' ? { type: 'list', elements } : payloadType === 'json' ? { type: 'json', data: requestBody.data } : null,
					response
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



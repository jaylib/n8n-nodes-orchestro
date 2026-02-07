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
			subtitle:
				'={{ $parameter.operation === "approval" ? "Approve" : "Rich Notification" }}',
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
				displayName: 'Send rich, interactive push notifications to the Orchestro app. Include text, images, links, or workflow triggers to enable human-in-the-loop actions.',
				name: 'nodeNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Rich Notification',
						value: 'richNotification',
						description: 'Send a rich, interactive push notification',
						action: 'Send a rich interactive push notification',
					},
					{
						name: 'Approve',
						value: 'approval',
						description: 'Send an approval request notification',
						action: 'Send an approval request notification',
					},
				],
				default: 'richNotification',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				placeholder: 'e.g. Workflow completed successfully',
				description: 'The headline of the notification. Keep it short and attention-grabbing.',
				displayOptions: {
					show: {
						operation: ['richNotification', 'approval'],
					},
				},
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				placeholder: 'e.g. Data sync finished. 42 records processed.',
				description: 'The main message shown in the notification. Provide context or a summary of what needs attention.',
				displayOptions: {
					show: {
						operation: ['richNotification', 'approval'],
					},
				},
			},
			{
				displayName: 'Device Identifiers',
				name: 'userIds',
				type: 'fixedCollection',
				placeholder: 'Add Device Identifier',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Device Identifier',
				},
				required: true,
				default: {
					values: [
						{
							value: '',
						},
					],
				},
				options: [
					{
						displayName: 'Device Identifier',
						name: 'values',
						typeOptions: {
							multipleValueButtonText: 'Add Device Identifier',
						},
						values: [
							{
								displayName: 'Device Identifier',
								name: 'value',
								type: 'string',
								required: true,
								default: '',
								placeholder: 'e.g. abc123-def456-ghi789',
								description: 'The unique ID of the device that will receive this notification',
								hint: 'Tip: You can also add your device directly from the Orchestro app via Notification Settings',
							},
						],
					},
				],
				description: 'Identifies which device(s) will receive the notification. Find your Device Identifier in the Orchestro app under Settings → Device Info.',
				displayOptions: {
					show: {
						operation: ['richNotification', 'approval'],
					},
				},
			},
			{
				displayName: 'Review Content Format',
				name: 'reviewContentType',
				type: 'options',
				options: [
					{
						name: 'List of Content Blocks',
						value: 'list',
						description: 'Build rich approval content with multiple blocks like text, images, and links',
					},
					{
						name: 'Markdown',
						value: 'markdown',
						description: 'Simple formatted content using Markdown syntax',
					},
					{
						name: 'No Rich Content',
						value: 'none',
						description: 'Send only the title and body without additional content',
					},
				],
				default: 'markdown',
				description: 'Choose how the review content is constructed before it is shown for approval',
				displayOptions: {
					show: {
						operation: ['approval'],
					},
				},
			},
			{
				displayName: 'Markdown',
				name: 'reviewContentMarkdown',
				type: 'string',
				typeOptions: {
					rows: 10,
				},
				default: '',
				placeholder: 'Describe what should be approved or refined',
				displayOptions: {
					show: {
						operation: ['approval'],
						reviewContentType: ['markdown'],
					},
				},
			},
			{
				displayName: 'Blocks',
				name: 'reviewContentElements',
				type: 'fixedCollection',
				placeholder: 'Add Block',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Block',
					sortable: true,
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
						operation: ['approval'],
						reviewContentType: ['list'],
					},
				},
				options: [
					{
						displayName: 'Block',
						name: 'element',
						typeOptions: {
							multipleValueButtonText: 'Add Block',
						},
						/* eslint-disable -- Custom field order for workflowTrigger fields */
						values: [
							{
								displayName: 'Block Type',
								name: 'type',
								type: 'options',
								options: [
									{
										name: 'Headline',
										value: 'headline',
										description: 'Bold section header to organize your content',
									},
									{
										name: 'Image',
										value: 'image',
										description: 'Display an image from a URL or Base64 string',
									},
									{
										name: 'Link',
										value: 'url',
										description: 'Clickable link with custom text',
									},
									{
										name: 'Markdown',
										value: 'markdown',
										description: 'Rich text with formatting using Markdown syntax',
									},
									{
										name: 'Text',
										value: 'text',
										description: 'Simple plain text content',
									},
									{
										name: 'Workflow Trigger',
										value: 'workflowTrigger',
										description: 'Interactive button or form to trigger a webhook',
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
								displayName: 'Adds an interactive element with a button or form fields to trigger a webhook or form. Perfect for human-in-the-loop workflows — users can approve, reject, submit data, or trigger actions directly from the notification.',
								name: 'workflowTriggerNotice',
								type: 'notice',
								default: '',
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
								placeholder: 'e.g. https://your-n8n-instance.com/webhook/abc123',
								description: 'Used to identify the trigger and display its form fields or parameters. This URL will be called when the user executes the action.',
								hint: 'Paste the Production URL from your Webhook or Form trigger node',
								displayOptions: {
									show: {
										type: ['workflowTrigger'],
									},
								},
							},
							{
								displayName: 'Options',
								name: 'workflowTriggerOptions',
								type: 'collection',
								placeholder: 'Add Option',
								default: {},
								displayOptions: {
									show: {
										type: ['workflowTrigger'],
									},
								},
								options: [
									{
										displayName: 'Title',
										name: 'title',
										type: 'string',
										default: '',
										placeholder: 'Enter a title for the workflow trigger usage',
									},
									{
										displayName: 'Description',
										name: 'description',
										type: 'string',
										default: '',
										placeholder: 'Enter a description for the workflow trigger usage',
									},
									{
										displayName: 'Primary',
										name: 'primary',
										type: 'boolean',
										default: true,
									},
									{
										displayName: 'Execution Button Label',
										name: 'executionButtonLabel',
										type: 'string',
										default: '',
										placeholder: 'Enter execution button label',
									},
									{
										displayName: 'Show Execution Button Only',
										name: 'showExecutionButtonOnly',
										type: 'boolean',
										default: false,
									},
									{
										displayName: 'HTTP Method',
										name: 'httpMethod',
										type: 'options',
										default: 'POST',
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
									},
									{
										displayName: 'Prefill Data',
										name: 'bodyType',
										type: 'options',
										default: 'none',
										description: 'Prefill form fields or webhook parameters with default values before the user sees them',
										hint: 'Use this to pre-populate fields so users don\'t have to enter them manually',
										options: [
											{
												name: 'No Prefill',
												value: 'none',
												description: 'Let users fill in all fields themselves',
											},
											{
												name: 'Field Values',
												value: 'customFields',
												description: 'Prefill specific fields by name',
											},
											{
												name: 'JSON',
												value: 'jsonBody',
												description: 'Prefill using a JSON object',
											},
										],
									},
									{
										displayName: 'Prefill JSON',
										name: 'jsonBody',
										type: 'string',
										typeOptions: {
											rows: 5,
										},
										default: '',
										placeholder: '{ "fieldName": "value", "anotherField": 123 }',
										description: 'JSON object with field names and their prefill values. Field names must match the form or webhook parameters.',
										hint: 'Add "Prefill Data" option and select "JSON" to use this',
									},
									{
										displayName: 'Prefill Fields',
										name: 'fields',
										type: 'fixedCollection',
										placeholder: 'Add Field',
										typeOptions: {
											multipleValues: true,
											sortable: true,
										},
										default: {},
										description: 'Define field names and their prefill values. Field names must match the form or webhook parameters.',
										hint: 'Add "Prefill Data" option and select "Field Values" to use this',
										options: [
											{
												displayName: 'Field',
												name: 'field',
												values: [
													{
														displayName: 'Field Name',
														name: 'key',
														type: 'string',
														default: '',
														placeholder: 'e.g. email, amount, approved',
														description: 'The name of the form field or webhook parameter to prefill',
													},
													{
														displayName: 'Value Type',
														name: 'valueType',
														type: 'options',
														default: 'text',
														options: [
															{
																name: 'Text',
																value: 'text',
															},
															{
																name: 'Number',
																value: 'number',
															},
															{
																name: 'Boolean',
																value: 'boolean',
															},
														],
													},
													{
														displayName: 'Value',
														name: 'value',
														type: 'string',
														default: '',
														placeholder: 'Enter the prefill value',
														description: 'The value to prefill for this field',
													},
												],
											},
										],
									},
								],
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
			},
						{
				displayName: 'Approval Actions',
				name: 'approvalActions',
				type: 'fixedCollection',
				default: {},
				placeholder: 'Add Approval Action',
				typeOptions: {
					multipleValues: false,
				},
				displayOptions: {
					show: {
						operation: ['approval'],
					},
				},
				options: [
					{
						displayName: 'Approval',
						name: 'approval',
						values: [
							{
								displayName: 'Button Label',
								name: 'label',
								type: 'string',
								default: 'Approve',
								description: 'Label shown on the approval button',
							},
							{
								displayName: 'Trigger URL',
								name: 'url',
								type: 'string',
								required: true,
								default: '',
								placeholder: 'e.g. https://your-n8n-instance.com/webhook/approve',
								description: 'Webhook URL called when the user approves',
								validateType: 'url',
							},
						],
					},
					{
						displayName: 'Refinement',
						name: 'refinement',
						values: [
							{
								displayName: 'Button Label',
								name: 'label',
								type: 'string',
								default: 'Refine',
								description: 'Label shown on the refinement button',
							},
							{
								displayName: 'Trigger URL',
								name: 'url',
								type: 'string',
								required: true,
								default: '',
								placeholder: 'e.g. https://your-n8n-instance.com/webhook/refine',
								description: 'Webhook URL called when the user requests a refinement',
								validateType: 'url',
							},
						],
					},
				],
				description: 'Configure approval and refinement actions for approval requests',
			},
			{
				displayName: 'Rich Notification Content',
				name: 'payloadType',
				type: 'options',
				options: [
					// {
					// 	name: 'JSON',
					// 	value: 'json',
					// },
					{
						name: 'List of Content Blocks',
						value: 'list',
						description: 'Build rich notifications with multiple content blocks like text, images, links, and interactive triggers',
					},
					{
						name: 'Markdown',
						value: 'markdown',
						description: 'Simple formatted content using Markdown syntax',
					},
					{
						name: 'No Payload',
						value: 'none',
						description: 'Send only the title and body without additional content',
					},
				],
				default: 'none',
				description: 'Add extra content that is displayed when the notification is opened. Use blocks for interactive elements like buttons or forms, or markdown for formatted text.',
				displayOptions: {
					show: {
						operation: ['richNotification'],
					},
				},
			},
			// {
			// 	displayName: 'Payload JSON',
			// 	name: 'payloadJson',
			// 	type: 'string',
			// 	typeOptions: {
			// 		rows: 10,
			// 	},
			// 	default: '',
			// 	placeholder: 'Enter JSON content',
			// 	displayOptions: {
			// 		show: {
			// 			payloadType: ['json'],
			// 		},
			// 	},
			// },
			{
				displayName: 'Markdown',
				name: 'payloadMarkdown',
				type: 'string',
				typeOptions: {
					rows: 10,
				},
				default: '',
				placeholder: 'Enter markdown',
				displayOptions: {
					show: {
						payloadType: ['markdown'],
						operation: ['richNotification'],
					},
				},
			},
			{
				displayName: 'Blocks',
				name: 'elements',
				type: 'fixedCollection',
				placeholder: 'Add Block',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Block',
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
						operation: ['richNotification'],
					},
				},
				options: [
					{
						displayName: 'Block',
						name: 'element',
						typeOptions: {
							multipleValueButtonText: 'Add Block',
						},
						/* eslint-disable -- Custom field order for workflowTrigger fields */
						values: [
							{
								displayName: 'Block Type',
								name: 'type',
								type: 'options',
								options: [
									{
										name: 'Headline',
										value: 'headline',
										description: 'Bold section header to organize your content',
									},
									{
										name: 'Image',
										value: 'image',
										description: 'Display an image from a URL or Base64 string',
									},
									{
										name: 'Link',
										value: 'url',
										description: 'Clickable link with custom text',
									},
									{
										name: 'Markdown',
										value: 'markdown',
										description: 'Rich text with formatting using Markdown syntax',
									},
									{
										name: 'Text',
										value: 'text',
										description: 'Simple plain text content',
									},
									{
										name: 'Workflow Trigger',
										value: 'workflowTrigger',
										description: 'Interactive button or form to trigger a webhook',
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
								displayName: 'Adds an interactive element with a button or form fields to trigger a webhook or form. Perfect for human-in-the-loop workflows — users can approve, reject, submit data, or trigger actions directly from the notification.',
								name: 'workflowTriggerNotice',
								type: 'notice',
								default: '',
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
								placeholder: 'e.g. https://your-n8n-instance.com/webhook/abc123',
								description: 'Used to identify the trigger and display its form fields or parameters. This URL will be called when the user executes the action.',
								hint: 'Paste the Production URL from your Webhook or Form trigger node',
								displayOptions: {
									show: {
										type: ['workflowTrigger'],
									},
								},
							},
							{
								displayName: 'Options',
								name: 'workflowTriggerOptions',
								type: 'collection',
								placeholder: 'Add Option',
								default: {},
								displayOptions: {
									show: {
										type: ['workflowTrigger'],
									},
								},
								options: [
									{
										displayName: 'Title',
										name: 'title',
										type: 'string',
										default: '',
										placeholder: 'Enter a title for the workflow trigger usage',
									},
									{
										displayName: 'Description',
										name: 'description',
										type: 'string',
										default: '',
										placeholder: 'Enter a description for the workflow trigger usage',
									},
									{
										displayName: 'Primary',
										name: 'primary',
										type: 'boolean',
										default: true,
									},
									{
										displayName: 'Execution Button Label',
										name: 'executionButtonLabel',
										type: 'string',
										default: '',
										placeholder: 'Enter execution button label',
									},
									{
										displayName: 'Show Execution Button Only',
										name: 'showExecutionButtonOnly',
										type: 'boolean',
										default: false,
									},
									{
										displayName: 'HTTP Method',
										name: 'httpMethod',
										type: 'options',
										default: 'POST',
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
									},
									{
										displayName: 'Prefill Data',
										name: 'bodyType',
										type: 'options',
										default: 'none',
										description: 'Prefill form fields or webhook parameters with default values before the user sees them',
										hint: 'Use this to pre-populate fields so users don\'t have to enter them manually',
										options: [
											{
												name: 'No Prefill',
												value: 'none',
												description: 'Let users fill in all fields themselves',
											},
											{
												name: 'Field Values',
												value: 'customFields',
												description: 'Prefill specific fields by name',
											},
											{
												name: 'JSON',
												value: 'jsonBody',
												description: 'Prefill using a JSON object',
											},
										],
									},
									{
										displayName: 'Prefill JSON',
										name: 'jsonBody',
										type: 'string',
										typeOptions: {
											rows: 5,
										},
										default: '',
										placeholder: '{ "fieldName": "value", "anotherField": 123 }',
										description: 'JSON object with field names and their prefill values. Field names must match the form or webhook parameters.',
										hint: 'Add "Prefill Data" option and select "JSON" to use this',
									},
									{
										displayName: 'Prefill Fields',
										name: 'fields',
										type: 'fixedCollection',
										placeholder: 'Add Field',
										typeOptions: {
											multipleValues: true,
											sortable: true,
										},
										default: {},
										description: 'Define field names and their prefill values. Field names must match the form or webhook parameters.',
										hint: 'Add "Prefill Data" option and select "Field Values" to use this',
										options: [
											{
												displayName: 'Field',
												name: 'field',
												values: [
													{
														displayName: 'Field Name',
														name: 'key',
														type: 'string',
														default: '',
														placeholder: 'e.g. email, amount, approved',
														description: 'The name of the form field or webhook parameter to prefill',
													},
													{
														displayName: 'Value Type',
														name: 'valueType',
														type: 'options',
														default: 'text',
														options: [
															{
																name: 'Text',
																value: 'text',
															},
															{
																name: 'Number',
																value: 'number',
															},
															{
																name: 'Boolean',
																value: 'boolean',
															},
														],
													},
													{
														displayName: 'Value',
														name: 'value',
														type: 'string',
														default: '',
														placeholder: 'Enter the prefill value',
														description: 'The value to prefill for this field',
													},
												],
											},
										],
									},
								],
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
		const workflowId = this.getWorkflow().id;
		let item: INodeExecutionData;
		let title: string;
		let body: string;
		let userIds: string[];
		let operation: string;
		let payloadType: string;
		let elements: Array<{ type: string; text?: string; title?: string; url?: string; linkText?: string; markdown?: string; httpMethod?: string; bodyType?: string; jsonBody?: string; fields?: { field?: Array<{ key: string; valueType?: string; value: string | number | boolean }> }; name?: string; description?: string; primary?: boolean; executionButtonLabel?: string; showExecutionButtonOnly?: boolean; imageSourceType?: string; base64?: string; imageUrl?: string; workflowTriggerOptions?: Record<string, unknown> }>;
		let approvalConfig: { approval: { label: string; url: string }; refinement: { label: string; url: string } } | null = null;
		let approvalElements: typeof elements = [];

		// Iterates over all input items and send HTTP request for each item
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				title = this.getNodeParameter('title', itemIndex, '') as string;
				body = this.getNodeParameter('body', itemIndex, '') as string;
				const userIdParam = this.getNodeParameter('userIds', itemIndex, { values: [] }) as {
					values?: Array<{ value: string }>;
				};
				// Extract user IDs from fixedCollection structure
				userIds = (userIdParam?.values || []).map((item) => item.value).filter((id) => id && id.trim() !== '');
				operation = this.getNodeParameter('operation', itemIndex, 'richNotification') as string;
				payloadType = this.getNodeParameter('payloadType', itemIndex, 'none') as string;
				if (operation === 'approval') {
					payloadType = 'none';
				}
				item = items[itemIndex];

				// Validate that at least one user ID is provided
				if (userIds.length === 0) {
					throw new NodeOperationError(this.getNode(), 'At least one device identifier is required', {
						itemIndex,
					});
				}

				// Prepare request body based on payload type
				let requestBody: { title: string; body: string; data: Record<string, unknown> };
				
				if (operation === 'approval') {
					const approvalActions = this.getNodeParameter('approvalActions', itemIndex, {
						approval: {},
						refinement: {},
					}) as {
						approval?: { label?: string; url?: string };
						refinement?: { label?: string; url?: string };
					};
					const approvalContentType = this.getNodeParameter('reviewContentType', itemIndex, 'markdown') as string;
					const approvalContentMarkdown = this.getNodeParameter('reviewContentMarkdown', itemIndex, '') as string;
					let rawApprovalElements: typeof elements = [];
					const approvalLabel = approvalActions?.approval?.label?.trim() || 'Approve';
					const approvalUrl = approvalActions?.approval?.url?.trim() || '';
					const refinementLabel = approvalActions?.refinement?.label?.trim() || 'Refine';
					const refinementUrl = approvalActions?.refinement?.url?.trim() || '';

					if (!approvalUrl || !refinementUrl) {
						throw new NodeOperationError(this.getNode(), 'Approval and refinement trigger URLs are required', {
							itemIndex,
						});
					}

					approvalConfig = {
						approval: { label: approvalLabel, url: approvalUrl },
						refinement: { label: refinementLabel, url: refinementUrl },
					};

					if (approvalContentType === 'list') {
						const contentElementsParam = this.getNodeParameter('reviewContentElements', itemIndex, { element: [] }) as {
							element?: typeof elements;
						};
						rawApprovalElements = contentElementsParam.element || [];
					} else if (approvalContentType === 'markdown') {
						rawApprovalElements = [
							{
								type: 'markdown',
								markdown: approvalContentMarkdown,
							},
						];
					} else {
						rawApprovalElements = [];
					}

					approvalElements = rawApprovalElements.map((element) => {
						const flattenedElement = {
							...element,
							id: generateUUID(),
						} as typeof element & { id: string };

						if (flattenedElement.fields && typeof flattenedElement.fields === 'object' && 'field' in flattenedElement.fields) {
							const fieldsObj = flattenedElement.fields as { field?: Array<{ key: string; valueType?: string; value: string | number | boolean }> };
							(flattenedElement as Record<string, unknown>).fields = fieldsObj.field || [];
						}

						return flattenedElement;
					}) as typeof elements;

					requestBody = {
						title,
						body,
						data: {
							executionId,
							workflowId,
							elements: approvalElements,
							approvalActions: approvalConfig,
						},
					};
					elements = [];
				} else if (payloadType === 'json') {
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
						? { ...jsonDataWithIds as Record<string, unknown>, executionId, workflowId }
						: { data: jsonDataWithIds, executionId, workflowId };
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
							element?: Array<{ type: string; text?: string; title?: string; url?: string; linkText?: string; markdown?: string; httpMethod?: string; bodyType?: string; jsonBody?: string; fields?: { field?: Array<{ key: string; valueType?: string; value: string | number | boolean }> }; name?: string; description?: string; primary?: boolean; executionButtonLabel?: string; showExecutionButtonOnly?: boolean; imageSourceType?: string; base64?: string; imageUrl?: string; workflowTriggerOptions?: Record<string, unknown> }>;
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
						} as typeof element & { id: string; workflowTriggerOptions?: Record<string, unknown> };
						
						// Flatten workflowTriggerOptions: merge options into element
						if (flattenedElement.type === 'workflowTrigger') {
							if (flattenedElement.workflowTriggerOptions) {
								const options = flattenedElement.workflowTriggerOptions as Record<string, unknown>;
								Object.assign(flattenedElement, options);
								delete flattenedElement.workflowTriggerOptions;
							}
							// Set default primary value if not specified
							if ((flattenedElement as Record<string, unknown>).primary === undefined) {
								(flattenedElement as Record<string, unknown>).primary = true;
							}
						}
						
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
							workflowId,
							elements: elements 
						},
					};
				}

				// Send HTTP request for each user ID
				const responses: Array<{ userId: string; response: unknown; error?: unknown }> = [];
				for (const userId of userIds) {
					try {
						const response = await this.helpers.httpRequest({
							method: 'POST',
							url: `https://orchestro.app/api/push/${userId}`,
							body: requestBody,
							json: true,
						});
						responses.push({ userId, response });
					} catch (error) {
						// If continueOnFail is enabled, collect errors; otherwise throw
						if (this.continueOnFail()) {
							responses.push({ userId, response: null, error });
						} else {
							throw error;
						}
					}
				}

				// Add response to output
				item.json = {
					...item.json,
					title,
					body,
					executionId,
					workflowId,
					userIds,
					payload: operation === 'approval'
						? { type: 'approval', approvalActions: approvalConfig, elements: approvalElements }
						: payloadType === 'list'
							? { type: 'list', elements }
							: payloadType === 'json'
								? { type: 'json', data: requestBody.data }
								: null,
					responses
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

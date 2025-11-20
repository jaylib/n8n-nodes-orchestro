# n8n-nodes-orchestro

This is an n8n community node. It lets you send push notifications to the [Orchestro](https://orchestro.app) app in your n8n workflows.

Orchestro is an application that allows you to receive actionable push notifications from your workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Usage](#usage)  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### Send Push Notification
This node sends a push notification to a specific user via the Orchestro API.

**Parameters:**
*   **Title**: The title of the notification.
*   **Body**: The main body text of the notification.
*   **User ID**: The target user's ID (required).

**Payload Types:**
You can attach different types of payloads to your notification:

*   **No Payload**: Just the title and body.
*   **JSON**: Send raw JSON data. Useful for debugging or custom data handling.
*   **Markdown**: Send a markdown formatted block.
*   **List of Elements**: Build a rich notification with multiple UI elements.

**Supported Elements (in "List of Elements"):**
*   **Headline**: A bold section header.
*   **Text**: Standard text block.
*   **Markdown**: Render markdown content.
*   **Image**: Display an image from a URL or Base64 string.
*   **Link**: A clickable URL with custom link text.
*   **Webhook**: Create actionable buttons that trigger webhooks.
    *   Supports standard HTTP methods (GET, POST, PUT, DELETE, etc.).
    *   Can send custom fields or a JSON body.
    *   Customizable button label and appearance.

## Usage

To use this node, you need to have the Orchestro app installed and obtain your User ID.

1.  Add the **Orchestro** node to your workflow.
2.  Enter your **User ID**.
3.  Set the **Title** and **Body** of the notification.
4.  (Optional) Select a **Payload Type** to add rich content or interactive elements like buttons (Triggers) or images.

## Resources

*   [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
*   [Orchestro Website](https://orchestro.app)

# n8n-nodes-orchestro

This is an n8n community node. It lets you send rich, interactive push notifications to the [Orchestro](https://orchestro.app) app in your n8n workflows.

Orchestro enables human-in-the-loop workflows by allowing users to receive actionable push notifications, approve or reject actions, submit data, and trigger workflows directly from their mobile device.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
- [Notification Inbox](#notification-inbox)
- [Configuration Options](#configuration-options)
  - [Title](#title)
  - [Body](#body)
  - [Device Identifiers](#device-identifiers)
  - [Rich Notification Content](#rich-notification-content)
- [Content Blocks](#content-blocks)
  - [Text](#text)
  - [Headline](#headline)
  - [Markdown](#markdown)
  - [Image](#image)
  - [Link](#link)
  - [Workflow Trigger](#workflow-trigger)
- [Human-in-the-Loop Workflows](#human-in-the-loop-workflows)
- [Examples](#examples)
- [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Getting Started

1. Install the Orchestro app on your mobile device
2. Open the app and navigate to **Settings → Notifications** to find your Device Identifier
3. Add the **Orchestro** node to your n8n workflow
4. Enter your Device Identifier
5. Configure the notification title, body, and optional rich content
6. Execute your workflow to receive the notification

## Notification Inbox

All workflow notifications are collected in one place — the Orchestro Inbox. Think of it like an email inbox, but for your automations.

- **Never miss a notification** — Even if you didn't catch a push notification, it's waiting in the inbox
- **Review past notifications** — Scroll through notification history to find previous reports, approvals, or updates
- **Take action anytime** — Interactive notifications remain actionable from the inbox, so users can approve requests or submit data whenever they're ready
- **Stay organized** — Keep track of what workflows are doing across all automations
- **See status at a glance** — Notifications are visually distinguished by their status: action required, action completed, or informational results only

## Configuration Options

### Title

The headline of your push notification. This is the first thing users see when the notification arrives.

- **Type:** String
- **Required:** No
- **Example:** `Workflow completed successfully`

Keep it short and attention-grabbing. The title appears prominently in the notification banner.

### Body

The main message shown in the push notification. Use this to provide context or a summary of what needs attention.

- **Type:** String (multiline)
- **Required:** No
- **Example:** `Data sync finished. 42 records processed.`

### Device Identifiers

Identifies which device(s) will receive the push notification. You can send the same notification to multiple devices.

- **Type:** Array of strings
- **Required:** Yes (at least one)
- **Example:** `abc123-def456-ghi789`

**Adding your Device Identifier:**

There are two ways to configure which devices receive notifications:

**Option 1: From the Orchestro App (Recommended)**
1. Open the Orchestro app
2. Open any workflow and go to notification settings via the menu in the toolbar
4. You'll see a list of Orchestro nodes in your workflows
5. Tap **"Add my device to all nodes for me"** to automatically configure all nodes, or tap on individual nodes to configure them selectively

**Option 2: Manual Configuration**
1. Open the Orchestro app
2. Go to **Settings → Notifications**
3. Copy your Device Identifier
4. Paste it into the Device Identifier field in your n8n Orchestro node

You can add multiple Device Identifiers to send the notification to several devices at once.

### Rich Notification Content

Add extra content that is displayed when the notification is opened. This content appears in the detail view, not in the notification banner.

**Options:**

| Option | Description |
|--------|-------------|
| **No Payload** | Send only the title and body without additional content |
| **Markdown** | Simple formatted content using Markdown syntax |
| **List of Content Blocks** | Build rich notifications with multiple content blocks like text, images, links, and interactive triggers |

## Content Blocks

When using "List of Content Blocks", you can combine multiple block types to create rich, interactive notifications.

### Text

Simple plain text content.

- **Text:** The text content to display

### Headline

Bold section header to organize your content. Use headlines to create visual hierarchy in longer notifications.

- **Text:** The headline text

### Markdown

Rich text with formatting using Markdown syntax. Supports standard Markdown features like bold, italic, lists, and links.

- **Markdown Text:** The markdown content to render

### Image

Display an image from a URL or Base64 string.

**Image Source Type:**
- **URL:** Provide a direct link to an image
- **Base64:** Provide a Base64-encoded image string

**Parameters:**
- **Image URL:** The URL of the image (when using URL source)
- **Base64:** The Base64-encoded image data (when using Base64 source)

### Link

Clickable link with custom text.

- **Link Text:** The text displayed for the link
- **URL:** The destination URL

### Workflow Trigger

Interactive button or form to trigger a webhook. This is the key block type for human-in-the-loop workflows, allowing users to approve, reject, submit data, or trigger actions directly from the notification.

**Required Parameters:**

| Parameter | Description |
|-----------|-------------|
| **URL** | The webhook URL to call when the user executes the action. Paste the Production URL from your Webhook or Form trigger node. |

**Optional Parameters (under "Add Option"):**

| Parameter | Description |
|-----------|-------------|
| **Title** | A title for the workflow trigger section |
| **Description** | A description explaining what the action does |
| **Primary** | Whether this is the primary action (affects button styling) |
| **Execution Button Label** | Custom label for the execution button |
| **Show Execution Button Only** | Hide form fields and show only the execution button |
| **HTTP Method** | The HTTP method to use (GET, POST, PUT, PATCH, DELETE, etc.). Default: POST |
| **Prefill Data** | Prefill form fields or webhook parameters with default values |

**Prefill Data Options:**

| Option | Description |
|--------|-------------|
| **No Prefill** | Let users fill in all fields themselves |
| **Field Values** | Prefill specific fields by name using key-value pairs |
| **JSON** | Prefill using a JSON object |

**Prefill Fields Parameters:**
- **Field Name:** The name of the form field or webhook parameter to prefill (e.g., `email`, `amount`, `approved`)
- **Value Type:** Text, Number, or Boolean
- **Value:** The prefill value

## Human-in-the-Loop Workflows

Orchestro excels at human-in-the-loop workflows where automated processes need human input or approval. Here are common patterns:

### Approval Workflows

Create notifications with "Approve" and "Reject" workflow triggers:

1. Add two Workflow Trigger blocks
2. Point each to different webhook endpoints in your n8n workflow
3. Use meaningful button labels like "Approve" and "Reject"
4. Your workflow can then branch based on which action was taken

### Data Collection

Use Form triggers to collect data from users:

1. Set the URL to your n8n Form trigger node
2. The form fields defined in n8n will be displayed in the notification
3. Users can fill in the data and submit directly from their device
4. Prefill known values to save users time

### Action Confirmation

Request confirmation before executing critical actions:

1. Create a notification explaining the pending action
2. Add a Workflow Trigger with a clear button label
3. Only proceed with the action when the user confirms

## Examples

### Triggered Workflow Notification

A webhook or form trigger completes processing and notifies the user.

```
Title: Video Transcription Complete
Body: Your YouTube tutorial has been converted to text and is ready for review.
Rich Notification Content: No Payload
```

### Scheduled Report (Informational)

A daily scheduled workflow curates tech news and delivers a digest. No action needed—just keeping you informed.

```
Title: Your Tech News Digest
Body: AI curated today's top stories from your favorite sources.
Rich Notification Content: Markdown

Markdown Content:
## Top Stories

**OpenAI Announces GPT-5 Preview**
First look at next-generation capabilities with improved reasoning...

**Apple's On-Device AI Strategy**
New report reveals Apple's focus on privacy-first machine learning...

**Startup Raises $50M for AI Code Review**
Backed by Sequoia, aims to automate pull request reviews...

[View All 12 Stories](https://example.com/digest)
```

### Scheduled Content Performance (Informational)

A weekly scheduled workflow analyzes your published content and reports the results.

```
Title: Weekly Content Report
Body: Your blog and social media performance from the past 7 days.

Blocks:
1. Headline: "Performance Summary"
2. Markdown: "**Blog Views:** 2,847 (+12%)\n**Top Post:** 'Getting Started with n8n' - 892 views\n**Newsletter Opens:** 67%\n**New Subscribers:** 34"
3. Link:
   - Link Text: "View Full Analytics"
   - URL: https://example.com/analytics
```

### Scheduled Draft for Approval

A daily scheduled workflow monitors RSS feeds, drafts a blog post, and generates a thumbnail. Requires your approval before publishing—or refine the image first.

```
Title: Blog Draft Ready
Body: AI generated a post and thumbnail from today's trending topics.

Blocks:
1. Headline: "Generated Article"
2. Markdown: "**Title:** Why Every Developer Should Learn Prompt Engineering\n\n**Preview:**\nThree years ago, I thought prompt engineering was just a buzzword. Today, it's become my most valuable skill..."
3. Headline: "Generated Thumbnail"
4. Image:
   - Image Source Type: URL
   - Image URL: https://your-storage.com/generated/thumb_abc123.png
5. Workflow Trigger (Publish):
   - URL: https://your-n8n.com/webhook/publish-blog
   - Button Label: "Publish to Blog"
6. Workflow Trigger (Refine Image):
   - URL: https://your-n8n.com/form/refine-thumbnail
   - Title: "Refine Thumbnail"
   - Description: "Describe what you'd like to change about the image"
   - Button Label: "Regenerate Thumbnail"
   - Primary: false
7. Workflow Trigger (Discard):
   - URL: https://your-n8n.com/webhook/discard-draft
   - Button Label: "Discard"
   - Primary: false
```

### Scheduled Newsletter for Approval

A weekly scheduled workflow compiles saved articles into a newsletter. Requires confirmation before sending to subscribers.

```
Title: Newsletter Ready to Send
Body: AI compiled this week's newsletter from your saved articles.

Blocks:
1. Headline: "This Week's Issue"
2. Text: "12 articles curated, 3 original insights added, estimated read time: 8 minutes. Subscriber count: 2,847."
3. Workflow Trigger:
   - URL: https://your-n8n.com/webhook/send-newsletter
   - Button Label: "Send to Subscribers"
```

## Resources

- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Orchestro Website](https://orchestro.app)
- [n8n Webhook Trigger Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [n8n Form Trigger Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.formtrigger/)

# Push Notifications for Workflows

Receive actionable push notifications directly from your n8n workflows. Orchestro enables human-in-the-loop automation by letting you approve actions, submit data, and trigger workflows right from your mobile device.

## How It Works

1. **Your n8n workflow runs** — triggered by a schedule, webhook, or any other event
2. **The workflow sends a notification** — using the Orchestro node with your Device Identifier
3. **You receive a push notification** — with rich content, images, and interactive buttons
4. **You take action** — approve, reject, submit data, or trigger follow-up workflows

## Your Notification Inbox

All your workflow notifications are collected in one place — the Orchestro Inbox. Think of it like an email inbox, but for your automations.

- **Never miss a notification** — Even if you didn't catch a push notification, it's waiting in your inbox
- **Review past notifications** — Scroll through your notification history to find previous reports, approvals, or updates
- **Take action anytime** — Interactive notifications remain actionable from your inbox, so you can approve requests or submit data whenever you're ready
- **Stay organized** — Keep track of what your workflows are doing across all your automations
- **See status at a glance** — Notifications are visually distinguished by their status:
  - **Action required** — Notifications waiting for your input or approval
  - **Action completed** — Notifications you've already responded to
  - **Informational** — Results and updates that don't require any action

## Setting Up Your Device

### Option 1: App-Based Registration (Recommended)

The easiest way to start receiving notifications:

1. Open any workflow in the Orchestro app
2. Tap the menu icon in the toolbar
3. Select **Notification Settings**
4. You'll see a list of Orchestro nodes in your workflows
5. Tap **"Add my device to all nodes for me"** to automatically register your device with all nodes

You can also tap individual nodes to selectively choose which notifications you want to receive.

### Option 2: Manual Configuration

If you prefer to configure nodes manually:

1. Open the Orchestro app
2. Go to **Settings → Notifications**
3. Copy your **Device Identifier**
4. Share this identifier with your n8n workflow administrator to add it to the Orchestro nodes

## What You'll Receive

### Basic Notifications

Simple notifications with a title and message, perfect for status updates and alerts.

### Rich Notifications

When you open a notification, you may see additional content:

- **Text & Headlines** — Organized information with clear sections
- **Markdown** — Formatted text with bold, lists, and links
- **Images** — Visual content like charts, thumbnails, or screenshots
- **Links** — Quick access to external resources

### Interactive Notifications

The most powerful feature — notifications that let you take action:

- **Approval Buttons** — Approve or reject requests with a single tap
- **Forms** — Submit data directly from the notification
- **Workflow Triggers** — Start follow-up workflows from your device

## Example Use Cases

### Triggered Workflow Notification

A webhook or form trigger completes processing and notifies you:

> **Video Transcription Complete**
> Your YouTube tutorial has been converted to text and is ready for review.

### Scheduled Report (Informational)

A daily scheduled workflow curates tech news and delivers a digest. No action needed—just keeping you informed:

> **Your Tech News Digest**
> AI curated today's top stories from your favorite sources.
>
> ## Top Stories
>
> **OpenAI Announces GPT-5 Preview**
> First look at next-generation capabilities with improved reasoning...
>
> **Apple's On-Device AI Strategy**
> New report reveals Apple's focus on privacy-first machine learning...
>
> [View All 12 Stories]

### Scheduled Content Performance (Informational)

A weekly scheduled workflow analyzes your published content and reports the results:

> **Weekly Content Report**
> Your blog and social media performance from the past 7 days.
>
> **Performance Summary**
> - Blog Views: 2,847 (+12%)
> - Top Post: 'Getting Started with n8n' - 892 views
> - Newsletter Opens: 67%
> - New Subscribers: 34
>
> [View Full Analytics]

### Scheduled Draft for Approval

A daily scheduled workflow monitors RSS feeds, drafts a blog post, and generates a thumbnail. Requires your approval before publishing—or refine the image first:

> **Blog Draft Ready**
> AI generated a post and thumbnail from today's trending topics.
>
> **Generated Article**
> Title: Why Every Developer Should Learn Prompt Engineering
>
> Preview: Three years ago, I thought prompt engineering was just a buzzword. Today, it's become my most valuable skill...
>
> **Generated Thumbnail**
> [Image preview]
>
> [Publish to Blog] [Regenerate Thumbnail] [Discard]

### Scheduled Newsletter for Approval

A weekly scheduled workflow compiles saved articles into a newsletter. Requires confirmation before sending to subscribers:

> **Newsletter Ready to Send**
> AI compiled this week's newsletter from your saved articles.
>
> **This Week's Issue**
> 12 articles curated, 3 original insights added, estimated read time: 8 minutes. Subscriber count: 2,847.
>
> [Send to Subscribers]

## Troubleshooting

### Not receiving notifications?

1. **Check notification permissions** — Ensure Orchestro has permission to send notifications in your device settings
2. **Verify your Device Identifier** — Make sure the correct identifier is configured in the n8n workflow
3. **Check the workflow** — The n8n workflow must be active and executing successfully

### Notifications arriving but no content?

The workflow may be configured to send only a title and body without rich content. Contact your workflow administrator if you expected additional content.

## Privacy & Security

- Your Device Identifier is unique to your device and app installation
- Notifications are delivered via Google Firebase Cloud Messaging
- Notification content is stored securely in your personal inbox using a cloud database provider
- Only you can access your inbox — notifications are private to your device
- You control which workflows can send you notifications

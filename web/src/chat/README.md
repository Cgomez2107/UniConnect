# Decorator Pattern — Chat Messages (Web)

## Overview

The Decorator pattern allows adding dynamic capabilities to chat messages without modifying the base class. Each decorator wraps a message and adds specific behavior: file attachments, @mentions highlighting, or interactive reaction bars.

## UML

```
┌─────────────────────────────────────────────┐
│                «interface»                   │
│                  IMessage                    │
├─────────────────────────────────────────────┤
│ +id: string                                  │
│ +content: string                             │
│ +senderId: string                            │
│ +timestamp: Date                             │
├─────────────────────────────────────────────┤
│ +getContent(): string                        │
│ +getMetadata(): Record<string, unknown>      │
│ +render(context?): ReactNode                 │
└─────────────────────────────────────────────┘
          ▲                    ▲
          │                    │
┌─────────┴─────────┐  ┌──────┴──────────────────┐
│   BaseMessage     │  │  MessageDecorator (abs) │
├───────────────────┤  ├─────────────────────────┤
│ -content: string  │  │ #wrapper: IMessage       │
│ -senderId: string │  └─────────────────────────┤
│ -timestamp: Date  │  │ +getContent(): string    │
├───────────────────┤  │ +getMetadata(): Record   │
│ +render(): text   │  │ +render(): abstract      │
└───────────────────┘  └─────────────────────────┘
                               ▲
                               │
              ┌────────────────┼────────────────┐
              │                │                │
   ┌──────────┴───────┐ ┌─────┴────────┐ ┌──────┴──────────┐
   │   FileDecorator  │ │MentionDecor  │ │ReactionDecorator│
   ├──────────────────┤ ├──────────────┤ ├─────────────────┤
   │ -file: FileData  │ │ -mentions:   │ │ -reactions:     │
   │                  │ │  MentionData │ │  ReactionData[]  │
   ├──────────────────┤ ├──────────────┤ ├─────────────────┤
   │ +getFile()       │ │ +getMentions │ │ +getReactions() │
   │ +render(): img   │ │ +render():   │ │ +render():      │
   │   or file card   │ │   @highlight │ │   reaction bar  │
   └──────────────────┘ └──────────────┘ └─────────────────┘
```

## Decorators

| Decorator | Adds | Render output |
|---|---|---|
| `BaseMessage` | Raw text content | Plain text |
| `FileDecorator` | `FileData` (url, mimeType, filename, size) | Image `<img>` or file attachment card |
| `MentionDecorator` | `MentionData[]` (userId, displayName, position) | Highlighted `@name` spans, amber for self |
| `ReactionDecorator` | `ReactionData[]` (emoji, count, users) | Interactive emoji row with counters + picker |

## Composition

Decorators are composable via `messageFactory.buildDecoratedMessage(raw)`:

```
raw → BaseMessage → FileDecorator(mentions exist?) → MentionDecorator(reactions exist?) → ReactionDecorator
```

Order matters: the innermost decorator renders text, then each outer decorator wraps the render output.

## Files

| File | Role |
|---|---|
| `chat/models/IMessage.ts` | Interface + data types |
| `chat/models/BaseMessage.ts` | Base implementation |
| `chat/models/MessageDecorator.ts` | Abstract decorator |
| `chat/models/FileDecorator.ts` | File/media decorator |
| `chat/models/MentionDecorator.ts` | Mention decorator |
| `chat/models/ReactionDecorator.ts` | Reaction decorator |
| `chat/models/messageFactory.ts` | Factory function |
| `components/chat/MessageBubble.tsx` | Uses decorated render |
| `components/chat/ReactionBar.tsx` | Reaction UI component |

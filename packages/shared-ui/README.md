# @uniconnect/shared-ui

Design Tokens + Headless Hooks shared UI library for Web (Tailwind) and Mobile (React Native).

## Overview

This package provides:

- **Design Tokens**: Centralized visual system (colors, spacing, typography) as single source of truth
- **Headless Hooks**: Reusable logic (auth validation, chat composer state) without UI rendering

## Architecture

```
Design Tokens (Single Source of Truth)
    ├── Colors (semantic + functional)
    ├── Spacing (4px base unit)
    ├── Typography (scales + styles)
    └── Utilities (getColor, getSpacing, getTailwindTokens)
         ↓
Web (Tailwind)  &  Mobile (React Native)

Headless Hooks (Platform-agnostic logic)
    ├── useAuthForm (login/signup validation)
    ├── useChatMessageComposer (message state)
    └── (extensible for more hooks)
         ↓
Web Components  &  Mobile Components
```

## Design Tokens: The Single Source of Truth

### Why Tokens Matter

Design tokens eliminate hardcoded values and ensure visual consistency across platforms:

```typescript
// ❌ BAD: Hardcoded values scatter across codebase
const ButtonComponent = styled.button`
  background-color: #3B82F6;  // Where is this blue from?
  padding: 12px 16px;          // Inconsistent spacing
  font-size: 16px;             // Not aligned with system
`;

// ✅ GOOD: Centralized tokens, used everywhere
import { colors, spacing, fontSize } from "@uniconnect/shared-ui";

const ButtonComponent = styled.button`
  background-color: ${colors.primary[500]};  // Clear semantic meaning
  padding: ${spacing.md} ${spacing.lg};      // Scales maintained
  font-size: ${fontSize.md};                 // Aligned with typography system
`;
```

### Token Structure

#### 1. **Colors** (`src/tokens/colors.ts`)

**Semantic Palettes** (10 colors each):
- `colors.primary` - Brand primary (Blue)
- `colors.secondary` - Brand secondary (Purple)
- `colors.success` - Success states (Green)
- `colors.warning` - Warning states (Amber)
- `colors.error` - Error states (Red)
- `colors.info` - Info states (Cyan)
- `colors.neutral` - Backgrounds, borders, text (Gray)

Each palette has scales 50-900 (light to dark):
```typescript
colors.primary[50]    // #EFF6FF (lightest)
colors.primary[500]   // #3B82F6 (base)
colors.primary[900]   // #1E3A8A (darkest)
```

**Functional Colors** (semantic usage):
```typescript
functionalColors.text.primary       // colors.neutral[900]
functionalColors.background.primary // white
functionalColors.border.light       // colors.neutral[200]
functionalColors.status.success     // colors.success[500]
```

#### 2. **Spacing** (`src/tokens/spacing.ts`)

**Base Unit**: 4px

**T-shirt Sizes**:
```typescript
spacing.xs     // 4px   (1 unit)
spacing.sm     // 8px   (2 units)
spacing.md     // 12px  (3 units)
spacing.lg     // 16px  (4 units)
spacing.xl     // 24px  (6 units)
spacing["2xl"] // 32px  (8 units)
```

**Numeric Scale** (for React Native):
```typescript
spacingNumeric[1]  // 4
spacingNumeric[2]  // 8
spacingNumeric[3]  // 12
spacingNumeric[4]  // 16
```

**Scales**: `padding`, `margin`, `gap`, `borderRadius`, `shadows`

#### 3. **Typography** (`src/tokens/typography.ts`)

**Font Sizes**:
```typescript
fontSize.xs    // 12px (labels, captions)
fontSize.sm    // 14px (small text)
fontSize.md    // 16px (body text - default)
fontSize.lg    // 18px (subtitles)
fontSize.xl    // 20px (section headings)
fontSize["2xl"]// 24px (page headings)
fontSize["3xl"]// 30px (major headings)
fontSize["4xl"]// 36px (hero headings)
fontSize["5xl"]// 48px (extra large)
```

**Predefined Styles** (convenience):
```typescript
typographyStyles.h1       // { fontSize: "36px", fontWeight: 700, lineHeight: 1.2 }
typographyStyles.h2       // { fontSize: "30px", fontWeight: 700, lineHeight: 1.2 }
typographyStyles.bodyLarge // { fontSize: "16px", fontWeight: 400, lineHeight: 1.75 }
typographyStyles.label    // { fontSize: "14px", fontWeight: 500, lineHeight: 1.5 }
typographyStyles.button   // { fontSize: "16px", fontWeight: 600, lineHeight: 1.5 }
```

### Using Tokens

#### Web (Tailwind)

```typescript
// tailwind.config.js
import { getTailwindTokens } from "@uniconnect/shared-ui";

export default {
  theme: {
    extend: getTailwindTokens(),
  },
};

// In components
import { colors, spacing } from "@uniconnect/shared-ui";

export function Button() {
  return (
    <button
      className={`
        bg-primary-500
        hover:bg-primary-600
        text-white
        px-4 py-3
        rounded-lg
        font-semibold
        transition-colors
      `}
    >
      Click me
    </button>
  );
}
```

#### Mobile (React Native)

```typescript
import { StyleSheet } from "react-native";
import { colors, spacingNumeric, fontSizeNumeric, fontSize } from "@uniconnect/shared-ui";

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacingNumeric[4],  // 16px
    paddingVertical: spacingNumeric[3],    // 12px
    borderRadius: 8,
  },
  buttonText: {
    fontSize: fontSizeNumeric.md,  // 16
    fontWeight: "600",
    color: colors.white,
  },
});

export function Button() {
  return (
    <TouchableOpacity style={styles.button}>
      <Text style={styles.buttonText}>Click me</Text>
    </TouchableOpacity>
  );
}
```

### Token Utilities

```typescript
import {
  getColor,
  getSpacing,
  getFontSize,
  getTypographyStyle,
  getTailwindTokens,
  generateCSSVariables,
} from "@uniconnect/shared-ui";

// Get color by path
getColor("primary.500")           // "#3B82F6"
getColor("text.primary")          // "#111827"

// Get spacing
getSpacing("md")                  // "12px"
getSpacingNumeric(3)              // 12

// Get font size
getFontSize("lg")                 // "18px"
getFontSizeNumeric("lg")          // 18

// Get typography style
getTypographyStyle("h1")          // { fontSize: "36px", fontWeight: 700, ... }

// Tailwind integration
const tailwindTokens = getTailwindTokens();

// Generate CSS variables (for reference/documentation)
const cssVars = generateCSSVariables();
// :root {
//   --color-primary-50: #EFF6FF;
//   --color-primary-500: #3B82F6;
//   ...
// }
```

---

## Headless Hooks: Platform-Agnostic Logic

Headless hooks provide **no UI rendering** — just logic and state management that works on Web and Mobile.

### useAuthForm

Validation and state management for authentication (login/signup).

```typescript
import { useAuthForm } from "@uniconnect/shared-ui";

export function LoginForm() {
  const form = useAuthForm();

  const handleSubmit = async () => {
    if (!form.validate("login")) {
      console.log("Validation failed:", form.errors);
      return;
    }

    form.setIsLoading(true);
    try {
      // Call your auth API
      await authStore.signIn(form.values.email, form.values.password);
      form.reset();
    } catch (error) {
      form.setError("form", error.message);
    } finally {
      form.setIsLoading(false);
    }
  };

  return {
    email: form.values.email,
    emailError: form.errors.email,
    onEmailChange: form.handleEmailChange,

    password: form.values.password,
    passwordError: form.errors.password,
    onPasswordChange: form.handlePasswordChange,

    isLoading: form.isLoading,
    isValid: form.isValid,
    onSubmit: handleSubmit,
  };
}
```

#### API Reference

```typescript
interface AuthFormHook {
  // State
  values: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  };
  errors: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    form?: string;
  };
  isLoading: boolean;
  isValid: boolean;

  // Handlers
  handleEmailChange(email: string): void;
  handlePasswordChange(password: string): void;
  handleFirstNameChange(firstName: string): void;
  handleLastNameChange(lastName: string): void;

  // Methods
  setError(field: string, message: string): void;
  clearError(field: string): void;
  clearAllErrors(): void;
  reset(): void;
  setIsLoading(loading: boolean): void;
  validate(mode: "login" | "signup"): boolean;
  validateField(field: string, value: string, mode: "login" | "signup"): string | undefined;
}
```

#### Validation Rules

**Email**:
- Required
- Valid format (regex check)

**Password**:
- Required
- Minimum 8 characters
- At least one uppercase letter
- At least one number

**First Name** (signup only):
- Required
- Minimum 2 characters

**Last Name** (signup only):
- Required
- Minimum 2 characters

### useChatMessageComposer

State management for chat message input (message, typing, attachments).

```typescript
import { useChatMessageComposer } from "@uniconnect/shared-ui";

export function ChatComposer() {
  const composer = useChatMessageComposer();

  const handleSendMessage = async () => {
    if (!composer.canSend()) return;

    composer.startSending();
    try {
      const message = composer.getMessage();
      // Send via API
      await messagingClient.sendMessage(conversationId, message);
      composer.resetComposer();
    } finally {
      composer.endSending();
    }
  };

  return {
    message: composer.state.message,
    onMessageChange: composer.handleMessageChange,
    onMessageClear: composer.handleMessageClear,

    isSending: composer.state.isSending,
    canSend: composer.canSend(),
    onSendMessage: handleSendMessage,

    characterCount: composer.state.characterCount,
    remainingCharacters: composer.remainingCharacters,
    exceedsMaxLength: composer.exceedsMaxLength,

    attachmentCount: composer.state.attachmentCount,
    hasAttachments: composer.state.hasAttachments,
    onAttachmentAdd: composer.handleAttachmentAdd,
    onAttachmentRemove: composer.handleAttachmentRemove,
  };
}
```

#### API Reference

```typescript
interface ChatComposerHook {
  // State
  state: {
    message: string;
    isTyping: boolean;
    isSending: boolean;
    characterCount: number;
    hasAttachments: boolean;
    attachmentCount: number;
  };

  // Handlers
  handleMessageChange(text: string): void;
  handleMessageClear(): void;
  handleAttachmentAdd(): void;
  handleAttachmentRemove(index: number): void;
  handleAttachmentsClear(): void;

  // Methods
  getMessage(): string;
  canSend(): boolean;
  startSending(): void;
  endSending(): void;
  triggerTypingIndicator(): void;
  resetComposer(): void;

  // Computed
  isMessageEmpty: boolean;
  isComposerDisabled: boolean;
  remainingCharacters: number;
  exceedsMaxLength: boolean;
}
```

#### Features

- **Message State**: Tracks current message text
- **Character Limit**: Enforces 4000 character max (configurable)
- **Typing Indicator**: Debounced typing notifications
- **Attachments**: Support for attachment state management
- **Sending State**: Prevents double-submission

---

## Cross-Platform Usage

### File Suffix Pattern (Optional)

For platform-specific implementations:

```
components/
  Button/
    Button.ts          # Shared logic
    Button.web.tsx    # Web (Tailwind)
    Button.native.tsx # Mobile (React Native)
```

Example:

```typescript
// Button.ts (shared logic)
import { useAuthForm } from "@uniconnect/shared-ui";

export function useButtonLogic() {
  // Shared logic here
}
```

```typescript
// Button.web.tsx
import { colors, spacing } from "@uniconnect/shared-ui";
import styled from "styled-components";

const StyledButton = styled.button`
  background-color: ${colors.primary[500]};
  padding: ${spacing.md} ${spacing.lg};
`;

export function Button() {
  return <StyledButton>Click me</StyledButton>;
}
```

```typescript
// Button.native.tsx
import { StyleSheet, TouchableOpacity, Text } from "react-native";
import { colors, spacingNumeric } from "@uniconnect/shared-ui";

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacingNumeric[4],
  },
});

export function Button() {
  return (
    <TouchableOpacity style={styles.button}>
      <Text>Click me</Text>
    </TouchableOpacity>
  );
}
```

---

## Building

```bash
# Type-check
pnpm typecheck

# Build and emit declarations
pnpm build

# Clean
pnpm clean
```

## Key Design Principles

1. **Single Source of Truth**: All visual tokens defined once, used everywhere
2. **Platform Agnostic**: Works with Tailwind (Web) and React Native (Mobile)
3. **Headless Hooks**: No UI rendering, pure logic
4. **Composable**: Tokens and hooks can be extended independently
5. **Typed**: Full TypeScript support with intelligent completions
6. **Minimal Surface**: Only essential UI logic, not a full component library

---

**Version**: 0.1.0  
**Last Updated**: May 9, 2026

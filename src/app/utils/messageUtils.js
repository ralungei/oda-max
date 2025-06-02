// src/app/utils/messageUtils.js

// Create a user message
export const createUserMessage = (text, userId) => {
  return {
    userId,
    messagePayload: {
      type: "text",
      text: text.trim(),
    },
    date: new Date().toISOString(),
    from: null, // null indicates user message
  };
};

// Create a chat suggestion message
export const createSuggestionRequest = (query, userId) => {
  return {
    userId,
    messagePayload: {
      type: "suggest",
      query: query,
      threshold: 5,
    },
  };
};

// Helper to determine if message is from bot
export const isFromBot = (message) => {
  return message.from && message.from.type === "bot";
};

// Helper to determine if message is from user
export const isFromUser = (message) => {
  return message.from === null;
};

// Helper to determine message type
export const getMessageType = (message) => {
  return message.messagePayload?.type || "unknown";
};

// Extract text content from a message for preview/summary
export const getMessageText = (message) => {
  const payload = message.messagePayload;
  if (!payload) return "";

  switch (payload.type) {
    case "text":
      return payload.text;
    case "card":
      if (payload.cards && payload.cards.length > 0) {
        const card = payload.cards[0];
        return card.title || card.description || "Card message";
      }
      return "Card message";
    case "attachment":
      return `Attachment: ${payload.attachment.type}`;
    default:
      return `Message of type: ${payload.type}`;
  }
};

// Format a date from ISO string to a readable format
export const formatMessageTime = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
};

// Extract code blocks from a message for proper formatting
export const extractCodeBlocks = (text) => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
  const matches = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    matches.push({
      language: match[1] || "",
      code: match[2],
    });
  }

  return matches;
};

// Convert markdown links to HTML
export const convertMarkdownLinks = (text) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  return text.replace(
    linkRegex,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
};

// Process message content for display
export const processMessageContent = (text) => {
  if (!text) return "";

  // First handle code blocks to avoid interference with other replacements
  const codeBlocks = extractCodeBlocks(text);
  let processedText = text;

  // Replace code blocks with placeholders
  codeBlocks.forEach((block, index) => {
    const placeholder = `__CODE_BLOCK_${index}__`;
    processedText = processedText.replace(
      /```(\w+)?\n([\s\S]*?)\n```/,
      placeholder
    );
  });

  // Convert markdown links
  processedText = convertMarkdownLinks(processedText);

  // Restore code blocks
  codeBlocks.forEach((block, index) => {
    const placeholder = `__CODE_BLOCK_${index}__`;
    const formattedCode = `<pre><code class="language-${block.language}">${block.code}</code></pre>`;
    processedText = processedText.replace(placeholder, formattedCode);
  });

  return processedText;
};

// Format the timestamp for conversation history
export const formatConversationTime = (dateString) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  } catch (e) {
    return "";
  }
};

// Truncate text for previews
export const truncateText = (text, maxLength = 60) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength).trim() + "...";
};

// Parse and sanitize HTML content
export const sanitizeHtml = (html) => {
  // This is a simple implementation
  // In a production app, use a proper HTML sanitizer library
  if (!html) return "";

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/g, "")
    .replace(/javascript:/g, "");
};

// Check if a message contains an image
export const hasImage = (message) => {
  const payload = message.messagePayload;
  if (!payload) return false;

  if (
    payload.type === "attachment" &&
    payload.attachment &&
    payload.attachment.type.startsWith("image/")
  ) {
    return true;
  }

  if (payload.type === "card" && payload.cards) {
    return payload.cards.some((card) => card.imageUrl);
  }

  return false;
};

// Convert a message to a shareable format (e.g., for export)
export const messageToShareableFormat = (message) => {
  if (!message || !message.messagePayload) return "";

  const isBot = isFromBot(message);
  const sender = isBot ? "ChatBPI" : "You";
  const content = getMessageText(message);
  const time = formatMessageTime(message.date);

  return `${sender} (${time}): ${content}`;
};

// Add this to src/app/utils/messageUtils.js

// Convert WebSDK message to our app format if needed
export const adaptSdkMessage = (sdkMessage, userId) => {
  // Make sure we have a valid message
  if (!sdkMessage || !sdkMessage.messagePayload) {
    console.warn("Invalid message format received from SDK");
    return {
      userId: userId,
      messagePayload: {
        type: "text",
        text: "Sorry, I received an invalid message.",
      },
      date: new Date().toISOString(),
      from: { type: "bot" },
    };
  }

  return {
    userId: userId,
    messagePayload: sdkMessage.messagePayload,
    date: new Date().toISOString(),
    from: { type: "bot" },
  };
};

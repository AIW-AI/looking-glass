import { Fragment, type ReactNode } from 'react';
import type { Message as MessageType } from '@looking-glass/core';
import { useLookingGlassStore } from '@looking-glass/core';

export interface MessageProps {
  message: MessageType;
  className?: string;
}

export function Message({ message, className = '' }: MessageProps) {
  const assistantName = useLookingGlassStore((state) => state.assistantName);
  const roleLabel = getRoleLabel(message.role, assistantName);
  const timestamp = formatTimestamp(message.timestamp);

  return (
    <div className={`lg-message lg-message--${message.role} ${className}`}>
      <div className="lg-message__header">
        <span className="lg-message__role">{roleLabel}:</span>
        <span className="lg-message__time">{timestamp}</span>
      </div>
      <div className="lg-message__content">
        <MessageContent content={message.content} />
      </div>
    </div>
  );
}

interface MessageContentProps {
  content: string;
}

function MessageContent({ content }: MessageContentProps) {
  // Simple markdown-like rendering for terminal aesthetic
  // Handles: **bold**, `code`, ```code blocks```, and links
  const lines = content.split('\n');

  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          <LineContent line={line} />
        </Fragment>
      ))}
    </>
  );
}

function LineContent({ line }: { line: string }) {
  // Check for code block (will be handled by parent in full implementation)
  if (line.startsWith('```')) {
    return <span className="lg-message__code-fence">{line}</span>;
  }

  // Simple inline formatting
  const parts: ReactNode[] = [];
  let remaining = line;
  let key = 0;

  // Match patterns: `code`, **bold**, *italic*, [link](url)
  const patterns = [
    { regex: /`([^`]+)`/, className: 'lg-message__code' },
    { regex: /\*\*([^*]+)\*\*/, className: 'lg-message__bold' },
    { regex: /\*([^*]+)\*/, className: 'lg-message__italic' },
  ];

  while (remaining) {
    let earliest = { index: Infinity, length: 0, className: '', content: '' };

    for (const { regex, className } of patterns) {
      const match = remaining.match(regex);
      if (match && match.index !== undefined && match.index < earliest.index) {
        earliest = {
          index: match.index,
          length: match[0].length,
          className,
          content: match[1],
        };
      }
    }

    if (earliest.index === Infinity) {
      // No more patterns, add remaining text
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    // Add text before match
    if (earliest.index > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, earliest.index)}</span>);
    }

    // Add matched content
    parts.push(
      <span key={key++} className={earliest.className}>
        {earliest.content}
      </span>
    );

    // Continue with remaining text
    remaining = remaining.slice(earliest.index + earliest.length);
  }

  return <>{parts}</>;
}

function getRoleLabel(role: 'user' | 'assistant' | 'system', assistantName: string): string {
  switch (role) {
    case 'user':
      return 'USER';
    case 'assistant':
      return assistantName.toUpperCase();
    case 'system':
      return 'SYSTEM';
  }
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

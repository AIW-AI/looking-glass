import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useLookingGlassStore } from '@looking-glass/core';

export interface ChatInputProps {
  className?: string;
  placeholder?: string;
  onSend?: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({
  className = '',
  placeholder = 'Type a message...',
  onSend,
  disabled = false,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isStreaming = useLookingGlassStore((state) => state.chat.isStreaming);
  const addMessage = useLookingGlassStore((state) => state.addMessage);

  const isDisabled = disabled || isStreaming;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;

    // Add user message to store
    addMessage({
      role: 'user',
      content: trimmed,
    });

    // Callback for parent to handle actual sending
    onSend?.(trimmed);

    // Clear input
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`lg-chat-input ${isDisabled ? 'lg-chat-input--disabled' : ''} ${className}`}>
      <span className="lg-chat-input__prompt">&gt;</span>
      <textarea
        ref={textareaRef}
        className="lg-chat-input__textarea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isDisabled}
        rows={1}
        aria-label="Message input"
      />
      <button
        className="lg-chat-input__send"
        onClick={handleSend}
        disabled={isDisabled || !value.trim()}
        aria-label="Send message"
      >
        {isStreaming ? '...' : '⏎'}
      </button>
    </div>
  );
}

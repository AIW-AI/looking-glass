import { useEffect, useRef } from 'react';
import { useLookingGlassStore } from '@looking-glass/core';
import { Message } from './Message.js';

export interface MessageListProps {
  className?: string;
  autoScroll?: boolean;
}

export function MessageList({ className = '', autoScroll = true }: MessageListProps) {
  const messages = useLookingGlassStore((state) => state.chat.messages);
  const isStreaming = useLookingGlassStore((state) => state.chat.isStreaming);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  return (
    <div className={`lg-message-list ${className}`}>
      {messages.length === 0 ? (
        <div className="lg-message-list__empty">
          <div className="lg-message-list__welcome">
            <pre className="lg-message-list__ascii">
{`
╔═══════════════════════════════════════════╗
║                                           ║
║         LOOKING GLASS v0.1.0              ║
║                                           ║
║   "But I don't want to go among mad       ║
║    people," Alice remarked.               ║
║                                           ║
║   "Oh, you can't help that," said the     ║
║    Cat: "we're all mad here."             ║
║                                           ║
╚═══════════════════════════════════════════╝
`}
            </pre>
            <p className="lg-message-list__prompt">
              Type a message to begin...
            </p>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <Message key={message.id} message={message} />
        ))
      )}

      {isStreaming && (
        <div className="lg-message-list__streaming">
          <span className="lg-message-list__cursor">▌</span>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}

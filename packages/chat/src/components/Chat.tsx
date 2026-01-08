import { MessageList } from './MessageList.js';
import { ChatInput } from './ChatInput.js';

export interface ChatProps {
  className?: string;
  onSendMessage?: (message: string) => void;
}

export function Chat({ className = '', onSendMessage }: ChatProps) {
  return (
    <div className={`lg-chat ${className}`}>
      <MessageList className="lg-chat__messages" />
      <ChatInput
        className="lg-chat__input"
        onSend={onSendMessage}
      />
    </div>
  );
}

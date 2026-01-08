import { useEffect, useState } from 'react';
import { createLookingGlass, useLookingGlassStore } from '@looking-glass/core';
import { Shell } from '@looking-glass/shell';
import { Chat } from '@looking-glass/chat';

// Initialize Looking Glass with Zoe configuration
const lg = createLookingGlass({
  transport: { type: 'embedded' },
  theme: 'terminal', // Will be overridden by zoe.css
  logLevel: 'info',
});

export function App() {
  const addMessage = useLookingGlassStore((state) => state.addMessage);
  const setStreaming = useLookingGlassStore((state) => state.setStreaming);
  const [orbState, setOrbState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');

  useEffect(() => {
    // Start Looking Glass on mount
    lg.start().catch(console.error);

    // Add welcome message
    addMessage({
      role: 'system',
      content: '> Zoe initialized\n> System 1 ready\n> Type a message to begin.',
    });

    return () => {
      lg.stop().catch(console.error);
    };
  }, []);

  const handleSendMessage = async (message: string) => {
    // Update orb state
    setOrbState('thinking');
    setStreaming(true);

    try {
      // In Phase 5, this will call the real backend
      // For now, use mock response
      const response = await mockChatResponse(message);

      addMessage({
        role: 'assistant',
        content: response,
      });
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        role: 'system',
        content: `> Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setStreaming(false);
      setOrbState('idle');
    }
  };

  return (
    <Shell
      showSidebar={false}
      showTabBar={false}
      showHeader={false}
      showFooter={false}
    >
      <div className="zoe-container">
        <header className="zoe-header">
          <div className="zoe-header__brand">
            <div className={`zoe-orb zoe-orb--${orbState}`} />
            <span className="zoe-header__title">Zoe</span>
          </div>
          <div className="zoe-header__status">
            <span className="zoe-header__status-dot" />
            <span>System 1</span>
          </div>
        </header>
        <Chat onSendMessage={handleSendMessage} />
      </div>
    </Shell>
  );
}

// Mock response until Phase 5 backend connection
async function mockChatResponse(message: string): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const lowered = message.toLowerCase();

  if (lowered.includes('hello') || lowered.includes('hi')) {
    return `Hello Ross! I'm Zoe, your personal AI assistant.

I'm running through **Looking Glass**, the MCP-controllable chat interface. This is System 1 - fast, conversational responses.

What can I help you with?`;
  }

  if (lowered.includes('task') || lowered.includes('todo')) {
    return `*[Backend not connected - mock response]*

In production, I would fetch your Todoist tasks via Context MCP. Here's what that would look like:

**Today's Tasks:**
- [ ] Review Looking Glass implementation
- [ ] Test voice mode integration
- [ ] Prepare demo script

To enable real task fetching, complete Phase 5 of the implementation plan.`;
  }

  if (lowered.includes('search') || lowered.includes('news')) {
    return `*[Backend not connected - mock response]*

In production, I would search the web via Actions MCP. The real response would include:

- Cited sources with links
- Recent news from the past 24 hours
- Relevance-ranked results

Complete Phase 5 to enable web search.`;
  }

  if (lowered.includes('theme')) {
    return `Looking Glass supports multiple themes. I'm currently using the **Zoe theme** (teal on black).

Available themes:
- \`terminal\` - Classic green
- \`terminal-amber\` - Warm amber
- \`terminal-cyan\` - Cool cyan
- \`zoe\` - Teal (current)

Say "switch to amber theme" to change. *(MCP UI control will be wired in Phase 6)*`;
  }

  if (lowered.includes('system 2') || lowered.includes('brain') || lowered.includes('research')) {
    return `For complex tasks requiring deep work, I can dispatch to **System 2** (the Brain).

System 2 is a Claude Code instance that handles:
- Multi-step research
- Code generation and review
- Long-form writing
- Complex analysis

Example: "Research the competitive landscape for AI governance platforms"

I'll queue the task and notify you when it's complete.`;
  }

  // Default response
  return `I received: "${message}"

This is a **mock response** while the backend is being connected. In production, I would:

1. Process your message through GPT-4o
2. Use tools like web search, Todoist, and memory
3. Stream the response in real-time

**Implementation Status:**
- Phase 1: Looking Glass deployment
- Phase 5: Backend connection (pending)

Try asking about:
- Tasks
- Web search
- System 2 / Brain
- Themes`;
}

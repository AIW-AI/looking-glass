import { useEffect } from 'react';
import { createLookingGlass, useLookingGlassStore } from '@looking-glass/core';
import { Shell } from '@looking-glass/shell';
import { Chat } from '@looking-glass/chat';

// Initialize Looking Glass
const lg = createLookingGlass({
  transport: { type: 'embedded' },
  theme: 'terminal',
  logLevel: 'info',
});

export function App() {
  const addMessage = useLookingGlassStore((state) => state.addMessage);
  const setStreaming = useLookingGlassStore((state) => state.setStreaming);

  useEffect(() => {
    // Start Looking Glass on mount
    lg.start().catch(console.error);

    // Add welcome message
    addMessage({
      role: 'system',
      content: '> Looking Glass v0.1.0 initialized\n> Running in Alice Demo mode\n> Type a message to begin.',
    });

    return () => {
      lg.stop().catch(console.error);
    };
  }, []);

  const handleSendMessage = async (message: string) => {
    // Simulate AI response (in real app, this would call Claude API)
    setStreaming(true);

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Add mock response
    addMessage({
      role: 'assistant',
      content: generateMockResponse(message),
    });

    setStreaming(false);
  };

  return (
    <Shell
      showSidebar={false}
      showTabBar={false}
    >
      <Chat onSendMessage={handleSendMessage} />
    </Shell>
  );
}

// Mock response generator for demo purposes
function generateMockResponse(userMessage: string): string {
  const lowered = userMessage.toLowerCase();

  if (lowered.includes('hello') || lowered.includes('hi')) {
    return `Hello! I'm Alice, running through Looking Glass.

I can see you're using the **terminal** theme. This demo showcases the core UI capabilities of Looking Glass:

• Terminal-style aesthetic with \`JetBrains Mono\`
• Box-drawing characters for structure
• Markdown rendering in messages
• Streaming text display

Would you like to explore what I can do with this interface?`;
  }

  if (lowered.includes('theme')) {
    return `Looking Glass supports multiple themes:

• \`terminal\` - Green on black (current)
• \`terminal-amber\` - Amber on black
• \`terminal-cyan\` - Cyan on black
• \`light\` - Light mode for accessibility

Each theme uses CSS custom properties for easy customization.`;
  }

  if (lowered.includes('help') || lowered.includes('what can you do')) {
    return `In this **Alice Demo**, I can:

1. Have conversations with full markdown support
2. Show inline \`code\` and code blocks
3. Display **bold** and *italic* text
4. Switch themes (coming soon in full version)
5. Show notifications and progress indicators

For the full experience with dashboards, visualizations, and the Orb, try the complete Looking Glass deployment!`;
  }

  if (lowered.includes('mcp') || lowered.includes('protocol')) {
    return `Looking Glass implements the **Model Context Protocol (MCP)** for UI control.

This means external processes—including AI systems—can:
• Register and call tools
• Read and subscribe to resources
• Send notifications
• Control the entire UI programmatically

The MCP layer is what makes Looking Glass truly *programmable*.`;
  }

  // Default response
  return `I received your message: "${userMessage}"

In a full deployment, I would process this through the Claude API. This demo uses a mock response generator to showcase the UI capabilities.

Try asking me about:
• Themes
• MCP protocol
• What I can do`;
}

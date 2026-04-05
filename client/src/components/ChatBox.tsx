import React from 'react';

const ChatBox = ({ messages }: { messages: any[] }) => {
  return (
    <div style={{ height: '400px', overflowY: 'scroll', background: '#1e1e1e', padding: '10px' }}>
      {messages.map((m, i) => (
        <p key={i}>
          <b style={{ color: m.user === 'Lord_lucifer' ? 'red' : 'cyan' }}>{m.user}:</b> {m.text}
        </p>
      ))}
    </div>
  );
};

export default ChatBox;

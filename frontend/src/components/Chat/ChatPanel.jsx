import { useState, useEffect, useRef } from 'react';
import { sendMessage, getChatHistory } from '../../api/chat';
import { Send, Bot, User } from 'lucide-react';

export default function ChatPanel({ experimentId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    getChatHistory(experimentId).then(res => setMessages(res.data)).catch(() => {});
  }, [experimentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const { data } = await sendMessage(experimentId, msg);
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get response. Please try again.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <Bot size={32} />
            <p>Ask questions about your analysis results</p>
            <div className="chat-suggestions">
              {['What are the key insights?', 'Are there any outliers?', 'Suggest hypotheses to test'].map(s => (
                <button key={s} className="chat-suggestion" onClick={() => { setInput(s); }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
            <div className="chat-msg-icon">
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className="chat-msg-content">{msg.content}</div>
          </div>
        ))}
        {loading && <div className="chat-msg chat-msg-assistant"><div className="chat-msg-icon"><Bot size={16} /></div><div className="chat-typing">Thinking...</div></div>}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input">
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about your data..." disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()} className="btn btn-primary">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

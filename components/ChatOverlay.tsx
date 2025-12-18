
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, ShieldCheck, Wifi, Trash2, Lock } from 'lucide-react';
import { ChatMessage } from '../types';
import { scramble } from '../services/cryptoUtils';

interface ChatOverlayProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    onClearChat: () => void;
    channelId: string;
}

const ChatOverlay: React.FC<ChatOverlayProps> = ({ messages, onSendMessage, onClearChat, channelId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if(isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSendMessage(input);
        setInput('');
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 right-4 md:right-8 z-50 bg-cyber-purple/90 hover:bg-cyber-purple text-white p-4 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] border-2 border-white/20 transition-all hover:scale-110 group animate-slide-in"
            >
                <MessageSquare size={24} />
                {messages.length > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                        {messages.length}
                    </div>
                )}
            </button>
        );
    }

    return (
        <div className="fixed bottom-20 right-4 md:right-8 z-50 w-[350px] h-[500px] bg-[#050505] border border-cyber-purple/50 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-cyber-panel p-4 border-b border-white/10 flex justify-between items-center relative overflow-hidden">
                {/* Matrix Rain Effect Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://media.giphy.com/media/U3qYN8S0j3bpK/giphy.gif')] bg-cover mix-blend-screen"></div>
                
                <div className="relative z-10">
                    <h3 className="text-cyber-purple font-black uppercase text-sm flex items-center gap-2">
                        <Lock size={14} className="animate-pulse"/> Secure Comms
                    </h3>
                    <div className="text-[10px] text-gray-500 font-mono">CH: {channelId.substring(0, 8)}...</div>
                </div>
                <div className="flex gap-2 relative z-10">
                    <button onClick={onClearChat} className="p-1 hover:text-red-500 text-gray-500 transition-colors" title="Burn Logs">
                        <Trash2 size={16}/>
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-1 hover:text-white text-gray-500 transition-colors">
                        <X size={18}/>
                    </button>
                </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/80 backdrop-blur-md">
                {messages.length === 0 && (
                    <div className="text-center text-gray-600 text-xs mt-20">
                        <ShieldCheck size={48} className="mx-auto mb-2 opacity-20"/>
                        <p>End-to-End Encryption Active.</p>
                        <p>Waiting for incoming transmission...</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'MANAGER' ? 'items-end' : 'items-start'}`}>
                        <div 
                            className={`max-w-[85%] p-3 rounded-xl text-sm font-mono border ${
                                msg.sender === 'MANAGER' 
                                    ? 'bg-cyber-purple/20 border-cyber-purple/50 text-white rounded-tr-none' 
                                    : 'bg-white/10 border-white/20 text-gray-200 rounded-tl-none'
                            }`}
                        >
                            {msg.text}
                        </div>
                        <span className="text-[9px] text-gray-600 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-cyber-panel border-t border-white/10">
                <div className="relative">
                    <input 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Encrypt & Send..."
                        className="w-full bg-black/50 border border-white/20 rounded-xl py-3 pl-4 pr-10 text-sm text-white outline-none focus:border-cyber-purple transition-all"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-cyber-purple text-white rounded-lg hover:brightness-110 transition-all">
                        <Send size={14} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatOverlay;

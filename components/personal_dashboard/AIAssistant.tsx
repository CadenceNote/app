import { Bird } from "../common/Bird";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Send, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface Message {
    type: 'user' | 'ai';
    content: string;
    isTyping?: boolean;
}

export default function AIAssistant() {
    const [messages, setMessages] = useState<Message[]>([
        { type: 'ai', content: "Hi! I'm your AI assistant. I can help you manage your tasks, analyze your schedule, and provide insights about your work. What would you like to know?" }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isAiResponding, setIsAiResponding] = useState(false);

    const simulateTyping = useCallback((text: string) => {
        return new Promise<void>((resolve) => {
            setIsAiResponding(true);
            // Add a temporary message that will be updated character by character
            setMessages(prev => [...prev, { type: 'ai', content: '', isTyping: true }]);

            let currentText = '';
            const words = text.split(' ');
            let wordIndex = 0;

            const typeWord = () => {
                if (wordIndex < words.length) {
                    currentText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
                    setMessages(prev => [
                        ...prev.slice(0, -1),
                        { type: 'ai', content: currentText, isTyping: true }
                    ]);
                    wordIndex++;
                    setTimeout(typeWord, Math.random() * 50 + 50); // Random delay between words
                } else {
                    setMessages(prev => [
                        ...prev.slice(0, -1),
                        { type: 'ai', content: currentText, isTyping: false }
                    ]);
                    setIsAiResponding(false);
                    resolve();
                }
            };

            setTimeout(typeWord, 500); // Initial delay before starting to type
        });
    }, []);

    const handleSend = async () => {
        if (!inputValue.trim() || isAiResponding) return;

        // Add user message
        setMessages(prev => [...prev, { type: 'user', content: inputValue }]);
        setInputValue('');

        // Simulate AI response with typing effect
        const response = "(placeholder) I'm analyzing your schedule and tasks. Based on your current workload, you have 3 high-priority tasks due this week and 2 upcoming meetings. Would you like me to help you prioritize these or provide more detailed insights about specific items?";
        await simulateTyping(response);
    };

    return (
        <Card className="border-indigo-100 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    <CardTitle>AI Assistant</CardTitle>
                </div>
                <CardDescription>Get personalized insights and recommendations for your work.</CardDescription>
            </CardHeader>
            <CardContent className="relative">
                {/* Bird Avatar */}
                <div className="absolute left-4 top-0">
                    <Bird className="transform scale-75" />
                </div>

                {/* Chat Container */}
                <div className="ml-20 space-y-4">
                    {/* Messages */}
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`rounded-2xl px-4 py-2 max-w-[80%] ${message.type === 'user'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gradient-to-br from-green-50 to-indigo-50 text-gray-800'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">
                                        {message.content}
                                        {message.isTyping && (
                                            <span className="inline-block ml-1 animate-pulse">▋</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="flex items-center gap-2 pt-4 border-t">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask me anything about your work..."
                            className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            disabled={isAiResponding}
                        />
                        <Button
                            onClick={handleSend}
                            className="rounded-full"
                            disabled={!inputValue.trim() || isAiResponding}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

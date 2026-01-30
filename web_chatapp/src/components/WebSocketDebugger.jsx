import { useWebSocket } from '../contexts/WebSocketContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';

export function WebSocketDebugger() {
    const { connectionState, isConnected, messages } = useWebSocket();
    const [recentMessages, setRecentMessages] = useState([]);

    useEffect(() => {
        setRecentMessages(messages.slice(-10)); // Keep last 10 messages
    }, [messages]);

    const getStatusColor = () => {
        switch (connectionState) {
            case 'connected':
                return 'bg-green-500';
            case 'connecting':
                return 'bg-yellow-500';
            case 'error':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const clearMessages = () => {
        setRecentMessages([]);
    };

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">WebSocket Debugger</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
                        <Badge variant="outline">{connectionState}</Badge>
                        <Badge variant={isConnected ? "default" : "secondary"}>
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm">
                    <p><strong>Total Messages:</strong> {messages.length}</p>
                    <p><strong>Recent Messages:</strong> {recentMessages.length}</p>
                </div>

                {recentMessages.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold">Recent Messages</h4>
                            <Button size="sm" variant="outline" onClick={clearMessages}>
                                Clear
                            </Button>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                            {recentMessages.map((msg, index) => (
                                <div key={index} className="text-xs p-2 bg-muted rounded border">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold">
                                            {msg.senderId} {msg.isOwn ? '(You)' : ''}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {msg.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground">{msg.content}</p>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Conv: {msg.conversationId} | ID: {msg.id}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {recentMessages.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No recent messages
                    </p>
                )}
            </CardContent>
        </Card>
    );
}


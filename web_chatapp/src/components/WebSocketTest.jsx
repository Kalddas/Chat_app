import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import webSocketService from '../services/websocketService';
import localWebSocketService from '../services/localWebSocketService';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function WebSocketTest() {
    const { user, token } = useAuth();
    const {
        connectionState,
        isConnected,
        messages,
        sendMessage,
        joinConversation,
        leaveConversation
    } = useWebSocket();

    const handleTestMessage = () => {
        if (isConnected) {
            sendMessage('test-conversation', 'Test message from WebSocket!', `test_${Date.now()}`);
        } else {
            console.log('WebSocket not connected, cannot send test message');
        }
    };

    const handleConnectionTest = () => {
        console.log('Connection state:', connectionState);
        console.log('Is connected:', isConnected);
        console.log('WebSocket service:', webSocketService);

        // Test if we can send a ping
        if (isConnected) {
            webSocketService.send({ event: 'ping', data: { test: true } });
            console.log('Ping sent to WebSocket server');
        }
    };

    const handleManualConnect = () => {
        console.log('Attempting manual WebSocket connection...');
        console.log('AuthContext user:', user);
        console.log('AuthContext token:', token ? 'Present' : 'Missing');

        if (user && user.id && token) {
            console.log('User ID:', user.id);
            webSocketService.connect(user.id, token);
        } else {
            console.error('Missing user ID or token for WebSocket connection');
            console.error('User:', user);
            console.error('Token:', token);

            // Fallback: try localStorage
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('token');
            console.log('Stored user:', storedUser);
            console.log('Stored token:', storedToken ? 'Present' : 'Missing');
        }
    };

    const handleTestServerConnection = () => {
        console.log('Testing WebSocket server connection...');
        const testSocket = new WebSocket('wss://chat-2swc.onrender.com');

        testSocket.onopen = (event) => {
            console.log('✅ WebSocket server is reachable!', event);
            testSocket.close();
        };

        testSocket.onerror = (error) => {
            console.error('❌ WebSocket server connection failed:', error);
        };

        testSocket.onclose = (event) => {
            console.log('Test connection closed:', event);
        };
    };

    const handleTestReverbConnection = () => {
        console.log('Testing Reverb WebSocket connection...');
        const reverbUrl = 'wss://chat-2swc.onrender.com?appId=917573&appKey=89pbiicfbhrz8hbnb8ai';
        console.log('Reverb URL:', reverbUrl);

        const testSocket = new WebSocket(reverbUrl);

        testSocket.onopen = (event) => {
            console.log('✅ Reverb WebSocket server is reachable!', event);
            testSocket.close();
        };

        testSocket.onerror = (error) => {
            console.error('❌ Reverb WebSocket server connection failed:', error);
        };

        testSocket.onclose = (event) => {
            console.log('Reverb test connection closed:', event);
        };
    };

    const handleLocalWebSocketTest = () => {
        console.log('Testing local WebSocket simulation...');
        console.log('AuthContext user:', user);
        console.log('AuthContext token:', token ? 'Present' : 'Missing');

        if (user && user.id && token) {
            localWebSocketService.connect(user.id, token);
            console.log('Local WebSocket connection initiated');
        } else {
            console.error('Missing user ID or token for local WebSocket test');
            console.error('User:', user);
            console.error('Token:', token);
        }
    };

    const handleTestBroadcast = () => {
        if (isConnected) {
            // Send a test message that should be broadcasted
            webSocketService.send({
                event: 'test_broadcast',
                data: {
                    message: 'This is a test broadcast message',
                    timestamp: new Date().toISOString(),
                    userId: 'test-user'
                }
            });
            console.log('Test broadcast message sent');
        }
    };

    const handleJoinTest = () => {
        if (isConnected) {
            joinConversation('test-conversation');
        }
    };

    const handleLeaveTest = () => {
        if (isConnected) {
            leaveConversation('test-conversation');
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-sm">WebSocket Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm">
                    <p><strong>Status:</strong> {connectionState}</p>
                    <p><strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}</p>
                    <p><strong>Messages:</strong> {messages.length}</p>
                </div>

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={handleJoinTest}
                        disabled={!isConnected}
                    >
                        Join Test
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLeaveTest}
                        disabled={!isConnected}
                    >
                        Leave Test
                    </Button>
                </div>

                <div className="space-y-2">
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={handleManualConnect}
                            className="flex-1"
                        >
                            Manual Connect
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleTestServerConnection}
                            className="flex-1"
                        >
                            Test Server
                        </Button>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTestReverbConnection}
                        className="w-full"
                    >
                        Test Reverb Connection
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleLocalWebSocketTest}
                        className="w-full"
                    >
                        Test Local WebSocket
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={handleTestMessage}
                            disabled={!isConnected}
                            className="flex-1"
                        >
                            Send Test Message
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleConnectionTest}
                            className="flex-1"
                        >
                            Test Connection
                        </Button>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTestBroadcast}
                        disabled={!isConnected}
                        className="w-full"
                    >
                        Test Broadcast
                    </Button>
                </div>

                {messages.length > 0 && (
                    <div className="max-h-32 overflow-y-auto">
                        <p className="text-xs font-semibold mb-2">Recent Messages:</p>
                        {messages.slice(-5).map((msg, index) => (
                            <div key={index} className="text-xs p-2 bg-muted rounded mb-1">
                                <p><strong>From:</strong> {msg.senderId}</p>
                                <p><strong>Content:</strong> {msg.content}</p>
                                <p><strong>Time:</strong> {msg.timestamp.toLocaleTimeString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

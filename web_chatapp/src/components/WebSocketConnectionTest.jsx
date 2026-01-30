import { useState, useEffect } from 'react';

export function WebSocketConnectionTest() {
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [logs, setLogs] = useState([]);

    const addLog = (message) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const testDirectWebSocket = () => {
        addLog('Testing direct WebSocket connection...');

        const wsUrl = 'wss://chat-2swc.onrender.com/app/89pbiicfbhrz8hbnb8ai?protocol=7&client=js&version=8.4.0&flash=false';

        try {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                addLog('✅ Direct WebSocket connection successful!');
                setConnectionStatus('connected');
            };

            ws.onerror = (error) => {
                addLog(`❌ Direct WebSocket error: ${error}`);
                setConnectionStatus('error');
            };

            ws.onclose = (event) => {
                addLog(`🔌 Direct WebSocket closed: ${event.code} - ${event.reason}`);
                setConnectionStatus('disconnected');
            };

            // Close after 5 seconds
            setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            }, 5000);

        } catch (error) {
            addLog(`❌ Failed to create WebSocket: ${error.message}`);
            setConnectionStatus('error');
        }
    };

    const testServerAvailability = async () => {
        addLog('Testing server availability...');

        try {
            // Test if the server responds to HTTP requests
            const response = await fetch('https://chat-2swc.onrender.com/api', {
                method: 'GET',
                mode: 'no-cors' // This will fail if CORS is not configured, but we can still see if server responds
            });
            addLog('✅ Server is responding to HTTP requests');
        } catch (error) {
            addLog(`❌ Server HTTP test failed: ${error.message}`);
        }

        try {

            // Test the auth endpoint
            const authResponse = await fetch('https://chat-2swc.onrender.com/api/broadcasting/auth', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    socket_id: 'test',
                    channel_name: 'public-chat'
                })
            });

            if (authResponse.ok) {
                addLog('✅ Auth endpoint is working');
            } else {
                addLog(`❌ Auth endpoint error: ${authResponse.status} ${authResponse.statusText}`);
            }
        } catch (error) {
            addLog(`❌ Auth endpoint test failed: ${error.message}`);
        }
    };

    const testEchoConnection = () => {
        addLog('Testing Echo connection...');

        if (window.Echo && window.Echo.connector && window.Echo.connector.pusher) {
            const pusher = window.Echo.connector.pusher;
            addLog(`Pusher state: ${pusher.connection.state}`);
            addLog(`Pusher config: ${JSON.stringify(pusher.config, null, 2)}`);
        } else {
            addLog('❌ Echo not available');
        }
    };

    const clearLogs = () => {
        setLogs([]);
    };

    return (
        <div className="p-4 border rounded-lg bg-card">
            <h3 className="text-lg font-semibold mb-4">WebSocket Connection Test</h3>

            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' :
                        connectionStatus === 'error' ? 'bg-red-500' :
                            'bg-yellow-500'
                        }`}></div>
                    <span className="text-sm">Status: {connectionStatus}</span>
                </div>
            </div>

            <div className="mb-4 space-x-2">
                <button
                    onClick={testServerAvailability}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Test Server
                </button>
                <button
                    onClick={testDirectWebSocket}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                    Test WebSocket
                </button>
                <button
                    onClick={testEchoConnection}
                    className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
                >
                    Test Echo
                </button>
                <button
                    onClick={clearLogs}
                    className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded hover:bg-muted/90"
                >
                    Clear Logs
                </button>
            </div>

            <div className="max-h-40 overflow-y-auto border rounded p-2 bg-muted">
                <h4 className="text-sm font-medium mb-2">Connection Logs:</h4>
                {logs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No logs yet</p>
                ) : (
                    logs.map((log, index) => (
                        <div key={index} className="text-xs mb-1 font-mono">
                            {log}
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
                <p><strong>WebSocket URL:</strong> wss://chat-2swc.onrender.com/app/89pbiicfbhrz8hbnb8ai</p>
                <p><strong>Auth Endpoint:</strong> https://chat-2swc.onrender.com/api/broadcasting/auth</p>
                <p><strong>Status:</strong> Public channels don't require auth</p>
                <p><strong>Expected:</strong> Connection should establish successfully</p>
            </div>
        </div>
    );
}

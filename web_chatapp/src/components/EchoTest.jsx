// import { useEffect, useState } from 'react';
// // import echo from '../services/echo';

// export function EchoTest() {
//     const [connectionStatus, setConnectionStatus] = useState('disconnected');
//     const [messages, setMessages] = useState([]);
//     const [testMessage, setTestMessage] = useState('');

//     useEffect(() => {
//         // Listen for connection events
//         const handleConnected = () => {
//             setConnectionStatus('connected');
//             console.log('Echo connected successfully');
//         };

//         const handleDisconnected = () => {
//             setConnectionStatus('disconnected');
//             console.log('Echo disconnected');
//         };

//         const handleError = (error) => {
//             setConnectionStatus('error');
//             console.error('Echo connection error:', error);
//         };

//         // Set up connection event listeners
//         if (echo.connector && echo.connector.pusher) {
//             echo.connector.pusher.connection.bind('connected', handleConnected);
//             echo.connector.pusher.connection.bind('disconnected', handleDisconnected);
//             echo.connector.pusher.connection.bind('error', handleError);
//         }

//         // Subscribe to public chat channel
//         const channel = echo.channel('public-chat');

//         channel.listen('ChatEvent', (data) => {
//             console.log('Received message via Echo:', data);
//             setMessages(prev => [...prev, {
//                 id: data.id,
//                 message: data.message,
//                 user: data.user,
//                 timestamp: data.created_at
//             }]);
//         });

//         return () => {
//             // Cleanup
//             if (echo.connector && echo.connector.pusher) {
//                 echo.connector.pusher.connection.unbind('connected', handleConnected);
//                 echo.connector.pusher.connection.unbind('disconnected', handleDisconnected);
//                 echo.connector.pusher.connection.unbind('error', handleError);
//             }
//             echo.leaveChannel('public-chat');
//         };
//     }, []);

//     const sendTestMessage = () => {
//         if (testMessage.trim()) {
//             // This would typically be sent via your API
//             console.log('Sending test message:', testMessage);
//             setTestMessage('');
//         }
//     };

//     return (
//         <></>
//     );
// }

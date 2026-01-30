import { useWebSocket } from '../contexts/WebSocketContext';
import { Badge } from './ui/badge';

export function WebSocketStatus() {
    const { connectionState, isConnected } = useWebSocket();

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

    const getStatusText = () => {
        switch (connectionState) {
            case 'connected':
                return 'Connected';
            case 'connecting':
                return 'Connecting...';
            case 'error':
                return 'Connection Error';
            default:
                return 'Disconnected';
        }
    };

    return (
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
            <Badge variant="outline" className="text-xs">
                {getStatusText()}
            </Badge>
        </div>
    );
}

const WS_HOST = 'chat-2swc.onrender.com';
const APP_KEY = '89pbiicfbhrz8hbnb8ai';
const API_URL = 'https://liveflow-v99z.onrender.com';
let echo = null;

document.addEventListener('DOMContentLoaded', () => {
  const checkScripts = (attempts = 10, delay = 500) => {
    if (window.Pusher && window.Echo) {
      console.log('Pusher and Echo loaded successfully');
      document.getElementById('connectBtn').addEventListener('click', initEcho);
      document.getElementById('sendBtn').addEventListener('click', sendMessage);
      return;
    }
    if (attempts === 0) {
      console.error('Pusher or Echo failed to load after retries');
      alert('Required scripts (Pusher/Echo) failed to load');
      return;
    }
    setTimeout(() => checkScripts(attempts - 1, delay), delay);
  };
  checkScripts();
});

function initEcho() {
  const token = document.getElementById('token').value;
  const conversationId = document.getElementById('conversationId').value;

  if (!token || !conversationId) {
    alert('Enter both token and conversation ID');
    return;
  }

  if (echo && typeof echo.disconnect === 'function') {
    echo.disconnect();
    console.log('Disconnected previous Echo instance');
  }

  try {
    echo = new window.Echo({
      broadcaster: 'reverb',
      key: APP_KEY,
      wsHost: WS_HOST,
      wsPort: 443,
      wssPort: 443,
      forceTLS: true,
      enabledTransports: ['wss'],
      disableStats: true,
      authEndpoint: `${API_URL}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    console.log('Echo initialized:', echo);

    echo.private(`conversation.${conversationId}`)
      .listen('MessageSent', (e) => {
        console.log('Message received:', e);
        const msgEl = document.createElement('div');
        msgEl.textContent = `[${e.created_at}] User ${e.user_id}: ${e.message}`;
        document.getElementById('messages').appendChild(msgEl);
        document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
      })
      .error((err) => {
        console.error('Subscription error:', err);
        alert('Failed to subscribe to channel: ' + err.message);
      });

    console.log(`🔗 Subscribed to private-conversation.${conversationId}`);
  } catch (err) {
    console.error('Echo initialization failed:', err);
    alert('Failed to initialize Echo: ' + err.message);
    echo = null;
  }
}

async function sendMessage() {
  const token = document.getElementById('token').value;
  const conversationId = document.getElementById('conversationId').value;
  const message = document.getElementById('messageInput').value;

  if (!message || !token || !conversationId) {
    alert('Enter token, conversation ID, and message');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/chat/conversations/${conversationId}/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message: message,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to send message');
    }
    document.getElementById('messageInput').value = '';
    console.log('Message sent successfully');
  } catch (err) {
    console.error('Send error:', err);
    alert('Error sending message: ' + err.message);
  }
}

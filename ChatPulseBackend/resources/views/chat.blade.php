<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Real-Time Chat</title>
    <style>
        .chat-container {
            display: flex;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .conversation-list {
            width: 300px;
            border-right: 1px solid #e0e0e0;
            overflow-y: auto;
            background-color: #f8f9fa;
        }

        .conversation-item {
            display: flex;
            padding: 15px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
            transition: background-color 0.2s;
        }

        .conversation-item:hover, .conversation-item.active {
            background-color: #e9ecef;
        }

        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 15px;
            object-fit: cover;
        }

        .conversation-info {
            flex: 1;
            overflow: hidden;
        }

        .user-name {
            font-weight: bold;
            margin-bottom: 5px;
            color: #212529;
        }

        .last-message {
            font-size: 0.9em;
            color: #6c757d;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .chat-window {
            flex: 1;
            display: flex;
            flex-direction: column;
            background-color: #ffffff;
        }

        .chat-header {
            padding: 15px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            align-items: center;
            background-color: #f8f9fa;
        }

        .user-info {
            margin-left: 15px;
        }

        .user-status {
            font-size: 0.9em;
            color: #28a745;
        }

        .messages-container {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
            background-color: #f8f9fa;
        }

        .message {
            display: flex;
            flex-direction: column;
            max-width: 70%;
        }

        .own-message {
            align-self: flex-end;
        }

        .message-content {
            background-color: #ffffff;
            padding: 10px 15px;
            border-radius: 18px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .own-message .message-content {
            background-color: #007bff;
            color: white;
        }

        .attachments {
            margin-top: 10px;
        }

        .attachment {
            display: inline-block;
            margin-right: 10px;
            text-decoration: none;
            color: inherit;
        }

        .attachment-image img {
            max-width: 100px;
            max-height: 100px;
            border-radius: 5px;
        }

        .attachment-file {
            display: inline-flex;
            align-items: center;
            padding: 5px 10px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 5px;
        }

        .message-time {
            font-size: 0.8em;
            color: #6c757d;
            margin-top: 5px;
        }

        .own-message .message-time {
            text-align: right;
            color: rgba(255, 255, 255, 0.8);
        }

        .message-input {
            padding: 15px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            align-items: center;
            gap: 10px;
            background-color: #ffffff;
        }

        .message-input textarea {
            flex: 1;
            border: 1px solid #e0e0e0;
            border-radius: 20px;
            padding: 10px 15px;
            resize: none;
            outline: none;
            font-family: inherit;
        }

        .message-input textarea:focus {
            border-color: #007bff;
        }

        .attachment-label {
            cursor: pointer;
            padding: 8px;
            color: #6c757d;
        }

        .send-btn {
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 20px;
            padding: 10px 20px;
            cursor: pointer;
            font-weight: 500;
        }

        .send-btn:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }

        .loading {
            text-align: center;
            padding: 20px;
            color: #6c757d;
        }

        .empty-state {
            text-align: center;
            padding: 40px;
            color: #6c757d;
        }

        .typing-indicator {
            padding: 5px 15px;
            font-size: 0.9em;
            color: #6c757d;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="conversation-list" id="conversationList">
            <div class="loading">Loading conversations...</div>
        </div>

        <div class="chat-window" id="chatWindow" style="display: none;">
            <div class="chat-header">
                <img id="activeUserAvatar" class="avatar" src="/default-avatar.png" />
                <div class="user-info">
                    <div class="user-name" id="activeUserName"></div>
                    <div class="user-status" id="activeUserStatus">Online</div>
                </div>
            </div>

            <div class="messages-container" id="messagesContainer">
                <div class="loading">Loading messages...</div>
            </div>

            <div class="message-input">
                <textarea id="messageInput" placeholder="Type your message..." rows="2"></textarea>
                <label for="attachmentInput" class="attachment-label">
                    📎
                    <input type="file" id="attachmentInput" style="display: none;" />
                </label>
                <button id="sendButton" class="send-btn" disabled>Send</button>
            </div>
        </div>

        <div class="chat-window" id="noConversationSelected" style="display: flex; align-items: center; justify-content: center;">
            <div class="empty-state">
                <h3>Select a conversation to start chatting</h3>
                <p>Or start a new conversation from your contacts</p>
            </div>
        </div>
    </div>

    <script src="https://js.pusher.com/7.0.3/pusher.min.js"></script>
    <script>
        // Current state
        const state = {
            user: @json(auth()->user()),
            chats: [],
            activeConversation: null,
            messages: [],
            echo: null,
            attachmentFile: null
        };

        // DOM elements
        const elements = {
            conversationList: document.getElementById('conversationList'),
            chatWindow: document.getElementById('chatWindow'),
            noConversationSelected: document.getElementById('noConversationSelected'),
            messagesContainer: document.getElementById('messagesContainer'),
            messageInput: document.getElementById('messageInput'),
            attachmentInput: document.getElementById('attachmentInput'),
            sendButton: document.getElementById('sendButton'),
            activeUserAvatar: document.getElementById('activeUserAvatar'),
            activeUserName: document.getElementById('activeUserName'),
            activeUserStatus: document.getElementById('activeUserStatus')
        };

        // Initialize the chat
        document.addEventListener('DOMContentLoaded', function() {
            initializeEcho();
            fetchChatList();
            setupEventListeners();
        });

        // Initialize Echo for real-time communication
        function initializeEcho() {
            Pusher.logToConsole = false; // Set to true for debugging

            state.echo = new Echo({
                broadcaster: 'reverb',
                key: '{{ env('VITE_REVERB_APP_KEY') }}',
                wsHost: '{{ env('VITE_REVERB_HOST') }}',
                wsPort: '{{ env('VITE_REVERB_PORT') }}',
                wssPort: '{{ env('VITE_REVERB_PORT') }}',
                forceTLS: false,
                enabledTransports: ['ws', 'wss'],
                auth: {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                }
            });
        }

        // Set up event listeners
        function setupEventListeners() {
            // Send message on Enter key (but allow Shift+Enter for new line)
            elements.messageInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            // Send button click
            elements.sendButton.addEventListener('click', sendMessage);

            // File attachment
            elements.attachmentInput.addEventListener('change', handleFileUpload);

            // Enable/disable send button based on input
            elements.messageInput.addEventListener('input', toggleSendButton);
        }

        // Fetch chat list
        async function fetchChatList() {
            try {
                const response = await fetch('/api/chat/list', {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'include'
                });

                if (!response.ok) throw new Error('Failed to fetch chats');

                const data = await response.json();
                state.chats = data.chats;
                renderConversationList();
            } catch (error) {
                console.error('Error fetching chat list:', error);
                elements.conversationList.innerHTML = '<div class="loading">Error loading conversations</div>';
            }
        }

        // Render conversation list
        function renderConversationList() {
            if (state.chats.length === 0) {
                elements.conversationList.innerHTML = '<div class="empty-state">No conversations yet</div>';
                return;
            }

            let html = '';
            state.chats.forEach(chat => {
                const isActive = state.activeConversation && state.activeConversation.conversation_id === chat.conversation_id;

                html += `
                    <div class="conversation-item ${isActive ? 'active' : ''}"
                         data-conversation-id="${chat.conversation_id}"
                         onclick="selectConversation(${JSON.stringify(chat).replace(/"/g, '&quot;')})">
                        <img src="${chat.user.profile_image || '/default-avatar.png'}" class="avatar" />
                        <div class="conversation-info">
                            <div class="user-name">${chat.user.first_name} ${chat.user.last_name}</div>
                            ${chat.last_message ? `
                                <div class="last-message">${escapeHtml(chat.last_message.message)}</div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });

            elements.conversationList.innerHTML = html;
        }

        // Select a conversation
        async function selectConversation(chat) {
            state.activeConversation = chat;

            // Update UI
            elements.chatWindow.style.display = 'flex';
            elements.noConversationSelected.style.display = 'none';
            elements.activeUserAvatar.src = chat.user.profile_image || '/default-avatar.png';
            elements.activeUserName.textContent = `${chat.user.first_name} ${chat.user.last_name}`;

            // Re-render conversation list to show active state
            renderConversationList();

            // Fetch messages for this conversation
            await fetchMessages(chat.conversation_id);

            // Listen for new messages in this conversation
            listenForMessages(chat.conversation_id);
        }

        // Fetch messages for a conversation
        async function fetchMessages(conversationId) {
            try {
                elements.messagesContainer.innerHTML = '<div class="loading">Loading messages...</div>';

                const response = await fetch(`/api/conversations/${conversationId}/messages`, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'include'
                });

                if (!response.ok) throw new Error('Failed to fetch messages');

                const messages = await response.json();
                state.messages = messages;
                renderMessages();
                scrollToBottom();
            } catch (error) {
                console.error('Error fetching messages:', error);
                elements.messagesContainer.innerHTML = '<div class="loading">Error loading messages</div>';
            }
        }

        // Render messages
        function renderMessages() {
            if (state.messages.length === 0) {
                elements.messagesContainer.innerHTML = '<div class="empty-state">No messages yet</div>';
                return;
            }

            let html = '';
            state.messages.forEach(message => {
                const isOwnMessage = message.user_id === state.user.id;

                html += `
                    <div class="message ${isOwnMessage ? 'own-message' : ''}">
                        <div class="message-content">
                            <p>${escapeHtml(message.message)}</p>
                            ${message.attachments && message.attachments.length > 0 ? `
                                <div class="attachments">
                                    ${message.attachments.map(attachment => `
                                        <a href="${attachment.url}" target="_blank" class="attachment">
                                            ${isImage(attachment.type) ? `
                                                <span class="attachment-image">
                                                    <img src="${attachment.url}" alt="Attachment ${attachment.id}" />
                                                </span>
                                            ` : `
                                                <span class="attachment-file">
                                                    📎 Download File
                                                </span>
                                            `}
                                        </a>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                        <div class="message-time">${formatTime(message.created_at)}</div>
                    </div>
                `;
            });

            elements.messagesContainer.innerHTML = html;
        }

        // Listen for new messages
        function listenForMessages(conversationId) {
            // Stop listening to previous channel if any
            if (state.echo) {
                state.echo.leave(`conversation.${conversationId}`);
            }

            // Listen to new channel
            state.echo.private(`conversation.${conversationId}`)
                .listen('.MessageSent', (e) => {
                    state.messages.push(e);
                    renderMessages();
                    scrollToBottom();
                });
        }

        // Send a message
        async function sendMessage() {
            if (!elements.messageInput.value && !state.attachmentFile) return;

            const formData = new FormData();
            if (elements.messageInput.value) {
                formData.append('message', elements.messageInput.value);
            }
            if (state.attachmentFile) {
                formData.append('attachment', state.attachmentFile);
            }

            try {
                const response = await fetch(`/api/conversations/${state.activeConversation.conversation_id}/messages`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                if (response.ok) {
                    // Clear input and attachment
                    elements.messageInput.value = '';
                    state.attachmentFile = null;
                    elements.attachmentInput.value = '';
                    toggleSendButton();

                    // Refresh messages to get the latest
                    await fetchMessages(state.activeConversation.conversation_id);
                } else {
                    console.error('Failed to send message');
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }

        // Handle file upload
        function handleFileUpload(event) {
            state.attachmentFile = event.target.files[0];
            toggleSendButton();
        }

        // Toggle send button state
        function toggleSendButton() {
            elements.sendButton.disabled = !elements.messageInput.value && !state.attachmentFile;
        }

        // Check if file is an image
        function isImage(fileType) {
            return fileType && fileType.startsWith('image/');
        }

        // Format time
        function formatTime(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Scroll to bottom of messages container
        function scrollToBottom() {
            setTimeout(() => {
                elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
            }, 100);
        }

        // Escape HTML to prevent XSS
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Make functions available globally for onclick handlers
        window.selectConversation = selectConversation;
    </script>
</body>
</html>

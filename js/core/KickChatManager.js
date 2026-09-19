/**
 * KickChatManager
 * Dedicated Kick chat integration via Pusher WebSocket.
 * Reuses existing Kick chat architecture while providing a clean, modular event interface.
 */
export class KickChatManager {
  constructor(options = {}) {
    this.chatroomId = options.chatroomId || (typeof localStorage !== 'undefined' ? localStorage.getItem('kick_chatroom_id') : null) || '107612';
    this.channelName = options.channelName || (typeof localStorage !== 'undefined' ? localStorage.getItem('kick_channel_name') : null) || '';
    this.ws = null;
    this.status = 'DISCONNECTED'; // 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'
    this.statusMessage = 'Not connected';
    this.reconnectTimer = null;
    this.autoReconnect = true;
    this.chatLog = [];
    this.maxChatLog = 50;

    this.callbacks = {
      onJoin: null,
      onLeave: null,
      onStart: null,
      onReset: null,
      onTurbo: null,
      onMessage: null,
      onStatusChange: null
    };
  }

  setCallbacks(callbacks = {}) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  _setStatus(status, message) {
    this.status = status;
    this.statusMessage = message;
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange({ status, message, chatroomId: this.chatroomId, channelName: this.channelName });
    }
  }

  /**
   * Helper to extract sender username from Kick Pusher payload
   */
  _extractSender(data) {
    if (!data) return 'Unknown';
    const s = data.sender || data.user || data.author || data.identity || data.profile || {};
    if (typeof s === 'string') return s;
    if (s.username) return s.username;
    if (s.slug) return s.slug;
    if (s.name) return s.name;
    if (s.display_name) return s.display_name;
    if (s.displayName) return s.displayName;
    if (data.username) return data.username;
    if (data.user_name) return data.user_name;
    if (data.display_name) return data.display_name;
    if (data.name) return data.name;
    return 'Viewer_' + Math.floor(Math.random() * 8999 + 1000);
  }

  /**
   * Helper to extract chat message text from Kick Pusher payload
   */
  _extractContent(data) {
    return String(data.content || data.message || data.body || data.text || '').trim();
  }

  /**
   * Resolve a Kick channel name to Chatroom ID using local /api/chatroom or direct Kick API
   */
  async resolveChannel(name) {
    const cleanName = String(name).trim().toLowerCase();
    if (!cleanName) throw new Error('Channel name required');

    this._setStatus('CONNECTING', `Resolving channel "${cleanName}"...`);

    try {
      const response = await fetch(`/api/chatroom?name=${encodeURIComponent(cleanName)}`);
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to resolve channel ${cleanName}`);
      }
      const resData = await response.json();
      if (!resData.chatroomId) {
        throw new Error('No chatroomId found for channel');
      }

      this.channelName = cleanName;
      this.chatroomId = String(resData.chatroomId);
      localStorage.setItem('kick_channel_name', this.channelName);
      localStorage.setItem('kick_chatroom_id', this.chatroomId);

      return this.connect(this.chatroomId);
    } catch (err) {
      this._setStatus('ERROR', `Error resolving channel: ${err.message}`);
      throw err;
    }
  }

  /**
   * Connect to Kick Pusher WebSocket using chatroomId
   */
  connect(customChatroomId) {
    if (customChatroomId) {
      this.chatroomId = String(customChatroomId).trim();
      localStorage.setItem('kick_chatroom_id', this.chatroomId);
    }

    if (!this.chatroomId) {
      this._setStatus('ERROR', 'No chatroomId provided');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    this._setStatus('CONNECTING', `Connecting to Kick chatroom ${this.chatroomId}...`);

    try {
      // Existing verified Kick Pusher endpoint and key
      const pusherUrl = 'wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=7.6.0&flash=false';
      this.ws = new WebSocket(pusherUrl);

      this.ws.onopen = () => {
        this._setStatus('CONNECTING', `WebSocket open. Subscribing to chatrooms.${this.chatroomId}.v2...`);
        const subscribePayload = {
          event: 'pusher:subscribe',
          data: { channel: `chatrooms.${this.chatroomId}.v2` }
        };
        this.ws.send(JSON.stringify(subscribePayload));
      };

      this.ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch (e) {
          return;
        }

        if (msg.event === 'pusher:connection_established') {
          return;
        }

        if (msg.event === 'pusher:subscription_succeeded' || msg.event === 'pusher_internal:subscription_succeeded') {
          this._setStatus('CONNECTED', `Connected to Kick Chatroom #${this.chatroomId}`);
          return;
        }

        const isChatEvent = msg.event === 'App\\Events\\ChatMessageEvent' || msg.event === 'App\\Events\\ChatMessageSentEvent';
        if (isChatEvent && msg.data) {
          let data;
          try {
            data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
          } catch (e) {
            return;
          }

          const sender = this._extractSender(data);
          const rawText = this._extractContent(data);
          this.handleIncomingMessage(sender, rawText, data);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Kick WebSocket error:', err);
        this._setStatus('ERROR', 'Connection error to Kick chat.');
      };

      this.ws.onclose = (ev) => {
        this._setStatus('DISCONNECTED', 'Kick chat disconnected.');
        if (this.autoReconnect) {
          this.reconnectTimer = setTimeout(() => {
            console.log('Attempting auto-reconnect to Kick chat...');
            this.connect();
          }, 6000);
        }
      };
    } catch (err) {
      this._setStatus('ERROR', `Failed to open socket: ${err.message}`);
    }
  }

  /**
   * Disconnect from Kick WebSocket
   */
  disconnect() {
    this.autoReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this._setStatus('DISCONNECTED', 'Disconnected by user.');
  }

  /**
   * Process an incoming message and route commands
   */
  handleIncomingMessage(sender, rawContent, rawPayload = null) {
    const text = String(rawContent || '').trim();
    const lower = text.toLowerCase();

    // Add to chat log
    const chatItem = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      sender,
      content: text,
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isCommand: lower.startsWith('!')
    };

    this.chatLog.unshift(chatItem);
    if (this.chatLog.length > this.maxChatLog) {
      this.chatLog.pop();
    }

    if (this.callbacks.onMessage) {
      this.callbacks.onMessage(chatItem);
    }

    // Command Routing
    if (lower.startsWith('!join') || lower === '!join') {
      if (this.callbacks.onJoin) {
        this.callbacks.onJoin(sender, text, rawPayload);
      }
    } else if (lower.startsWith('!leave') || lower === '!leave') {
      if (this.callbacks.onLeave) {
        this.callbacks.onLeave(sender, text, rawPayload);
      }
    } else if (lower === '!start') {
      if (this.callbacks.onStart) {
        this.callbacks.onStart(sender, text, rawPayload);
      }
    } else if (lower === '!reset') {
      if (this.callbacks.onReset) {
        this.callbacks.onReset(sender, text, rawPayload);
      }
    } else if (/!?\s*masturbo/i.test(lower) || lower === '!turbo' || lower === 'turbo') {
      if (this.callbacks.onTurbo) {
        this.callbacks.onTurbo(sender, text, rawPayload);
      }
    }
  }

  /**
   * Simulate a chat message for testing/debug without live Kick stream
   */
  simulateMessage(sender, content) {
    this.handleIncomingMessage(sender, content, { simulated: true });
  }

  getChatLog() {
    return [...this.chatLog];
  }
}

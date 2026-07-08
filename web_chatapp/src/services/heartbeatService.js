const API_BASE = "http://127.0.0.1:8000/api";
const HEARTBEAT_INTERVAL_MS = 30000;

class HeartbeatService {
  constructor() {
    this.intervalId = null;
    this.token = null;
  }

  start(token) {
    if (!token) return;
    this.token = token;
    this.stop();
    this.sendHeartbeat();
    this.intervalId = setInterval(() => this.sendHeartbeat(), HEARTBEAT_INTERVAL_MS);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.token = null;
  }

  async sendHeartbeat() {
    const token = this.token || localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(`${API_BASE}/user/heartbeat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
    } catch {
      // Non-fatal — status will expire after 5 minutes without heartbeat
    }
  }

  async markOffline() {
    const token = this.token || localStorage.getItem("token");
    if (!token) return;

    try {
      await fetch(`${API_BASE}/user/offline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        keepalive: true,
      });
    } catch {
      // ignore
    }
  }
}

const heartbeatService = new HeartbeatService();
export default heartbeatService;

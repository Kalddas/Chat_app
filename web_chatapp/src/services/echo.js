import Echo from "laravel-echo";
import Pusher from "pusher-js";
import axios from "axios";

window.Pusher = Pusher;
Pusher.logToConsole = false;

let echoInstance = null;

const getToken = () => localStorage.getItem("token");

function createEcho() {
  const instance = new Echo({
    broadcaster: "pusher",
    key: "local",
    cluster: "mt1",
    wsHost: "127.0.0.1",
    wsPort: 6001,
    forceTLS: false,
    encrypted: false,
    enabledTransports: ["ws", "wss"],
    authEndpoint: "http://127.0.0.1:8000/api/broadcasting/auth",
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        axios
          .post(
            "http://127.0.0.1:8000/api/broadcasting/auth",
            new URLSearchParams({
              socket_id: socketId,
              channel_name: channel.name,
            }),
            {
              headers: {
                Authorization: `Bearer ${getToken()}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          )
          .then((res) => callback(false, res.data))
          .catch((err) => callback(true, err));
      },
    }),
  });

  instance.connector.pusher.connection.bind("connected", () => {
    console.log("Pusher/Soketi connected successfully");
  });

  instance.connector.pusher.connection.bind("error", (err) => {
    // Soketi/Reverb is optional — chat still works via polling
    if (err?.type !== "PusherError") {
      console.warn("WebSocket connection issue:", err);
    }
  });

  window.Echo = instance;
  return instance;
}

/** Connect only when authenticated — avoids errors on login/register pages */
export function getEcho() {
  if (!getToken()) return null;
  if (!echoInstance) {
    echoInstance = createEcho();
  }
  return echoInstance;
}

export function disconnectEcho() {
  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch {
      // ignore
    }
    echoInstance = null;
    window.Echo = undefined;
  }
}

export default getEcho;

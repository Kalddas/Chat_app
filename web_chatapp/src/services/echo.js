import Echo from "laravel-echo";
import Pusher from "pusher-js";
import axios from "axios";

window.Pusher = Pusher;

const getToken = () => localStorage.getItem("token");

const echo = new Echo({
  broadcaster: "pusher",
  key: "local",              // your Soketi APP_KEY
  cluster: "mt1",            // required even for Soketi
  wsHost: "127.0.0.1",
  wsPort: 6001,
  forceTLS: false,
  encrypted: false,
  enabledTransports: ["ws", "wss"],
  authEndpoint: "http://127.0.0.1:8000/broadcasting/auth",
  authorizer: (channel, options) => {
    return {
      authorize: (socketId, callback) => {
        axios.post(
          "http://127.0.0.1:8000/broadcasting/auth",
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
    };
  },
});

echo.connector.pusher.connection.bind("connected", () => {
  console.log("Pusher/Soketi connected successfully");
});

echo.connector.pusher.connection.bind("error", (err) => {
  console.error("Pusher/Soketi connection error:", err);
});

export default echo;

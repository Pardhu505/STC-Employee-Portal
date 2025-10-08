import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext"; // adjust path
import { Textarea } from "./ui/textarea";

export default function ChatBox() {
  const { user, sendWebSocketMessage } = useAuth(); // we get logged-in user + websocket
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  // 📩 Listen for incoming WS messages
  useEffect(() => {
    if (!user) return;

    const handleWebSocketMessage = (event) => {
      const data = event.detail;
      console.log("📩 Incoming WS:", data);

      if (data.type === "chat_message") {
        setMessages((prev) => [...prev, data]);
      }
    };

    window.addEventListener('websocket-message', handleWebSocketMessage);
    return () => {
      window.removeEventListener('websocket-message', handleWebSocketMessage);
    };
  }, [user]);

  // ✉️ Send a message
  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const message = {
      type: "chat_message",
      recipient_id: "admin@showtimeconsulting.in", // TODO: dynamic later
      sender_id: user.email,
      sender_name: user.name || user.email,
      content: inputMessage,
    };

    sendWebSocketMessage(message);
    setMessages((prev) => [...prev, message]); // show for sender immediately
    setInputMessage("");
  };

  return (
    <div className="flex flex-col h-full border rounded-lg shadow-sm">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg max-w-xs ${
              msg.sender_id === user.email
                ? "ml-auto bg-blue-500 text-white"
                : "mr-auto bg-gray-200 text-gray-900"
            }`}
          >
            <strong>{msg.sender_name}: </strong>
            {msg.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t flex items-center gap-2">
        <Textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}

"use client"
import { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io();

export default function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/socket"); // Ensures the WebSocket API is initialized

    socket.on("newMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => socket.off("newMessage");
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("sendMessage", message);
      setMessage("");
    }
  };

  return (
    <div style={styles.chatBox}>
      <div style={styles.messages}>
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.sender}: </strong>
            {msg.message}
          </p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={styles.input}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage} style={styles.button}>Send</button>
    </div>
  );
}

const styles = {
  chatBox: { border: "1px solid #ccc", padding: "10px", width: "300px", position: "fixed", bottom: "20px", right: "20px", background: "white", borderRadius: "10px" },
  messages: { height: "200px", overflowY: "scroll" },
  input: { width: "80%", padding: "5px", marginTop: "5px" },
  button: { padding: "5px 10px", marginLeft: "5px" }
};

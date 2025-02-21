// import dotenv from "dotenv";
// dotenv.config();

// import { Server } from "socket.io";
// import mongoose from "mongoose";
// import pkg from "whatsapp-web.js";
// const { Client: WhatsAppClient, LocalAuth } = pkg;
// import qrcode from "qrcode-terminal";
// // import TelegramBot from "node-telegram-bot-api";


// // Define a global WebSocket variable
// let io;

// if (!process.env.MONGO_URI) {
//     console.error("❌ ERROR: Missing MONGO_URI in .env file!");
//     process.exit(1); // Stop the server if the database connection string is missing
//   }
  
//   mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => console.log("✅ MongoDB Connected"))
//     .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// const ChatMessage = mongoose.model("ChatMessage", {
//   sender: String,
//   message: String,
//   timestamp: Date,
//   platform: String,
// });

// // const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
// const whatsappClient = new WhatsAppClient({
//     authStrategy: new LocalAuth(),
//     puppeteer: { headless: false }
// });

// // ✅ Log QR Code to Terminal
// whatsappClient.on("qr", (qr) => {
//     console.log("📲 Scan the QR Code below in WhatsApp Web:");
//     qrcode.generate(qr, { small: true });
// });

// // ✅ Notify When WhatsApp is Ready
// whatsappClient.on("ready", () => {
//     console.log("✅ WhatsApp Web Client is Ready!");
// });

// // if (!global._mongoClientPromise) {
// //   mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
// //   global._mongoClientPromise = mongoose.connection;
// // }




// export default function SocketHandler(req, res) {
//   if (!res.socket.server.io) {
//     console.log("Starting WebSocket Server...");
//     io = new Server(res.socket.server);

//     io.on("connection", (socket) => {
//       console.log("Web Client Connected");

//       socket.on("sendMessage", async (message) => {
//         console.log("Web Message:", message);
//         io.emit("newMessage", { sender: "User", message });

//         await ChatMessage.create({ sender: "User", message, timestamp: new Date(), platform: "web" });

//         // Forward message to WhatsApp
//         whatsappClient.sendMessage(process.env.WHATSAPP_NUMBER + "@c.us", message);

//         // Forward message to Telegram
//         // bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message);
//       });

//       socket.on("disconnect", () => console.log("Web Client Disconnected"));
//     });

//     res.socket.server.io = io;
//   }
//   res.end();
// }



// // Handle WhatsApp Messages
// whatsappClient.on("message", async (msg) => {
//   console.log("WhatsApp Message:", msg.body);

//   if(io){
//     io.emit("newMessage", { sender: "WhatsApp", message: msg.body });
//   } else {
//     console.log("⚠️ WebSocket (io) is not initialized yet.")
//   }
// //   res.socket.server.io.emit("newMessage", { sender: "WhatsApp", message: msg.body });

//   await ChatMessage.create({ sender: "WhatsApp", message: msg.body, timestamp: new Date(), platform: "whatsapp" });
// });
// whatsappClient.initialize();

// // Handle Telegram Messages
// // bot.on("message", async (msg) => {
// //   console.log("Telegram Message:", msg.text);
// //   res.socket.server.io.emit("newMessage", { sender: "Telegram", message: msg.text });

// //   await ChatMessage.create({ sender: "Telegram", message: msg.text, timestamp: new Date(), platform: "telegram" });
// // });


import dotenv from "dotenv";
dotenv.config();

import { Server } from "socket.io";
import mongoose from "mongoose";
import pkg from "whatsapp-web.js";
const { Client: WhatsAppClient, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";

// ✅ Store WebSocket (`io`) globally
let io;

// ✅ Connect to MongoDB
if (!process.env.MONGO_URI) {
    console.error("❌ ERROR: Missing MONGO_URI in .env file!");
    process.exit(1);
}
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

const ChatMessage = mongoose.model("ChatMessage", {
  sender: String,
  message: String,
  timestamp: Date,
  platform: String,
});

// ✅ Initialize WhatsApp Client
const whatsappClient = new WhatsAppClient({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: false }
});

whatsappClient.on("qr", (qr) => {
    console.log("📲 Scan the QR Code below in WhatsApp Web:");
    qrcode.generate(qr, { small: true });
});

whatsappClient.on("ready", () => {
    console.log("✅ WhatsApp Web Client is Ready!");
});

// ✅ GLOBAL VARIABLE TO STORE `io`
let ioReady = false;

// ✅ Store WebSocket (`io`) Globally
export default function SocketHandler(req, res) {
  if (!res.socket.server.io) {
    console.log("Starting WebSocket Server...");
    io = new Server(res.socket.server, {
      cors: {
        origin: "*",
      },
    });

    io.on("connection", (socket) => {
      console.log("Web Client Connected");

      socket.on("sendMessage", async (message) => {
        console.log("Web Message:", message);
        io.emit("newMessage", { sender: "User", message });

        await ChatMessage.create({ sender: "User", message, timestamp: new Date(), platform: "web" });

        // Forward message to WhatsApp
        whatsappClient.sendMessage(process.env.WHATSAPP_NUMBER + "@c.us", message);
      });

      socket.on("disconnect", () => console.log("Web Client Disconnected"));
    });

    res.socket.server.io = io;
    ioReady = true; // ✅ Mark WebSocket as Ready
  }

  res.end();
}

// ✅ Use Global `io` to Emit WhatsApp Messages to Web Chat
whatsappClient.on("message", async (msg) => {
  console.log("📩 WhatsApp Message:", msg.body);

  // ✅ Ensure `io` is initialized before emitting
  if (ioReady && io) {
    io.emit("newMessage", { sender: "WhatsApp", message: msg.body });
  } else {
    console.log("⚠️ WebSocket (io) is not initialized yet. Retrying in 2 seconds...");
    setTimeout(() => {
      if (ioReady && io) {
        io.emit("newMessage", { sender: "WhatsApp", message: msg.body });
      } else {
        console.log("❌ WebSocket (io) is still not initialized!");
      }
    }, 2000);
  }

  await ChatMessage.create({ sender: "WhatsApp", message: msg.body, timestamp: new Date(), platform: "whatsapp" });
});

whatsappClient.initialize();

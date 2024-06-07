const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "https://gamevo.onrender.com" } });
app.use(express.json());

const rooms = new Map();

// Mock API created for cron-job(server sleep prevention)
app.get("/mockAPI", (req, res) => {
  res.status(200).json({ msg: 'Mock API data fetched successfully' });
});

io.on("connection", (socket) => {
  console.log("socket.id: " + socket.id);

  socket.on("createRoom", (name) => {
    const roomCode = Math.random().toString(36).substr(2, 9);
    const room = {
      code: roomCode,
      status: "waiting",
      users: [{ name: name, id: socket.id }],
      data: [],
      board: Array(9).fill(null),
      isNext: "",
      isNextMove: "",
      winner: null
    };
    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.emit("roomCreated", roomCode);
    console.log(`Room created with code: ${roomCode}`);
    io.emit("roomsUpdate", Array.from(rooms.values()));
  });

  socket.on("joinRoom", (roomCode, name) => {

    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      room.users.push({ name: name, id: socket.id });
      room.status = room.users.length === 2 ? "bothJoined" : "waiting";
      rooms.set(roomCode, room);
      socket.join(roomCode);
      io.emit("roomsUpdate", Array.from(rooms.values()));

      socket.emit("joinedRoom", roomCode);
      io.to(roomCode).emit("playerJoined", getUserNameById(room.users, socket.id));

      console.log(`Socket ${socket.id} joined room ${roomCode}`);
    } else {
      socket.emit("joinError");
      console.log(`Room ${roomCode} not found`);
    }
  });

  const getUserNameById = (users, id) => {
    const user = users.find(user => user.id === id);
    return user ? user.name : null;
  };

  socket.on("sendMessage", (roomCode, message) => {
    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      const userName = getUserNameById(room.users, socket.id);

      io.to(roomCode).emit("newMessage", { sender: socket.id, message, name: userName });
      console.log(`Message sent to room ${roomCode}: ${message}`);
    } else {
      socket.emit("error", "Room not found");
      console.log(`Room ${roomCode} not found`);
    }
  });

  socket.on("typing", (roomCode) => {
    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      const userName = getUserNameById(room.users, socket.id);
      io.to(roomCode).emit("othertyping", { sender: socket.id, userName });
      console.log(`Socket ${socket.id} is typing in room ${roomCode}`);
    } else {
      socket.emit("error", "Room not found");
      console.log(`Room ${roomCode} not found`);
    }
  });

  socket.on("checkRoomAndPlayer", (roomCode) => {
    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      if (room.users.find(user => user.id === socket.id)) {
        socket.emit("roomAndPlayerExists");
      } else {
        console.log(`Player ${socket.id} not found in room ${roomCode}`);
        socket.emit("roomOrPlayerNotFound");
      }
    } else {
      socket.emit("roomOrPlayerNotFound");
      console.log(`Room ${roomCode} not found`);
    }
  });

  socket.on("exitRoom", (roomCode, callback) => {
    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      const index = room.users.findIndex(user => user.id === socket.id);
      if (index !== -1) {
        const username = getUserNameById(room.users, socket.id);
        room.users.splice(index, 1);
        socket.leave(roomCode);
        io.to(roomCode).emit("playerLeft", socket.id, username);
        console.log(`Socket ${socket.id} left room ${roomCode}`);
        if (room.users.length === 0) {
          rooms.delete(roomCode);
          console.log(`Room ${roomCode} closed`);
        } else {
          room.status = "waiting";
          rooms.set(roomCode, room);
        }
        io.emit("roomsUpdate", Array.from(rooms.values()));
      }
      callback(); // Call the callback to navigate the user to the home page
    } else {
      socket.emit("error", "Room not found");
      console.log(`Room ${roomCode} not found`);
    }
  });

  socket.on("StartGame", (roomCode) => {
    if (rooms.has(roomCode) && rooms.get(roomCode).users[0].id === socket.id) {
      console.log("Starting game in room " + roomCode);
      const room = rooms.get(roomCode);
      if (room.users.length === 2) {
        const [p1, p2] = room.users;
        room.isNext = Math.random() < 0.5 ? p1 : p2;
        room.isNextMove = "X";
        io.to(roomCode).emit("GameInitialized", { playerId: room.isNext.id, playerName: room.isNext.name, nextMove: room.isNextMove });
      }
    }
  });

  socket.on("makeMove", ({ nextMove, roomCode, newBoard, gameWinner }) => {
    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      room.board = newBoard;
      room.winner = gameWinner;


      if (gameWinner) {
        let gameWinnerID = socket.id;
        io.in(roomCode).emit("gameUpdate", {
          newBoard,
          nextPlayerId: null,
          nextPlayerName: null,
          nextMove: null,
          gameWinner,
          gameWinnerID: gameWinnerID
        });
      } else {
        const isTie = !newBoard.includes(null);
        const [p1, p2] = room.users;
        room.isNextMove = nextMove === "X" ? "O" : "X";
        room.isNext = room.isNext.id === p1.id ? p2 : p1;

        io.in(roomCode).emit("gameUpdate", {
          newBoard,
          nextPlayerId: isTie ? null : room.isNext.id,
          nextPlayerName: isTie ? null : room.isNext.name,
          nextMove: isTie ? null : room.isNextMove,
          gameWinner: isTie ? "Tie" : null
        });
      }
    } else {
      socket.emit("error", "Room not found");
      console.log(`Room ${roomCode} not found`);
    }
  });

  socket.on("resetGame", ({ roomCode, newBoard }) => {
    if (rooms.has(roomCode)) {
      const room = rooms.get(roomCode);
      room.board = newBoard;

      const [p1, p2] = room.users;
      room.isNext = Math.random() < 0.5 ? p1 : p2;
      room.winner = null;
      room.isNextMove = "X";

      io.in(roomCode).emit("gameUpdate", {
        newBoard,
        nextPlayerId: room.isNext.id,
        nextPlayerName: room.isNext.name,
        nextMove: room.isNextMove,
        gameWinner: null
      });
    } else {
      socket.emit("error", "Room not found");
      console.log(`Room ${roomCode} not found`);
    }
  });

  socket.on("disconnect", () => {
    rooms.forEach((room, roomCode) => {
      const index = room.users.findIndex(user => user.id === socket.id);
      if (index !== -1) {
        room.users.splice(index, 1);
        socket.to(roomCode).emit("playerLeft", socket.id);
        console.log(`Socket ${socket.id} left room ${roomCode}`);
        if (room.users.length === 0) {
          rooms.delete(roomCode);
          console.log(`Room ${roomCode} closed`);
        } else {
          room.status = "waiting";
          rooms.set(roomCode, room);
        }
        io.emit("roomsUpdate", Array.from(rooms.values()));
      }
    });
  });
});

httpServer.listen(4000, () => {
  console.log("Server listening on port 4000");
});

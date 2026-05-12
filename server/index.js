import { Character } from "./Character.js";
import { MovementActionScripts as MAScripts } from "./movementActionScripts.js";
import { Server } from "socket.io";
import { createServer } from "http";

const http = createServer();
const io = new Server(http, {
  cors: { origin: "*" },
});

const allPlayers = [];
global.io = io;
global.allPlayers = allPlayers;

// WEBSOCKET SERVER CODE:

io.on("connection", (socket) => {
  // User has connected
  io.emit("gameActions", allPlayers);
  io.emit("chatMessage", {
    from: socket.id,
    message: `${socket.id} has connected`,
  });

  // Pass chatMessage to everyone
  socket.on("chatMessage", (message) => {
    io.emit("chatMessage", {
      from: socket.id,
      message: message,
    });
  });

  socket.on("arenaActionPlayerSpawn", () => {
    const playerIndex = allPlayers.findIndex((e) => e.id === socket.id);
    const newCharacter = new Character({
      id: socket.id,
      position: {
        x: 100 + Math.floor(Math.random() * 700),
        y: 100 + Math.floor(Math.random() * 400),
      },
      maxHP: 1000,
      currentHP: 1000,
      headerName: socket.id,
      maxEnergy: 2000,
      currentEnergy: 2000,
    });
    if (playerIndex !== -1) {
      allPlayers[playerIndex] = newCharacter;
    } else {
      allPlayers.push(newCharacter);
    }
    io.emit("gameActions", allPlayers);
  });

  socket.on("controlActions", (controlData) => {
    const champ = allPlayers.find((e) => e.id === socket.id);
    if (!champ) return;
    let basicMovementSpeed = 0;
    let currentVelocity = { x: 0, y: 0 };
    if (controlData.champRunning && champ.currentEnergy > 0) {
      basicMovementSpeed = champ.runSpeed;
    } else if (controlData.champWalking) {
      basicMovementSpeed = champ.walkSpeed;
    }
    if (champ.isPunching1 && !champ.isJumping) {
      basicMovementSpeed = champ.walkSpeed / 2;
    }
    if (champ.isJumping) {
      if (champ.isRunning) {
        basicMovementSpeed = basicMovementSpeed * 1.2;
      } else {
        basicMovementSpeed = basicMovementSpeed * 1.4;
      }
    }

    allPlayers.forEach((player2) => {
      if (
        champ.id !== player2.id &&
        !champ.isPushed &&
        !player2.isPushed &&
        MAScripts.doesCollideRect(
          champ.getCurrentPushingBox(),
          player2.getCurrentPushingBox(),
          champ.offset.y,
          player2.offset.y,
        )
      ) {
        if (champ.isRunning && player2.isRunning) {
          player2.pushMe(champ.lastDirection, 7);
          champ.pushMe(MAScripts.getOppositeDirection(champ.lastDirection), 7);
        } else if (champ.isRunning) {
          player2.pushMe(champ.lastDirection, 7);
          champ.pushMe(MAScripts.getOppositeDirection(champ.lastDirection), 3);
        } else if (player2.isRunning) {
          player2.pushMe(champ.lastDirection, 3);
          champ.pushMe(MAScripts.getOppositeDirection(champ.lastDirection), 7);
        } else if (player2.isWalking && champ.isWalking) {
          player2.pushMe(champ.lastDirection, 1);
          champ.pushMe(MAScripts.getOppositeDirection(champ.lastDirection), 1);
        } else if (champ.isWalking) {
          player2.pushMe(champ.lastDirection, 1);
          champ.pushMe(MAScripts.getOppositeDirection(champ.lastDirection), 1);
        }
      }
    });

    if (controlData.champMoving && !champ.isPushed) {
      if (controlData.champDirection === "topLeft") {
        currentVelocity.y = -basicMovementSpeed * MAScripts.getDiagonalFactor();
        currentVelocity.x = -basicMovementSpeed * MAScripts.getDiagonalFactor();
      } else if (controlData.champDirection === "topRight") {
        currentVelocity.y = -basicMovementSpeed * MAScripts.getDiagonalFactor();
        currentVelocity.x = basicMovementSpeed * MAScripts.getDiagonalFactor();
      } else if (controlData.champDirection === "top") {
        currentVelocity.y = -basicMovementSpeed;
      } else if (controlData.champDirection === "bottomLeft") {
        currentVelocity.y = basicMovementSpeed * MAScripts.getDiagonalFactor();
        currentVelocity.x = -basicMovementSpeed * MAScripts.getDiagonalFactor();
      } else if (controlData.champDirection === "bottomRight") {
        currentVelocity.y = basicMovementSpeed * MAScripts.getDiagonalFactor();
        currentVelocity.x = basicMovementSpeed * MAScripts.getDiagonalFactor();
      } else if (controlData.champDirection === "bottom") {
        currentVelocity.y = basicMovementSpeed;
      } else if (controlData.champDirection === "right") {
        currentVelocity.x = basicMovementSpeed;
      } else if (controlData.champDirection === "left") {
        currentVelocity.x = -basicMovementSpeed;
      }
    }
    // Change parameters
    champ.direction = controlData.champDirection;
    if (champ.direction !== "") {
      champ.lastDirection = champ.direction;
    }
    champ.isMoving = controlData.champMoving;
    champ.isWalking = controlData.champWalking;
    champ.isRunning = controlData.champRunning && champ.currentEnergy > 0;
    champ.position.x += currentVelocity.x * champ.speedFactor;
    champ.position.y += currentVelocity.y * champ.speedFactor;
    // Hitboxes movement
    champ.hurtBoxPosition.x = champ.getHurtBoxPosition().x;
    champ.hurtBoxPosition.y = champ.getHurtBoxPosition().y;
    champ.punchBoxPosition.x = champ.getPunchBoxPosition().x;
    champ.punchBoxPosition.y = champ.getPunchBoxPosition().y;
    champ.pushingBoxPosition.x = champ.getPushingBoxPosition().x;
    champ.pushingBoxPosition.y = champ.getPushingBoxPosition().y;

    // Change parameters
    if (champ.isRunning) {
      champ.currentEnergy -= 1;
    }
    if (champ.currentEnergy <= 0) {
      champ.currentEnergy = 0;
    }
    // Animations
    let holdTime = 7;
    if (champ.isRunning) {
      holdTime = 5;
    }
    champ.framesElapsed += 1;

    if (!champ.isJumping) {
      if (champ.framesElapsed >= holdTime) {
        champ.framesElapsed = 0;
        champ.currentFrame += 1;
        if (champ.currentFrame >= 9) {
          champ.currentFrame = 1;
        }
      }
    }

    // Jumping
    if (controlData.champJumping && champ.currentEnergy >= 20) {
      if (!champ.isJumping) {
        champ.jump();
      }
    }

    // Guard up
    if (controlData.champIsGuarding) {
      champ.isGuardUp = true;
    } else if (controlData.champIsGuarding === false) {
      champ.isGuardUp = false;
    }

    // Attacking
    if (controlData.champAttacking && controlData.champPunching1) {
      if (!champ.isAttacking && champ.currentEnergy >= 5) {
        champ.punch1();
      }
    } else {
      // Actualize game data on clients
      io.emit("gameActions", allPlayers);
    }
  });

  socket.on("gameActionPlayerDisconnect", () => {
    io.emit("chatMessage", {
      from: socket.id,
      message: `Has disconnected`,
    });
    const playerIndex = allPlayers.findIndex((e) => e.id === socket.id);
    if (playerIndex !== -1) {
      allPlayers.splice(playerIndex, 1);
      io.emit("gameActions", allPlayers);
    }
  });
});

// Time dependent actions
const gameInterval = setInterval(() => {
  allPlayers.forEach((player) => {
    player.currentEnergy += 15 + player.maxEnergy / 200;
    player.gold += 1;
    if (player.currentEnergy >= player.maxEnergy) {
      player.currentEnergy = player.maxEnergy;
    }
    player.currentHP += 5;
    if (player.currentHP >= player.maxHP) {
      player.currentHP = player.maxHP;
    }
  });
  io.emit("gameActions", allPlayers);
}, 1000);

http.listen(8080, () => console.log("listening on http://localhost:8080"));

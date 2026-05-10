const allPlayers = [];
const diagonalFactor = 0.70710678118;

const getOppositeDirection = (direction) => {
  if (direction === "left") return "right";
  if (direction === "right") return "left";
  if (direction === "top") return "bottom";
  if (direction === "bottom") return "top";
  if (direction === "topLeft") return "bottomRight";
  if (direction === "topRight") return "bottomLeft";
  if (direction === "bottomLeft") return "topRight";
  if (direction === "bottomRight") return "topLeft";
};

const doesCollideRect = (a, b, aJumpOffset, bJumpOffset) => {
  let isCollision = !(
    a.y + a.height < b.y ||
    a.y > b.y + b.height ||
    a.x + a.width < b.x ||
    a.x > b.x + b.width
  );
  const areRectsOnSimilarHeight = Math.abs(aJumpOffset - bJumpOffset) <= 10;
  // TODO ^ change <= 10 to a number related with rect height
  return isCollision && areRectsOnSimilarHeight;
};

const timeoutFrameControl = (
  timeout,
  frames,
  character,
  frameFunction,
  actionFrame,
  actionFunction,
  reverse,
  endFunction,
) => {
  character.currentFrame = 1;
  character.framesElapsed = 0;
  if (reverse) {
    frames = [...frames, ...frames.slice(0, frames.length - 1).reverse()];
  }
  frames.forEach((frame, i) => {
    setTimeout(
      () => {
        character.currentFrame = frame;
        frameFunction && frameFunction();
        if (i + 1 === actionFrame) {
          actionFunction && actionFunction();
        }
        if (i + 1 === frames.length) {
          endFunction && endFunction();
        }
      },
      timeout * (i + 1),
    );
  });
};
const timeoutAction = (
  interval,
  numberOfIterations,
  iterationFunction,
  endFunction,
) => {
  let iteration = 0;
  const actionInterval = setInterval(() => {
    iteration += 1;
    iterationFunction && iterationFunction(iteration);
    if (iteration >= numberOfIterations) {
      endFunction && endFunction();
      clearInterval(actionInterval);
    }
  }, interval);
};

class Character {
  constructor({
    id,
    headerName,
    attack = 15,
    armor = 0.01,
    jumpPower = 32,
    maxHP = 1000,
    currentHP = 1000,
    maxEnergy = 1000,
    currentEnergy = 1000,
    gold = 0,
    direction = "bottom",
    hurtBoxSize = { width: 28, height: 58 },
    punchBoxSize = { width: 28, height: 16 },
    pushingBoxSize = { width: 16, height: 16 },
    position = { x: 0, y: 0 },
    offset = { x: 0, y: 0 },
    walkSpeed = 2,
    runSpeed = 3.3,
    speedFactor = 1,
    isWalking = false,
    isRunning = false,
    isMoving = false,
    isJumping = false,
    isAttacking = false,
    isPunching1 = false,
    isPushed = false,
    isGuardUp = false,
    isPunching2 = false,
    isPunching3 = false,
    currentFrame = 1,
    framesElapsed = 0,
  }) {
    this.id = id;
    this.maxHP = maxHP;
    this.attack = attack;
    this.armor = armor;
    this.jumpPower = jumpPower;
    this.currentHP = currentHP;
    this.maxEnergy = maxEnergy;
    this.currentEnergy = currentEnergy;
    this.gold = gold;
    this.hurtBoxSize = hurtBoxSize;
    this.punchBoxSize = punchBoxSize;
    this.pushingBoxSize = pushingBoxSize;
    this.position = position;
    this.offset = offset;
    this.direction = direction;
    this.lastDirection = direction;
    this.hurtBoxPosition = this.getHurtBoxPosition();
    this.punchBoxPosition = this.getPunchBoxPosition();
    this.pushingBoxPosition = this.getPushingBoxPosition();
    this.isWalking = isWalking;
    this.isRunning = isRunning;
    this.isJumping = isJumping;
    this.isAttacking = isAttacking;
    this.isPunching1 = isPunching1;
    this.isPushed = isPushed;
    this.isGuardUp = isGuardUp;
    this.speedFactor = speedFactor;
    this.isMoving = isMoving;
    this.walkSpeed = walkSpeed;
    this.runSpeed = runSpeed;
    this.headerName = headerName;
    this.currentFrame = currentFrame;
    this.framesElapsed = framesElapsed;
  }

  getHurtBoxPosition = () => {
    return {
      x: this.position.x - this.hurtBoxSize.width / 2 + this.offset.x + 2,
      y: this.position.y - this.hurtBoxSize.height / 2 + this.offset.y - 2,
    };
  };
  getPunchBoxPosition = () => {
    let x = this.position.x - this.punchBoxSize.width / 2 + this.offset.x + 2;
    let y = this.position.y - this.punchBoxSize.height / 2 + this.offset.y - 2;
    if (this.lastDirection.includes("ight")) x += 16;
    if (this.lastDirection.includes("eft")) x -= 16;
    if (this.lastDirection.includes("op")) y -= 16;
    if (this.lastDirection.includes("ottom")) y += 16;
    return { x, y };
  };
  getPushingBoxPosition = () => {
    return {
      x: this.position.x - this.pushingBoxSize.width / 2 + this.offset.x + 2,
      y: this.position.y - this.pushingBoxSize.height / 2 + this.offset.y - 2,
    };
  };
  getCurrentHurtBox = () => {
    return {
      ...this.getHurtBoxPosition(),
      width: this.hurtBoxSize.width,
      height: this.hurtBoxSize.height,
    };
  };
  getCurrentPunchBox = () => {
    return {
      ...this.getPunchBoxPosition(),
      width: this.punchBoxSize.width,
      height: this.punchBoxSize.height,
    };
  };
  getCurrentPushingBox = () => {
    return {
      ...this.getPushingBoxPosition(),
      width: this.pushingBoxSize.width,
      height: this.pushingBoxSize.height,
    };
  };
  pushMe = (direction, power) => {
    if (this.isPushed) return;
    let randomXDirectionOffset = Math.floor(Math.random() * power * 0.3);
    let randomYDirectionOffset = Math.floor(Math.random() * power * 0.3);
    if (Math.random() < 0.5)
      randomXDirectionOffset = randomXDirectionOffset * -1;
    if (Math.random() < 0.5)
      randomYDirectionOffset = randomYDirectionOffset * -1;
    let pushPower = power;
    this.isPushed = true;

    timeoutAction(
      30,
      power,
      () => {
        if (direction === "right") {
          this.position.x += pushPower;
          this.position.y += randomYDirectionOffset;
        }
        if (direction === "left") {
          this.position.x -= pushPower;
          this.position.y += randomYDirectionOffset;
        }
        if (direction === "top") {
          this.position.y -= pushPower;
          this.position.x += randomXDirectionOffset;
        }
        if (direction === "bottom") {
          this.position.y += pushPower;
          this.position.x += randomXDirectionOffset;
        }
        if (direction === "topRight") {
          this.position.x += pushPower * diagonalFactor;
          this.position.y -= pushPower * diagonalFactor;
          this.position.x += randomXDirectionOffset;
          this.position.y += randomYDirectionOffset;
        }
        if (direction === "topLeft") {
          this.position.x -= pushPower * diagonalFactor;
          this.position.y -= pushPower * diagonalFactor;
          this.position.x += randomXDirectionOffset;
          this.position.y += randomYDirectionOffset;
        }
        if (direction === "bottomRight") {
          this.position.y += pushPower * diagonalFactor;
          this.position.x += pushPower * diagonalFactor;
          this.position.x += randomXDirectionOffset;
          this.position.y += randomYDirectionOffset;
        }
        if (direction === "bottomLeft") {
          this.position.y += pushPower * diagonalFactor;
          this.position.x -= pushPower * diagonalFactor;
          this.position.x += randomXDirectionOffset;
          this.position.y += randomYDirectionOffset;
        }
        this.hurtBoxPosition.x = this.getHurtBoxPosition().x;
        this.hurtBoxPosition.y = this.getHurtBoxPosition().y;
        this.punchBoxPosition.x = this.getPunchBoxPosition().x;
        this.punchBoxPosition.y = this.getPunchBoxPosition().y;
        this.pushingBoxPosition.x = this.getPushingBoxPosition().x;
        this.pushingBoxPosition.y = this.getPushingBoxPosition().y;
        io.emit("gameActions", allPlayers);
        pushPower -= 1;
        if (randomXDirectionOffset > 0) {
          randomXDirectionOffset -= Math.abs(randomXDirectionOffset) / power;
        } else {
          randomXDirectionOffset += Math.abs(randomXDirectionOffset) / power;
        }
        if (randomYDirectionOffset > 0) {
          randomYDirectionOffset -= Math.abs(randomYDirectionOffset) / power;
        } else {
          randomYDirectionOffset += Math.abs(randomYDirectionOffset) / power;
        }
      },
      () => {
        this.isPushed = false;
      },
    );
  };

  jump = () => {
    this.isJumping = true;
    this.currentFrame = 1;
    this.currentEnergy -= 20;
    const iterationsAndJumpPower = this.jumpPower;
    const animationFactor = iterationsAndJumpPower / 5.5;
    timeoutAction(
      17 /* 58hz */,
      iterationsAndJumpPower,
      (iteration) => {
        const jumpVelocity =
          iterationsAndJumpPower / (iterationsAndJumpPower / animationFactor);
        const downForce =
          iteration / (iterationsAndJumpPower / (animationFactor * 2));
        this.offset.y -= jumpVelocity - downForce;
        this.hurtBoxPosition.x = this.getHurtBoxPosition().x;
        this.hurtBoxPosition.y = this.getHurtBoxPosition().y;
        this.punchBoxPosition.x = this.getPunchBoxPosition().x;
        this.punchBoxPosition.y = this.getPunchBoxPosition().y;
        this.pushingBoxPosition.x = this.getPushingBoxPosition().x;
        this.pushingBoxPosition.y = this.getPushingBoxPosition().y;
        if (!this.isAttacking) {
          if (jumpVelocity > downForce) {
            this.currentFrame = 2;
          } else if (jumpVelocity <= downForce) {
            this.currentFrame = 4;
            if (downForce - jumpVelocity >= 4) {
              this.currentFrame = 7;
            }
          }
        }
        io.emit("gameActions", allPlayers);
      },
      () => {
        this.offset.y = 0;
        this.isJumping = 0;
        this.currentFrame = 1;
        io.emit("gameActions", allPlayers);
      },
    );
  };

  punch1 = () => {
    this.isAttacking = true;
    this.isPunching1 = true;
    this.currentEnergy -= 5;
    const punchFrames = Math.random(1, 1) > 0.5 ? [1, 2, 3, 4] : [5, 6, 7, 8];
    timeoutFrameControl(
      40,
      punchFrames,
      this,
      () => {
        io.emit("gameActions", allPlayers);
      },
      4,
      () => {
        allPlayers.forEach((hurtChamp) => {
          if (
            hurtChamp.id !== this.id &&
            doesCollideRect(
              hurtChamp.getCurrentHurtBox(),
              this.getCurrentPunchBox(),
              hurtChamp.offset.y,
              this.offset.y,
            )
          ) {
            let hurtChampHP =
              hurtChamp.currentHP - (1 - hurtChamp.armor) * this.attack;
            if (hurtChampHP <= 0) {
              hurtChampHP = 0;
            }
            hurtChamp.currentHP = hurtChampHP;
            hurtChamp.pushMe(this.lastDirection, 3);
            io.emit("gameActions", allPlayers);
          }
        });
      },
      true,
      () => {
        this.isAttacking = false;
        this.isPunching1 = false;
        io.emit("gameActions", allPlayers);
      },
    );
  };
}

// WEBSOCKET SERVER CODE:
const http = require("http").createServer();

const io = require("socket.io")(http, {
  cors: { origin: "*" },
});

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
        doesCollideRect(
          champ.getCurrentPushingBox(),
          player2.getCurrentPushingBox(),
          champ.offset.y,
          player2.offset.y,
        )
      ) {
        if (champ.isRunning && player2.isRunning) {
          player2.pushMe(champ.lastDirection, 7);
          champ.pushMe(getOppositeDirection(champ.lastDirection), 7);
        } else if (champ.isRunning) {
          player2.pushMe(champ.lastDirection, 7);
          champ.pushMe(getOppositeDirection(champ.lastDirection), 3);
        } else if (player2.isRunning) {
          player2.pushMe(champ.lastDirection, 3);
          champ.pushMe(getOppositeDirection(champ.lastDirection), 7);
        } else if (player2.isWalking && champ.isWalking) {
          player2.pushMe(champ.lastDirection, 1);
          champ.pushMe(getOppositeDirection(champ.lastDirection), 1);
        } else if (champ.isWalking) {
          player2.pushMe(champ.lastDirection, 1);
          champ.pushMe(getOppositeDirection(champ.lastDirection), 1);
        }
      }
    });

    if (controlData.champMoving && !champ.isPushed) {
      if (controlData.champDirection === "topLeft") {
        currentVelocity.y = -basicMovementSpeed * diagonalFactor;
        currentVelocity.x = -basicMovementSpeed * diagonalFactor;
      } else if (controlData.champDirection === "topRight") {
        currentVelocity.y = -basicMovementSpeed * diagonalFactor;
        currentVelocity.x = basicMovementSpeed * diagonalFactor;
      } else if (controlData.champDirection === "top") {
        currentVelocity.y = -basicMovementSpeed;
      } else if (controlData.champDirection === "bottomLeft") {
        currentVelocity.y = basicMovementSpeed * diagonalFactor;
        currentVelocity.x = -basicMovementSpeed * diagonalFactor;
      } else if (controlData.champDirection === "bottomRight") {
        currentVelocity.y = basicMovementSpeed * diagonalFactor;
        currentVelocity.x = basicMovementSpeed * diagonalFactor;
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

http.listen(8080, () => console.log("listening on http://localhost:8080"));

const gameInterval = setInterval(() => {
  // Time dependent actions
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

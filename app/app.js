const socket = io("ws://localhost:8080");
let allPlayers = [];
let lastEmitedData = "";
let isChatVisible = false;
//const socket = io("ws://192.168.7.110:8080");

// ---------------------------------------------------------------------- GAME CHAT.

const getColorFromText = (text) => {
  if (text) {
    const chatColors = [
      "yellow",
      "silver",
      "cyan",
      "pink",
      "orange",
      "yellowgreen",
    ];
    const charSum = text
      .split("")
      .map((char) => char.charCodeAt(0))
      .reduce((acc, val) => acc + val, 0);
    const colorIndex = charSum % chatColors.length;
    return chatColors[colorIndex];
  } else {
    return `rgba(0, 0, 0, 0.5)`;
  }
};

function showChat() {
  isChatVisible = true;
  const messagesContainer = document.getElementsByClassName("chat-messages")[0];
  messagesContainer.style.opacity = 1;
  const chatControls = document.getElementsByClassName("chat-controls")[0];
  chatControls.style.display = "block";
  document.querySelector("input").focus();
}
function hideChat() {
  isChatVisible = false;
  const messagesContainer = document.getElementsByClassName("chat-messages")[0];
  messagesContainer.style.opacity = 0.6;
  const chatControls = document.getElementsByClassName("chat-controls")[0];
  chatControls.style.display = "none";
}

// ---------------------------------------------------------------------------------------------- Event reactions
socket.on("chatMessage", (message) => {
  const el = document.createElement("li");
  const messagesContainer = document.getElementsByClassName("chat-messages")[0];
  el.innerHTML = `${message.from}: ${message.message}`;
  el.style.color = getColorFromText(message.from);
  document.querySelector("ul").appendChild(el);
  messagesContainer.scrollBy(0, messagesContainer.scrollHeight);
});
socket.on("gameActions", (gameData) => {
  allPlayers = gameData;
});

// ---------------------------------------------------------------------------------------- Event triggers

function sendChatMessage() {
  const text = document.querySelector("input").value;
  hideChat();
  if (text) {
    document.querySelector("input").value = "";
    socket.emit("chatMessage", text);
  }
}

document.querySelector("button").onclick = () => {
  if (isChatVisible) {
    sendChatMessage();
  }
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (isChatVisible) {
      sendChatMessage();
    } else {
      showChat();
    }
  }
});
document.getElementById("join-arena").onclick = () => {
  socket.emit("arenaActionPlayerSpawn", {
    team: undefined,
  });
};
window.onbeforeunload = () => {
  socket.emit("gameActionPlayerDisconnect");
};

// -------------------------------------------------------------------------------------------- Game

const drawCharacterName = (c, isEnemy, character) => {
  const enemyOffsetY = isEnemy ? 11 : 0;
  c.font = "11px serif";
  c.fillStyle = "rgba(255,255,255, 0.6)";
  c.fillText(
    character.id,
    character.position.x -
      c.measureText(character.id).width / 2 +
      character.offset.x,
    character.position.y - 65 + character.offset.y + enemyOffsetY,
  );
};
const drawHpBar = (c, isEnemy, character) => {
  const enemyOffsetY = isEnemy ? 11 : 0;
  c.fillStyle = `rgba(0,0,0, ${isEnemy ? "1" : "0.5"})`;
  c.fillRect(
    character.position.x - 50 + character.offset.x,
    character.position.y - 60 + character.offset.y + enemyOffsetY,
    100,
    6,
  );
  const hpPercent = (character.currentHP / character.maxHP) * 100;
  c.fillStyle = `rgba(${255 - hpPercent * 2.5},${hpPercent * 2.5},40,${
    isEnemy ? "1" : "0.5"
  })`;
  c.fillRect(
    character.position.x - 49 + character.offset.x,
    character.position.y - 59 + character.offset.y + enemyOffsetY,
    hpPercent - 2,
    4,
  );
};
const drawEnergyBar = (c, isEnemy, character) => {
  const enemyOffsetY = isEnemy ? 11 : 0;
  c.fillStyle = `rgba(0,0,0, ${isEnemy ? "1" : "0.5"})`;
  c.fillRect(
    character.position.x - 50 + character.offset.x,
    character.position.y - 55 + character.offset.y + enemyOffsetY,
    100,
    5,
  );
  c.fillStyle = `rgba(68, 137, 255, ${isEnemy ? "1" : "0.5"})`;
  c.fillRect(
    character.position.x - 49 + character.offset.x,
    character.position.y - 54 + character.offset.y + enemyOffsetY,
    (character.currentEnergy / character.maxEnergy) * 100 - 2,
    3,
  );
};
const drawHUD = (c, character, canvas) => {
  // HUD
  c.fillStyle = "rgba(255,215,25, 0.8)";
  c.fillText(character.gold, canvas.width - 50, 50);
};

const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = 1024;
canvas.height = 700;

c.fillRect(0, 0, canvas.width, canvas.height);

const mapTexture = new Image();
mapTexture.src = "./Sprites/background0.png";

const champ0Image = new Image();
champ0Image.src = "./Sprites/Template/Walk/walk.png";

const champ0ImageIdle = new Image();
champ0ImageIdle.src = "./Sprites/Template/Idle/idle.png";

const champ0ImagePunch1 = new Image();
champ0ImagePunch1.src = "./Sprites/Template/Punch1/punch1.png";

const champ0ImageGuard = new Image();
champ0ImageGuard.src = "./Sprites/Template/Guard/guard.png";

const champ0Jump = new Image();
champ0Jump.src = "./Sprites/Template/Jump/jump.png";

const champ0Shadow = new Image();
champ0Shadow.src = "./Sprites/Template/shadow.png";

class BackgroundSprite {
  constructor({ position, image }) {
    this.position = position;
    this.image = image;
  }
  draw() {
    c.drawImage(this.image, 0, 0);
  }
}
const background = new BackgroundSprite({
  position: { x: 0, y: 0 },
  image: mapTexture,
});

const controlState = {
  up: { pressed: false },
  down: { pressed: false },
  right: { pressed: false },
  left: { pressed: false },
  shift: { pressed: false },
  attack: { pressed: false },
  jump: { pressed: false },
  def: { pressed: false },
};

function getVerticalFrameNumberByDirection(direction) {
  if (direction === "bottom") return 1;
  if (direction === "bottomRight") return 2;
  if (direction === "right") return 3;
  if (direction === "topRight") return 4;
  if (direction === "top") return 5;
  if (direction === "topLeft") return 6;
  if (direction === "left") return 7;
  if (direction === "bottomLeft") return 8;
}

const spriteFrameSize = 156;

let currentFrame = 1;
let clientFrameHold = 0;

function animate() {
  eventsListener();
  window.requestAnimationFrame(animate);
  // Game screen
  c.fillStyle = "black";
  c.fillRect(0, 0, canvas.width, canvas.height);
  // Background
  background.draw();
  // Background filter
  /*  c.fillStyle = "rgba(255,255,255,0.1)";
  c.fillRect(0, 0, canvas.width, canvas.height); */
  // Player
  if (allPlayers.length > 0) {
    // Order players by y to have proper z-index
    allPlayers.sort((a, b) =>
      a.position.y > b.position.y ? 1 : b.position.y > a.position.y ? -1 : 0,
    );

    allPlayers.forEach((character, i) => {
      let currentPlayerSprite;
      let currFrame;
      if (character.isGuardUp) {
        currentPlayerSprite = champ0ImageGuard;
        currFrame = character.currentFrame;
      } else if (character.isAttacking) {
        currentPlayerSprite = champ0ImagePunch1;
        currFrame = character.currentFrame;
      } else if (character.isJumping) {
        currentPlayerSprite = champ0Jump;
        currFrame = character.currentFrame;
      } else if (character.isWalking || character.isRunning) {
        currentPlayerSprite = champ0Image;
        currFrame = character.currentFrame;
      } else {
        currentPlayerSprite = champ0ImageIdle;
        clientFrameHold += 1;
        if (clientFrameHold >= 10) {
          clientFrameHold = 0;
          currentFrame += 1;
          if (currentFrame >= 9) {
            currentFrame = 1;
          }
        }
        currFrame = currentFrame;
      }
      /*  // Blood
      c.strokeStyle = "rgba(155,00,25, 0.3)";
      c.rect(character.position.x, character.position.y, 15, 15);
      c.stroke(); */
      // Draw Shadow
      c.drawImage(
        champ0Shadow,
        character.position.x - champ0Shadow.width / 2,
        character.position.y - champ0Shadow.width / 2,
      );
      // Draw character
      c.drawImage(
        currentPlayerSprite,
        spriteFrameSize * currFrame - spriteFrameSize, // start drawing from 0px x of whole image when current is 1
        spriteFrameSize *
          getVerticalFrameNumberByDirection(character.lastDirection) -
          spriteFrameSize, // 0 - start drawing from 0px y of image
        spriteFrameSize, // width of single frame
        spriteFrameSize, // height of single frame
        character.position.x - spriteFrameSize / 2 + character.offset.x, // x pos on canvas - half of frame size
        character.position.y - spriteFrameSize / 2 + character.offset.y, // y pos on canvas - half
        spriteFrameSize, // width of single frame
        spriteFrameSize, // height of single frame
      );
      // HurtBox
      c.fillStyle = "rgba(55,150,255, 0.3)";
      c.fillRect(
        character.hurtBoxPosition.x,
        character.hurtBoxPosition.y,
        character.hurtBoxSize.width,
        character.hurtBoxSize.height,
      );
      // PunchBox
      c.fillStyle = "rgba(255,70,195, 0.2)";
      c.fillRect(
        character.punchBoxPosition.x,
        character.punchBoxPosition.y,
        character.punchBoxSize.width,
        character.punchBoxSize.height,
      );
      // PushingBox
      c.fillStyle = "rgba(225,250,255, 0.4)";
      c.fillRect(
        character.pushingBoxPosition.x,
        character.pushingBoxPosition.y,
        character.pushingBoxSize.width,
        character.pushingBoxSize.height,
      );
      const isEnemy = character.id !== socket.id;

      drawCharacterName(c, isEnemy, character);
      drawHpBar(c, isEnemy, character);
      drawEnergyBar(c, isEnemy, character);
      drawHUD(c, character, canvas);
    });
  }
}

// image src onload is not working?
setTimeout(() => {
  animate();
  // Automatic join-arena click
  setTimeout(() => {
    document.getElementById("join-arena").click();
  }, 500);
}, 1000);

function eventsListener() {
  let champDirection = "";
  let champMoving = false;
  let champWalking = false;
  let champRunning = false;
  if (controlState.up.pressed && controlState.left.pressed) {
    champDirection = "topLeft";
  } else if (controlState.up.pressed && controlState.right.pressed) {
    champDirection = "topRight";
  } else if (controlState.up.pressed) {
    champDirection = "top";
  } else if (controlState.down.pressed && controlState.left.pressed) {
    champDirection = "bottomLeft";
  } else if (controlState.down.pressed && controlState.right.pressed) {
    champDirection = "bottomRight";
  } else if (controlState.down.pressed) {
    champDirection = "bottom";
  } else if (controlState.left.pressed) {
    champDirection = "left";
  } else if (controlState.right.pressed) {
    champDirection = "right";
  }
  if (
    controlState.up.pressed ||
    controlState.down.pressed ||
    controlState.left.pressed ||
    controlState.right.pressed
  ) {
    champMoving = true;
    champWalking = true;
    if (controlState.shift.pressed) {
      champRunning = true;
    }
  }
  // Jump
  let champJumping;
  if (controlState.jump.pressed) {
    champJumping = true;
  }

  // Attack
  let champAttacking;
  let champPunching1;

  if (controlState.attack.pressed) {
    champAttacking = true;
    champPunching1 = true;
  }

  // Guard up
  let champIsGuarding = false;
  if (controlState.def.pressed) {
    champIsGuarding = true;
  }

  const dataToEmit = {
    champDirection,
    champMoving,
    champRunning,
    champWalking,
    champAttacking,
    champPunching1,
    champJumping,
    champIsGuarding,
  };

  // Emit only when anything is happening
  if (
    JSON.stringify(dataToEmit) === JSON.stringify(lastEmitedData) &&
    champMoving === false &&
    champWalking === false &&
    champRunning === false &&
    champIsGuarding === false
  ) {
    // TODO - player not active
  } else {
    socket.emit("controlActions", dataToEmit);
    lastEmitedData = dataToEmit;
  }
}

window.addEventListener("keydown", (e) => {
  console.log(e.keyCode);
  if (e.keyCode === 73) controlState.up.pressed = true;
  if (e.keyCode === 75) controlState.down.pressed = true;
  if (e.keyCode === 74) controlState.left.pressed = true;
  if (e.keyCode === 76) controlState.right.pressed = true;
  if (e.keyCode === 16) controlState.shift.pressed = true;
  if (e.keyCode === 90) controlState.attack.pressed = true;
  if (e.keyCode === 65) controlState.jump.pressed = true;
  if (e.keyCode === 88) controlState.def.pressed = true;
});

window.addEventListener("keyup", (e) => {
  if (e.keyCode === 73) controlState.up.pressed = false;
  if (e.keyCode === 75) controlState.down.pressed = false;
  if (e.keyCode === 74) controlState.left.pressed = false;
  if (e.keyCode === 76) controlState.right.pressed = false;
  if (e.keyCode === 16) controlState.shift.pressed = false;
  if (e.keyCode === 90) controlState.attack.pressed = false;
  if (e.keyCode === 65) controlState.jump.pressed = false;
  if (e.keyCode === 88) controlState.def.pressed = false;
});

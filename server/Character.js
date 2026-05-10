export class Character {
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

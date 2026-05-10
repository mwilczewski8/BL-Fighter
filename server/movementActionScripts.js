export class MovementActionScripts {
  static getOppositeDirection = (direction) => {
    if (direction === "left") return "right";
    if (direction === "right") return "left";
    if (direction === "top") return "bottom";
    if (direction === "bottom") return "top";
    if (direction === "topLeft") return "bottomRight";
    if (direction === "topRight") return "bottomLeft";
    if (direction === "bottomLeft") return "topRight";
    if (direction === "bottomRight") return "topLeft";
  };

  static doesCollideRect = (a, b, aJumpOffset, bJumpOffset) => {
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
  static getDiagonalFactor = () => {
    return 0.70710678118;
  };
}

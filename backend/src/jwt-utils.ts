import jwt from "jsonwebtoken";

export const generateToken = (userId: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET");
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "24h" });
};

export const verifyToken = (token: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET");
  }
  return jwt.verify(token, process.env.JWT_SECRET);
};

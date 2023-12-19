import express from "express";
import User from "./user";
import bcrypt from "bcryptjs";
import { generateToken, verifyToken } from "./jwt-utils";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    const token = generateToken(user._id.toString());
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).send("User does not exist");
    } else if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).send("Authentication failed");
    }
    const token = generateToken(user._id.toString());
    res.send({ user, token });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/account", async (req, res) => {
  try {
    const token = req.headers.token;
    if (typeof token !== "string") return res.status(401).send("Authentication failed");
    const decoded = verifyToken(token);
    if (!decoded || typeof decoded !== "object")
      return res.status(401).send("Authentication failed");
    const userId = decoded.userId;
    const user = await User.findById(userId);
    res.send(String(user?.username));
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;

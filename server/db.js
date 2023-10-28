const mongoose = require("mongoose");
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const atlasURI = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.ght2591.mongodb.net/?retryWrites=true&w=majority`;

mongoose
  .connect(atlasURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB!");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

const gameSchema = new mongoose.Schema({
  gameId: String,
  playerIdYellow: String,
  playerIdRed: String,
  nPlayersReady: Number,
  turn: String,
  pieces: Array,
  gameOver: Boolean,
});

const Game = mongoose.model("Game", gameSchema);


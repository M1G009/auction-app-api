const { io } = require("../app");
const verifyToken = require("./SecureSocket.controller");
const Players = require("../modules/User/User.model");
const Team = require("../modules/Team/Team.model");

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

function sumOfBid(data) {
  let sum = 0;
  for (const item of data) {
    sum += item.bid;
  }

  return sum;
}

let currentPlayer = null;
let bidProgress = [];
let currentList = "";

const socketApi = () =>
  io.on("connection", async (socket) => {
    try {
      let isAdmin = await verifyToken(socket);
      console.log(isAdmin ? "Admin connected" : "User Connected");

      let players = await Players.find().populate("team");
      let team = await Team.find();

      socket.emit("playersData", {
        players,
        team,
        isAdmin,
        currentPlayer,
        bidProgress,
      });

      socket.on("startbid", ({ list }) => {
        currentList = list;
        let filterPlayers = players.filter((el) => el.type == list && !el.team);
        shuffle(filterPlayers);
        shuffle(filterPlayers);

        if (filterPlayers && filterPlayers.length) {
          currentPlayer = filterPlayers[0];
          io.emit("currentPlayerBid", { currentPlayer });
        } else {
          io.emit("listcomplete", {});
        }
      });

      socket.on("raiseBid", ({ team }) => {
        if (
          bidProgress.length &&
          bidProgress[bidProgress.length - 1]?.name !== team?.name
        ) {
          let newBidProgress = [...bidProgress, { ...team, bid: 1 }];
          let totalProgressBid = sumOfBid(newBidProgress);
          if (team.totalpurse < totalProgressBid) {
            socket.emit("insufficientPurse", { team });
          } else {
            bidProgress = newBidProgress;
          }
        } else if (bidProgress.length == 0) {
          bidProgress = [...bidProgress, { ...team, bid: 2 }];
        }
        io.emit("bidProgress", { bidProgress });
      });

      socket.on("undoBid", ({}) => {
        bidProgress.pop();
        // let newBidProgress = [...bidProgress];
        // newBidProgress.pop();
        io.emit("bidProgress", { bidProgress });
      });

      socket.on("sellBid", async ({}) => {
        let playerId = currentPlayer._id;
        let finalTeam = bidProgress.length
          ? bidProgress[bidProgress.length - 1]
          : "";
        if (playerId && finalTeam && finalTeam._id) {
          let finalprice = sumOfBid(bidProgress);
          await Players.findByIdAndUpdate(playerId, {
            team: finalTeam._id,
            finalprice,
          });
          await Team.findByIdAndUpdate(finalTeam._id, {
            totalpurse: finalTeam.totalpurse - (finalprice - 2),
          });
          players = await Players.find().populate("team");
          team = await Team.find();
          currentPlayer = null;
          bidProgress = [];

          let filterPlayers = players.filter(
            (el) => el.type == currentList && !el.team
          );
          shuffle(filterPlayers);
          shuffle(filterPlayers);

          if (filterPlayers && filterPlayers.length) {
            currentPlayer = filterPlayers[0];
            io.emit("nextPlayerData", {
              players,
              team,
              currentPlayer,
              bidProgress,
            });
          } else {
            currentList = "";
            io.emit("nextPlayerData", {
              players,
              team,
              currentPlayer,
              bidProgress,
            });
          }
        }
      });

      ////////////////////////////////////
    } catch (error) {
      socket.emit("errorMessage", {
        message: error.message,
      });
    }
  });
io.on("error", (error) => {
  console.log("a user connected", error.message);
});
module.exports = socketApi;

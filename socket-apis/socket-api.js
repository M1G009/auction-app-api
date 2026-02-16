const { io } = require("../app");
const verifyToken = require("./SecureSocket.controller");
const PlayersModel = require("../modules/User/User.model");
const TeamModel = require("../modules/Team/Team.model");
const AuctionSettingModel = require("../modules/AuctionSetting/AuctionSetting.model");

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array.sort((a, b) => a.rank - b.rank);
}

function sumOfBid(data) {
  let sum = 0;
  for (const item of data) {
    sum += Number(item.bid) || 0;
  }

  return sum;
}

let currentPlayer = null;
let bidProgress = [];
let unsoldPlayers = [];
let players = [];
let team = [];
let auctionSetting = {};

const socketApi = () =>
  io.on("connection", async (socket) => {
    try {
      const resetPlayersAndTeam = async () => {
        players = await PlayersModel.find().sort({ playerNumber: 1, _id: 1 }).populate("team");
        team = await TeamModel.find();
      };
      await resetPlayersAndTeam();
      let isAdmin = await verifyToken(socket);

      auctionSetting = await AuctionSettingModel.findOne();

      socket.emit("isAdmin", { isAdmin });

      socket.emit("playersData", {
        players,
        team,
        isAdmin,
        currentPlayer,
        bidProgress,
        auctionSetting,
      });

      function createRandomPlayerBid() {
        currentPlayer = null;
        bidProgress = [];
        shuffle(players);
        let filterPlayers = [...players].filter(
          (el) =>
            el.type == "Player" &&
            !el.team &&
            !unsoldPlayers.includes(el._id.toString())
        );

        if (filterPlayers && filterPlayers.length) {
          currentPlayer = filterPlayers[0];
          io.emit("newBid", {
            players,
            team,
            currentPlayer,
            bidProgress,
          });
        } else {
          io.emit("listcomplete", {});
          unsoldPlayers = [];
          currentPlayer = null;
          bidProgress = [];
        }
      }

      socket.on("newBid", () => {
        createRandomPlayerBid();
      });

      socket.on("selectPlayerByNumber", ({ playerNumber }) => {
        const num = Number(playerNumber);
        if (isNaN(num) || num < 1) {
          socket.emit("errorMessage", { message: "Invalid player number" });
          return;
        }
        const filterPlayers = [...players].filter(
          (el) =>
            el.type == "Player" &&
            !el.team &&
            !unsoldPlayers.includes(el._id.toString())
        );
        const found = filterPlayers.find(
          (el) => el.playerNumber != null && Number(el.playerNumber) === num
        );
        if (!found) {
          socket.emit("errorMessage", {
            message: "Player not found or already sold",
          });
          return;
        }
        currentPlayer = found;
        bidProgress = [];
        io.emit("newBid", {
          players,
          team,
          currentPlayer,
          bidProgress,
        });
      });

      socket.on("resumeBid", () => {
        io.emit("newBid", {
          players,
          team,
          currentPlayer,
          bidProgress,
        });
      });

      socket.on("raiseBid", ({ team }) => {
        const incrementAmount = auctionSetting?.bidIncrement || 1;
        const teamId = team?._id || team?.id || null;

        if (bidProgress.length === 0) {
          bidProgress = [{ bid: auctionSetting?.startBid || 1, teamId }];
        } else {
          bidProgress = [...bidProgress, { bid: incrementAmount, teamId }];
        }

        io.emit("bidProgress", { bidProgress });
      });

      socket.on("undoBid", ({}) => {
        bidProgress.pop();
        io.emit("bidProgress", { bidProgress });
      });

      socket.on("unSoldBid", async ({}) => {
        if (currentPlayer && currentPlayer._id) {
          await PlayersModel.findByIdAndUpdate(currentPlayer._id, { type: "Unsold" });
          unsoldPlayers.push(currentPlayer._id.toString());
        }
        bidProgress = [];
        currentPlayer = null;
        await resetPlayersAndTeam();
        io.emit("playersData", {
          players,
          team,
          isAdmin,
          currentPlayer,
          bidProgress,
          auctionSetting,
        });
      });

      socket.on("sellBid", async ({ team }) => {
        let playerId = currentPlayer._id;
        
        if (!playerId || !team || !team._id) {
          socket.emit("sellError", { message: "Invalid player or team" });
          return;
        }
        
          let finalprice = sumOfBid(bidProgress);
        
        // Check if team can afford
        const teamData = await TeamModel.findById(team._id);
        if (!teamData) {
          socket.emit("sellError", { message: "Team not found" });
          return;
        }
        
        const finalpriceNum = Math.round(Number(finalprice) * 100) / 100;
        const totalpurseNum = Math.round(Number(teamData.totalpurse) * 100) / 100;
        if (finalpriceNum > totalpurseNum) {
          socket.emit("insufficientPurse", { team });
          return;
        }
        
          await PlayersModel.findByIdAndUpdate(playerId, {
          team: team._id,
            finalprice: finalpriceNum,
          });
        
          await TeamModel.findByIdAndUpdate(team._id, {
          totalpurse: teamData.totalpurse - finalpriceNum,
          });
        
          players = await PlayersModel.find().sort({ playerNumber: 1, _id: 1 }).populate("team");
          team = await TeamModel.find();
          currentPlayer = null;
          bidProgress = [];
        
        io.emit("playersData", {
          players,
          team,
          isAdmin,
          currentPlayer,
          bidProgress,
          auctionSetting,
        });
      });

      socket.on("updateSetting", async ({ data }) => {
        console.log("data", data);
        auctionSetting = await AuctionSettingModel.findOneAndUpdate({}, data, {
          upsert: true,
        });
        console.log("data", auctionSetting);
      });

      socket.on("resetPlayerAndAmountHandler", async ({}) => {
        await PlayersModel.updateMany(
          { type: { $in: ["Player", "Unsold"] } },
          { team: null, finalprice: 0, type: "Player" }
        );
        await TeamModel.updateMany({}, { totalpurse: 100 });
        unsoldPlayers = [];
        bidProgress = [];
        await resetPlayersAndTeam();
        currentPlayer = null;
        socket.emit("playersData", {
          players,
          team,
          isAdmin,
          currentPlayer,
          bidProgress,
          auctionSetting,
        });
      });

      socket.on("resetCaptainHandler", async ({}) => {
        await PlayersModel.updateMany(
          { type: "Captain" },
          { team: null, finalprice: 0, type: "Player" }
        );
        await resetPlayersAndTeam();
        currentPlayer = null;
        socket.emit("playersData", {
          players,
          team,
          isAdmin,
          currentPlayer,
          bidProgress,
          auctionSetting,
        });
      });

      socket.on("resetIconPlayersHandler", async ({}) => {
        await PlayersModel.updateMany(
          { type: "IconPlayer" },
          { team: null, finalprice: 0, type: "Player" }
        );
        await resetPlayersAndTeam();
        currentPlayer = null;
        socket.emit("playersData", {
          players,
          team,
          isAdmin,
          currentPlayer,
          bidProgress,
          auctionSetting,
        });
      });

      socket.on("resetPlayerNumbersHandler", async ({}) => {
        const list = await PlayersModel.find().sort({ playerNumber: 1, createdAt: 1, _id: 1 }).lean();
        for (let i = 0; i < list.length; i++) {
          await PlayersModel.findByIdAndUpdate(list[i]._id, { playerNumber: i + 1 });
        }
        await resetPlayersAndTeam();
        socket.emit("playersData", {
          players,
          team,
          isAdmin,
          currentPlayer,
          bidProgress,
          auctionSetting,
        });
      });

      socket.on("resetSinglePlayer", async ({ playerId }) => {
        if (!playerId) {
          socket.emit("errorMessage", { message: "Invalid player" });
          return;
        }
        await PlayersModel.findByIdAndUpdate(playerId, { team: null, finalprice: 0 });
        await resetPlayersAndTeam();
        const resetPlayer = players.find((p) => p._id.toString() === playerId.toString());
        if (resetPlayer) {
          currentPlayer = resetPlayer;
          bidProgress = [];
          io.emit("newBid", {
            players,
            team,
            currentPlayer,
            bidProgress,
          });
        } else {
          socket.emit("playersData", {
            players,
            team,
            isAdmin,
            currentPlayer,
            bidProgress,
            auctionSetting,
          });
        }
      });
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

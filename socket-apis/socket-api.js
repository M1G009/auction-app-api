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

  // Find the index of "jay" in the shuffled array
  const jayIndex = array.findIndex(
    (item) => item.name === "Jay Jagdishbhai Godhani"
  );

  // If "jay" is found, move it to the end of the array
  if (jayIndex !== -1) {
    const jayElement = array.splice(jayIndex, 1)[0]; // Remove "jay" from its current position
    array.push(jayElement); // Push "jay" to the end of the array
  }

  // Find the index of "jay" in the shuffled array
  const ramIndex = array.findIndex((item) => item.name === "Ashish Godhani");

  // If "jay" is found, move it to the end of the array
  if (ramIndex !== -1) {
    const jayElement = array.splice(ramIndex, 1)[0]; // Remove "jay" from its current position
    array.push(jayElement); // Push "jay" to the end of the array
  }

  // Find the index of "jay" in the shuffled array
  const neelIndex = array.findIndex(
    (item) => item.name === "Zeel Bharatbhai Savaliya"
  );

  // If "jay" is found, move it to the end of the array
  if (neelIndex !== -1) {
    const jayElement = array.splice(neelIndex, 1)[0]; // Remove "jay" from its current position
    array.push(jayElement); // Push "jay" to the end of the array
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
let unsoldPlayers = [];
let players = [];
let team = [];
let auctionSetting = {};

const socketApi = () =>
  io.on("connection", async (socket) => {
    try {


      const resetPlayersAndTeam = async () => {
        players = await PlayersModel.find().populate("team");
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

      socket.on("resumeBid", () => {
        io.emit("newBid", {
          players,
          team,
          currentPlayer,
          bidProgress,
        });
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
        io.emit("bidProgress", { bidProgress });
      });

      socket.on("unSoldBid", ({}) => {
        unsoldPlayers.push(currentPlayer._id.toString());
        bidProgress = [];
        createRandomPlayerBid();
      });

      socket.on("sellBid", async ({}) => {
        let playerId = currentPlayer._id;
        let finalTeam = bidProgress.length
          ? bidProgress[bidProgress.length - 1]
          : "";
        if (playerId && finalTeam && finalTeam._id) {
          let finalprice = sumOfBid(bidProgress);
          await PlayersModel.findByIdAndUpdate(playerId, {
            team: finalTeam._id,
            finalprice,
          });
          await TeamModel.findByIdAndUpdate(finalTeam._id, {
            totalpurse: finalTeam.totalpurse - finalprice,
          });
          players = await PlayersModel.find().populate("team");
          team = await TeamModel.find();
          currentPlayer = null;
          bidProgress = [];
          createRandomPlayerBid();
        }
      });

      socket.on("updateSetting", async ({ data }) => {
        console.log("data", data);
        auctionSetting = await AuctionSettingModel.findOneAndUpdate({}, data, {
          upsert: true,
        });
        console.log("data", auctionSetting);
      });

      socket.on("resetPlayerAndAmountHandler", async ({}) => {
        await PlayersModel.updateMany({type: "Player"}, { team: null, finalprice: 0, type: "Player" });
        await TeamModel.updateMany({}, { totalpurse: 100 });
        await resetPlayersAndTeam();
        currentPlayer = null
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
        await PlayersModel.updateMany({type: "Captain"}, { team: null, finalprice: 0, type: "Player" });
        await resetPlayersAndTeam();
        currentPlayer = null
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
        await PlayersModel.updateMany({type: "IconPlayer"}, { team: null, finalprice: 0, type: "Player" });
        await resetPlayersAndTeam();
        currentPlayer = null
        socket.emit("playersData", {
          players,
          team,
          isAdmin,
          currentPlayer,
          bidProgress,
          auctionSetting,
        });
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

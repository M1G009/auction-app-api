const Team = require("./Team.model");

exports.AllTeams = async function (req, res, next) {
  try {
    // req.body.
    let allTeamsData = await Team.find().populate(["owner", "captain"]);

    res.status(200).json({
      status: "success",
      message: "Team find successful",
      data: allTeamsData,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.TeamCreate = async function (req, res, next) {
  try {
    // req.body.
    let newTeam = await Team.insertMany(req.body);

    res.status(201).json({
      status: "success",
      message: "Team create successful",
      data: newTeam,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.TeamUpdate = async function (req, res, next) {
  try {
    // req.body.name
    await Team.findByIdAndUpdate(req.params.id, req.body);

    res.status(201).json({
      status: "success",
      message: "Team update successful",
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

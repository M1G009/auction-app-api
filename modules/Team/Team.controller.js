const Team = require("./Team.model");

exports.AllTeams = async function (req, res, next) {
  try {
    // req.body.
    let allTeamsData = await Team.find();

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
    // Handle both array (bulk) and single object
    let teamData = Array.isArray(req.body) ? req.body : [req.body];
    
    // If file is uploaded, add filename to all teams in the array
    if (req.file) {
      teamData = teamData.map(team => ({
        ...team,
        logo: req.file.filename
      }));
    }

    let newTeam = await Team.insertMany(teamData);

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
    const updateData = { ...req.body };
    
    // If file is uploaded, update logo filename
    if (req.file) {
      updateData.logo = req.file.filename;
    }

    await Team.findByIdAndUpdate(req.params.id, updateData);

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

exports.TeamDelete = async function (req, res, next) {
  try {
    let deletedTeam = await Team.findByIdAndDelete(req.params.id);

    if (!deletedTeam) {
      return res.status(404).json({
        status: "fail",
        message: "Team not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Team deleted successfully",
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

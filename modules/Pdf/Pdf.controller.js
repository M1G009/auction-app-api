const USER = require("../User/User.model");
const Team = require("../Team/Team.model");
const { jsPDF } = require("jspdf");
const path = require("path");
const fs = require("fs");

function getImageDataUrl(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === ".png" ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

exports.remainingPlayersPdf = async (req, res) => {
  try {
    const players = await USER.find().sort({ playerNumber: 1, _id: 1 }).populate("team");
    const remaining = players.filter(p => !p.team).sort((a, b) => (a.playerNumber || 0) - (b.playerNumber || 0));

    if (!remaining.length) {
      return res.status(400).json({ status: "fail", message: "No remaining players to list." });
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 10;
    const cardW = (pageW - margin * 3) / 2;
    const cardH = 42;
    const pad = 4;
    const imgW = 18;
    const imgH = 18;
    const textX = pad + imgW + 2;
    const lineH = 5;
    const cardsPerPage = 2 * Math.floor((pageH - margin * 2) / (cardH + margin));
    const publicPath = path.join(__dirname, "../../public/player");

    doc.setFontSize(10);
    for (let idx = 0; idx < remaining.length; idx++) {
      const player = remaining[idx];
      if (idx > 0 && idx % cardsPerPage === 0) doc.addPage();
      const cardOnPage = idx % cardsPerPage;
      const col = cardOnPage % 2;
      const row = Math.floor(cardOnPage / 2);
      const x = margin + col * (cardW + margin);
      const y = margin + row * (cardH + margin);
      doc.setDrawColor(200, 200, 200);
      doc.rect(x, y, cardW, cardH);
      if (player.photo) {
        const fullPath = path.join(publicPath, player.photo);
        const dataUrl = getImageDataUrl(fullPath);
        if (dataUrl) {
          const format = dataUrl.indexOf("image/png") !== -1 ? "PNG" : "JPEG";
          doc.addImage(dataUrl, format, x + pad, y + pad, imgW, imgH);
        }
      }
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`No: ${player.playerNumber ?? "-"}`, x + textX, y + pad + lineH);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${player.name || "-"}`, x + textX, y + pad + lineH * 2);
      doc.text(`Batsman: ${player.batstyle ? "Yes" : "No"}`, x + textX, y + pad + lineH * 3);
      doc.text(`Bowler: ${player.bowlstyle ? "Yes" : "No"}`, x + textX, y + pad + lineH * 4);
      doc.text(`Wicket Keeper: ${player.wicketkeeper ? "Yes" : "No"}`, x + textX, y + pad + lineH * 5);
    }

    const buffer = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=remaining-players.pdf");
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

exports.teamWisePdf = async (req, res) => {
  try {
    const teams = await Team.find();
    const players = await USER.find().sort({ playerNumber: 1, _id: 1 }).populate("team");

    if (!teams.length) {
      return res.status(400).json({ status: "fail", message: "No teams to list." });
    }

    const typeOrder = ["Captain", "IconPlayer", "Player", "Unsold"];
    const getTeamPlayers = (team) =>
      players.filter(p => p.team && (p.team._id?.toString() === team._id.toString() || p.team.toString() === team._id.toString()));
    const colW = [12, 50, 32, 45, 22, 25];
    const rowH = 7;
    const headerH = 8;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageH = doc.internal.pageSize.getHeight();
    let y = 10;
    doc.setFontSize(10);

    teams.forEach((team, teamIdx) => {
      const teamPlayers = getTeamPlayers(team).sort((a, b) => {
        const ai = typeOrder.indexOf(a.type || "Player");
        const bi = typeOrder.indexOf(b.type || "Player");
        if (ai !== bi) return ai - bi;
        return (a.playerNumber || 0) - (b.playerNumber || 0);
      });
      if (y > 10 && y + headerH + rowH * (teamPlayers.length + 1) > pageH - 10) {
        doc.addPage();
        y = 10;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(team.name || `Team ${teamIdx + 1}`, 10, y);
      y += headerH;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const headers = ["No", "Name", "Mobile", "T-Shirt Name", "T-Shirt Size", "T-Shirt No"];
      let x = 10;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      headers.forEach((h, i) => {
        doc.setFont("helvetica", "bold");
        doc.rect(x, y - 5, colW[i], rowH);
        doc.text(h, x + 2, y);
        x += colW[i];
      });
      y += rowH;
      teamPlayers.forEach((player, playerIdx) => {
        if (y + rowH > pageH - 10) {
          doc.addPage();
          y = 10;
        }
        x = 10;
        const cells = [
          String(playerIdx + 1),
          (player.name || "-").substring(0, 24),
          (player.mobile || "-").substring(0, 14),
          (player.tshirtName || "-").substring(0, 20),
          (player.tshirtSize || "-").substring(0, 10),
          (player.tshirtNumber || "-").substring(0, 10)
        ];
        cells.forEach((cell, i) => {
          doc.rect(x, y - 5, colW[i], rowH);
          doc.text(cell, x + 2, y);
          x += colW[i];
        });
        y += rowH;
      });
      y += rowH;
    });

    const remaining = players.filter(p => !p.team).sort((a, b) => (a.playerNumber || 0) - (b.playerNumber || 0));
    if (remaining.length) {
      if (y > 10 && y + headerH + rowH * (remaining.length + 1) > pageH - 10) {
        doc.addPage();
        y = 10;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Remaining", 10, y);
      y += headerH;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const headers = ["No", "Name", "Mobile", "T-Shirt Name", "T-Shirt Size", "T-Shirt No"];
      let x = 10;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      headers.forEach((h, i) => {
        doc.setFont("helvetica", "bold");
        doc.rect(x, y - 5, colW[i], rowH);
        doc.text(h, x + 2, y);
        x += colW[i];
      });
      y += rowH;
      remaining.forEach((player, playerIdx) => {
        if (y + rowH > pageH - 10) {
          doc.addPage();
          y = 10;
        }
        x = 10;
        const cells = [
          String(player.playerNumber ?? playerIdx + 1),
          (player.name || "-").substring(0, 24),
          (player.mobile || "-").substring(0, 14),
          (player.tshirtName || "-").substring(0, 20),
          (player.tshirtSize || "-").substring(0, 10),
          (player.tshirtNumber || "-").substring(0, 10)
        ];
        cells.forEach((cell, i) => {
          doc.rect(x, y - 5, colW[i], rowH);
          doc.text(cell, x + 2, y);
          x += colW[i];
        });
        y += rowH;
      });
    }

    const buffer = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=all-teams-players.pdf");
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

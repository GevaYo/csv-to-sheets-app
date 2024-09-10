import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { fileURLToPath } from "url";
import { authorize, appendToSheet, createSheet } from "./googleSheets.mjs";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = process.env.CREDENTIALS_PATH || "credentials.json";
const PORT = process.env.PORT || 5000;
let oAuth2Client;

// Enable CORS
app.use(cors());

fs.readFile(CREDENTIALS_PATH, (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  authorize(JSON.parse(content)).then((client) => {
    oAuth2Client = client;
  });
});

app.use(express.static("public"));

app.get("/oauth2callback", (req, res) => {
  const code = req.query.code;
  if (code) {
    exchangeAuthorizationCode(oAuth2Client, code)
      .then((client) => {
        oAuth2Client = client;
        res.send("Authorization successful! You can now use the application.");
      })
      .catch((err) => {
        console.error("Error exchanging authorization code:", err);
        res.status(500).send("Error exchanging authorization code");
      });
  } else {
    res.status(400).send("Authorization code is missing");
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!oAuth2Client) {
    return res
      .status(401)
      .send(
        "Authorization required. Please visit the /oauth2callback endpoint to authorize."
      );
  }

  const filePath = path.join(__dirname, req.file.path);
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

  let data = [];
  let dates = [];
  let headers = null;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("headers", (headerList) => {
      headers = headerList;
    })
    .on("data", (row) => {
      data.push(Object.values(row));
      dates.push(row["Transaction Date"]);
    })
    .on("end", async () => {
      if (dates.length === 0) {
        res.status(400).send("No transaction dates found");
        return;
      }

      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      console.log(startDate, endDate);
      const sheetTitle = `${startDate || "No Start Date"} - ${
        endDate || "No End Date"
      }`;

      if (headers) {
        data.unshift(headers);
      }

      try {
        await createSheet(spreadsheetId, sheetTitle, oAuth2Client);
        appendToSheet(spreadsheetId, sheetTitle, data, oAuth2Client, res);
      } catch (err) {
        res.status(500).send("Error creating sheet");
      }
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

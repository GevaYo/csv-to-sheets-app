import { google } from "googleapis";
import fs from "fs";
import readline from "readline";

const TOKEN_PATH = process.env.TOKEN_PATH || "token.json";

export async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  return new Promise((resolve, reject) => {
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) {
        return getNewToken(oAuth2Client)
          .then((client) => resolve(client))
          .catch((err) => reject(err));
      }
      oAuth2Client.setCredentials(JSON.parse(token));
      resolve(oAuth2Client);
    });
  });
}

function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  console.log("Authorize this app by visiting this url:", authUrl);

  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Enter the code from that page here: ", (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return reject("Error retrieving access token", err);
        oAuth2Client.setCredentials(token);
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return reject(err);
          console.log("Token stored to", TOKEN_PATH);
        });
        resolve(oAuth2Client);
      });
    });
  });
}

export async function createSheet(spreadsheetId, sheetTitle, authClient) {
  const sheets = google.sheets({ version: "v4", auth: authClient });

  const request = {
    spreadsheetId: spreadsheetId,
    resource: {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetTitle,
            },
          },
        },
      ],
    },
  };

  try {
    const response = await sheets.spreadsheets.batchUpdate(request);
    console.log("Sheet created:", response.data.replies[0].addSheet.properties);
    return response.data.replies[0].addSheet.properties.sheetId;
  } catch (err) {
    if (err.message.includes("already exists")) {
      console.log(
        `Sheet "${sheetTitle}" already exists. Fetching existing sheet.`
      );
      // Fetch the existing sheet
      const sheetsResponse = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
        fields: "sheets.properties",
      });
      const existingSheet = sheetsResponse.data.sheets.find(
        (sheet) => sheet.properties.title === sheetTitle
      );
      if (existingSheet) {
        return existingSheet.properties.sheetId;
      }
    }
    console.error("Error creating sheet:", err);
    throw err;
  }
}

export function appendToSheet(spreadsheetId, sheetName, data, authClient, res) {
  const sheets = google.sheets({ version: "v4", auth: authClient });

  const resource = {
    values: data,
  };
  sheets.spreadsheets.values.append(
    {
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      resource: resource,
    },
    (err, result) => {
      if (err) {
        console.error("Error appending data:", err);
        res.status(500).send("Error appending data");
        return;
      }
      res.send("CSV data appended successfully");
    }
  );
}

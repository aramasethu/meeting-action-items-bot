const express = require("express");
const { executePythonScript } = require("./ragLoad");
const axios = require("axios");
const config = require("../config");
const {
    preprocessGoogleMeetTranscript,
    cleanUpTranscript,
    extractActionItems,
  } = require("../utils");
const { sendEvent } = require("../events");
const router = express.Router();
const fs = require('fs').promises;
router.post("/status_change", async (req, res) => {
  const { data } = req.body;
  console.log("Here is the meeting date", data.status.created_at);
  res.status(200).send("OK");

  if (data.status.code === "done") {
    try {

      const meetingDateTime = data.status.created_at;
      const formattedDateTime = new Date(meetingDateTime).toLocaleString(); 
      const transcriptResponse = await axios.get(
              `https://${config.recallRegion}.recall.ai/api/v1/bot/${data.bot_id}/transcript`,
              {
                headers: {
                  Authorization: `Token ${config.recallApiKey}`,
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
              }
            );
      const transcript = transcriptResponse.data;
      const preprocessedTranscript = preprocessGoogleMeetTranscript(transcript);
      console.log("transcript precleaned");
      const cleanTranscript = await cleanUpTranscript(preprocessedTranscript);
      console.log("transcript cleaned");
      const actionItems = await extractActionItems(cleanTranscript);
      console.log("transcript action items", actionItems);
      sendEvent(actionItems);
      const inputData = {
        meeting_id: data.bot_id, 
        transcript: cleanTranscript,
        meetingDateTime: formattedDateTime,
      };

      await executePythonScript(inputData);
    } catch (error) {
      console.error(error);
      sendEvent({ error: "Error extracting action items" });
    }
  }
});

module.exports = router;
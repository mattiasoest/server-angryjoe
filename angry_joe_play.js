handlers.sendHighScore = function (args, context) {
    var score = args.score;
    var now = Date.now();

    // Spawn timer, 1, rest 1.26, 0.7 death animation
    // These are exact number then we will have some request time etc
    var minTimeValueSeconds = 1 + (1.26 * score) + 0.7;
    var continueCount = 6;
    var videoAd = 20; // Test add is 10 seconds, double the value to be safe
    // Client side wont allow users watching the add over 2 minutes and then continue
    // so we can have a decent time 'window' to prevent cheating
    // This way ppl can only gain 50-100 extra points by cheating we should
    // NOT see weird values like 999999 in the leaderboards
    var videoAdCap = 90; //
    var maxTimeValueSeconds = minTimeValueSeconds + continueCount + videoAd + videoAdCap;

    var playerData = server.GetUserInternalData({
        PlayFabId: currentPlayerId,
        Keys: ["start_timestamp"]
    });

    var startGameTimestamp = playerData.Data["start_timestamp"].Value;
    if (startGameTimestamp && startGameTimestamp !== -1) {
        var gameTimeSeconds = (now - startGameTimestamp) / 1000;

        if (gameTimeSeconds < minTimeValueSeconds || gameTimeSeconds > maxTimeValueSeconds) {
            resetStartGameStamp();
            sendFailedEvent(score, gameTimeSeconds);
            return { messageValue: `Failed to update!` };
        }
    } else {
        sendFailedEvent(score, gameTimeSeconds);
        return { messageValue: `Failed to update! Invalid params.` };
    }

    resetStartGameStamp();

    // Everything ok, update the score
    var requestGlobal = {
        PlayFabId: currentPlayerId, Statistics: [{
            StatisticName: "highscore",
            Value: score
        }]
    };

    var requestWeekly = {
        PlayFabId: currentPlayerId, Statistics: [{
            StatisticName: "highscore_weekly",
            Value: score
        }]
    };

    server.UpdatePlayerStatistics(requestGlobal);
    server.UpdatePlayerStatistics(requestWeekly);

    return { messageValue: `Updated score: ${score}` };
}


handlers.startGame = function (args, context) {
    server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,
        Data: {
            start_timestamp: Date.now()
        }
    });

    return { messageValue: "Game started!" };
};

function resetStartGameStamp() {
    server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,
        Data: {
            start_timestamp: -1
        }
    });
}

function sendFailedEvent(score, gameTimeSeconds) {
    server.WritePlayerEvent({
        PlayFabId: currentPlayerId,
        EventName: "failed_update_highscore",
        Body: {
            score,
            gameTime: gameTimeSeconds
        }
    });
}
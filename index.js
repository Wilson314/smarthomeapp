const linebot = require('linebot');
const express = require('express');
const path = require('path');
const firebase = require("firebase");
const PROJECT_ID = "line-355ac";
const API_KEY = "AIzaSyDhhbg1Y5Cb9XCjA2qmZTkeJ9LroEqJYeg";
firebase.initializeApp({
    apiKey: API_KEY,
    authDomain: PROJECT_ID + ".firebaseapp.com",
    databaseURL: "https://" + PROJECT_ID + ".firebaseio.com",
    storageBucket: PROJECT_ID + ".appspot.com",
});
const db = firebase.database();
require("webduino-js");
require("webduino-blockly");
var relay;
var temperature = 0;
var humidity = 0;


boardReady({board: 'Smart', device: '10VBGBkQ', transport: 'mqtt'}, function (board) {
    board.systemReset();
    board.samplingInterval = 50;
    dht = getDht(board, 14);
    relay = getRelay(board, 16);
    relay.off();
    dht.read(function (evt) {
        temperature = dht.temperature;
        humidity = dht.humidity;
    }, 1000);
});

const bot = linebot({
    channelId: '1607674263',
    channelSecret: 'd039147ed525e880e089f137f57a21ef',
    channelAccessToken: 'Em0bkuwt5wloUjd2SJP6CziQwRaSlygnnTUUMT5JBB2KorpqBRLoX9q+bzotBEWxOztd6IFFIEjDhmhqQw1gLKtsx46wOo7YoPSLhUDQPkSDBo9/Es03JcfjYTl4ZAuH+MeWfEhOLYfqGugHlQoYowdB04t89/1O/w1cDnyilFU='
});

bot.on('postback', function (event) {
    let json = JSON.parse(event.postback.data);
    switch (json.TYPE) {
        case "RELAY":
            if (json.DATA) {
                event.reply("已開燈");
                relay.on();
            } else {
                event.reply("已關燈");
                relay.off();
            }
            break;
    }
});

const message = {
    "開燈": function (event) {
        relay.on();
        event.reply("已開燈");
    },
    "關燈": function (event) {
        relay.off();
        event.reply("已關燈");
    },
    "溫濕度": function (event) {
        event.reply("溫度：" + temperature + "度,濕度：" + humidity + "%");
    }
};

bot.on('message', function (event) {
    let requestMessage = event.message.text;
    if (message[requestMessage]) {
        message[requestMessage](event);
    } else {
        let lineid = event.source.userId;
        let ref = db.ref("/" + requestMessage);
        ref.once("value", function (snapshot) {
            let respone = "";
            if (snapshot.val()) {
                respone = snapshot.val();
            } else {
                respone = "我不懂你說的 [" + requestMessage + "]";
            }
            bot.push(lineid, respone);
        });
    }
});

bot.on('beacon', function (event) {
    let text = "";
    let enter = false;
    switch (event.beacon.type) {
        case "enter":
            text = "確定要開燈?";
            enter = true;
            break;
        case "leave":
            text = "確定要關燈?";
            enter = false;
            break;
        default:
            event.reply("我壞掉了");
            return;
    }
    event.reply({
        "type": "text",
        "text": text,
        "quickReply": {
            "items": [
                {
                    "type": "action",
                    "action": {
                        "type": "postback",
                        "label": "是",
                        "data": JSON.stringify({TYPE: "RELAY", DATA: (enter ? true : false)})
                    }
                },
                {
                    "type": "action",
                    "action": {
                        "type": "postback",
                        "label": "否",
                        "data": JSON.stringify({TYPE: "RELAY", DATA: (enter ? false : true)})
                    }
                }
            ]
        }
    });
});
const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

const server = app.listen(process.env.PORT || 8080, function () {
    let port = server.address().port;
    console.log("App now running on port", port);
});

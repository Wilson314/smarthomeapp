var linebot = require('linebot');
var express = require('express');
var path = require('path');
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

var bot = linebot({
    channelId: '1607674263',
    channelSecret: 'd039147ed525e880e089f137f57a21ef',
    channelAccessToken: 'Em0bkuwt5wloUjd2SJP6CziQwRaSlygnnTUUMT5JBB2KorpqBRLoX9q+bzotBEWxOztd6IFFIEjDhmhqQw1gLKtsx46wOo7YoPSLhUDQPkSDBo9/Es03JcfjYTl4ZAuH+MeWfEhOLYfqGugHlQoYowdB04t89/1O/w1cDnyilFU='
});

var message = {
    "你好": function (event) {
        event.reply("我不好");
    },
    "你是誰": function (event) {
        event.reply("我是器人");
    },
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

bot.on('postback', function (event) {
    var json = JSON.parse(event.postback.data);
    switch (json.TYPE) {
        case "RELAY":
            if(json.DATA){
                event.reply("已開燈");
                relay.on();
            }else{
                event.reply("已關燈");
                relay.off();
            }
            break;
    }
});

bot.on('message', function (event) {
    var requestMessage = event.message.text;
    if (message[requestMessage]) {
        message[requestMessage](event);
    } else {
        event.reply("我不懂你說的 [" + requestMessage + "]");
    }
});

bot.on('beacon', function (event) {
    var text = "";
    var enter = false;
    switch (event.beacon.type) {
        case "enter":
            relay.on();
            return;
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
                        "data": JSON.stringify({TYPE:"RELAY",DATA: (enter ? true : false)})
                    }
                },
                {
                    "type": "action",
                    "action": {
                        "type": "postback",
                        "label": "否",
                        "data": JSON.stringify({TYPE:"RELAY",DATA: (enter ? false : true)})
                    }
                }
            ]
        }
    });
});
const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});

var linebot = require('linebot');
var express = require('express');
var path = require('path');
require("webduino-js"); //+
require("webduino-blockly");    //+
var relay;    //+

boardReady({board: 'Smart', device: '10VBGBkQ', transport: 'mqtt'}, function (board) {
    board.systemReset();    //+
    board.samplingInterval = 50;    //+
    relay = getRelay(board, 11);    //+
    relay.off();    //+
});    //+

var bot = linebot({
    channelId: '1607674263',
    channelSecret: 'd039147ed525e880e089f137f57a21ef',
    channelAccessToken: 'Em0bkuwt5wloUjd2SJP6CziQwRaSlygnnTUUMT5JBB2KorpqBRLoX9q+bzotBEWxOztd6IFFIEjDhmhqQw1gLKtsx46wOo7YoPSLhUDQPkSDBo9/Es03JcfjYTl4ZAuH+MeWfEhOLYfqGugHlQoYowdB04t89/1O/w1cDnyilFU='
});

var message = {
    "你好":"我不好",
    "你是誰":"我是ㄐ器人"
};

bot.on('message', function (event) {
    var respone;
    if(message[event.message.text]){
        respone = message[event.message.text];
    }else{
        //+
		if(event.message.text == '開燈'){
            relay.on();    //+
            respone = '已開燈';    //+
		}else if(event.message.text == '關燈'){
            relay.off();    //+
            respone = '已關燈';    //+
		}else{
            respone = '我不懂你說的 ['+event.message.text+']';
        }
    }
	console.log(event.message.text + ' -> ' + respone);
    bot.reply(event.replyToken, respone);
});

const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});

var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");

// var mongo = require("mongodb");
// var MongoClient = require("mongodb").MongoClient;
// var url = 'mongodb://greenblatt:kinesis1717!@hafscluster-shard-00-00-cyacf.mongodb.net:27017,hafscluster-shard-00-01-cyacf.mongodb.net:27017,hafscluster-shard-00-02-cyacf.mongodb.net:27017/mbot?ssl=true&replicaSet=hafsCluster-shard-0&authSource=admin'

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000));

app.get("/", function (req, res){
  res.send("Deployed!");
});


app.get("/webhook", function (req, res) {
  if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
    console.log("Verified webhook");
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    console.error("Verification failed. The tokens do not ma tch.");
    res.sendStatus(403);
  }
});

app.post('/webhook', function (req, res) {
  var data = req.body;

  if (data.object === 'page') {

    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if(event.postback){
          receivedPostback(event);
        }
        else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;
  var messageText = message.text;
  var messageAttachments = message.attachments;


  if (messageText) {
    switch (messageText) {

      default:
        if (messageText.indexOf('안녕')) {
          sendTextMessage(senderID, "안녕! 만나서 반가워!");
        }
        sendTextMessage(senderID, "뭐라고?")
        break;
    }

  } else if (messageAttachments) {
    sendTextMessage(senderID, "워우 라이크 감사합니다");
  }
}


function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  var payload = event.postback.payload;


  if(payload){
    switch(payload){

      case "Get Started":
        sendTextMessage(senderID, "이봐 자네");
        delayText(senderID, "(콜록)", 1000);
                break;
      default:
        break;
    }
  }
}

function delayText(senderID, say, time){
  setTimeout(function() {sendTextMessage(senderID, say);}, time);
}


function sendCategory(recipientId){
    var messageData = {
      recipient: {
        id: recipientId
      },
      message:{
        text:"지금 제일 듣고 싶은 말을 알려줘",
        quick_replies:[
          {
            content_type:"text",
            title:"몰라",
            payload:"morning",
            image_url:"http://emojipedia-us.s3.amazonaws.com/cache/7f/f8/7ff8f47f222447a9616ab1c7028cc3b5.png"
          },
          {
            content_type:"text",
            title:"몰라",
            payload:"morning",
            image_url:"http://emojipedia-us.s3.amazonaws.com/cache/7f/f8/7ff8f47f222447a9616ab1c7028cc3b5.png"
          },
          {
            content_type:"text",
            title:"몰라",
            payload:"morning",
            image_url:"http://emojipedia-us.s3.amazonaws.com/cache/7f/f8/7ff8f47f222447a9616ab1c7028cc3b5.png"
          }
        ]
      }
    };
    sendTypingOn(recipientId);
    callSendAPI(messageData);
}



function sendImage(recipientId, image){
  var messageData = {
    recipient:{
      id:recipientId
    },
    message:{
      attachment:{
        type:"image",
        payload:{
          url:image
        }
      }
    }
  };
  sendTypingOn(recipientId);
  callSendAPI(messageData);
}


function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };
  sendTypingOn(recipientId);
  setTimeout(function() {callSendAPI(messageData)}, 400)
  sendTypingOff(recipientId);

}

function sendTypingOn(recipientId) {

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_on"
  };

  callSendAPI(messageData);
}

function sendTypingOff(recipientId) {

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_off"
  };

  setTimeout(function() {callSendAPI(messageData)}, 400)
}



function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}

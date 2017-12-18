var express = require('express');
var app = express();
var plugins = require('./plugins');

var bot_token = 'xoxb-287887410179-4BnqFtyiiZqB3fuOqt1EvjwD';
var rtm = new plugins.RtmClient(bot_token);
var sourceChannelId, destChannelId;
var sourceChannelName, destChannelName;
var listOfChannels = [];

rtm.on(plugins.CLIENT_EVENTS.RTM.AUTHENTICATED, function(rtmStartData) {
    for (var i = 0; i < rtmStartData.channels.length; i++) {
        if (rtmStartData.channels[i].is_member) {
            if (rtmStartData.channels[i].name == 'pvt_translator') {
                destChannelId = rtmStartData.channels[i].id;
                destChannelName = rtmStartData.channels[i].name;
            }
            listOfChannels.push(rtmStartData.channels[i]);
        }
    }
    
    console.log('Determining destination... ' + destChannelId);
    console.log('Logged in but not yet connected to a channel');
});

rtm.on(plugins.CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function() {});

rtm.on(plugins.RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
    var messageChannelId = message.channel;
    var messageChannelName = new plugins.LINQ(listOfChannels).Where(function(c) { return c.id == message.channel; }).ToArray()[0].name;
    if (messageChannelId != destChannelId) {
        plugins.Translate(message.text, { from: 'ja', to: 'en' }).then(function(output) {
            console.log("Pushing...");
            rtm.sendMessage('[' + messageChannelName + '] ' + output.text, destChannelId);
            console.log("Pushed");
        });
    }
});

rtm.start();
app.listen(3000, function () { console.log('Slack translator listening on port 3000!'); });
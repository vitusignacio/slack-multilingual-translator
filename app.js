var express = require('express');
var app = express();
var plugins = require('./plugins');

var bot_token = 'xoxb-287887410179-4BnqFtyiiZqB3fuOqt1EvjwD';
var rtm = new plugins.RtmClient(bot_token);
var token = 'xoxp-2496922627-281226671255-287713637027-5e2dfa96bf00e27c213dd9905f9bc221';
var web = new plugins.WebClient(token);
var sourceChannelId, destChannelId;
var sourceChannelName, destChannelName;
var listOfChannels = [];

defaultLanguage = process.env.DESTINATION_LANGUAGE || 'en';
defaultEnvironment = process.env.ENVIRONMENT || 'dev';

console.log('Specified language: ' + defaultLanguage);
console.log('Specified environment: ' + defaultEnvironment);

rtm.on(plugins.CLIENT_EVENTS.RTM.AUTHENTICATED, function(rtmStartData) {
    var observableChannel = null;
    if (defaultEnvironment != 'dev' &&
        defaultEnvironment != 'test')
    {
        observableChannel = 'pvt_translator_' + defaultLanguage;
    } else
    {
        observableChannel = 'pvt_translator_' + defaultEnvironment;
    }
    
    console.log('Effective channel: ' + observableChannel);
    for (var i = 0; i < rtmStartData.channels.length; i++) {
        if (rtmStartData.channels[i].is_member) {
            if (rtmStartData.channels[i].name == observableChannel) {
                destChannelId = rtmStartData.channels[i].id;
                destChannelName = rtmStartData.channels[i].name;
            }
        }
        listOfChannels.push(rtmStartData.channels[i]);
    }
});

rtm.on(plugins.CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function() {});

rtm.on(plugins.RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
    var messageChannelId = message.channel;
    var messageChannelName = new plugins.LINQ(listOfChannels).Where(function(c) { return c.id == message.channel; }).ToArray()[0].name;
    if (messageChannelId != destChannelId) {
        plugins.Translate(message.text, { from: 'ja', to: defaultLanguage }).then(function(output) {
            web.users.info(message.user, function (err, info) {
                rtm.sendMessage('*' + info.user.real_name + '* *' + messageChannelName + '* ' + output.text, destChannelId);
            });
        });
    }
});

rtm.start();
app.listen(3000, function () { console.log('Slack translator listening on port 3000!'); });
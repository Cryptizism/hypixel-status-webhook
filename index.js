const axios = require('axios');
const webhooks = require('./webhooks.json');

async function startLoop(){
    var status = await callStatusApi();
    var responseTime = await callResponseTimeApi();
    if(!status || !responseTime){
        console.log("Error calling APIs");
    } else {
        if(status.issue || responseTime >= 1000){
            sendWebhooks(responseTime, status.description);
        }
    }
    setTimeout(startLoop, 300000);
}

function callStatusApi(){
    return new Promise((resolve)=>{
        axios.get('https://status.hypixel.net/api/v2/status.json')
        .then(function (response) {
            var data = response.data;
            var indicator = data.status.indicator;
            var message = data.status.description;
            if(indicator == "none"){
                issue = false;
            } else {
                issue = true;
            }
            var response = {
                issue: issue,
                description: message
            }
            resolve(response);
        })
        .catch(function (error) {
            console.log(error);
            resolve(false);
        });
    });
}

async function callResponseTimeApi(){
    return new Promise((resolve)=>{
        axios.get(`https://status.hypixel.net/metrics-display/qtxd0x1427g5/day.json`)
        .then(function (response) {
            var data = response.data.metrics[0].data;
            var responseTime = data[data.length - 1].value;
            resolve(responseTime);
        })
        .catch(function (error) {
            console.log(error);
            resolve(false);
        });
    });
}

function sendWebhooks(responseTime, description){
    if (responseTime >= 1000){
        var embedDescription = "The Hypixel API is currently experiencing a high response time.";
    } else {
        var embedDescription = description;
    }
    embedDescription = embedDescription + "\nCheck out the [status page](https://status.hypixel.net/) for more information and updates.";
    var embed = [{
        title: "⚠ Hypixel Status",
        description: embedDescription,
        color: 16711680,
        timestamp: new Date(),
        fields: [{
            name: "Status",
            value: description,
            inline: true
        },
        {
            name: "API Response Time",
            value: `${responseTime}ms`,
            inline: true
        }],
        footer: {
            text: "https://status.hypixel.net/"
        },
    }]
    for(var i = 0; i < webhooks.length; i++){
        var webhook = webhooks[i];
        axios.post(webhook, {
            embeds: embed
        });
    }
}

startLoop();
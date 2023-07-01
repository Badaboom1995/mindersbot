const axios = require('axios');

const BOT_TOKEN = '5888882359:AAGcta__XatJMomOeSNIzTvQ9k5y7ejP8jQ';

axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
    .then(response => {
        console.log(response.data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
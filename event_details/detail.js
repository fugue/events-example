const id = process.env.CLIENT_ID;
const secret = process.env.CLIENT_SECRET;
const https = require('https');
const options = {
    method: 'GET',
    auth: id + ':' + secret
};

const Detail = function (newUrl) {

    https.get(newUrl, options, (res) => {
        let body = "";
        res.on("data", (chunk) => {
            body += chunk;
        });
        res.on("end", () => {
            console.log(body);
        });

    }).on("error", (error) => {
        console.error(error.message);
    });
};

module.exports = Detail;


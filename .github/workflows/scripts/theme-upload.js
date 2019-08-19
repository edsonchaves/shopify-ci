#!/usr/bin/env node

const ngrok = require('ngrok');
const liveServer = require("live-server");
const shopifyClient = require('./lib/shopify-client');
require('dotenv').config();

const {
    SHOP_NAME,
    NGROK_AUTH_TOKEN,
    GITHUB_SHA,
} = process.env;

/*
    🌈 Create New Theme Based on Build
*/

(async function () {
    try {
        const port = 8181;
        const params = {
            port, // Defaults to 8080
            open: false, // don't load browser
            file: 'theme.zip', // Server the theme zip directly
            logLevel: 0, // 0 = errors only, 1 = some, 2 = lots
            watch: 'theme.zip',
        };
        liveServer.start(params);

        const ngrokUrl = await ngrok.connect({
            authtoken: NGROK_AUTH_TOKEN,
            port,
        });

        const prNumber = 0;
        const commitSha = GITHUB_SHA && GITHUB_SHA.slice(5);
        const themeName = `[${prNumber}] GITHUB-PR ${commitSha}`;
        const themeUrl = `${ngrokUrl}/theme.zip`;
        console.log('themeUrl', themeUrl);

        await shopifyClient.theme.create({
            name: themeName,
            src: themeUrl,
        })
            .then(async theme => {
                console.log(theme);
                console.log(`\x1b[33m %s \x1b[0m`, `View Theme at https://${SHOP_NAME}.myshopify.com/?preview_theme_id=${theme.id}`)
                await ngrok.kill();
            })
            .catch(async err => {
                console.error(err.response.body);
                await ngrok.kill();
                process.exit(1);
            });
    } catch (e) {
        console.log(e);
    }
})();


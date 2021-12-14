//npm init 
//npm install minimist
//npm install puppeteer
//node Automation.js --url=https://www.hackerrank.com/ --config=config.json

let minimist = require("minimist");
let puppeteer = require("puppeteer");
let fs = require("fs");

let args = minimist(process.argv);

let configJSON = fs.readFileSync(args.config,"utf-8");
let configJSO = JSON.parse(configJSON);

async function run(){
    let browser = await puppeteer.launch({
        headless: false,
        args:[
            '--start-maximized'
        ],
        defaultViewport: null
    });
    
    let page = await browser.newPage();
    await page.goto(args.url);

    await page.waitForSelector("a[data-event-action='Login']");
    await page.click("a[data-event-action='Login']");

    await page.waitForSelector("a[href='https://www.hackerrank.com/login']");
    await page.click("a[href='https://www.hackerrank.com/login']");

    // Type username
    await page.waitForSelector('#input-1');
    await page.type('#input-1',configJSO.userid);

    // Type Password
    await page.waitForSelector('#input-2');
    await page.type('#input-2',configJSO.password);

    // Click on Login Button 
    await page.waitForSelector("button[data-analytics='LoginPassword']");
    await page.click("button[data-analytics='LoginPassword']");

    // Click on compete tab
    await page.waitForSelector("a[data-analytics='NavBarContests']");
    await page.click("a[data-analytics='NavBarContests']");

    await page.waitForSelector("a[href='/administration/contests/']");
    await page.click("a[href='/administration/contests/']");  

    // Find total number of pages
    await page.waitForSelector("a[data-attr1='Last']");
    let numPages = await page.$eval("a[data-attr1='Last']", function (atag) {
        let totPages = parseInt(atag.getAttribute("data-page"));
        return totPages;
    });
    
    // Perform action for each page and move to next page
    for (let i = 1; i <= numPages; i++) {
        await handleAllContestsOfAPage(page, browser);

        if (i != numPages) {
            await page.waitForSelector("a[data-attr1='Right']");
            await page.click("a[data-attr1='Right']");
        }
    } 
}

async function handleAllContestsOfAPage(page, browser) {
    
    // Find all urls in a page
    await page.waitForSelector("a.backbone.block-center");
    let curls = await page.$$eval("a.backbone.block-center", function (atags) {
        let urls = [];
        for (let i = 0; i < atags.length; i++) {
            let url = atags[i].getAttribute("href");
            urls.push(url);
        }
        return urls;
    });

    // Open new page and call function to open contest and add moderator
    for (let i = 0; i < curls.length; i++) {
        let ctab = await browser.newPage();
        await saveModeratorInContest(ctab, args.url + curls[i], configJSO.moderator);
        await ctab.close();
        await page.waitFor(2000);
    }
}

// To open contest and add a moderator
async function saveModeratorInContest(ctab, fullCurl, moderator) {
    
    // Open url for each contest
    await ctab.bringToFront();
    await ctab.goto(fullCurl);
    await ctab.waitFor(2000);

    // Click on moderators tab
    await ctab.waitForSelector("li[data-tab='moderators']");
    await ctab.click("li[data-tab='moderators']");

    // Type in moderator
    await ctab.waitForSelector("input#moderator");
    await ctab.type("input#moderator", moderator, {delay: 40});

    // Press enter
    await ctab.keyboard.press("Enter");
}

run();


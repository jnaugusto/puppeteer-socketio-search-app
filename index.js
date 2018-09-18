const puppeteer = require('puppeteer');
const io = require('socket.io')();
const md5 = require('md5');

// Listen to connections on port 3000
io.listen(3000);

var isSearching = false;

console.log('SERVER STARTED. Listening to port 3000...');

io.sockets.on('connection', function (socket) {
    socket.on('search-order', (order, response) => {
        if (order != null && 'keyword' in order) {
        	if (!isSearching) {
        		isSearching = true;
	        	scrape(order.keyword, order.encrypted_url, order.search_engine_url, (callback) => {
	        		response(callback);
	       		});
	       	} else response('Error');
		}
    });

    // This method does the google search and finds the correct URL
    let scrape = async (keyword, encryptedUrl, googelUrl, callback) => {
        console.log(`Searching for keyword => ${keyword}`);

        const browser = await puppeteer.launch({headless: true, timeout: 0, args: ['--no-sandbox', '--disabled-setuid-sandbox']});
        const page = await browser.newPage();

        try {
            await page.goto(googelUrl, {waitUntil: 'load', timeout: 0 });
            await page.type('input[name=q]', keyword, {delay: 100});
            await page.keyboard.press('Enter');
            await page.waitForSelector('.g h3 a', {visible: true, timeout: 10000 });
            
            const elements = await page.evaluate("[].map.call(document.querySelectorAll('.g h3 a'), a => a.href)");
            let endOfPageCheck = false;
            let pageIndex = 1;

            console.log(`Checking google page ${pageIndex}...`);

            let noResult = async function () {
                try {
                    console.log(`No matching URL found :(`);
                    setTimeout(() => {isSearching = false;}, 10000);
                    callback('NotFound');
                    await browser.close(); 
                    return;
                } catch (e) { error(e,null); }
            }

            let error = async function (e, cause) {
                try {
                    console.log(`Retrying ${cause}... ERROR => ${e}`);
                    setTimeout(() => {isSearching = false;}, 10000);
                    callback('Error');
                    await browser.close();
                    return;
                } catch (e) { error(e,null); }
            }

            let findUrl = async (links) => {
                pageIndex++;

                for (let x = 0; x < links.length; x++) {
                    let href = links[x];
                    let pattern = /https?:\/\/(?:www\.)?(.+)/;
                    let pathname = pattern.exec(href)[1];
                    if (pathname.slice(-1) === '/') pathname = pathname.slice(0, -1);

                    if (md5(pathname) == encryptedUrl) { 
                        console.log(`URL found => ${href}`);
                        urlFound = true;
                        setTimeout(() => {isSearching = false;}, 10000);
                        callback(href);
                        await browser.close();
                        return;
                    }
                }
                
                try {
                    if (endOfPageCheck) noResult();
                    else {
                        const nextHandle = await page.$('#pnnext'); 
                        if (nextHandle !== null) {
                            await page.waitFor(5000);
                            // Go to next page
                            console.log(`Checking google page ${pageIndex}...`);
                            await nextHandle.click();
                            getUrls();
                        } else {
                            // If not found, we have reached the end of page
                            await page.waitForSelector('#topstuff', {visible: true, timeout: 10000 });
                            let endOfPage = await page.evaluate(() => document.querySelector('#topstuff').childElementCount);
                            if (endOfPage > 0) noResult();
                            else {
                                endOfPageCheck = true;
                                getUrls();
                            }
                        }
                    }
                } catch (e) { error(e,'handle'); }
            }

            let getUrls = async function () {
                try {
                    await page.waitForSelector('.g h3 a', {visible: true, timeout: 10000 });
                    const newElements = await page.evaluate("links: [].map.call(document.querySelectorAll('.g h3 a'), a => a.href)");
                    findUrl(newElements);
                } catch (e) { error(e,null); }
            }

            findUrl(elements);
        } catch (e) {
            console.log(`Retrying... ERROR => ${e}`);
            setTimeout(() => {isSearching = false;}, 10000);
            callback('Error');
            await browser.close();
        }
    };

});
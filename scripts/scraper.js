const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://news.ycombinator.com/news');

    // Perform actions or extract data from the page
    // for(let i = 0; i < 100; i++) {
    //     await page.evaluate(() => {
    //         document.documentElement.scrollTop = document.documentElement.scrollHeight;
    //     });
    //     await page.waitForTimeout(2000);
    //
    // }
    const articles = await page.$$('table tr.athing span.titleline > a');
    for (const article of articles) {
        const data = await page.evaluate((el) => el.textContent, article);
        console.log(data);
    }


    // Alternatively, you can use Promise.all with map
    // const articleData = await Promise.all(articles.map((article) => page.evaluate((el) => el.textContent, article)));
    // console.log(articleData);

    await browser.close();
})();
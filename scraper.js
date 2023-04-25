const puppeteer = require('puppeteer');
const fs = require('fs');

// Please supply an argument (i.e., node scraper.js hello.company.com)
const domain = process.argv[2];
const webArchiveURL = `http://web.archive.org/web/*/${domain}*`;

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Set navigation timeout to a higher value if needed
    page.setDefaultNavigationTimeout(60000);

    await page.goto(webArchiveURL, { waitUntil: 'networkidle0' });

    let allUrls = [];

    while (true) {
        const urls = await page.evaluate(() => {
            const urlElements = document.querySelectorAll('.url.sorting_1 a');
            const urlList = [];

            for (const urlElement of urlElements) {
                urlList.push(urlElement.textContent);
            }

            return urlList;
        });

        allUrls = allUrls.concat(urls);

        const nextButton = await page.$('.paginate_button.next');
        const nextButtonDisabled = await page.$('.paginate_button.next.disabled');

        if (nextButton && !nextButtonDisabled) {
            await nextButton.click();
            // Wait for the table to update
            await page.waitForSelector('.url.sorting_1 a', { timeout: 60000 });
        } else {
            break;
        }
    }

    // Write the URLs to a text file
    fs.writeFileSync('output.txt', allUrls.join('\n'));

    console.log('URLs have been saved to output.txt');
    await browser.close();
})();
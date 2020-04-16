const puppeteer = require('puppeteer');
const stringify = require('csv-stringify');
const fs = require('fs');
const util = require('util');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let links = [];

    for (let i = 1; i <= 75; i++) {

        await page.goto(`https://link.springer.com/search/page/${i}?facet-content-type=%22Book%22&showAll=false`);

        links = links.concat((await page.evaluate(() => {
            return [].map.call(window.document.querySelectorAll('li h2 > a'), a => a.href);
        })));
    }

    const pdfLinks = [];
    for (const link of links) {
        await page.goto(link);
        const pdfLink = await page.evaluate((url) => {
            return {
                title: (document.querySelector('.page-title h1') || {}).innerText,
                subTitle: (document.querySelector('.page-title__subtitle') || {}).innerText,
                authors: [].map.call(document.querySelectorAll('.authors__name'), span => span.innerText).join(', '),
                category: (document.getElementById('ebook-package') || {}).innerText || 'uncategorized',
                url,
                pdfUrl: (document.querySelector('.test-bookpdf-link') || {}).href
            };
        }, link);
        pdfLinks.push(pdfLink);
    }

    console.log(pdfLinks.length);

    pdfLinks.sort((a, b) => a.category.localeCompare(b.category));

    pdfLinks.unshift({
        title: 'title',
        subTitle: 'sub title',
        authors: 'authors',
        category: 'category',
        url: 'Web url',
        pdfUrl: 'PDF url'
    });

    const json = JSON.stringify(pdfLinks, null, 4);

    const csv = await util.promisify(stringify)(pdfLinks);

    fs.writeFileSync('./export/springer.json', json);

    fs.writeFileSync('./export/springer.csv', csv);

    await browser.close();
})();

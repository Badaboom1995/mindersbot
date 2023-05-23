// const PDFParser = require('pdf2json');

const extractTextContent = (pageData) => {
    let textContent = "";

    for (const textElement of pageData.Texts) {
        if (textElement.R && textElement.R.length > 0) {
            let decodedText = decodeURIComponent(textElement.R[0].T);
            decodedText = decodedText.replace(/%([0-9A-F]{2})/g, (match, p1) => {
                return String.fromCharCode(parseInt(p1, 16));
            });
            textContent += `${decodedText} `;
        }
    }

    return textContent.trim();
};

async function parsePdfToHtml(pdfPath) {
    const PDFParser = (await import('pdf2json')).default;
    const pdfParser = new PDFParser();

    return new Promise((resolve, reject) => {
        pdfParser.on('pdfParser_dataError', (errData) => {
            console.error('Error parsing PDF:', errData.parserError);
            reject(errData.parserError);
        });

        pdfParser.on('pdfParser_dataReady', (pdfData) => {
            const parts = [];
            // console.log('pdfData:', console.log(extractTextContent(pdfData.Pages[51])));
            // return resolve(pdfData)

            pdfData.Pages.forEach((page) => {
                let result = extractTextContent(page);
                parts.push(result);
            });
            resolve(parts);
        });

        pdfParser.loadPDF(pdfPath);
    });
}

(async () => {
    try {
        const pdfPath = 'data/aibook.pdf';
        const parts = await parsePdfToHtml(pdfPath);
        console.log(parts);
    } catch (error) {
        console.error('Error:', error);
    }
})();

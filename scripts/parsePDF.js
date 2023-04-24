import fs from "fs";
import PDFParser from "pdf2json";

const pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    fs.writeFile("./result.json", JSON.stringify(pdfData));
});

pdfParser.loadPDF("./scripts/ai.pdf");
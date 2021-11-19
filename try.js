//node try.js --config=config.json --dataFolder=Companies
const minimist = require("minimist");
const puppeteer  = require("puppeteer");
const fs = require("fs");
const pdf = require('pdf-lib');
const args = minimist(process.argv);
let path = require("path");

try{
    let configJson = fs.readFileSync(args.config , "utf-8");
    let config = JSON.parse(configJson);
    console.log(config);
    fs.mkdirSync(args.dataFolder);


// Launch browser and and define its size

    ( async function(){
    let browser =  await puppeteer.launch({
        headless : false ,
            defaultViewport :null ,
            args : ["--start-maximized"]
        });
        let pages = await  browser.pages();
        let page = pages[0];

        // Go to GFG page
        await page.goto("https://www.geeksforgeeks.org/");
        
        await page.waitForTimeout(3000);
        // Click on Login in button
        await page.waitForSelector("a.header-main__signup.login-modal-btn");
        await page.hover("a.header-main__signup.login-modal-btn");
        await page.click("a.header-main__signup.login-modal-btn");

        await page.waitForTimeout(2000);

        // Enter username from config.json file
        await page.type("input#luser" , config.username , {delay: 100});
        await page.waitForSelector("input#luser");

        await page.waitForTimeout(2000);

        // Enter password from config.json file
        await page.waitForSelector("input#luser");
        await page.type("input#password" , config.password , {delay: 100});

        await page.waitForTimeout(2000);

        // 
        await page.waitForSelector("input[type='checkbox']");
        await page.click("input[type='checkbox']");

        await page.waitForTimeout(2000);

        // Enter(keyboard) to proceed
        await page.keyboard.press("Enter");

        await page.waitForTimeout(3000);

        // On the header choosing tutorial and pressing its drop down menu
        await page.waitForSelector("i.gfg-icon.gfg-icon_arrow-down.gfg-icon_header");
        await page.hover("i.gfg-icon.gfg-icon_arrow-down.gfg-icon_header");
        await page.click("i.gfg-icon.gfg-icon_arrow-down.gfg-icon_header");

        await page.waitForTimeout(000);

        // Pressing the right arrow to open more options
        await page.waitForSelector("i.gfg-icon.gfg-icon_arrow-right");
        await page.click("i.gfg-icon.gfg-icon_arrow-right");
        
        await page.waitForTimeout(3000);

        // Open DSA company-wise
        await page.waitForSelector('a[href="https://practice.geeksforgeeks.org/company-tags"]');
        await page.hover('a[href="https://practice.geeksforgeeks.org/company-tags"]');
        await page.click('a[href="https://practice.geeksforgeeks.org/company-tags"]');

        await page.waitForTimeout(3000);
        await page.waitForSelector("td.text-center a b");
        
        let TotalCompanies = await page.$$eval("td.text-center a b" , function(CName){
        
            let companyName = [];
            for(let  i = 0 ; i < CName.length; i++){
                let name =  CName[i].textContent;
                companyName.push(name);
            }
            return companyName;
        });

        // Opening new tab for a company
        for(let i = 0 ; i < TotalCompanies.length ; i++){
            let url = "https://practice.geeksforgeeks.org/company/" + TotalCompanies[i] + "/";
            let OpenNewTabForACompany = await browser.newPage();
            await OpenNewTabForACompany.waitForTimeout(2000);
            await OpenNewTabForACompany.bringToFront();
            await OpenNewTabForACompany.goto(url);

            await OpenNewTabForACompany.waitForTimeout(3000);
            
            // Calling a function to autoscroll the new tab 
            await autoScroll(OpenNewTabForACompany);
            
            await OpenNewTabForACompany.waitForTimeout(3000);

            // Calling a function to create PDFs company wise
            await createAndModifyPdf(OpenNewTabForACompany , TotalCompanies[i] , url);
            
            // We will close the new tab that was open for that certain company
            await OpenNewTabForACompany.close();
            
            page.waitForTimeout(3000);
        }

    })();

    // Function for autoscrolling
    async function autoScroll(page){
        await page.evaluate(async () => {
            await new Promise((resolve, reject) => {
                var totalHeight = 0;
                var distance = 100;
                var timer = setInterval(() => {
                    var scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if(totalHeight >= scrollHeight){
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });
    }

    // Fetch the problem names of the company passed 
    async function fetchProblemsName(OpenNewTabForACompany , ){
        await OpenNewTabForACompany.waitForSelector("div.col-sm-6.col-md-6.col-lg-6.col-xs-12.item  div.panel-body > span"); //name 
        let ProblemName = await OpenNewTabForACompany.$$eval("div.col-sm-6.col-md-6.col-lg-6.col-xs-12.item  div.panel-body > span",
        
        function(span){
            let Problemspan = [];
            for(let i = 0 ; i < span.length ; i++){
                let name = span[i].textContent;
                Problemspan.push(name);
            }
            return Problemspan;
        })
        return Promise.resolve(ProblemName);
    }

    async function createAndModifyPdf(OpenNewTabForACompany , companyName , url){

        const pdfdoc = await pdf.PDFDocument.create();
        let  page =  pdfdoc.addPage();

            let YCordinates = 700;
            let ProblemName = await fetchProblemsName(OpenNewTabForACompany);
            const pages = pdfdoc.getPages()
            const firstPage = pages[0];
            if(firstPage){
                page.drawText(companyName + " Archives" ,{
                    x: 200 , y : 800 , size :24 
                });   
                page.drawText("[ " + url + " ]" , {
                    x:100 , y:750 , size : 15
                });
            }
            var num = 0;
            for(let i = 0 ; i < ProblemName.length ; i++){
            if(YCordinates == 25 || YCordinates < 25 )   { page =  pdfdoc.addPage(); YCordinates = 800;}
                page.drawText( num + ".) " + ProblemName[i] , {
                    x:  70,
                    y:  YCordinates,
                    size: 14
                });
                YCordinates -= 25;
                num++;
            }
        let finalPDF = await pdfdoc.save();
        let CName = await companyName+".pdf";
        let one =  path.join(args.dataFolder , CName);
        fs.writeFileSync(one , finalPDF);
    }; 
}

catch(err) {
    console.log("[ERROR]: " + err);
}
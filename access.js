
import fs from "fs";

import readline from "readline"

const LOGS = "./access.log";


console.clear();

async function processLineByLine(){
    const fileStream = fs.createReadStream(LOGS);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        const searchIP = [
            "127.0.0.1",
            "127.0.0.2",
        ];
        searchIP.forEach((el)=> {
            if (line.includes(el)){
                fs.appendFile(`./${"logs_" + el}`, line + "\n", (err)=> console.log(err))
            }
        })
    }
}

processLineByLine(); 
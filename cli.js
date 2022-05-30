#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const inquirer = require('inquirer');
const colors = require('colors');

const executionDir = process.cwd();
const options = yargs
    .option('d', {
        alias: 'dir',
        describe: 'path to the dir to scan',
        type: 'string',
        default: executionDir,
    })
    .option('f', {
        alias: 'find',
        describe: 'substring to search',
        type: 'string',
    })
    .argv
const substringToFind = options.f;
function reader(directoryToScan = options.d) {
    const fileList = fs.readdirSync(directoryToScan);
    inquirer.prompt([
        {
            name: 'fileName',
            type: 'list',
            message: 'Выберите файл или папку для просмотра',
            choices: fileList,
        },
    ]).then(({ fileName }) => {
        const fullPath = path.join(directoryToScan, fileName);
        if (fs.lstatSync(fullPath).isDirectory()) {
            reader(`${directoryToScan}/${fileName}`);
        } else {
            let data = fs.readFileSync(fullPath, 'utf-8');
            if (options.f) {
                let regExp = new RegExp(options.f, 'g');
                data = data.replace(regExp, colors.red(options.f));
            }
            console.log(data);
        }

    });
}

reader(); 
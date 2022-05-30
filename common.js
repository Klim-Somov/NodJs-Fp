const { readdir, lstat } = require('fs/promises');
const path = require('path');
const { API } = require('./API');

function getPageMarkup(url, { backUrl, list }) {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="${API}/styles.css" />
      <title>Reader</title>
    </head>
    <body>
      <h1>My Server</h1>
      <hr />
      <ul class="list">
        ${
          url === '/'
            ? ''
            : `<li class="item directory"><a href="${backUrl}">/..</a></li>`
        }
        ${getDirListMarkup(list)}
      </ul>
    </body>
  </html>
`;
}

function getDirListMarkup(dirList) {
  return dirList
    .map(({ name, url, isFile }) =>
      isFile
        ? `<li class="item file"><a href="${url}">${name}</a></li>`
        : `<li class="item directory"><a href="${url}">/${name}</a></li>`
    )
    .join('');
}

async function checkIsFile(path) {
  const stats = await lstat(path);
  return stats.isFile();
}

function sortByIsFileAndName(a, b) {
  if (a.isFile === b.isFile) {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();

    if (nameA > nameB) return 1;
    if (nameA < nameB) return -1;
    return 0;
  }
  if (a.isFile) {
    return 1;
  }
  return -1;
}

function getBackUrl(url) {
  const splitUrl = url.split('/');

  splitUrl.pop();

  return splitUrl.length > 1 ? splitUrl.join('/') : '/';
}

async function getDirList(url, dirPath) {
  const dirData = await readdir(dirPath);

  const dirList = await dirData.reduce(
    async (previousPromise, item) => {
      const isFile = await checkIsFile(path.join(dirPath, item));
      const acc = await previousPromise;

      acc.list.push({
        name: item,
        url: path.join(url, item),
        isFile,
      });

      return acc;
    },
    Promise.resolve({
      backUrl: getBackUrl(url),
      list: [],
    })
  );

  dirList.list.sort(sortByIsFileAndName);

  return dirList;
}

exports.getDirList = getDirList;
exports.getPageMarkup = getPageMarkup;
exports.checkIsFile = checkIsFile; 
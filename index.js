const fs = require("node:fs");
const path = require("node:path");
const { execSync, exec } = require("node:child_process");

// 读取 ~/.projj/cache.json 文件
function getProjjCacheList() {
    const cacheFilePath = path.join(process.env.HOME, '.projj', 'cache.json');
    const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
    return Object.keys(cacheData).map((key) => {
        return {
            title: key,
            desc: cacheData[key],
            gitUrl: cacheData[key].repo,
        }
    });
}
let list  = []

window.exports = {
    "projj": {
        mode: "list",
        args: {
            // 进入插件应用时调用（可选）
            enter: (action, callbackSetList) => {
                // 如果进入插件应用就要显示列表数据
                // 清除输入框内容
                list = getProjjCacheList()
                callbackSetList([])
            },
            // 子输入框内容变化时被调用 可选 (未设置则无搜索)
            search: (action, input, callbackSetList) => {
                // 获取一些数据
                // 执行 callbackSetList 显示出来
                if (!input) {
                    callbackSetList([]);
                    return;
                }
                
                if (input?.startsWith('clone git@git')) {
                    const text = input.trim()
                    const gitUrl = text.split(' ')[1]
                    callbackSetList([
                        {
                            title: '克隆 git 仓库',
                            description: gitUrl,
                            type: 'clone'
                        }
                    ]);
                    return;
                }
                const searchText = input.trim()
                const matches = list.filter((item) => {
                    // 模糊匹配，不连续字符也匹配
                    return fuzzyMatch(searchText, item.title);
                })

                if (matches.length === 0) {
                    callbackSetList([]);
                }

                // 如果有多个匹配项，显示选择列表
                const options = matches.map((match) => ({
                    title: match.title,
                    description: match.repo,
                }));

                callbackSetList(options)
            },
            // 用户选择列表中某个条目时被调用
            select: (action, itemData, callbackSetList) => {
                if (itemData.type === 'clone') {
                    // 使用 utools.shellPath 获取正确的 Shell 路径
                    const shellPath = '/Users/bilibili/.nvm/versions/node/v18.20.8/bin/node /Users/bilibili/.nvm/versions/node/v18.20.8/bin/projj'

                    // 使用 utools.shellExec 执行命令
                    console.log('克隆', itemData.description)
                    exec(`${shellPath} add ${itemData.description}`, (err) => {
                        if (err) {
                            console.log('克隆失败', err);
                        } else {
                            console.log('克隆成功', stdout);
                            // 打开项目
                            list = getProjjCacheList()
                            const title = list.find((item) => item.gitUrl === itemData.description)?.title
                            openInWebStorm(title)
                        }
                    });
                    return;
                }
                openInWebStorm(itemData.title);
            },
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "搜索",
        },
    },
}

// 打开 WebStorm
function openInWebStorm(filePath) {
    if (!filePath) return
    const shellPath = '/usr/local/bin/code'
    exec(`${shellPath} ${filePath}`, (err) => {
        if (err) {
            console.log('打开 WebStorm 失败', err)
        }
    });
}

function fuzzyMatch(pattern, str) {
    let patternIndex = 0;
    let strIndex = 0;

    // 遍历字符串和模式
    while (strIndex < str.length && patternIndex < pattern.length) {
        if (str[strIndex].toLowerCase() === pattern[patternIndex].toLowerCase()) {
            patternIndex++; // 匹配成功，移动到下一个模式字符
        }
        strIndex++; // 移动到下一个字符串字符
    }

    // 如果模式中的所有字符都匹配成功，返回 true
    return patternIndex === pattern.length;
}

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

let isWebStorm = false
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
                const text = input.trim()
                const searchText = text.split(' ')[0]
                isWebStorm = text.split(' ')?.[1] === 'w'
                console.log('searchText', searchText, searchText?.startsWith('clone git.@git'))
                if (searchText?.startsWith('clone git@git')) {
                    const gitUrl = searchText.replace('clone ', '').trim();
                    callbackSetList([
                        {
                            title: '克隆 git 仓库',
                            description: gitUrl,
                            type: 'clone'
                        }
                    ]);
                    return;
                }
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
            // select: (action, itemData, callbackSetList) => {
            //     if (itemData.type === 'clone') {
            //         // window.services.execCommand(`projj add ${itemData.description}`);
            //         // TODO 这里会报错，提示没有 node 环境
            //         exec(`node -v`, (err) => {
            //             if (err) {
            //                 console.log('请先安装 node 环境', err)
            //             }
            //         })
            //         // exec(`projj add ${itemData.description}`, (err) => {
            //         //     if (err) {
            //         //         console.log('克隆失败', err)
            //         //     }
            //         // })
            //         return
            //     }
            //     openInWebStorm(itemData.title);
            // },
            select: (action, itemData, callbackSetList) => {
                if (itemData.type === 'clone') {
                    // 使用 utools.shellPath 获取正确的 Shell 路径
                    const shellPath = utools.shellPath();

                    // 使用 utools.shellExec 执行命令
                    utools.shellExec(`${shellPath} -c "node -v"`, (stdout, stderr) => {
                        if (stderr) {
                            console.log('请先安装 node 环境', stderr);
                        } else {
                            console.log('Node.js 版本:', stdout);

                            // 如果 Node.js 可用，继续执行 projj add 命令
                            utools.shellExec(`${shellPath} -c "projj add ${itemData.description}"`, (stdout, stderr) => {
                                if (stderr) {
                                    console.log('克隆失败', stderr);
                                } else {
                                    console.log('克隆成功', stdout);
                                }
                            });
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
    const shellPath = isWebStorm ? '/usr/local/bin/webstorm' : '/usr/local/bin/code'
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

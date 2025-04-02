const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execSync } = require("node:child_process");

window.services = {
    readFile: (filename) => {
        return fs.readFileSync(filename, { encoding: "utf-8" });
    },
    getFolder: (filepath) => {
        return path.dirname(filepath);
    },
    getOSInfo: () => {
        return { arch: os.arch(), cpus: os.cpus(), release: os.release() };
    },
    execCommand: (command) => {
        execSync(command);
    },
    webstormOpen: (filepath) => {
        execSync(`webstorm ${filepath}`);
    }
};

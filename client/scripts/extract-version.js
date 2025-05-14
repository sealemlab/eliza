import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义 lerna.json 的路径
const lernaPath = path.resolve(__dirname, "../../lerna.json");

try {
    // 读取 lerna.json
    const lernaContent = fs.readFileSync(lernaPath, "utf8");
    const lernaJson = JSON.parse(lernaContent);

    // 获取版本号
    const version = lernaJson.version;

    if (!version) {
        console.error("Error: Unable to extract version from lerna.json");
        process.exit(1);
    }

    // 创建 info.json
    const infoJson = { version };
    const infoPath = path.resolve(__dirname, "../src/lib/info.json");

    // 确保目录存在
    const dir = path.dirname(infoPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(infoPath, JSON.stringify(infoJson, null, 2));
    console.log(`info.json created with version: ${version}`);
} catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
}

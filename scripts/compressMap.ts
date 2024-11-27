import * as fs from "fs";
import { compress } from "lz4js";
import { MAP_FILE_PATH_COMPRESSED } from "~/constants/commonvars";

// korea.json 파일 읽기
const koreaJson = fs.readFileSync("public/korea.json");

// JSON 데이터 최적화 (공백 제거)
const minifiedJson = JSON.stringify(JSON.parse(koreaJson.toString()));

// 데이터 압축 (높은 압축 레벨 사용)
const compressed = compress(Buffer.from(minifiedJson));

// 압축된 데이터를 Base64로 인코딩
const base64Compressed = Buffer.from(compressed).toString("base64");

// 압축된 데이터를 파일로 저장
fs.writeFileSync(`public/${MAP_FILE_PATH_COMPRESSED}`, base64Compressed);

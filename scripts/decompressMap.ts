import * as fs from "fs";
import { decompress } from "lz4js";
import {
  MAP_FILE_PATH_COMPRESSED,
  MAP_FILE_PATH_DECOMPRESSED,
} from "~/constants/commonvars";

// 압축된 파일 읽기
const compressedBase64 = fs.readFileSync(
  `public/${MAP_FILE_PATH_COMPRESSED}`,
  "utf-8"
);

// Base64 디코딩
const compressedData = Buffer.from(compressedBase64, "base64");

// 데이터 압축 해제
const decompressed = decompress(compressedData);

// 압축 해제된 데이터를 문자열로 변환
const jsonString = Buffer.from(decompressed).toString("utf-8");

// 결과 확인을 위해 파일로 저장 (선택사항)
fs.writeFileSync(`public/${MAP_FILE_PATH_DECOMPRESSED}`, jsonString);

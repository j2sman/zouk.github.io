import { decompress } from "lz4js";
import { MAP_FILE_PATH_COMPRESSED } from "~/constants/commonvars";
export async function loadKoreaMap() {
  try {
    if (import.meta.dev) {
      console.log("지도 데이터 로드 시작");
    }

    const response = await fetch(MAP_FILE_PATH_COMPRESSED);

    if (import.meta.dev) {
      console.log("응답 상태:", response.status);
    }

    const base64Data = await response.text();

    if (import.meta.dev) {
      console.log("base64Data 길이:", base64Data.length);
    }

    // Base64 디코딩 (Buffer 대신 Uint8Array 사용)
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 데이터 압축 해제
    const decompressedData = decompress(bytes);

    // JSON 파싱
    return JSON.parse(new TextDecoder().decode(decompressedData));
  } catch (error: any) {
    console.error("상세 오류 정보:", {
      message: error?.message || "알 수 없는 오류",
      stack: error?.stack || "알 수 없는 오류",
    });
    throw error;
  }
}

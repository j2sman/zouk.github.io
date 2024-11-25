export const useDevice = () => {
  const isMobile = ref(false);

  if (import.meta.client) {
    // 사용자 에이전트 문자열 가져오기
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // 모바일 기기 정규식 패턴
    const mobileRegex = [
      /Android/i,
      /webOS/i,
      /iPhone/i,
      /iPad/i,
      /iPod/i,
      /BlackBerry/i,
      /Windows Phone/i,
      /Opera Mini/i,
      /IEMobile/i,
      /Mobile/i,
      /Tablet/i,
    ];

    // 화면 크기 기반 모바일 감지
    const isMobileViewport = window.innerWidth <= 768;

    // User Agent 기반 모바일 감지
    const isMobileUserAgent = mobileRegex.some((mobile) =>
      mobile.test(userAgent)
    );

    isMobile.value = isMobileUserAgent || isMobileViewport;
  }

  return {
    isMobile,
  };
};

export default defineNuxtPlugin(() => {
  return {
    provide: {
      device: useDevice(),
    },
  };
});

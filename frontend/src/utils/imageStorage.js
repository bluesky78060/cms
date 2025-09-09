// 도장 이미지 저장을 위한 유틸리티
const STAMP_IMAGE_KEY = 'constructionApp_stampImage';

// localStorage에 이미지 저장
export const saveStampImage = (imageDataUrl) => {
  try {
    localStorage.setItem(STAMP_IMAGE_KEY, imageDataUrl);
    console.log('도장 이미지가 localStorage에 저장되었습니다.');
    return true;
  } catch (error) {
    console.error('도장 이미지 저장 실패:', error);
    return false;
  }
};

// localStorage에서 이미지 불러오기
export const loadStampImage = () => {
  try {
    const imageData = localStorage.getItem(STAMP_IMAGE_KEY);
    if (imageData) {
      console.log('도장 이미지가 localStorage에서 로드되었습니다.');
    }
    return imageData;
  } catch (error) {
    console.error('도장 이미지 로드 실패:', error);
    return null;
  }
};

// localStorage에서 이미지 삭제
export const removeStampImage = () => {
  try {
    localStorage.removeItem(STAMP_IMAGE_KEY);
    console.log('도장 이미지가 localStorage에서 삭제되었습니다.');
    return true;
  } catch (error) {
    console.error('도장 이미지 삭제 실패:', error);
    return false;
  }
};

// localStorage 저장 공간 확인
export const checkStorageAvailable = () => {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    console.error('localStorage 사용 불가:', error);
    return false;
  }
};

// 이미지 파일을 Base64로 변환
export const imageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// localStorage 사용량 확인 (개발용)
export const getStorageInfo = () => {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return {
    used: Math.round(total / 1024) + ' KB',
    stampImageSize: localStorage.getItem(STAMP_IMAGE_KEY) 
      ? Math.round(localStorage.getItem(STAMP_IMAGE_KEY).length / 1024) + ' KB'
      : '0 KB'
  };
};
// 전화번호 자동 하이픈 포맷팅 유틸리티

// 전화번호에서 숫자만 추출
export const extractNumbers = (phoneNumber) => {
  return phoneNumber.replace(/\D/g, '');
};

// 휴대전화번호 포맷팅 (010-XXXX-XXXX)
export const formatMobileNumber = (value) => {
  const numbers = extractNumbers(value);
  
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else if (numbers.length <= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }
  
  // 11자리 초과시 자르기
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
};

// 일반전화번호 포맷팅 (지역번호에 따라 다름)
export const formatPhoneNumber = (value) => {
  const numbers = extractNumbers(value);
  
  // 02 (서울) - 02-XXX-XXXX 또는 02-XXXX-XXXX
  if (numbers.startsWith('02')) {
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
    } else {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    }
  }
  
  // 031, 032, 033, 041, 042, 043, 051, 052, 053, 054, 055, 061, 062, 063, 064 등
  // 3자리 지역번호 - XXX-XXX-XXXX 또는 XXX-XXXX-XXXX
  if (numbers.length >= 3) {
    const areaCode = numbers.slice(0, 3);
    const validAreaCodes = ['031', '032', '033', '041', '042', '043', '044', '051', '052', '053', '054', '055', '061', '062', '063', '064', '070'];
    
    if (validAreaCodes.includes(areaCode)) {
      if (numbers.length <= 3) {
        return numbers;
      } else if (numbers.length <= 6) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else if (numbers.length <= 10) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
      } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
      }
    }
  }
  
  // 기본 포맷팅 (길이에 따라)
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else if (numbers.length <= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }
  
  // 11자리 초과시 자르기
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
};

// 전화번호 유효성 검사
export const validatePhoneNumber = (phoneNumber) => {
  const numbers = extractNumbers(phoneNumber);
  
  // 휴대전화 (010, 011, 016, 017, 018, 019)
  if (numbers.startsWith('01')) {
    return numbers.length >= 10 && numbers.length <= 11;
  }
  
  // 일반전화 (최소 9자리, 최대 11자리)
  return numbers.length >= 9 && numbers.length <= 11;
};

// 입력 이벤트 핸들러
export const handlePhoneInput = (value, iseMobile = false) => {
  if (iseMobile) {
    return formatMobileNumber(value);
  } else {
    return formatPhoneNumber(value);
  }
};
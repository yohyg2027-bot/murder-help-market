// 거래 지역 / 가격대 분류용 공통 데이터
// location 컬럼에는 "시/도 시군구" 형식으로 저장됩니다. 예) "서울 강남구", "전국 전체"

export const SIDO_LIST = [
  '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산',
  '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '전국',
] as const

export type Sido = typeof SIDO_LIST[number]

// 시/도별 시군구 목록 (전체는 UI에서 별도로 맨 앞에 추가)
export const SIGUNGU_MAP: Record<string, string[]> = {
  서울: [
    '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
    '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
    '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구',
  ],
  경기: [
    '수원시', '성남시', '고양시', '용인시', '부천시', '안산시', '안양시', '남양주시',
    '화성시', '평택시', '의정부시', '시흥시', '파주시', '김포시', '광명시', '광주시',
    '군포시', '하남시', '오산시', '이천시',
  ],
  인천: ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'],
  부산: [
    '해운대구', '부산진구', '동래구', '남구', '북구', '사하구', '금정구', '연제구',
    '수영구', '사상구', '중구', '서구', '동구', '영도구', '강서구', '기장군',
  ],
  대구: ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군'],
  광주: ['동구', '서구', '남구', '북구', '광산구'],
  대전: ['동구', '중구', '서구', '유성구', '대덕구'],
  울산: ['중구', '남구', '동구', '북구', '울주군'],
  세종: [],
  강원: ['춘천시', '원주시', '강릉시', '속초시', '동해시', '삼척시'],
  충북: ['청주시', '충주시', '제천시'],
  충남: ['천안시', '아산시', '서산시', '당진시', '논산시'],
  전북: ['전주시', '군산시', '익산시', '정읍시'],
  전남: ['목포시', '여수시', '순천시', '광양시', '나주시'],
  경북: ['포항시', '경주시', '구미시', '안동시', '경산시'],
  경남: ['창원시', '김해시', '진주시', '양산시', '거제시', '통영시'],
  제주: ['제주시', '서귀포시'],
  전국: [],
}

// "서울 강남구" 형식의 location 문자열 만들기
export function buildLocation(sido: string, sigungu: string): string {
  if (!sido) return ''
  if (!sigungu || sigungu === '전체') return `${sido} 전체`
  return `${sido} ${sigungu}`
}

// 저장된 location 문자열을 시/도 + 시군구로 분리
export function parseLocation(location: string | null | undefined): { sido: string; sigungu: string } {
  if (!location) return { sido: '', sigungu: '' }
  const [sido, ...rest] = location.trim().split(' ')
  const sigungu = rest.join(' ')
  return { sido: sido ?? '', sigungu: sigungu === '전체' ? '' : sigungu }
}

// 가격대 필터 구간 (min/max 모두 포함, 원 단위)
export type PriceRange = {
  key: string
  label: string
  min: number
  max: number | null
}

export const PRICE_RANGES: PriceRange[] = [
  { key: 'under5', label: '5만원 이하', min: 0, max: 50000 },
  { key: '5to10', label: '5만~10만', min: 50001, max: 100000 },
  { key: '10to30', label: '10만~30만', min: 100001, max: 300000 },
  { key: '30to50', label: '30만~50만', min: 300001, max: 500000 },
  { key: '50to100', label: '50만~100만', min: 500001, max: 1000000 },
  { key: 'over100', label: '100만원 이상', min: 1000001, max: null },
]

export function getPriceRange(key: string | undefined): PriceRange | null {
  if (!key) return null
  return PRICE_RANGES.find((r) => r.key === key) ?? null
}

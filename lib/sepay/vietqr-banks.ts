export type VietQrBank = {
  bankCode: string;
  bankName: string;
  bankShortName: string;
};

const POPULAR_CODES = [
  'VCB',
  'BIDV',
  'VTB',
  'AGR',
  'TCB',
  'MB',
  'ACB',
  'VPB',
  'STB',
  'TPB',
  'HDB',
  'VIB',
  'MSB',
  'OCB',
  'SHB',
  'LPB',
] as const;

const RAW_BANKS: readonly VietQrBank[] = [
  { bankCode: 'TCB', bankName: 'Ngân hàng TMCP Kỹ thương Việt Nam', bankShortName: 'Techcombank' },
  { bankCode: 'COOPBANK', bankName: 'Ngân hàng Hợp tác xã Việt Nam', bankShortName: 'COOPBANK' },
  { bankCode: 'ACB', bankName: 'Ngân hàng TMCP Á Châu', bankShortName: 'ACB' },
  { bankCode: 'KBHN', bankName: 'Ngân hàng Kookmin - Chi nhánh Hà Nội', bankShortName: 'KookminHN' },
  { bankCode: 'IBK', bankName: 'Ngân hàng Công nghiệp Hàn Quốc', bankShortName: 'IBK' },
  { bankCode: 'VAB', bankName: 'Ngân hàng TMCP Việt Á', bankShortName: 'VietABank' },
  { bankCode: 'MSB', bankName: 'Ngân hàng TMCP Hàng Hải', bankShortName: 'MSB' },
  { bankCode: 'ABB', bankName: 'Ngân hàng TMCP An Bình', bankShortName: 'ABBANK' },
  { bankCode: 'LIOBANK', bankName: 'Ngân hàng số LioBank', bankShortName: 'LioBank' },
  { bankCode: 'VPB', bankName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', bankShortName: 'VPBank' },
  { bankCode: 'CBB', bankName: 'Ngân hàng Thương mại TNHH MTV Xây dựng Việt Nam', bankShortName: 'CBBank' },
  { bankCode: 'KPB', bankName: 'Ngân hàng Đại chúng Kasikornbank - Chi nhánh TP. Hồ Chí Minh', bankShortName: 'KBank' },
  { bankCode: 'WRB', bankName: 'Ngân hàng TNHH MTV Woori Việt Nam', bankShortName: 'Woori' },
  { bankCode: 'HSBC', bankName: 'Ngân hàng TNHH MTV HSBC (Việt Nam)', bankShortName: 'HSBC' },
  { bankCode: 'BNPHCM', bankName: 'Ngân hàng BNP Paribas - Chi nhánh TP. Hồ Chí Minh', bankShortName: 'BNPHCM' },
  { bankCode: 'GPB', bankName: 'Ngân hàng Thương mại TNHH MTV Dầu Khí Toàn Cầu', bankShortName: 'GPBank' },
  { bankCode: 'PBVN', bankName: 'Ngân hàng TNHH MTV Public Việt Nam', bankShortName: 'PublicBank' },
  { bankCode: 'CAKE', bankName: 'TMCP Việt Nam Thịnh Vượng - Ngân hàng số CAKE by VPBank', bankShortName: 'CAKE' },
  { bankCode: 'VTB', bankName: 'Ngân hàng TMCP Công thương Việt Nam', bankShortName: 'Vietinbank' },
  { bankCode: 'BVB', bankName: 'Ngân hàng TMCP Bảo Việt', bankShortName: 'BaoVietBank' },
  { bankCode: 'HONGLEONG', bankName: 'Ngân hàng TNHH MTV Hongleong Việt Nam', bankShortName: 'HongLeong' },
  { bankCode: 'KEBHCM', bankName: 'Ngân hàng Keb Hana - Chi nhánh TP. Hồ Chí Minh', bankShortName: 'KEBHanaHCMBank' },
  { bankCode: 'BNPHN', bankName: 'Ngân hàng BNP Paribas - Chi nhánh Hà Nội', bankShortName: 'BNPHN' },
  { bankCode: 'VIB', bankName: 'Ngân hàng TMCP Quốc tế Việt Nam', bankShortName: 'VIB' },
  { bankCode: 'VRB', bankName: 'Ngân hàng Liên doanh Việt - Nga', bankShortName: 'VRB' },
  { bankCode: 'OCB', bankName: 'Ngân hàng TMCP Phương Đông', bankShortName: 'OCB' },
  { bankCode: 'BAB', bankName: 'Ngân hàng TMCP Bắc Á', bankShortName: 'BacABank' },
  { bankCode: 'KBHCM', bankName: 'Ngân hàng Kookmin - Chi nhánh Thành phố Hồ Chí Minh', bankShortName: 'KookminHCM' },
  { bankCode: 'DAB', bankName: 'Ngân hàng TMCP Đông Á', bankShortName: 'DongABank' },
  { bankCode: 'CITIBANK', bankName: 'Ngân hàng Citibank - Chi nhánh Hà Nội', bankShortName: 'CitibankHN' },
  { bankCode: 'NCB', bankName: 'Ngân hàng TMCP Quốc Dân', bankShortName: 'NCB' },
  { bankCode: 'VCAB', bankName: 'Ngân hàng TMCP Bản Việt', bankShortName: 'VietCapitalBank' },
  { bankCode: 'DBS', bankName: 'DBS Bank Ltd - Chi nhánh Thành phố Hồ Chí Minh', bankShortName: 'DBSBank' },
  { bankCode: 'NHB', bankName: 'Ngân hàng Nonghyup - Chi nhánh Hà Nội', bankShortName: 'Nonghyup' },
  { bankCode: 'VTLMONEY', bankName: 'Tổng Công ty Dịch vụ số Viettel - Chi nhánh tập đoàn công nghiệp viễn thông Quân Đội', bankShortName: 'ViettelMoney' },
  { bankCode: 'LPB', bankName: 'Ngân hàng TMCP Lộc Phát Việt Nam', bankShortName: 'LPBank' },
  { bankCode: 'STB', bankName: 'Ngân hàng TMCP Sài Gòn Thương Tín', bankShortName: 'Sacombank' },
  { bankCode: 'Ubank', bankName: 'TMCP Việt Nam Thịnh Vượng - Ngân hàng số Ubank by VPBank', bankShortName: 'Ubank' },
  { bankCode: 'SHINHAN', bankName: 'Ngân hàng TNHH MTV Shinhan Việt Nam', bankShortName: 'ShinhanBank' },
  { bankCode: 'SBC', bankName: 'Ngân hàng TMCP Sài Gòn Công Thương', bankShortName: 'SaigonBank' },
  { bankCode: 'AGR', bankName: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam', bankShortName: 'Agribank' },
  { bankCode: 'HDB', bankName: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh', bankShortName: 'HDBank' },
  { bankCode: 'PGB', bankName: 'Ngân hàng TMCP Xăng dầu Petrolimex', bankShortName: 'PGBank' },
  { bankCode: 'MB', bankName: 'Ngân hàng TMCP Quân đội', bankShortName: 'MBBank' },
  { bankCode: 'BIDC', bankName: 'Ngân hàng Đầu tư và Phát triển Campuchia – Chi nhánh Hà Nội', bankShortName: 'BIDC' },
  { bankCode: 'SAB', bankName: 'Ngân hàng TMCP Đông Nam Á', bankShortName: 'SeABank' },
  { bankCode: 'VNPTMONEY', bankName: 'Trung tâm dịch vụ tài chính số VNPT- Chi nhánh Tổng công ty truyền thông (VNPT Fintech)', bankShortName: 'VNPTMoney' },
  { bankCode: 'SHB', bankName: 'Ngân hàng TMCP Sài Gòn - Hà Nội', bankShortName: 'SHB' },
  { bankCode: 'NAB', bankName: 'Ngân hàng TMCP Nam Á', bankShortName: 'NamABank' },
  { bankCode: 'CUBHCM', bankName: 'Ngân hàng Cathay United Bank – Chi nhánh TP. Hồ Chí Minh', bankShortName: 'CathayUnitedBank' },
  { bankCode: 'PVCB', bankName: 'Ngân hàng TMCP Đại Chúng Việt Nam', bankShortName: 'PVcomBank' },
  { bankCode: 'VBC', bankName: 'Ngân hàng TMCP Việt Nam Thương Tín', bankShortName: 'VietBank' },
  { bankCode: 'UOB', bankName: 'Ngân hàng United Overseas - Chi nhánh TP. Hồ Chí Minh', bankShortName: 'UnitedOverseas' },
  { bankCode: 'TPB', bankName: 'Ngân hàng TMCP Tiên Phong', bankShortName: 'TPBank' },
  { bankCode: 'UMEE', bankName: 'Ngân hàng số Umee – Kiên Long Bank', bankShortName: 'KienLongBank' },
  { bankCode: 'CIMB', bankName: 'Ngân hàng TNHH MTV CIMB Việt Nam', bankShortName: 'CIMB' },
  { bankCode: 'KLB', bankName: 'Ngân hàng TMCP Kiên Long', bankShortName: 'KienLongBank' },
  { bankCode: 'VCB', bankName: 'Ngân hàng TMCP Ngoại Thương Việt Nam', bankShortName: 'Vietcombank' },
  { bankCode: 'TIMO', bankName: 'Ngân hàng số Timo by Ban Viet Bank (Timo by Ban Viet Bank)', bankShortName: 'Timo' },
  { bankCode: 'IVB', bankName: 'Ngân hàng TNHH Indovina', bankShortName: 'IndovinaBank' },
  { bankCode: 'SCB', bankName: 'Ngân hàng TMCP Sài Gòn', bankShortName: 'SCB' },
  { bankCode: 'BIDV', bankName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', bankShortName: 'BIDV' },
  { bankCode: 'EIB', bankName: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam', bankShortName: 'Eximbank' },
  { bankCode: 'SCVN', bankName: 'Ngân hàng TNHH MTV Standard Chartered Bank Việt Nam', bankShortName: 'StandardChartered' },
  { bankCode: 'MBV', bankName: 'Ngân hàng Thương mại TNHH MTV Đại Dương', bankShortName: 'Oceanbank' },
  { bankCode: 'KEBHN', bankName: 'Ngân hàng Keb Hana - Chi nhánh Hà Nội', bankShortName: 'KEBHanaHNBank' },
];

const POPULAR_INDEX = new Map<string, number>(
  POPULAR_CODES.map((code, index) => [code, index])
);

export const VIETQR_BANKS: readonly VietQrBank[] = [...RAW_BANKS].sort((a, b) => {
  const ai = POPULAR_INDEX.get(a.bankCode);
  const bi = POPULAR_INDEX.get(b.bankCode);
  if (ai !== undefined || bi !== undefined) {
    if (ai === undefined) return 1;
    if (bi === undefined) return -1;
    return ai - bi;
  }
  return (
    a.bankShortName.localeCompare(b.bankShortName) ||
    a.bankCode.localeCompare(b.bankCode)
  );
});

export function normalizeBankSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

export function findVietQrBank(
  value: string | null | undefined
): VietQrBank | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  const needle = normalizeBankSearch(raw);
  return (
    VIETQR_BANKS.find((bank) => normalizeBankSearch(bank.bankCode) === needle) ??
    VIETQR_BANKS.find(
      (bank) => normalizeBankSearch(bank.bankShortName) === needle
    )
  );
}

export type LegalSlug = 'terms' | 'privacy' | 'cookies';

export type LegalDoc = {
  slug: LegalSlug;
  title: string;
  updated: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
};

export const LEGAL_PAGES: Record<LegalSlug, LegalDoc> = {
  terms: {
    slug: 'terms',
    title: 'Điều khoản sử dụng',
    updated: '12/08/2026',
    intro:
      'Khi tạo tài khoản trên VBNB, bạn xác nhận đã đọc và đồng ý với các điều khoản dưới đây. Điều khoản áp dụng cho Khách hàng, Sale và Chủ nhà (Owner).',
    sections: [
      {
        heading: 'Quyền của VBNB',
        paragraphs: [
          'VBNB được quyền sử dụng thông tin tài khoản của Khách hàng, Sale và Owner để vận hành sàn: xác thực đăng nhập, tạo booking, phân phối lead, hỗ trợ giao dịch và chống gian lận.',
          'VBNB không bán thông tin cá nhân cho bên thứ ba ngoài phạm vi vận hành nền tảng. Việc chia sẻ trong sàn (ví dụ SĐT khách cho sale khi khách chủ động yêu cầu liên hệ) được mô tả rõ ở mục Khách hàng.',
          'VBNB có quyền tạm khóa, cảnh cáo hoặc chấm dứt tài khoản khi phát hiện vi phạm điều khoản, hành vi lừa đảo hoặc chiếm dụng tiền.',
        ],
      },
      {
        heading: 'Cảnh báo lừa đảo và chiếm dụng tiền',
        paragraphs: [
          'Nghiêm cấm giả mạo danh tính, tạo booking ảo, yêu cầu chuyển khoản ngoài luồng VBNB, chiếm dụng tiền cọc / thanh toán, hoặc bất kỳ hành vi nhằm chiếm đoạt tài sản của bên khác.',
          'Khi có dấu hiệu gian lận, VBNB có quyền khóa tài khoản ngay và cung cấp thông tin liên quan cho cơ quan có thẩm quyền theo pháp luật Việt Nam.',
        ],
      },
      {
        heading: 'Đối với Khách hàng',
        paragraphs: [
          'VBNB không buôn bán thông tin cá nhân, số điện thoại của khách cho các bên bên ngoài nền tảng.',
          'Đăng ký tài khoản đồng nghĩa bạn đồng ý: khi bạn dùng chức năng “Cần liên lạc sale” trên trang villa / booking, số điện thoại của bạn sẽ được hiển thị cho saleman và tư vấn viên trên VBNB để họ liên hệ hỗ trợ.',
          'Bạn chịu trách nhiệm về tính chính xác của họ tên và số điện thoại đã đăng ký.',
        ],
      },
      {
        heading: 'Đối với Sale',
        paragraphs: [
          'Sale phải tư vấn trung thực, không được lừa đảo khách, Owner hoặc các sale khác, không chiếm dụng tiền cọc / thanh toán.',
          'Hành vi lừa đảo dẫn đến ban tài khoản vĩnh viễn. Thông tin tài khoản và giao dịch liên quan có thể được VBNB cung cấp cho cơ quan điều tra và xử lý theo pháp luật Việt Nam.',
        ],
      },
      {
        heading: 'Đối với Owner',
        paragraphs: [
          'Owner phải chi trả hoa hồng / thù lao cho Sale đúng thời hạn theo thỏa thuận và quy định trên nền tảng.',
          'Không thanh toán đúng hạn có thể bị cảnh cáo. Vi phạm lặp lại hoặc cố ý chiếm dụng có thể dẫn đến xóa asset vĩnh viễn và khóa tài khoản.',
        ],
      },
    ],
  },
  privacy: {
    slug: 'privacy',
    title: 'Chính sách bảo mật',
    updated: '12/08/2026',
    intro:
      'Chính sách này giải thích VBNB thu thập, sử dụng và chia sẻ thông tin cá nhân như thế nào khi bạn dùng nền tảng.',
    sections: [
      {
        heading: 'Thông tin chúng tôi thu thập',
        paragraphs: [
          'Khách hàng: họ tên, số điện thoại, mật khẩu (được mã hóa bởi hệ thống xác thực).',
          'Sale và Owner: họ tên, email, số điện thoại, mật khẩu, và dữ liệu vận hành (booking, lead, tài sản, thanh toán gói).',
        ],
      },
      {
        heading: 'Cách chúng tôi sử dụng thông tin',
        paragraphs: [
          'Vận hành tài khoản, đăng nhập, xác minh OTP, tạo và quản lý booking.',
          'Phân phối lead khi khách bấm “Cần liên lạc sale”.',
          'Hỗ trợ, xử lý tranh chấp, chống gian lận và tuân thủ pháp luật.',
        ],
      },
      {
        heading: 'Chia sẻ thông tin',
        paragraphs: [
          'VBNB không bán thông tin cá nhân hay số điện thoại cho bên thứ ba ngoài nền tảng.',
          'Trong sàn: SĐT khách được chia sẻ với Sale / tư vấn viên chỉ khi khách chủ động dùng “Cần liên lạc sale”.',
          'VBNB có thể cung cấp thông tin cho cơ quan nhà nước khi pháp luật yêu cầu hoặc khi điều tra hành vi lừa đảo.',
        ],
      },
      {
        heading: 'Bảo mật và quyền của bạn',
        paragraphs: [
          'Bạn nên giữ mật khẩu riêng tư và không chia sẻ OTP cho người lạ.',
          'Muốn chỉnh sửa thông tin tài khoản, dùng trang hồ sơ trong ứng dụng hoặc liên hệ VBNB.',
        ],
      },
    ],
  },
  cookies: {
    slug: 'cookies',
    title: 'Chính sách cookie',
    updated: '12/08/2026',
    intro:
      'VBNB dùng cookie và công nghệ lưu trữ tương tự để giữ phiên đăng nhập và vận hành trang.',
    sections: [
      {
        heading: 'Cookie cần thiết',
        paragraphs: [
          'Cookie phiên đăng nhập (do hệ thống xác thực tạo) giúp bạn không phải nhập lại tài khoản mỗi lần mở trang.',
          'Các cookie này cần để đăng nhập, phân quyền Guest / Sale / Owner / Admin và bảo vệ phiên làm việc.',
        ],
      },
      {
        heading: 'Cookie chúng tôi không dùng',
        paragraphs: [
          'Hiện VBNB không dùng cookie quảng cáo của bên thứ ba hay mạng quảng cáo để theo dõi bạn trên website khác.',
        ],
      },
      {
        heading: 'Quản lý cookie',
        paragraphs: [
          'Bạn có thể xóa hoặc chặn cookie trong trình duyệt. Nếu chặn cookie cần thiết, một số chức năng (đăng nhập, giữ phiên) sẽ không hoạt động.',
        ],
      },
    ],
  },
};

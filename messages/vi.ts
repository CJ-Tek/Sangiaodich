import { ownerVi } from './owner/vi';
import { payVi } from './pay/index';
import { saleVi } from './sale/vi';
import { subscriptionVi } from './subscription/vi';

const messages = {
  "common": {
    "appName": "VBNB",
    "appDescription": "Sàn giao dịch tài sản lưu trú",
    "homeAriaLabel": "VBNB trang chủ",
    "switchLanguage": "Chuyển sang {lang}",
    "updated": "Cập nhật",
    "enterApp": "Vào app",
    "login": "Đăng nhập",
    "register": "Đăng ký",
    "getStarted": "Bắt đầu ngay",
    "openMenu": "Mở menu",
    "copyright": "© {year} VBNB",
    "logout": "Đăng xuất",
    "copy": "Sao chép",
    "copied": "Đã copy",
    "vietQr": {
      "label": "Mã NH VietQR",
      "description": "Chọn ngân hàng để tạo QR động kèm số tiền + nội dung. Gõ tên hoặc mã để tìm.",
      "bankNotFound": "Không tìm thấy ngân hàng"
    }
  },
  "nav": {
    "exploreVillas": "Khám phá villas",
    "forOwners": "Dành cho Chủ villa",
    "forSales": "Dành cho Sale",
    "pricing": "Bảng giá",
    "aboutUs": "Về chúng tôi"
  },
  "login": {
    "subtitle": "Tạo tài khoản — chọn đúng role (không đổi sau này).",
    "modeLogin": "Đăng nhập",
    "modeRegister": "Đăng ký",
    "identifierLabel": "Email hoặc số điện thoại",
    "identifierPlaceholder": "email@... hoặc 09xx xxx xx xx",
    "identifierPhoneHint": "Số điện thoại gõ 0 ở đầu (vd. 0961990739) — hệ thống tự chuẩn hóa.",
    "passwordLabel": "Mật khẩu",
    "rememberAccount": "Lưu tài khoản",
    "loginButton": "Đăng nhập",
    "roleQuestion": "Bạn tham gia với vai trò nào?",
    "roleFixedNote": "Role gắn cố định với tài khoản — không đổi sau khi đăng ký.",
    "continue": "Tiếp tục",
    "registerTitle": "Đăng ký · {role}",
    "changeRole": "Đổi role",
    "fullNameLabel": "Họ và tên",
    "fullNamePlaceholder": "Nguyễn Văn A",
    "phoneLabel": "Số điện thoại",
    "phonePlaceholder": "09xx xxx xx xx",
    "phoneFormatHint": "Gõ số bắt đầu bằng 0 (vd. 0901234567).",
    "passwordMinHint": "Tối thiểu 8 ký tự",
    "confirmPasswordLabel": "Xác nhận mật khẩu",
    "sendOtp": "Gửi OTP",
    "otpLabel": "Mã OTP",
    "otpPlaceholder": "000000",
    "termsPrefix": "Tôi đã đọc và đồng ý",
    "termsLink": "Điều khoản sử dụng",
    "completeRegister": "Hoàn tất đăng ký",
    "emailLabel": "Email",
    "phoneOtpDescription": "Bắt buộc xác minh OTP để chống SĐT ảo",
    "paidRoleNote": "Sau đăng ký bạn vào app ở trạng thái chờ kích hoạt. Thanh toán gói subscription để mở chức năng.",
    "accountTrashed": "Tài khoản đã bị đưa vào trash. Liên hệ Admin để khôi phục.",
    "roles": {
      "GUEST": {
        "title": "Khách hàng",
        "blurb": "Tìm Villa, tìm nhân viên tư vấn tự do"
      },
      "SALE": {
        "title": "Sale",
        "blurb": "Nhận lead, tạo booking, quản lý khách hàng"
      },
      "OWNER": {
        "title": "Chủ nhà",
        "blurb": "Đăng tài sản, quản lý P&L"
      }
    },
    "validation": {
      "phoneRequired": "Số điện thoại bắt buộc",
      "fullNameRequired": "Họ và tên bắt buộc",
      "passwordMismatch": "Mật khẩu xác nhận không khớp",
      "passwordMinLength": "Mật khẩu tối thiểu 8 ký tự",
      "otpRequired": "Vui lòng nhập mã OTP đã gửi tới SĐT",
      "termsRequired": "Vui lòng đồng ý điều khoản sử dụng"
    },
    "success": {
      "register": "Đăng ký thành công"
    }
  },
  "landing": {
    "hero": {
      "badge": "Nền tảng thông minh kết nối chủ villa, sale & khách hàng",
      "titleLine1": "Sàn giao dịch villa",
      "titleLine2": "thông minh kết nối",
      "titleHighlight": "Chủ villa, Sale & Khách hàng",
      "bullets": [
        "Chủ villa kết nối được với nhiều sale, tăng lợi nhuận",
        "Sale không cần tự tìm kiếm khách và chủ nhà",
        "Khách hàng được hưởng dịch vụ tốt hơn từ sale có tâm"
      ],
      "exploreCta": "Khám phá villas",
      "learnMoreCta": "Tìm hiểu thêm",
      "imageAlt": "Villa hiện đại với hồ bơi"
    },
    "trustStrip": {
      "ariaLabel": "Đối tác tin tưởng",
      "tagline": "Được tin tưởng bởi chủ villa và sales chuyên nghiệp"
    },
    "howItWorks": {
      "eyebrow": "VBNB hoạt động như thế nào",
      "title": "Cùng nhau phát triển đơn giản hơn",
      "steps": {
        "owner": {
          "title": "Chủ villa đăng tài sản",
          "body": "Thiết lập giá vốn, lịch trống và dễ dàng quản lý."
        },
        "sale": {
          "title": "Sale chốt nhiều đơn hơn",
          "body": "Truy cập toàn bộ villa, tạo booking và tối ưu lợi nhuận."
        },
        "guest": {
          "title": "Khách hàng tận hưởng kỳ nghỉ",
          "body": "Khám phá villa tuyệt đẹp và kết nối với sale phù hợp."
        }
      }
    },
    "owner": {
      "eyebrow": "Dành cho Chủ villa",
      "titleLine1": "Hiển thị nhiều hơn.",
      "titleLine2": "Booking nhiều hơn. Ít nỗ lực hơn.",
      "imageAlt": "Không gian nội thất villa",
      "statsTitle": "Hiệu suất villa của bạn",
      "statsBooking": "Booking",
      "statsRevenue": "Doanh thu",
      "features": {
        "network": {
          "title": "Tiếp cận mạng lưới sale chất lượng",
          "body": "Villa của bạn đến đúng người đang có khách — không cần tự chạy ads."
        },
        "transparency": {
          "title": "Minh bạch & an toàn",
          "body": "Giá vốn, lịch trống và đối soát rõ ràng. Guest không thấy giá trên sàn."
        },
        "growth": {
          "title": "Tăng booking, tăng doanh thu",
          "body": "Ít thao tác vận hành hơn, nhiều đêm được lấp hơn."
        }
      },
      "cta": "Đăng villa ngay"
    },
    "sale": {
      "eyebrow": "Dành cho Sale",
      "titleLine1": "Thông tin real-time.",
      "titleLine2": "Cơ hội nhiều hơn.",
      "features": {
        "inventory": {
          "title": "Truy cập giá vốn & lịch trống tức thì",
          "body": "Xem cost weekday/weekend và ngày đã book trước khi chốt khách."
        },
        "booking": {
          "title": "Tạo booking chỉ trong vài phút",
          "body": "Giữ chỗ, gửi thông tin thanh toán và theo dõi trạng thái realtime."
        },
        "membership": {
          "title": "Tăng hạng thành viên & thu nhập",
          "body": "Owner set mốc lần và % trên từng căn. Check-out càng nhiều trên căn đó, cost càng thấp nếu Owner đã mở chiết khấu."
        }
      }
    },
    "productShowcase": {
      "tagline": "Sàn villa",
      "openListings": "Listing mở",
      "monthlyBookings": "Booking tháng",
      "tier": "Hạng",
      "availability": "Lịch trống · 4 khách"
    },
    "pricing": {
      "eyebrow": "Bảng giá",
      "title": "Rõ ràng từ đầu.",
      "subtitle": "Phí để vào sàn VBNB. Gói càng dài, ưu đãi càng nhiều.",
      "roleTabAria": "Chọn vai trò",
      "ownerTab": "Chủ villa",
      "saleTab": "Sale",
      "emptyOwner": "Chưa có gói Chủ villa đang bật.",
      "emptySale": "Chưa có gói Sale đang bật.",
      "ctaOwner": "Đăng ký Chủ villa",
      "ctaSale": "Đăng ký Sale"
    },
    "featured": {
      "title": "Villa nổi bật",
      "viewAll": "Khám phá tất cả",
      "emptyTitle": "Chưa có listing",
      "emptyDescription": "Asset ACTIVE sẽ xuất hiện tại đây sau khi admin duyệt.",
      "emptyAction": "Đăng nhập"
    },
    "guestSignup": {
      "ariaLabel": "Tạo tài khoản khách",
      "text": "Tạo tài khoản để sale chốt booking và bạn theo dõi được lịch sử.",
      "cta": "Tạo tài khoản →"
    },
    "finalCta": {
      "title": "Sẵn sàng bắt đầu cùng VBNB?",
      "subtitle": "Tham gia cùng hàng ngàn chủ villa và sale chuyên nghiệp trên toàn quốc.",
      "ownerCta": "Tôi là Chủ villa",
      "saleCta": "Tôi là Sale"
    },
    "footer": {
      "tagline": "Nền tảng giao dịch villa hiện đại kết nối Chủ villa, Sale và Khách hàng.",
      "columns": {
        "platform": {
          "title": "Nền tảng",
          "exploreVillas": "Khám phá villas",
          "howItWorks": "Cách hoạt động",
          "pricing": "Bảng giá",
          "membership": "Thành viên"
        },
        "owner": {
          "title": "Dành cho Chủ villa",
          "listVilla": "Đăng villa",
          "guide": "Hướng dẫn",
          "policy": "Chính sách",
          "faq": "Câu hỏi thường gặp"
        },
        "sale": {
          "title": "Dành cho Sale",
          "forSales": "Dành cho Sales",
          "benefits": "Quyền lợi",
          "membership": "Membership sales",
          "resources": "Tài nguyên"
        },
        "about": {
          "title": "Về chúng tôi",
          "intro": "Giới thiệu",
          "careers": "Sự nghiệp",
          "news": "Tin tức",
          "contact": "Liên hệ"
        },
        "legal": {
          "title": "Pháp lý",
          "terms": "Điều khoản sử dụng",
          "privacy": "Chính sách bảo mật",
          "cookies": "Chính sách cookie"
        }
      }
    },
    "villaSearch": {
      "locationLabel": "Địa điểm",
      "locationPlaceholder": "Bạn muốn đi đâu?",
      "locationAria": "Địa điểm",
      "tagsLabel": "Thuộc tính",
      "tagsPlaceholder": "Hồ bơi, wifi, gần biển...",
      "tagsAria": "Thuộc tính villa",
      "submit": "Tìm kiếm villas",
      "advancedToggle": "Tìm kiếm nâng cao",
      "budgetLabel": "Ngân sách / đêm",
      "budgetFrom": "Từ",
      "budgetFromAria": "Ngân sách từ",
      "budgetTo": "Đến",
      "budgetToAria": "Ngân sách đến",
      "budgetHint": "Hiện villa dưới mức tối đa. Không hiện giá trên danh sách.",
      "datesLabel": "Ngày ở",
      "datesPlaceholder": "Nhận phòng – Trả phòng",
      "datesAria": "Ngày ở",
      "guestsLabel": "Số khách",
      "guestsPlaceholder": "Sức chứa tối thiểu",
      "guestsAria": "Số khách"
    }
  },
  "marketplace": {
    "page": {
      "title": "Khám phá villas",
      "description": "Lọc theo địa điểm và thuộc tính chủ nhà đã đăng. Không hiển thị giá.",
      "emptyTitle": "Không tìm thấy",
      "emptyDescription": "Thử từ khóa khác, bớt thuộc tính, hoặc nới ngân sách / số khách.",
      "clearFilters": "Xóa bộ lọc"
    },
    "signup": {
      "text": "Tạo tài khoản để sale chốt booking và bạn theo dõi được lịch sử.",
      "cta": "Tạo tài khoản →"
    },
    "assetCard": {
      "idPrefix": "ID",
      "apartment": "Căn hộ",
      "villa": "Villa",
      "bedrooms": "{count} PN",
      "guests": "{count} khách",
      "bathrooms": "{count} WC",
      "costWeekday": "Cost (WD)",
      "costWeekend": "Cost (WE)"
    },
    "detail": {
      "availability": "Lịch trống",
      "capacityMeta": "{capacity} khách · {bedrooms} PN · {bathrooms} WC"
    },
    "calendar": {
      "prevMonth": "Tháng trước",
      "nextMonth": "Tháng sau",
      "legendAvailable": "Trống",
      "legendHold": "Đang giữ",
      "legendClosed": "Đóng",
      "legendBooked": "Đã book",
      "weekdays": {
        "mon": "T2",
        "tue": "T3",
        "wed": "T4",
        "thu": "T5",
        "fri": "T6",
        "sat": "T7",
        "sun": "CN"
      }
    },
    "gallery": {
      "photoOf": "Ảnh {index} của {title}",
      "photoAlt": "{title} — ảnh {index}",
      "prevPhoto": "Ảnh trước",
      "nextPhoto": "Ảnh sau",
      "viewPhoto": "Xem ảnh {index}",
      "viewAllPhotos": "Xem tất cả ảnh",
      "close": "Đóng"
    },
    "pagination": {
      "itemLabel": "villa"
    },
    "ctas": {
      "copyIdSuccess": "Đã copy mã villa",
      "copyLinkSuccess": "Đã copy",
      "shareTitle": "VBNB asset",
      "error": "Lỗi",
      "leadSuccess": "Đã gửi yêu cầu — sale đang trả phí sẽ thấy thông tin của bạn",
      "loggedInTitle": "Đã đăng nhập",
      "loggedInBody": "Bấm “Cần liên lạc sale” để gửi yêu cầu cho villa này. Chúng tôi chỉ chia sẻ số điện thoại của bạn khi bạn tự bấm.",
      "loginHint": "Cần đăng nhập để liên lạc sale — sale chỉ tạo được booking cho tài khoản đã có trên hệ thống.",
      "copyId": "Copy ID",
      "copyLink": "Copy link",
      "share": "Share",
      "contactSale": "Cần liên lạc sale"
    }
  },
  "guest": {
    "nav": {
      "home": "Trang chủ",
      "explore": "Khám phá",
      "bookings": "Booking",
      "profile": "Tài khoản"
    },
    "shell": {
      "roleLabel": "Khách",
      "account": "Tài khoản",
      "login": "Đăng nhập"
    },
    "home": {
      "greeting": "Xin chào {name}",
      "greetingFallback": "bạn",
      "description": "Tổng quan booking và hạng thành viên của bạn."
    },
    "explore": {
      "title": "Khám phá villa",
      "description": "Chọn villa bạn thích rồi bấm liên lạc sale — sale sẽ báo giá và tạo booking.",
      "backToAll": "← Tất cả villa"
    },
    "bookings": {
      "title": "Booking",
      "description": "Booking do sale tạo hộ — không tự book trên sàn.",
      "emptyTitle": "Chưa có booking nào",
      "emptyDescription": "Booking sale tạo cho bạn sẽ hiện ở đây.",
      "emptyAction": "Khám phá villa",
      "viewDetail": "Xem chi tiết",
      "paidFull": "Đã thanh toán đủ",
      "remainingOwner": "Còn {amount} · CK chủ nhà lúc nhận phòng",
      "remainingSale": "Còn {amount} · CK Sale"
    },
    "bookingDetail": {
      "title": "Chi tiết booking",
      "backToAll": "← Tất cả booking",
      "viewVilla": "Xem villa",
      "payment": "Thanh toán",
      "listPrice": "Giá booking",
      "collectedSale": "Đã thanh toán (Sale)",
      "collectedOwner": "Đã thanh toán (chủ nhà)",
      "remaining": "Còn lại",
      "refunded": "Đã hoàn",
      "remainderOwnerNote": "Phần còn lại chuyển cho chủ nhà lúc nhận phòng. Chủ nhà ghi nhận khi check-in.",
      "remainderSaleNote": "Thanh toán offline qua sale phụ trách. Số liệu trên do sale ghi nhận khi nhận tiền.",
      "paidFullNote": "Đã thanh toán đủ giá bán.",
      "timeline": "Tiến trình",
      "notYet": "Chưa",
      "saleContact": "Sale phụ trách",
      "saleName": "Tên",
      "salePhone": "SĐT",
      "noSaleInfo": "Chưa có thông tin sale."
    },
    "stats": {
      "totalBookings": "Tổng booking",
      "totalSpend": "Tổng chi tiêu"
    },
    "tier": {
      "currentLabel": "Hạng hiện tại",
      "maxBadge": "Hạng cao nhất",
      "atMax": "Bạn đang ở hạng cao nhất.",
      "progress": "Tiến độ lên {nextLabel}: {progressBooks}/{neededBooks} booking · {progressGmv}/{neededGmv}",
      "remaining": "Cần đủ cả số booking và số tiền mới lên hạng. Còn {remainingBooks} booking và {remainingGmv}.",
      "note": "Tích luỹ tính khi booking được chốt. Hủy booking đã chốt có thể hạ hạng."
    },
    "upcoming": {
      "title": "Chuyến sắp tới",
      "empty": "Chưa có chuyến nào.",
      "explore": "Khám phá villa",
      "viewDetail": "Xem chi tiết"
    },
    "profile": {
      "title": "Tài khoản",
      "description": "Cập nhật tên, ảnh đại diện và email.",
      "personalInfo": "Thông tin cá nhân",
      "personalInfoDesc": "Tên và ảnh đại diện hiển thị với sale phụ trách booking của bạn.",
      "fullName": "Họ và tên",
      "avatar": "Ảnh đại diện",
      "avatarHint": "Upload từ thiết bị (JPG/PNG/WebP, tối đa 2MB) hoặc dán link URL.",
      "choosePhoto": "Chọn ảnh",
      "removePhoto": "Xóa ảnh",
      "avatarUrl": "Avatar URL",
      "avatarUrlDesc": "Tùy chọn — dán link nếu không upload file.",
      "phone": "Số điện thoại",
      "phoneDesc": "Là danh tính đăng nhập OTP nên không đổi ở đây. Cần đổi thì liên hệ hỗ trợ.",
      "email": "Email",
      "emailDesc": "Tùy chọn — dùng để nhận thông tin booking.",
      "save": "Lưu hồ sơ",
      "uploadFailed": "Upload thất bại",
      "uploadSuccess": "Đã tải ảnh lên",
      "saveFailed": "Không lưu được",
      "saveSuccess": "Đã cập nhật hồ sơ"
    }
  },
  "errors": {
    "UNAUTHORIZED": {
      "ownerOnly": "Owner only",
      "saleOnly": "Sale only",
      "saleLoginRequired": "Sale login required",
      "guestLoginRequired": "Guest login required",
      "loginRequired": "Login required",
      "ownerSaleOnly": "Owner/Sale only",
      "adminOnly": "Admin only",
      "saleOrOwnerOnly": "Sale or Owner only",
      "invalidCronSecret": "Invalid cron secret"
    },
    "INVALID": {
      "titleRequired": "Title required",
      "propertyTypeRequired": "Chọn loại hình: Villa hoặc Căn hộ",
      "imagesRequiredForReview": "Cần ít nhất 1 ảnh khi nộp duyệt",
      "tagsRequiredForReview": "Chọn ít nhất 1 tag khi nộp duyệt",
      "invalidPropertyType": "Loại hình không hợp lệ",
      "passwordRequired": "Mật khẩu bắt buộc",
      "identifierRequired": "Email hoặc số điện thoại bắt buộc",
      "invalidPhone": "Số điện thoại không hợp lệ",
      "fullNameRequired": "Họ tên bắt buộc",
      "nationalIdFormat": "CCCD/CMND phải là 9 hoặc 12 chữ số",
      "nationalIdFrontInvalid": "Ảnh CCCD mặt trước không hợp lệ",
      "nationalIdFrontUploadOnly": "Ảnh CCCD phải upload qua hệ thống (không dán link)",
      "nationalIdBackInvalid": "Ảnh CCCD mặt sau không hợp lệ",
      "nationalIdBackUploadOnly": "Ảnh CCCD phải upload qua hệ thống (không dán link)",
      "ownerSaleRegisterOnly": "Chỉ đăng ký Owner hoặc Sale tại đây",
      "invalidEmail": "Email không hợp lệ",
      "passwordMinLength": "Mật khẩu tối thiểu 8 ký tự",
      "otpRequired": "Vui lòng nhập mã OTP đã gửi tới SĐT",
      "termsRequired": "Vui lòng đồng ý điều khoản sử dụng",
      "missingFile": "Thiếu file",
      "imageTypeOnly": "Chỉ chấp nhận JPG, PNG hoặc WebP",
      "fileTooLarge5Mb": "File quá lớn (tối đa 5MB)",
      "fileTooLarge3Mb": "File quá lớn (tối đa 3MB)",
      "fileTooLargeMb": "File quá lớn (tối đa {mb}MB)",
      "kindPaymentQr": "kind phải là payment_qr",
      "uploadKindInvalid": "kind phải là avatar | national_id_front | national_id_back | payout_qr",
      "invalidStatus": "Trạng thái không hợp lệ",
      "idRequired": "id required",
      "amountInvalid": "amount invalid",
      "compareAtAmountInvalid": "compareAtAmount invalid",
      "compareAtMustExceedPrice": "Giá gốc (so sánh) phải lớn hơn giá gói thanh toán",
      "profileIdAndPlanIdRequired": "profileId and planId required",
      "planNotFound": "Plan not found",
      "planRoleMismatch": "Plan role does not match user",
      "profileIdRequired": "profileId required",
      "assetIdRequired": "assetId required",
      "bookingIdRequired": "Thiếu bookingId",
      "paymentCodeAndAmountRequired": "paymentCode and amount required",
      "invalidNightCost": "Giá đêm không hợp lệ",
      "discountPercentRange": "% chiết khấu phải từ 0 đến 100",
      "discountThresholdInvalid": "Mốc lần không hợp lệ",
      "discountThresholdDuplicate": "Trùng mốc lần",
      "discountRulesTooMany": "Quá nhiều mốc chiết khấu",
      "discountRulesInvalid": "Danh sách chiết khấu không hợp lệ",
      "invalidName": "Tên khách bắt buộc"
    },
    "INVALID_PHONE": "Số điện thoại không hợp lệ",
    "INVALID_STATUS": {
      "generic": "status không hợp lệ",
      "bookingInvoice": "Booking này không xuất invoice",
      "ownerPayout": "Không ghi nhận CK Owner ở trạng thái này",
      "ownerConfirm": "Booking không còn ở trạng thái chờ Owner",
      "checkIn": "Chỉ check-in booking đã xác nhận",
      "checkOut": "Chỉ check-out booking đang check-in"
    },
    "RATE_LIMIT": {
      "otpSend": "Too many OTP requests",
      "otpVerify": "Too many verify attempts",
      "register": "Too many register attempts",
      "otpAttempts": "Too many OTP attempts",
      "leads": "Too many lead requests"
    },
    "OTP_SEND_FAILED": "Không gửi được OTP",
    "OTP_INVALID": "Mã OTP không hợp lệ",
    "CONFLICT": {
      "phoneExists": "SĐT đã có tài khoản. Hãy đăng nhập.",
      "emailExists": "Email đã có tài khoản. Hãy đăng nhập.",
      "phoneOrNationalIdTaken": "SĐT hoặc CCCD đã được dùng bởi tài khoản khác",
      "duplicatePhone": "Đã lưu SĐT này — mở bản ghi cũ để cập nhật",
      "duplicatePhoneActive": "SĐT đã tồn tại ở bản ghi ACTIVE khác"
    },
    "USER_CREATE_FAILED": "Cannot create user",
    "ROLE_SYNC_FAILED": "Đồng bộ role thất bại",
    "SUB_CREATE_FAILED": "Cannot create subscription",
    "NO_EMAIL": "User missing email",
    "SESSION_FAILED": "Cannot create session",
    "LOGOUT_FAILED": "Đăng xuất thất bại",
    "AUTH_FAILED": {
      "wrongCredentials": "SĐT hoặc mật khẩu không đúng",
      "generic": "Xác thực thất bại"
    },
    "AUTH_UNREACHABLE": "Không kết nối được máy chủ xác thực. Chạy lại npm run local.",
    "CREATE_FAILED": "Failed",
    "DRAFT_LIMIT": "Tối đa 15 asset nháp. Hãy nộp duyệt hoặc xóa nháp cũ.",
    "FORBIDDEN": {
      "notYourAsset": "Not your asset",
      "payoutAccountOwnerSaleOnly": "Chỉ Owner hoặc Sale cập nhật tài khoản nhận tiền",
      "payoutQrOwnerSaleOnly": "Chỉ Owner hoặc Sale upload QR nhận tiền",
      "notYourBooking": "Không phải booking của bạn",
      "notYourAssetBooking": "Không phải booking của căn bạn",
      "notYourProperty": "Không phải căn của bạn",
      "notYourAssetGeneric": "Không phải asset của bạn"
    },
    "UPDATE_FAILED": "Cập nhật thất bại",
    "BOOKING_CREATE_FAILED": {
      "belowFloor": "Giá bán dưới floor {amount}",
      "overlap": "Ngày đã được sale khác confirm — lịch đã khóa",
      "closed": "Owner đã đóng một hoặc nhiều đêm trong khoảng này",
      "guestDuplicate": "Guest này đã có booking trùng ngày trên asset này",
      "generic": "Tạo booking thất bại"
    },
    "CANCEL_FAILED": "Hủy booking thất bại",
    "INVALID_ACTION": "Unknown action",
    "SUBSCRIPTION_INACTIVE": "Subscription hết hạn — gia hạn để tiếp tục",
    "LIST_FAILED": "Tải danh sách thất bại",
    "MISCONFIGURED": "CRON_SECRET is not configured",
    "EXPIRE_FAILED": "Gia hạn subscription thất bại",
    "GATEWAY_NOT_CONFIGURED": "Chưa cấu hình SePay Payment Gateway (SEPAY_MERCHANT_ID / SECRET)",
    "GATEWAY_ERROR": "Lỗi cổng thanh toán",
    "NOT_FOUND": {
      "assetUnavailable": "Asset not available",
      "booking": "Không tìm thấy booking",
      "savedCustomer": "Không tìm thấy khách đã lưu"
    },
    "UPLOAD_FAILED": "Upload thất bại",
    "SIGN_FAILED": "Ký URL thất bại",
    "LIMIT": "Tối đa 12 ảnh / asset",
    "INVALID_COST": "Giá đêm không hợp lệ",
    "NO_OWNER_EARN": "Chưa có giá gốc — không gửi Owner được",
    "BELOW_OWNER_PAYOUT": "Cần xác nhận CK Owner tối thiểu 50% giá gốc ({amount}) trước khi gửi",
    "BELOW_DEPOSIT": "Cần thu cọc Guest tối thiểu 50% giá bán ({amount}) trước khi gửi",
    "OVERLAP": {
      "submitConfirmed": "Ngày đã bị Sale khác chốt (CONFIRMED) — không gửi được",
      "ownerConfirm": "Ngày đã được Sale khác chốt trước — không xác nhận được"
    },
    "CLOSED": {
      "submit": "Owner đã đóng đêm này — không gửi được",
      "ownerConfirm": "Đêm đã đóng — không xác nhận được",
      "create": "Owner đã đóng một hoặc nhiều đêm trong khoảng này"
    },
    "AMOUNT_REGRESSION": {
      "payment": "Số đã thu mới không được nhỏ hơn số đã ghi",
      "ownerPayout": "Số đã CK Owner không được nhỏ hơn số đã ghi",
      "checkIn": "Số đã nhận từ khách không được nhỏ hơn số đã ghi"
    },
    "ABOVE_LIST": "Không thu vượt giá bán",
    "LOCKED_AFTER_CONFIRM": "Sau khi Owner chốt, phần còn lại khách CK chủ nhà lúc check-in",
    "ABOVE_OWNER_EARN": "Không ghi nhận vượt phần Owner earn",
    "GUEST_BALANCE_DUE": "Khách chưa chuyển đủ phần còn lại — không check-in được",
    "ABOVE_REMAINDER": "Không ghi nhận vượt phần khách còn nợ",
    "ALREADY_PAID": "Khách đã đủ giá bán",
    "NO_PAYOUT": "Chưa cấu hình STK — vào Profile để điền tài khoản nhận tiền",
    "INSERT_FAILED": "Không tạo được invoice",
    "UNKNOWN": "Đã xảy ra lỗi",
    "BOOKING_NOT_FOUND": "Booking không thuộc sale này",
    "BOOKING_NOT_CLOSED": "Chỉ gắn booking đã chốt",
    "INVALID_SCORE": "Điểm phải từ 1 đến 10",
    "NOT_CHECKED_OUT": "Chỉ đánh giá sau khi check-out",
    "LOCKED": {
      "rating": "Đã gửi đánh giá — không sửa được",
      "night": "Đêm đã khóa booking — không đóng được"
    },
    "HOLD": "Đêm đang giữ chỗ — không đóng được",
    "PAST_NIGHT": "Không sửa đêm đã qua",
    "INVALID_DATE": "Ngày không hợp lệ",
    "ADMIN_UPDATE_FAILED": "Admin user action failed",
    "ACTIVATE_FAILED": "Activate failed",
    "ADMIN_USER": {
      "NOT_FOUND": "Không tìm thấy user",
      "IN_TRASH": "User đang trong trash",
      "INVALID_ROLE": "Chỉ gỡ subscription cho Owner/Sale",
      "NO_SUB": "User chưa có subscription",
      "NOT_ACTIVE": "Subscription hiện tại là {status}, không cần gỡ",
      "SELF_DELETE": "Không thể đưa chính tài khoản admin đang đăng nhập vào trash",
      "ALREADY_TRASHED": "User đã ở trong trash",
      "NOT_IN_TRASH": "User không nằm trong trash",
      "RACE_SOFT_DELETE": "Không thể soft delete (đã thay đổi)",
      "RACE_RESTORE": "Không thể restore (đã thay đổi)",
      "HARD_DELETE_DISABLED": "Xóa vĩnh viễn bị chặn theo chính sách hệ thống"
    },
    "planIdRequired": "planId required"
  },
  "auth": {
    "otp": {
      "send": "Gửi OTP",
      "code": "Mã OTP",
      "codePlaceholder": "000000",
      "sent": "Đã gửi mã OTP",
      "invalid": "Mã OTP không hợp lệ hoặc đã hết hạn"
    },
    "register": {
      "ownerSaleOnly": "Chỉ đăng ký Owner hoặc Sale tại đây",
      "success": "Đăng ký thành công",
      "pendingActivation": "Đăng ký thành công. Vui lòng thanh toán gói để kích hoạt tài khoản."
    },
    "password": {
      "required": "Mật khẩu bắt buộc",
      "minLength": "Mật khẩu tối thiểu 8 ký tự",
      "mismatch": "Mật khẩu xác nhận không khớp"
    },
    "phone": {
      "required": "Số điện thoại bắt buộc",
      "invalid": "Số điện thoại không hợp lệ",
      "otpRequired": "Vui lòng nhập mã OTP đã gửi tới SĐT",
      "otpDescription": "Bắt buộc xác minh OTP để chống SĐT ảo"
    },
    "email": {
      "invalid": "Email không hợp lệ",
      "exists": "Email đã có tài khoản. Hãy đăng nhập."
    },
    "fullName": {
      "required": "Họ tên bắt buộc"
    },
    "terms": {
      "required": "Vui lòng đồng ý điều khoản sử dụng",
      "agreePrefix": "Tôi đã đọc và đồng ý",
      "link": "Điều khoản sử dụng"
    },
    "account": {
      "phoneExists": "SĐT đã có tài khoản. Hãy đăng nhập.",
      "trashed": "Tài khoản đã bị đưa vào trash. Liên hệ Admin để khôi phục."
    },
    "rateLimit": {
      "otpSend": "Quá nhiều yêu cầu OTP. Vui lòng thử lại sau.",
      "otpVerify": "Quá nhiều lần xác minh. Vui lòng thử lại sau.",
      "register": "Quá nhiều lần đăng ký. Vui lòng thử lại sau.",
      "otpAttempts": "Quá nhiều lần nhập OTP. Vui lòng thử lại sau."
    },
    "session": {
      "createFailed": "Không tạo được phiên đăng nhập",
      "noEmail": "Tài khoản thiếu email"
    },
    "logout": {
      "failed": "Đăng xuất thất bại"
    },
    "login": {
      "failed": "SĐT hoặc mật khẩu không đúng",
      "unreachable": "Không kết nối được máy chủ xác thực. Chạy lại npm run local."
    }
  },
  "bookingStatus": {
    "PENDING": "Chờ Sale gửi Owner",
    "AWAITING_OWNER": "Chờ Owner xác nhận",
    "CONFIRMED": "Đã xác nhận",
    "CHECKED_IN": "Đã check-in",
    "CHECKED_OUT": "Đã check-out",
    "CANCELLED": "Đã hủy",
    "available": "Trống",
    "confirmed": "Đã book",
    "selected": "Đã chọn"
  },
  "assetTags": {
    "groups": {
      "location": "Vị trí",
      "space": "Không gian & view",
      "amenities": "Tiện nghi",
      "audience": "Phù hợp với",
      "style": "Phong cách",
      "access": "Tiện lợi"
    },
    "tags": {
      "in_center": "Ở trung tâm",
      "near_center": "Gần trung tâm",
      "near_beach": "Gần biển",
      "beachfront": "Sát biển / View biển",
      "near_mountain": "Gần núi / đồi",
      "mountain_view": "View núi / đồi",
      "near_lake": "Gần hồ / sông",
      "near_attraction": "Gần khu vui chơi",
      "near_market": "Gần chợ / siêu thị",
      "near_airport": "Gần sân bay",
      "near_landmark": "Gần điểm du lịch nổi bật",
      "quiet_suburb": "Yên tĩnh / ngoại ô",
      "private_pool": "Hồ bơi riêng",
      "garden": "Sân vườn rộng",
      "bbq": "Sân BBQ",
      "balcony": "Ban công / terrace",
      "sea_view": "View biển",
      "city_view": "View thành phố",
      "wifi": "Wifi",
      "tv": "TV",
      "sound_system": "Loa / Sound system",
      "streaming": "Netflix / máy chiếu",
      "air_con": "Máy lạnh",
      "heater": "Máy sưởi / lò sưởi",
      "washer": "Máy giặt",
      "dryer": "Máy sấy",
      "kitchen": "Bếp đầy đủ",
      "oven_microwave": "Lò nướng / lò vi sóng",
      "fridge": "Tủ lạnh",
      "coffee": "Ấm đun / máy pha cà phê",
      "indoor_grill": "Đồ nướng trong nhà",
      "hot_water": "Máy nước nóng",
      "bathtub": "Bồn tắm",
      "toiletries": "Toiletries / khăn",
      "security_cam": "Camera an ninh",
      "safe": "Két sắt",
      "family": "Gia đình có trẻ",
      "friends": "Nhóm bạn / party",
      "couple": "Cặp đôi / honeymoon",
      "team_building": "Team building",
      "remote_work": "Remote work",
      "pet_friendly": "Pet friendly",
      "luxury": "Sang trọng / luxury",
      "rustic": "Rustic / thiên nhiên",
      "minimal": "Minimal / hiện đại",
      "local_style": "Phong cách địa phương",
      "parking": "Bãi đậu xe / garage",
      "compound": "Compound / có bảo vệ",
      "self_checkin": "Self check-in"
    }
  },
  "propertyTypes": {
    "VILLA": "Villa",
    "APARTMENT": "Căn hộ"
  },
  "subscriptionLocked": {
    "expiredTitle": "Subscription hết hạn",
    "pendingTitle": "Chờ kích hoạt",
    "pendingDesc": "Chọn gói trên trang Subscription, quét QR (nội dung CK đã sẵn) để kích hoạt.",
    "expiredDesc": "Kỳ phí đã hết. Chọn gói và thanh toán để mở lại.",
    "inactiveDesc": "Subscription chưa ACTIVE. Vào Subscription để chọn gói.",
    "statusLabel": "Trạng thái: {status}",
    "choosePlan": "Chọn gói & thanh toán",
    "profile": "Hồ sơ cá nhân"
  },
  "sale": saleVi,
  "owner": ownerVi,
  "pay": payVi,
  "subscription": subscriptionVi,
  "inventory": {
    "listPriceGuestPay": "Giá bán cả stay (khách trả)",
    "collectedGuestMin": "Đã thu khách (tối thiểu 50% = {amount})",
    "collectedOwnerMin": "Đã CK Owner (tối thiểu 50% cost = {amount})",
    "collectedGuest": "Đã thu khách",
    "collectedOwner": "Đã CK Owner",
    "costNightTitle": "Giá đêm (cost Owner)",
    "night": "Đêm",
    "costInput": "Cost (VND). Để trống rồi lưu = dùng WD/WE"
  },
  "admin": {
    "layout": {
      "title": "Admin",
      "nav": {
        "overview": "Tổng quan",
        "assets": "Duyệt căn",
        "users": "Người dùng",
        "fees": "Phí & TT",
        "payments": "Thanh toán",
        "membership": "Membership"
      }
    },
    "overview": {
      "title": "Admin",
      "description": "Pending actions first — cấu hình sàn.",
      "pendingAssets": "Căn chờ duyệt",
      "reviewQueue": "Hàng đợi duyệt",
      "revenue": "Doanh thu",
      "revenueAll": "Tổng đã thu",
      "revenueAllHint": "SePay + Admin mark paid",
      "revenueMonthHint": "User trả phí trong tháng",
      "monthLabel": "Tháng {month}/{year}",
      "users": "Người dùng",
      "activePaid": "Đang active",
      "activePaidHint": "Owner/Sale còn hạn sub",
      "guests": "Khách",
      "owners": "Owner",
      "sales": "Sale",
      "operations": "Vận hành",
      "totalAssets": "Tổng số căn",
      "firmBookings": "Booking đã chốt",
      "completedBookings": "Đã hoàn thành",
      "leadRequests": "Yêu cầu lead"
    },
    "assets": {
      "title": "Duyệt căn",
      "description": "Mở chi tiết để xem ảnh + mô tả, rồi duyệt. PENDING_REVIEW → ACTIVE lên sàn.",
      "searchLabel": "Tìm kiếm",
      "searchPlaceholder": "Tên villa, địa điểm, owner, mô tả...",
      "searchButton": "Tìm",
      "filterAll": "Tất cả",
      "filterPending": "Chờ duyệt",
      "filterActive": "Đang active",
      "filterReject": "Từ chối",
      "filterSuspend": "Tạm ngưng",
      "emptyNotFound": "Không tìm thấy",
      "emptyNoAssets": "Không có asset",
      "emptySearchHint": "Thử từ khóa khác hoặc đổi trạng thái.",
      "emptyPendingHint": "Chưa có listing chờ duyệt.",
      "emptyStatusHint": "Không có asset ở trạng thái này.",
      "clearFilters": "Xóa bộ lọc",
      "ownerLabel": "Owner",
      "imagesCount": "{count} ảnh",
      "noDescription": "Chưa có mô tả.",
      "viewDetail": "Xem chi tiết",
      "itemLabel": "asset",
      "backToList": "← Duyệt căn",
      "noImagesTitle": "Chưa có ảnh",
      "noImagesBody": "Owner chưa upload hình. Nên yêu cầu bổ sung trước khi duyệt.",
      "noDescTitle": "Chưa có mô tả",
      "noDescBody": "Listing chưa có description.",
      "decisionTitle": "Quyết định",
      "decisionHint": "Duyệt → ACTIVE lên sàn. Từ chối / Suspend cần ghi lý do.",
      "reasonLabel": "Lý do (reject/suspend)",
      "approve": "Duyệt",
      "reject": "Từ chối",
      "suspend": "Tạm ngưng",
      "updatedStatus": "Đã cập nhật {status}"
    },
    "users": {
      "title": "Người dùng",
      "description": "Quản lý theo role, gỡ subscription, trash/restore. Mark paid là fallback khi SePay chưa nhận được.",
      "searchLabel": "Tìm kiếm",
      "searchPlaceholder": "Tên, SĐT hoặc email...",
      "tabs": {
        "OWNER": "Owner",
        "SALE": "Sale",
        "GUEST": "Guest",
        "ADMIN": "Admin",
        "TRASH": "Trash"
      },
      "trashSince": "Trash từ {date}",
      "noSub": "Chưa có sub",
      "removeSub": "Gỡ sub",
      "trash": "Trash",
      "restore": "Khôi phục",
      "hardDelete": "Xóa vĩnh viễn",
      "cannotTrashSelf": "Không thể đưa chính tài khoản đang đăng nhập vào trash",
      "confirmRemoveSub": "Gỡ subscription ACTIVE của user này?",
      "confirmTrash": "Đưa user vào trash? (có thể khôi phục sau)",
      "confirmRestore": "Khôi phục user khỏi trash?",
      "failed": "Thất bại",
      "removedSub": "Đã gỡ subscription",
      "trashed": "Đã đưa vào trash",
      "restored": "Đã khôi phục",
      "emptySearch": "Không tìm thấy “{query}”",
      "emptyTrash": "Trash trống",
      "emptyRole": "Chưa có {role}",
      "emptySearchHint": "Thử từ khóa khác hoặc đổi tab role / Trash.",
      "emptyTrashHint": "User soft-delete sẽ hiện ở đây để khôi phục.",
      "emptyRoleHint": "User thuộc role này sẽ hiện tại đây.",
      "userCount": "{count} user"
    },
    "fees": {
      "title": "Fees & thanh toán",
      "description": "Gói subscription (1/3/6/12) + STK / VietQR. Owner & Sale chọn gói trên trang Subscription.",
      "tabs": {
        "subscription": "Gói subscription",
        "payout": "Tài khoản nhận tiền"
      },
      "subscriptionHint": "Giá từng gói do Admin set. Số tiền CK phải khớp chính xác mới kích hoạt. Kỳ hạn tính theo tháng lịch.",
      "noPlans": "Chưa có gói nào.",
      "planMonthsCurrent": "({months} tháng · hiện {amount})",
      "planActive": "Bật",
      "planLabel": "Nhãn hiển thị",
      "planAmount": "Giá gói thanh toán (VND)",
      "planAmountHint": "Số tiền CK / SePay phải khớp chính xác.",
      "planCompareAt": "Giá gốc so sánh (VND)",
      "planCompareAtHint": "Để trống nếu không giảm giá. Phải lớn hơn giá thanh toán.",
      "planDiscountTag": "Tag: −{percent}%",
      "savePlan": "Lưu gói",
      "savedPlan": "Đã lưu gói {label}",
      "paymentHint": "Owner/Sale thấy thông tin này trên trang Subscription khi chờ kích hoạt hoặc gia hạn. Giá gói chỉnh ở tab Gói subscription.",
      "bankName": "Ngân hàng",
      "vietqrBank": "Mã ngân hàng VietQR",
      "vietqrBankHint": "Chọn ngân hàng để tạo QR động. Nếu trống sẽ lấy tên Ngân hàng ở trên. Gõ tên hoặc mã để tìm.",
      "accountName": "Chủ tài khoản",
      "accountNumber": "Số tài khoản",
      "qrImage": "Ảnh QR thanh toán",
      "qrImageHint": "Upload từ thiết bị (JPG/PNG/WebP, tối đa 3MB) hoặc dán link URL.",
      "qrAlt": "QR thanh toán",
      "chooseQr": "Chọn ảnh QR",
      "removeQr": "Xóa QR",
      "qrUrl": "QR image URL",
      "qrUrlHint": "Tùy chọn — dán link nếu không upload file.",
      "transferNote": "Ghi chú hướng dẫn",
      "transferNoteHint": "VD: Sau khi CK, nhắn Admin kèm ảnh biên lai.",
      "contact": "Liên hệ hỗ trợ",
      "contactHint": "Zalo / SĐT Admin",
      "save": "Lưu",
      "uploadFailed": "Upload thất bại",
      "qrUploaded": "Đã tải QR lên",
      "paymentSaved": "Đã lưu thông tin thanh toán"
    },
    "membership": {
      "title": "Membership",
      "description": "Guest: ngưỡng book và GMV để lên hạng. Chiết khấu cost Sale do Owner set trên từng asset (mặc định 0%).",
      "addTier": "Thêm tier mới",
      "editTier": "Sửa tier",
      "addTierTitle": "Thêm tier",
      "tierRequirement": "#{sort} · cần {books} books + {gmv} GMV để lên hạng",
      "sort": "Thứ tự",
      "labelField": "Nhãn",
      "minBooks": "Tối thiểu booking",
      "minGmv": "GMV tối thiểu",
      "saveTier": "Lưu tier",
      "saveTierFailed": "Lưu tier thất bại",
      "tierSaved": "Đã lưu tier",
      "connectionFailed": "Không kết nối được máy chủ. Thử lại."
    },
    "payments": {
      "title": "Thanh toán cần xử lý",
      "description": "Tiền đã vào nhưng chưa tự kích hoạt được: lệch số tiền, thiếu mã CK, hoặc webhook lỗi. Xử lý bằng Mark paid sau khi đối soát sao kê.",
      "mismatchTitle": "Lệch số tiền",
      "mismatchHint": "Intent đã nhận CK nhưng số tiền không khớp giá gói. Chuyển đúng số tiền với cùng mã vẫn tự kích hoạt được.",
      "mismatchEmpty": "Không có giao dịch lệch tiền.",
      "webhookTitle": "Webhook chưa xử lý xong",
      "webhookHint": "Mỗi lần SePay gửi lại, hệ thống sẽ tự thử lại các giao dịch này.",
      "webhookEmpty": "Tất cả webhook đã xử lý.",
      "paymentCode": "Mã CK {code}",
      "planLabel": "gói {plan}",
      "needAmount": "Cần {expected} · nhận {received}",
      "noPaymentCode": "Không có mã CK",
      "unprocessed": "Chưa xử lý",
      "sepayId": "SePay #{id}"
    },
    "markPaid": {
      "noPlans": "Chưa có gói",
      "button": "Mark paid",
      "menuLabel": "Chọn gói kích hoạt",
      "success": "Đã kích hoạt / gia hạn theo gói"
    }
  },
  "membership": {
    "saleDiscountThisAsset": "−{percent}% căn này",
    "guestTimeline": {
      "created": "Tạo booking",
      "confirmed": "Đã chốt",
      "checkedIn": "Nhận phòng",
      "checkedOut": "Trả phòng",
      "cancelled": "Đã hủy"
    }
  },
  "legal": {
    "terms": {
      "slug": "terms",
      "title": "Điều khoản sử dụng",
      "updated": "12/08/2026",
      "intro": "Khi tạo tài khoản trên VBNB, bạn xác nhận đã đọc và đồng ý với các điều khoản dưới đây. Điều khoản áp dụng cho Khách hàng, Sale và Chủ nhà (Owner).",
      "sections": [
        {
          "heading": "Quyền của VBNB",
          "paragraphs": [
            "VBNB được quyền sử dụng thông tin tài khoản của Khách hàng, Sale và Owner để vận hành sàn: xác thực đăng nhập, tạo booking, phân phối lead, hỗ trợ giao dịch và chống gian lận.",
            "VBNB không bán thông tin cá nhân cho bên thứ ba ngoài phạm vi vận hành nền tảng. Việc chia sẻ trong sàn (ví dụ SĐT khách cho sale khi khách chủ động yêu cầu liên hệ) được mô tả rõ ở mục Khách hàng.",
            "VBNB có quyền tạm khóa, cảnh cáo hoặc chấm dứt tài khoản khi phát hiện vi phạm điều khoản, hành vi lừa đảo hoặc chiếm dụng tiền."
          ]
        },
        {
          "heading": "Cảnh báo lừa đảo và chiếm dụng tiền",
          "paragraphs": [
            "Nghiêm cấm giả mạo danh tính, tạo booking ảo, yêu cầu chuyển khoản ngoài luồng VBNB, chiếm dụng tiền cọc / thanh toán, hoặc bất kỳ hành vi nhằm chiếm đoạt tài sản của bên khác.",
            "Khi có dấu hiệu gian lận, VBNB có quyền khóa tài khoản ngay và cung cấp thông tin liên quan cho cơ quan có thẩm quyền theo pháp luật Việt Nam."
          ]
        },
        {
          "heading": "Đối với Khách hàng",
          "paragraphs": [
            "VBNB không buôn bán thông tin cá nhân, số điện thoại của khách cho các bên bên ngoài nền tảng.",
            "Đăng ký tài khoản đồng nghĩa bạn đồng ý: khi bạn dùng chức năng “Cần liên lạc sale” trên trang villa / booking, số điện thoại của bạn sẽ được hiển thị cho saleman và tư vấn viên trên VBNB để họ liên hệ hỗ trợ.",
            "Bạn chịu trách nhiệm về tính chính xác của họ tên và số điện thoại đã đăng ký."
          ]
        },
        {
          "heading": "Đối với Sale",
          "paragraphs": [
            "Sale phải tư vấn trung thực, không được lừa đảo khách, Owner hoặc các sale khác, không chiếm dụng tiền cọc / thanh toán.",
            "Hành vi lừa đảo dẫn đến ban tài khoản vĩnh viễn. Thông tin tài khoản và giao dịch liên quan có thể được VBNB cung cấp cho cơ quan điều tra và xử lý theo pháp luật Việt Nam."
          ]
        },
        {
          "heading": "Đối với Owner",
          "paragraphs": [
            "Owner phải chi trả hoa hồng / thù lao cho Sale đúng thời hạn theo thỏa thuận và quy định trên nền tảng.",
            "Không thanh toán đúng hạn có thể bị cảnh cáo. Vi phạm lặp lại hoặc cố ý chiếm dụng có thể dẫn đến xóa asset vĩnh viễn và khóa tài khoản."
          ]
        }
      ]
    },
    "privacy": {
      "slug": "privacy",
      "title": "Chính sách bảo mật",
      "updated": "12/08/2026",
      "intro": "Chính sách này giải thích VBNB thu thập, sử dụng và chia sẻ thông tin cá nhân như thế nào khi bạn dùng nền tảng.",
      "sections": [
        {
          "heading": "Thông tin chúng tôi thu thập",
          "paragraphs": [
            "Khách hàng: họ tên, số điện thoại, mật khẩu (được mã hóa bởi hệ thống xác thực).",
            "Sale và Owner: họ tên, email, số điện thoại, mật khẩu, và dữ liệu vận hành (booking, lead, tài sản, thanh toán gói)."
          ]
        },
        {
          "heading": "Cách chúng tôi sử dụng thông tin",
          "paragraphs": [
            "Vận hành tài khoản, đăng nhập, xác minh OTP, tạo và quản lý booking.",
            "Phân phối lead khi khách bấm “Cần liên lạc sale”.",
            "Hỗ trợ, xử lý tranh chấp, chống gian lận và tuân thủ pháp luật."
          ]
        },
        {
          "heading": "Chia sẻ thông tin",
          "paragraphs": [
            "VBNB không bán thông tin cá nhân hay số điện thoại cho bên thứ ba ngoài nền tảng.",
            "Trong sàn: SĐT khách được chia sẻ với Sale / tư vấn viên chỉ khi khách chủ động dùng “Cần liên lạc sale”.",
            "VBNB có thể cung cấp thông tin cho cơ quan nhà nước khi pháp luật yêu cầu hoặc khi điều tra hành vi lừa đảo."
          ]
        },
        {
          "heading": "Bảo mật và quyền của bạn",
          "paragraphs": [
            "Bạn nên giữ mật khẩu riêng tư và không chia sẻ OTP cho người lạ.",
            "Muốn chỉnh sửa thông tin tài khoản, dùng trang hồ sơ trong ứng dụng hoặc liên hệ VBNB."
          ]
        }
      ]
    },
    "cookies": {
      "slug": "cookies",
      "title": "Chính sách cookie",
      "updated": "12/08/2026",
      "intro": "VBNB dùng cookie và công nghệ lưu trữ tương tự để giữ phiên đăng nhập và vận hành trang.",
      "sections": [
        {
          "heading": "Cookie cần thiết",
          "paragraphs": [
            "Cookie phiên đăng nhập (do hệ thống xác thực tạo) giúp bạn không phải nhập lại tài khoản mỗi lần mở trang.",
            "Các cookie này cần để đăng nhập, phân quyền Guest / Sale / Owner / Admin và bảo vệ phiên làm việc."
          ]
        },
        {
          "heading": "Cookie chúng tôi không dùng",
          "paragraphs": [
            "Hiện VBNB không dùng cookie quảng cáo của bên thứ ba hay mạng quảng cáo để theo dõi bạn trên website khác."
          ]
        },
        {
          "heading": "Quản lý cookie",
          "paragraphs": [
            "Bạn có thể xóa hoặc chặn cookie trong trình duyệt. Nếu chặn cookie cần thiết, một số chức năng (đăng nhập, giữ phiên) sẽ không hoạt động."
          ]
        }
      ]
    }
  }
} as const;

export default messages;

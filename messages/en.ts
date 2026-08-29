import { ownerEn } from './owner/en';
import { payEn } from './pay/index';
import { saleEn } from './sale/en';
import { subscriptionEn } from './subscription/en';

const messages = {
  "common": {
    "appName": "VBNB",
    "appDescription": "Marketplace for vacation rental assets",
    "homeAriaLabel": "VBNB home",
    "switchLanguage": "Switch to {lang}",
    "updated": "Updated",
    "enterApp": "Enter app",
    "login": "Log in",
    "register": "Sign up",
    "getStarted": "Get started",
    "openMenu": "Open menu",
    "copyright": "© {year} VBNB",
    "logout": "Log out",
    "copy": "Copy",
    "copied": "Copied",
    "vietQr": {
      "label": "VietQR bank code",
      "description": "Select bank for dynamic QR with amount and transfer memo. Type name or code to search.",
      "bankNotFound": "Bank not found"
    }
  },
  "nav": {
    "exploreVillas": "Explore villas",
    "forOwners": "For villa owners",
    "forSales": "For sales",
    "pricing": "Pricing",
    "aboutUs": "About us"
  },
  "login": {
    "subtitle": "Create an account — choose the right role (cannot be changed later).",
    "modeLogin": "Log in",
    "modeRegister": "Sign up",
    "identifierLabel": "Email or phone number",
    "identifierPlaceholder": "email@... or 09xx xxx xx xx",
    "identifierPhoneHint": "Start phone numbers with 0 (e.g. 0961990739) — we normalize automatically.",
    "passwordLabel": "Password",
    "rememberAccount": "Remember account",
    "loginButton": "Log in",
    "roleQuestion": "Which role are you joining as?",
    "roleFixedNote": "Role is fixed to your account — it cannot be changed after registration.",
    "continue": "Continue",
    "registerTitle": "Sign up · {role}",
    "changeRole": "Change role",
    "fullNameLabel": "Full name",
    "fullNamePlaceholder": "Nguyen Van A",
    "phoneLabel": "Phone number",
    "phonePlaceholder": "09xx xxx xx xx",
    "phoneFormatHint": "Start with 0 (e.g. 0901234567).",
    "passwordMinHint": "At least 8 characters",
    "confirmPasswordLabel": "Confirm password",
    "sendOtp": "Send OTP",
    "otpLabel": "OTP code",
    "otpPlaceholder": "000000",
    "termsPrefix": "I have read and agree to the",
    "termsLink": "Terms of Service",
    "completeRegister": "Complete registration",
    "emailLabel": "Email",
    "phoneOtpDescription": "OTP verification required to prevent fake phone numbers",
    "paidRoleNote": "After registration you enter the app in pending activation. Pay for a subscription to unlock features.",
    "accountTrashed": "Account has been trashed. Contact Admin to restore.",
    "roles": {
      "GUEST": {
        "title": "Guest",
        "blurb": "Find villas and contact advisors freely"
      },
      "SALE": {
        "title": "Sale",
        "blurb": "Receive leads, create bookings, manage customers"
      },
      "OWNER": {
        "title": "Owner",
        "blurb": "List properties, manage P&L"
      }
    },
    "validation": {
      "phoneRequired": "Phone number is required",
      "fullNameRequired": "Full name is required",
      "passwordMismatch": "Password confirmation does not match",
      "passwordMinLength": "Password must be at least 8 characters",
      "otpRequired": "Please enter the OTP sent to your phone",
      "termsRequired": "Please agree to the Terms of Service"
    },
    "success": {
      "register": "Registration successful"
    }
  },
  "landing": {
    "hero": {
      "badge": "Smart platform connecting villa owners, sales & guests",
      "titleLine1": "Smart villa marketplace",
      "titleLine2": "connecting",
      "titleHighlight": "Owners, Sales & Guests",
      "bullets": [
        "Owners connect with more sales and grow profit",
        "Sales no longer need to hunt for guests and owners",
        "Guests get better service from dedicated sales"
      ],
      "exploreCta": "Explore villas",
      "learnMoreCta": "Learn more",
      "imageAlt": "Modern villa with pool"
    },
    "trustStrip": {
      "ariaLabel": "Trusted partners",
      "tagline": "Trusted by villa owners and professional sales"
    },
    "howItWorks": {
      "eyebrow": "How VBNB works",
      "title": "Grow together, more simply",
      "steps": {
        "owner": {
          "title": "Owners list properties",
          "body": "Set cost prices, availability, and manage with ease."
        },
        "sale": {
          "title": "Sales close more deals",
          "body": "Access all villas, create bookings, and optimize profit."
        },
        "guest": {
          "title": "Guests enjoy their stay",
          "body": "Discover beautiful villas and connect with the right sale."
        }
      }
    },
    "owner": {
      "eyebrow": "For villa owners",
      "titleLine1": "More visibility.",
      "titleLine2": "More bookings. Less effort.",
      "imageAlt": "Villa interior",
      "statsTitle": "Your villa performance",
      "statsBooking": "Bookings",
      "statsRevenue": "Revenue",
      "features": {
        "network": {
          "title": "Reach a quality sales network",
          "body": "Your villa reaches people who already have guests — no need to run ads yourself."
        },
        "transparency": {
          "title": "Transparent & secure",
          "body": "Clear cost prices, availability, and reconciliation. Guests do not see prices on the marketplace."
        },
        "growth": {
          "title": "More bookings, more revenue",
          "body": "Less operational work, more nights filled."
        }
      },
      "cta": "List your villa"
    },
    "sale": {
      "eyebrow": "For sales",
      "titleLine1": "Real-time information.",
      "titleLine2": "More opportunities.",
      "features": {
        "inventory": {
          "title": "Instant access to cost & availability",
          "body": "See weekday/weekend cost and booked dates before closing a guest."
        },
        "booking": {
          "title": "Create bookings in minutes",
          "body": "Hold inventory, send payment details, and track status in real time."
        },
        "membership": {
          "title": "Grow membership tier & income",
          "body": "Owners set visit thresholds and % per property. More check-outs on a property can lower cost if the Owner enabled discounts."
        }
      }
    },
    "productShowcase": {
      "tagline": "Villa marketplace",
      "openListings": "Open listings",
      "monthlyBookings": "Monthly bookings",
      "tier": "Tier",
      "availability": "Available · 4 guests"
    },
    "pricing": {
      "eyebrow": "Pricing",
      "title": "Clear from day one.",
      "subtitle": "Fees to join VBNB. Longer plans offer bigger savings.",
      "roleTabAria": "Choose role",
      "ownerTab": "Villa owner",
      "saleTab": "Sale",
      "emptyOwner": "No active villa owner plans.",
      "emptySale": "No active sale plans.",
      "ctaOwner": "Sign up as owner",
      "ctaSale": "Sign up as sale"
    },
    "featured": {
      "title": "Featured villas",
      "viewAll": "Explore all",
      "emptyTitle": "No listings yet",
      "emptyDescription": "ACTIVE assets will appear here after admin approval.",
      "emptyAction": "Log in"
    },
    "guestSignup": {
      "ariaLabel": "Create guest account",
      "text": "Create an account so sales can close bookings and you can track history.",
      "cta": "Create account →"
    },
    "finalCta": {
      "title": "Ready to get started with VBNB?",
      "subtitle": "Join thousands of villa owners and professional sales nationwide.",
      "ownerCta": "I am a villa owner",
      "saleCta": "I am a sale"
    },
    "footer": {
      "tagline": "Modern villa marketplace connecting Owners, Sales, and Guests.",
      "columns": {
        "platform": {
          "title": "Platform",
          "exploreVillas": "Explore villas",
          "howItWorks": "How it works",
          "pricing": "Pricing",
          "membership": "Membership"
        },
        "owner": {
          "title": "For villa owners",
          "listVilla": "List villa",
          "guide": "Guide",
          "policy": "Policy",
          "faq": "FAQ"
        },
        "sale": {
          "title": "For sales",
          "forSales": "For sales",
          "benefits": "Benefits",
          "membership": "Sales membership",
          "resources": "Resources"
        },
        "about": {
          "title": "About us",
          "intro": "About",
          "careers": "Careers",
          "news": "News",
          "contact": "Contact"
        },
        "legal": {
          "title": "Legal",
          "terms": "Terms of Service",
          "privacy": "Privacy Policy",
          "cookies": "Cookie Policy"
        }
      }
    },
    "villaSearch": {
      "locationLabel": "Location",
      "locationPlaceholder": "Where do you want to go?",
      "locationAria": "Location",
      "tagsLabel": "Features",
      "tagsPlaceholder": "Pool, Wi-Fi, near beach...",
      "tagsAria": "Villa features",
      "submit": "Search villas",
      "advancedToggle": "Advanced search",
      "budgetLabel": "Budget / night",
      "budgetFrom": "From",
      "budgetFromAria": "Budget from",
      "budgetTo": "To",
      "budgetToAria": "Budget to",
      "budgetHint": "Shows villas below the maximum. Prices are hidden in listings.",
      "datesLabel": "Stay dates",
      "datesPlaceholder": "Check-in – Check-out",
      "datesAria": "Stay dates",
      "guestsLabel": "Guests",
      "guestsPlaceholder": "Minimum capacity",
      "guestsAria": "Guests"
    }
  },
  "marketplace": {
    "page": {
      "title": "Explore villas",
      "description": "Filter by location and owner-listed amenities. Prices are not shown.",
      "emptyTitle": "No results",
      "emptyDescription": "Try a different keyword, fewer tags, or adjust budget / guest count.",
      "clearFilters": "Clear filters"
    },
    "signup": {
      "text": "Create an account so sales can finalize bookings and you can track your history.",
      "cta": "Create account →"
    },
    "assetCard": {
      "idPrefix": "ID",
      "apartment": "Apartment",
      "villa": "Villa",
      "bedrooms": "{count} BR",
      "guests": "{count} guests",
      "bathrooms": "{count} BA",
      "costWeekday": "Cost (WD)",
      "costWeekend": "Cost (WE)"
    },
    "detail": {
      "availability": "Availability",
      "capacityMeta": "{capacity} guests · {bedrooms} BR · {bathrooms} BA"
    },
    "calendar": {
      "prevMonth": "Previous month",
      "nextMonth": "Next month",
      "legendAvailable": "Available",
      "legendHold": "On hold",
      "legendClosed": "Closed",
      "legendBooked": "Booked",
      "weekdays": {
        "mon": "Mon",
        "tue": "Tue",
        "wed": "Wed",
        "thu": "Thu",
        "fri": "Fri",
        "sat": "Sat",
        "sun": "Sun"
      }
    },
    "gallery": {
      "photoOf": "Photo {index} of {title}",
      "photoAlt": "{title} — photo {index}",
      "prevPhoto": "Previous photo",
      "nextPhoto": "Next photo",
      "viewPhoto": "View photo {index}",
      "viewAllPhotos": "View all photos",
      "close": "Close"
    },
    "pagination": {
      "itemLabel": "villa"
    },
    "ctas": {
      "copyIdSuccess": "Villa ID copied",
      "copyLinkSuccess": "Copied",
      "shareTitle": "VBNB asset",
      "error": "Error",
      "leadSuccess": "Request sent — subscribed sales will see your details",
      "loggedInTitle": "Signed in",
      "loggedInBody": "Tap “Contact a sale” to send a request for this villa. We only share your phone number when you tap.",
      "loginHint": "Sign in to contact a sale — sales can only create bookings for accounts on the platform.",
      "copyId": "Copy ID",
      "copyLink": "Copy link",
      "share": "Share",
      "contactSale": "Contact a sale"
    }
  },
  "guest": {
    "nav": {
      "home": "Home",
      "explore": "Explore",
      "bookings": "Bookings",
      "profile": "Account"
    },
    "shell": {
      "roleLabel": "Guest",
      "account": "Account",
      "login": "Sign in"
    },
    "home": {
      "greeting": "Hello {name}",
      "greetingFallback": "there",
      "description": "Your booking overview and membership tier."
    },
    "explore": {
      "title": "Explore villas",
      "description": "Pick a villa you like and contact a sale — they will quote and create the booking.",
      "backToAll": "← All villas"
    },
    "bookings": {
      "title": "Bookings",
      "description": "Bookings created by your sale — you cannot book directly on the marketplace.",
      "emptyTitle": "No bookings yet",
      "emptyDescription": "Bookings your sale creates for you will appear here.",
      "emptyAction": "Explore villas",
      "viewDetail": "View details",
      "paidFull": "Fully paid",
      "remainingOwner": "{amount} remaining · Pay owner at check-in",
      "remainingSale": "{amount} remaining · Pay sale"
    },
    "bookingDetail": {
      "title": "Booking details",
      "backToAll": "← All bookings",
      "viewVilla": "View villa",
      "payment": "Payment",
      "listPrice": "Booking price",
      "collectedSale": "Paid (sale)",
      "collectedOwner": "Paid (owner)",
      "remaining": "Remaining",
      "refunded": "Refunded",
      "remainderOwnerNote": "The remainder is paid to the owner at check-in. The owner records it on check-in.",
      "remainderSaleNote": "Pay offline through your sale. Amounts above are recorded when the sale receives payment.",
      "paidFullNote": "Fully paid at list price.",
      "timeline": "Timeline",
      "notYet": "Pending",
      "saleContact": "Assigned sale",
      "saleName": "Name",
      "salePhone": "Phone",
      "noSaleInfo": "No sale information yet."
    },
    "stats": {
      "totalBookings": "Total bookings",
      "totalSpend": "Total spend"
    },
    "tier": {
      "currentLabel": "Current tier",
      "maxBadge": "Top tier",
      "atMax": "You are at the highest tier.",
      "progress": "Progress to {nextLabel}: {progressBooks}/{neededBooks} bookings · {progressGmv}/{neededGmv}",
      "remaining": "Both booking count and spend are required to tier up. {remainingBooks} bookings and {remainingGmv} remaining.",
      "note": "Progress counts when bookings are confirmed. Cancelling confirmed bookings may lower your tier."
    },
    "upcoming": {
      "title": "Upcoming trip",
      "empty": "No upcoming trips.",
      "explore": "Explore villas",
      "viewDetail": "View details"
    },
    "profile": {
      "title": "Account",
      "description": "Update your name, avatar, and email.",
      "personalInfo": "Personal info",
      "personalInfoDesc": "Your name and avatar are visible to the sale handling your bookings.",
      "fullName": "Full name",
      "avatar": "Avatar",
      "avatarHint": "Upload from device (JPG/PNG/WebP, max 2MB) or paste a URL.",
      "choosePhoto": "Choose photo",
      "removePhoto": "Remove photo",
      "avatarUrl": "Avatar URL",
      "avatarUrlDesc": "Optional — paste a link if not uploading a file.",
      "phone": "Phone number",
      "phoneDesc": "Used for OTP login and cannot be changed here. Contact support to update.",
      "email": "Email",
      "emailDesc": "Optional — used for booking updates.",
      "save": "Save profile",
      "uploadFailed": "Upload failed",
      "uploadSuccess": "Photo uploaded",
      "saveFailed": "Could not save",
      "saveSuccess": "Profile updated"
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
      "propertyTypeRequired": "Choose property type: Villa or Apartment",
      "imagesRequiredForReview": "At least 1 image required for review submission",
      "tagsRequiredForReview": "Select at least 1 tag for review submission",
      "invalidPropertyType": "Invalid property type",
      "passwordRequired": "Password is required",
      "identifierRequired": "Email or phone number is required",
      "invalidPhone": "Invalid phone number",
      "fullNameRequired": "Full name is required",
      "nationalIdFormat": "National ID must be 9 or 12 digits",
      "nationalIdFrontInvalid": "Invalid front national ID image",
      "nationalIdFrontUploadOnly": "National ID image must be uploaded (no pasted links)",
      "nationalIdBackInvalid": "Invalid back national ID image",
      "nationalIdBackUploadOnly": "National ID image must be uploaded (no pasted links)",
      "ownerSaleRegisterOnly": "Only Owner or Sale can register here",
      "invalidEmail": "Invalid email",
      "passwordMinLength": "Password must be at least 8 characters",
      "otpRequired": "Please enter the OTP sent to your phone",
      "termsRequired": "Please agree to the Terms of Service",
      "missingFile": "File missing",
      "imageTypeOnly": "Only JPG, PNG, or WebP accepted",
      "fileTooLarge5Mb": "File too large (max 5MB)",
      "fileTooLarge3Mb": "File too large (max 3MB)",
      "fileTooLargeMb": "File too large (max {mb}MB)",
      "kindPaymentQr": "kind must be payment_qr",
      "uploadKindInvalid": "kind must be avatar | national_id_front | national_id_back | payout_qr",
      "invalidStatus": "Invalid status",
      "idRequired": "id required",
      "amountInvalid": "amount invalid",
      "compareAtAmountInvalid": "compareAtAmount invalid",
      "compareAtMustExceedPrice": "Compare-at price must be greater than plan price",
      "profileIdAndPlanIdRequired": "profileId and planId required",
      "planNotFound": "Plan not found",
      "planRoleMismatch": "Plan role does not match user",
      "profileIdRequired": "profileId required",
      "assetIdRequired": "assetId required",
      "bookingIdRequired": "bookingId missing",
      "paymentCodeAndAmountRequired": "paymentCode and amount required",
      "invalidNightCost": "Invalid nightly rate",
      "discountPercentRange": "Discount % must be between 0 and 100",
      "discountThresholdInvalid": "Invalid threshold",
      "discountThresholdDuplicate": "Duplicate threshold",
      "discountRulesTooMany": "Too many discount tiers",
      "discountRulesInvalid": "Invalid discount rules",
      "invalidName": "Customer name is required"
    },
    "INVALID_PHONE": "Invalid phone number",
    "INVALID_STATUS": {
      "generic": "Invalid status",
      "bookingInvoice": "This booking cannot issue an invoice",
      "ownerPayout": "Cannot record owner payout in this status",
      "ownerConfirm": "Booking is no longer awaiting Owner",
      "checkIn": "Only confirmed bookings can be checked in",
      "checkOut": "Only checked-in bookings can be checked out"
    },
    "RATE_LIMIT": {
      "otpSend": "Too many OTP requests",
      "otpVerify": "Too many verify attempts",
      "register": "Too many register attempts",
      "otpAttempts": "Too many OTP attempts",
      "leads": "Too many lead requests"
    },
    "OTP_SEND_FAILED": "Failed to send OTP",
    "OTP_INVALID": "Invalid OTP code",
    "CONFLICT": {
      "phoneExists": "Phone number already registered. Please log in.",
      "emailExists": "Email already registered. Please log in.",
      "phoneOrNationalIdTaken": "Phone or national ID already used by another account",
      "duplicatePhone": "This phone is already saved — open the existing record to update",
      "duplicatePhoneActive": "Phone already exists on another ACTIVE record"
    },
    "USER_CREATE_FAILED": "Cannot create user",
    "ROLE_SYNC_FAILED": "Role sync failed",
    "SUB_CREATE_FAILED": "Cannot create subscription",
    "NO_EMAIL": "User missing email",
    "SESSION_FAILED": "Cannot create session",
    "LOGOUT_FAILED": "Logout failed",
    "AUTH_FAILED": {
      "wrongCredentials": "Incorrect phone or password",
      "generic": "Authentication failed"
    },
    "AUTH_UNREACHABLE": "Cannot reach authentication server. Run npm run local again.",
    "CREATE_FAILED": "Failed",
    "DRAFT_LIMIT": "Maximum 15 draft assets. Submit for review or delete old drafts.",
    "FORBIDDEN": {
      "notYourAsset": "Not your asset",
      "payoutAccountOwnerSaleOnly": "Only Owner or Sale can update payout account",
      "payoutQrOwnerSaleOnly": "Only Owner or Sale can upload payout QR",
      "notYourBooking": "Not your booking",
      "notYourAssetBooking": "Not a booking for your property",
      "notYourProperty": "Not your property",
      "notYourAssetGeneric": "Not your asset"
    },
    "UPDATE_FAILED": "Update failed",
    "BOOKING_CREATE_FAILED": {
      "belowFloor": "Sale price below floor {amount}",
      "overlap": "Dates already confirmed by another sale — calendar locked",
      "closed": "Owner closed one or more nights in this range",
      "guestDuplicate": "This guest already has an overlapping booking on this asset",
      "generic": "Failed to create booking"
    },
    "CANCEL_FAILED": "Failed to cancel booking",
    "INVALID_ACTION": "Unknown action",
    "SUBSCRIPTION_INACTIVE": "Subscription expired — renew to continue",
    "LIST_FAILED": "Failed to load list",
    "MISCONFIGURED": "CRON_SECRET is not configured",
    "EXPIRE_FAILED": "Failed to expire subscriptions",
    "GATEWAY_NOT_CONFIGURED": "SePay Payment Gateway not configured (SEPAY_MERCHANT_ID / SECRET)",
    "GATEWAY_ERROR": "Payment gateway error",
    "NOT_FOUND": {
      "assetUnavailable": "Asset not available",
      "booking": "Booking not found",
      "savedCustomer": "Saved customer not found"
    },
    "UPLOAD_FAILED": "Upload failed",
    "SIGN_FAILED": "Failed to sign URL",
    "LIMIT": "Maximum 12 images per asset",
    "INVALID_COST": "Invalid nightly rate",
    "NO_OWNER_EARN": "No owner cost set — cannot submit to Owner",
    "BELOW_OWNER_PAYOUT": "Owner payout must be at least 50% of cost ({amount}) before submitting",
    "BELOW_DEPOSIT": "Guest deposit must be at least 50% of sale price ({amount}) before submitting",
    "OVERLAP": {
      "submitConfirmed": "Dates already confirmed by another sale — cannot submit",
      "ownerConfirm": "Dates already confirmed by another sale — cannot confirm"
    },
    "CLOSED": {
      "submit": "Owner closed this night — cannot submit",
      "ownerConfirm": "Night is closed — cannot confirm",
      "create": "Owner closed one or more nights in this range"
    },
    "AMOUNT_REGRESSION": {
      "payment": "Collected amount cannot be less than recorded",
      "ownerPayout": "Owner payout cannot be less than recorded",
      "checkIn": "Amount received from guest cannot be less than recorded"
    },
    "ABOVE_LIST": "Cannot collect more than sale price",
    "LOCKED_AFTER_CONFIRM": "After Owner confirms, remaining balance is paid to owner at check-in",
    "ABOVE_OWNER_EARN": "Cannot record more than owner earn",
    "GUEST_BALANCE_DUE": "Guest has not paid remaining balance — cannot check in",
    "ABOVE_REMAINDER": "Cannot record more than guest remainder",
    "ALREADY_PAID": "Guest has already paid full sale price",
    "NO_PAYOUT": "Payout account not configured — go to Profile to add bank details",
    "INSERT_FAILED": "Failed to create invoice",
    "UNKNOWN": "An error occurred",
    "BOOKING_NOT_FOUND": "Booking does not belong to this sale",
    "BOOKING_NOT_CLOSED": "Only closed bookings can be linked",
    "INVALID_SCORE": "Score must be between 1 and 10",
    "NOT_CHECKED_OUT": "Can only rate after check-out",
    "LOCKED": {
      "rating": "Rating submitted — cannot edit",
      "night": "Night locked by booking — cannot close"
    },
    "HOLD": "Night on hold — cannot close",
    "PAST_NIGHT": "Cannot edit past nights",
    "INVALID_DATE": "Invalid date",
    "ADMIN_UPDATE_FAILED": "Admin user action failed",
    "ACTIVATE_FAILED": "Activate failed",
    "ADMIN_USER": {
      "NOT_FOUND": "User not found",
      "IN_TRASH": "User is in trash",
      "INVALID_ROLE": "Can only remove subscription for Owner/Sale",
      "NO_SUB": "User has no subscription",
      "NOT_ACTIVE": "Current subscription is {status} — no need to remove",
      "SELF_DELETE": "Cannot trash the currently logged-in admin account",
      "ALREADY_TRASHED": "User is already in trash",
      "NOT_IN_TRASH": "User is not in trash",
      "RACE_SOFT_DELETE": "Cannot soft delete (state changed)",
      "RACE_RESTORE": "Cannot restore (state changed)",
      "HARD_DELETE_DISABLED": "Permanent delete is blocked by system policy"
    },
    "planIdRequired": "planId required"
  },
  "auth": {
    "otp": {
      "send": "Send OTP",
      "code": "OTP code",
      "codePlaceholder": "000000",
      "sent": "OTP sent",
      "invalid": "Invalid or expired OTP"
    },
    "register": {
      "ownerSaleOnly": "Only Owner or Sale can register here",
      "success": "Registration successful",
      "pendingActivation": "Registration successful. Please pay for a plan to activate your account."
    },
    "password": {
      "required": "Password is required",
      "minLength": "Password must be at least 8 characters",
      "mismatch": "Password confirmation does not match"
    },
    "phone": {
      "required": "Phone number is required",
      "invalid": "Invalid phone number",
      "otpRequired": "Please enter the OTP sent to your phone",
      "otpDescription": "OTP verification required to prevent fake phone numbers"
    },
    "email": {
      "invalid": "Invalid email",
      "exists": "Email already registered. Please log in."
    },
    "fullName": {
      "required": "Full name is required"
    },
    "terms": {
      "required": "Please agree to the Terms of Service",
      "agreePrefix": "I have read and agree to the",
      "link": "Terms of Service"
    },
    "account": {
      "phoneExists": "Phone number already registered. Please log in.",
      "trashed": "Account has been trashed. Contact Admin to restore."
    },
    "rateLimit": {
      "otpSend": "Too many OTP requests. Please try again later.",
      "otpVerify": "Too many verification attempts. Please try again later.",
      "register": "Too many registration attempts. Please try again later.",
      "otpAttempts": "Too many OTP attempts. Please try again later."
    },
    "session": {
      "createFailed": "Failed to create login session",
      "noEmail": "Account missing email"
    },
    "logout": {
      "failed": "Logout failed"
    },
    "login": {
      "failed": "Incorrect phone or password",
      "unreachable": "Cannot reach authentication server. Run npm run local again."
    }
  },
  "bookingStatus": {
    "PENDING": "Awaiting Sale submission to Owner",
    "AWAITING_OWNER": "Awaiting Owner confirmation",
    "CONFIRMED": "Confirmed",
    "CHECKED_IN": "Checked in",
    "CHECKED_OUT": "Checked out",
    "CANCELLED": "Cancelled",
    "available": "Available",
    "confirmed": "Booked",
    "selected": "Selected"
  },
  "assetTags": {
    "groups": {
      "location": "Location",
      "space": "Space & views",
      "amenities": "Amenities",
      "audience": "Best for",
      "style": "Style",
      "access": "Convenience"
    },
    "tags": {
      "in_center": "City center",
      "near_center": "Near city center",
      "near_beach": "Near the beach",
      "beachfront": "Beachfront / ocean view",
      "near_mountain": "Near mountains / hills",
      "mountain_view": "Mountain / hill view",
      "near_lake": "Near lake / river",
      "near_attraction": "Near attractions",
      "near_market": "Near market / supermarket",
      "near_airport": "Near airport",
      "near_landmark": "Near famous landmarks",
      "quiet_suburb": "Quiet / suburban",
      "private_pool": "Private pool",
      "garden": "Large garden",
      "bbq": "BBQ yard",
      "balcony": "Balcony / terrace",
      "sea_view": "Sea view",
      "city_view": "City view",
      "wifi": "Wi-Fi",
      "tv": "TV",
      "sound_system": "Speakers / sound system",
      "streaming": "Netflix / projector",
      "air_con": "Air conditioning",
      "heater": "Heater / fireplace",
      "washer": "Washing machine",
      "dryer": "Dryer",
      "kitchen": "Full kitchen",
      "oven_microwave": "Oven / microwave",
      "fridge": "Refrigerator",
      "coffee": "Kettle / coffee maker",
      "indoor_grill": "Indoor grill",
      "hot_water": "Hot water heater",
      "bathtub": "Bathtub",
      "toiletries": "Toiletries / towels",
      "security_cam": "Security camera",
      "safe": "Safe",
      "family": "Families with children",
      "friends": "Friend groups / parties",
      "couple": "Couples / honeymoon",
      "team_building": "Team building",
      "remote_work": "Remote work",
      "pet_friendly": "Pet friendly",
      "luxury": "Luxury",
      "rustic": "Rustic / nature",
      "minimal": "Minimal / modern",
      "local_style": "Local style",
      "parking": "Parking / garage",
      "compound": "Gated compound / security",
      "self_checkin": "Self check-in"
    }
  },
  "propertyTypes": {
    "VILLA": "Villa",
    "APARTMENT": "Apartment"
  },
  "subscriptionLocked": {
    "expiredTitle": "Subscription expired",
    "pendingTitle": "Awaiting activation",
    "pendingDesc": "Choose a plan on the Subscription page and scan the QR code (transfer memo included) to activate.",
    "expiredDesc": "Your billing period has ended. Choose a plan and pay to restore access.",
    "inactiveDesc": "Subscription is not active. Go to Subscription to choose a plan.",
    "statusLabel": "Status: {status}",
    "choosePlan": "Choose plan & pay",
    "profile": "Profile"
  },
  "sale": saleEn,
  "owner": ownerEn,
  "pay": payEn,
  "subscription": subscriptionEn,
  "inventory": {
    "listPriceGuestPay": "List price for stay (guest pay)",
    "collectedGuestMin": "Collected from guest (min 50% = {amount})",
    "collectedOwnerMin": "Transferred to owner (min 50% cost = {amount})",
    "collectedGuest": "Collected from guest",
    "collectedOwner": "Transferred to owner",
    "costNightTitle": "Nightly cost (owner cost)",
    "night": "Night",
    "costInput": "Cost (VND). Leave empty and save to use WD/WE"
  },
  "admin": {
    "layout": {
      "title": "Admin",
      "nav": {
        "overview": "Overview",
        "assets": "Asset approval",
        "users": "Users",
        "fees": "Fees & settings",
        "payments": "Payments",
        "membership": "Membership"
      }
    },
    "overview": {
      "title": "Admin",
      "description": "Pending actions first — marketplace configuration.",
      "pendingAssets": "Assets awaiting approval",
      "reviewQueue": "Review queue",
      "revenue": "Revenue",
      "revenueAll": "Total collected",
      "revenueAllHint": "SePay + Admin mark paid",
      "revenueMonthHint": "User subscription payments this month",
      "monthLabel": "Month {month}/{year}",
      "users": "Users",
      "activePaid": "Active",
      "activePaidHint": "Owner/Sale with active subscription",
      "guests": "Guests",
      "owners": "Owners",
      "sales": "Sales",
      "operations": "Operations",
      "totalAssets": "Total assets",
      "firmBookings": "Confirmed bookings",
      "completedBookings": "Completed",
      "leadRequests": "Lead requests"
    },
    "assets": {
      "title": "Asset approval",
      "description": "Open details to review photos and description, then approve. PENDING_REVIEW → ACTIVE goes live.",
      "searchLabel": "Search",
      "searchPlaceholder": "Villa name, location, owner, description...",
      "searchButton": "Search",
      "filterAll": "All",
      "filterPending": "Pending",
      "filterActive": "Active",
      "filterReject": "Reject",
      "filterSuspend": "Suspend",
      "emptyNotFound": "No results",
      "emptyNoAssets": "No assets",
      "emptySearchHint": "Try another keyword or change status filter.",
      "emptyPendingHint": "No listings awaiting review.",
      "emptyStatusHint": "No assets in this status.",
      "clearFilters": "Clear filters",
      "ownerLabel": "Owner",
      "imagesCount": "{count} photos",
      "noDescription": "No description yet.",
      "viewDetail": "View details",
      "itemLabel": "asset",
      "backToList": "← Asset approval",
      "noImagesTitle": "No photos",
      "noImagesBody": "Owner has not uploaded images. Ask them to add photos before approving.",
      "noDescTitle": "No description",
      "noDescBody": "Listing has no description.",
      "decisionTitle": "Decision",
      "decisionHint": "Approve → ACTIVE goes live. Reject / Suspend requires a reason.",
      "reasonLabel": "Reason (reject/suspend)",
      "approve": "Approve",
      "reject": "Reject",
      "suspend": "Suspend",
      "updatedStatus": "Updated to {status}"
    },
    "users": {
      "title": "Users",
      "description": "Manage by role, remove subscriptions, trash/restore. Mark paid is a fallback when SePay has not matched yet.",
      "searchLabel": "Search",
      "searchPlaceholder": "Name, phone, or email...",
      "tabs": {
        "OWNER": "Owner",
        "SALE": "Sale",
        "GUEST": "Guest",
        "ADMIN": "Admin",
        "TRASH": "Trash"
      },
      "trashSince": "Trashed since {date}",
      "noSub": "No sub",
      "removeSub": "Remove sub",
      "trash": "Trash",
      "restore": "Restore",
      "hardDelete": "Delete permanently",
      "cannotTrashSelf": "Cannot trash the currently logged-in account",
      "confirmRemoveSub": "Remove this user's ACTIVE subscription?",
      "confirmTrash": "Move user to trash? (can be restored later)",
      "confirmRestore": "Restore user from trash?",
      "failed": "Failed",
      "removedSub": "Subscription removed",
      "trashed": "Moved to trash",
      "restored": "Restored",
      "emptySearch": "No results for “{query}”",
      "emptyTrash": "Trash is empty",
      "emptyRole": "No {role} yet",
      "emptySearchHint": "Try another keyword or switch role / Trash tab.",
      "emptyTrashHint": "Soft-deleted users appear here for restore.",
      "emptyRoleHint": "Users in this role will appear here.",
      "userCount": "{count} users"
    },
    "fees": {
      "title": "Fees & payments",
      "description": "Subscription plans (1/3/6/12 months) + bank / VietQR. Owner & Sale pick plans on the Subscription page.",
      "tabs": {
        "subscription": "Subscription plans",
        "payout": "Payout account"
      },
      "subscriptionHint": "Admin sets plan prices. Transfer amount must match exactly to activate. Periods are calendar months.",
      "noPlans": "No plans yet.",
      "planMonthsCurrent": "({months} months · current {amount})",
      "planActive": "Active",
      "planLabel": "Display label",
      "planAmount": "Plan price (VND)",
      "planAmountHint": "Transfer / SePay amount must match exactly.",
      "planCompareAt": "Compare-at price (VND)",
      "planCompareAtHint": "Leave empty for no discount. Must be greater than plan price.",
      "planDiscountTag": "Tag: −{percent}%",
      "savePlan": "Save plan",
      "savedPlan": "Saved plan {label}",
      "paymentHint": "Owner/Sale see this on the Subscription page when pending activation or renewal. Edit plan prices on the Subscription plans tab.",
      "bankName": "Bank",
      "vietqrBank": "VietQR bank code",
      "vietqrBankHint": "Select bank for dynamic QR. If empty, uses Bank name above. Type name or code to search.",
      "accountName": "Account holder",
      "accountNumber": "Account number",
      "qrImage": "Payment QR image",
      "qrImageHint": "Upload from device (JPG/PNG/WebP, max 3MB) or paste a URL.",
      "qrAlt": "Payment QR",
      "chooseQr": "Choose QR image",
      "removeQr": "Remove QR",
      "qrUrl": "QR image URL",
      "qrUrlHint": "Optional — paste a link if not uploading a file.",
      "transferNote": "Transfer instructions",
      "transferNoteHint": "E.g. After transfer, message Admin with receipt photo.",
      "contact": "Support contact",
      "contactHint": "Zalo / Admin phone",
      "save": "Save",
      "uploadFailed": "Upload failed",
      "qrUploaded": "QR uploaded",
      "paymentSaved": "Payment info saved"
    },
    "membership": {
      "title": "Membership",
      "description": "Guest: booking and GMV thresholds to rank up. Sale cost discount is set per asset by Owner (default 0%).",
      "addTier": "Add new tier",
      "editTier": "Edit tier",
      "addTierTitle": "Add tier",
      "tierRequirement": "#{sort} · needs {books} books + {gmv} GMV to rank up",
      "sort": "Sort",
      "labelField": "Label",
      "minBooks": "Min books",
      "minGmv": "Min GMV",
      "saveTier": "Save tier",
      "saveTierFailed": "Failed to save tier",
      "tierSaved": "Tier saved",
      "connectionFailed": "Cannot reach server. Try again."
    },
    "payments": {
      "title": "Payments to resolve",
      "description": "Money received but not auto-activated: amount mismatch, missing payment code, or webhook error. Use Mark paid after reconciling bank statement.",
      "mismatchTitle": "Amount mismatch",
      "mismatchHint": "Intent received transfer but amount does not match plan price. Correct amount with same code will still auto-activate.",
      "mismatchEmpty": "No amount mismatches.",
      "webhookTitle": "Unresolved webhooks",
      "webhookHint": "Each SePay retry will re-attempt these transactions.",
      "webhookEmpty": "All webhooks processed.",
      "paymentCode": "Code {code}",
      "planLabel": "plan {plan}",
      "needAmount": "Need {expected} · received {received}",
      "noPaymentCode": "No payment code",
      "unprocessed": "Unprocessed",
      "sepayId": "SePay #{id}"
    },
    "markPaid": {
      "noPlans": "No plans",
      "button": "Mark paid",
      "menuLabel": "Choose plan to activate",
      "success": "Activated / renewed per plan"
    }
  },
  "membership": {
    "saleDiscountThisAsset": "−{percent}% this property",
    "guestTimeline": {
      "created": "Booking created",
      "confirmed": "Confirmed",
      "checkedIn": "Checked in",
      "checkedOut": "Checked out",
      "cancelled": "Cancelled"
    }
  },
  "legal": {
    "terms": {
      "slug": "terms",
      "title": "Terms of Service",
      "updated": "12/08/2026",
      "intro": "By creating an account on VBNB, you confirm that you have read and agree to the terms below. These terms apply to Guests, Sales, and Villa Owners.",
      "sections": [
        {
          "heading": "VBNB Rights",
          "paragraphs": [
            "VBNB may use account information from Guests, Sales, and Owners to operate the marketplace: authenticate logins, create bookings, distribute leads, support transactions, and prevent fraud.",
            "VBNB does not sell personal information to third parties outside the scope of platform operations. In-platform sharing (for example, sharing a guest phone number with a sale when the guest requests contact) is described clearly in the Guest section.",
            "VBNB may suspend, warn, or terminate accounts when terms are violated, or when fraud or misappropriation of funds is detected."
          ]
        },
        {
          "heading": "Fraud and Misappropriation Warning",
          "paragraphs": [
            "Identity impersonation, fake bookings, requests to transfer money outside VBNB, misappropriation of deposits or payments, or any act intended to seize another party's assets is strictly prohibited.",
            "When signs of fraud appear, VBNB may lock the account immediately and provide relevant information to competent authorities under Vietnamese law."
          ]
        },
        {
          "heading": "For Guests",
          "paragraphs": [
            "VBNB does not sell guests' personal information or phone numbers to parties outside the platform.",
            "Creating an account means you agree that when you use \"Contact a sale\" on a villa or booking page, your phone number will be shown to sales and advisors on VBNB so they can assist you.",
            "You are responsible for the accuracy of the name and phone number you register."
          ]
        },
        {
          "heading": "For Sales",
          "paragraphs": [
            "Sales must advise honestly and must not defraud guests, Owners, or other sales, or misappropriate deposits or payments.",
            "Fraudulent behavior leads to permanent account bans. VBNB may provide account and transaction information to investigative authorities and process cases under Vietnamese law."
          ]
        },
        {
          "heading": "For Owners",
          "paragraphs": [
            "Owners must pay commissions and fees to Sales on time according to agreements and platform rules.",
            "Late payment may result in warnings. Repeated violations or intentional misappropriation may lead to permanent asset removal and account suspension."
          ]
        }
      ]
    },
    "privacy": {
      "slug": "privacy",
      "title": "Privacy Policy",
      "updated": "12/08/2026",
      "intro": "This policy explains how VBNB collects, uses, and shares personal information when you use the platform.",
      "sections": [
        {
          "heading": "Information We Collect",
          "paragraphs": [
            "Guests: full name, phone number, password (encrypted by the authentication system).",
            "Sales and Owners: full name, email, phone number, password, and operational data (bookings, leads, assets, subscription payments)."
          ]
        },
        {
          "heading": "How We Use Information",
          "paragraphs": [
            "Operate accounts, logins, OTP verification, and booking creation and management.",
            "Distribute leads when guests tap \"Contact a sale\".",
            "Provide support, resolve disputes, prevent fraud, and comply with law."
          ]
        },
        {
          "heading": "Information Sharing",
          "paragraphs": [
            "VBNB does not sell personal information or phone numbers to third parties outside the platform.",
            "Within the platform: guest phone numbers are shared with Sales and advisors only when guests actively use \"Contact a sale\".",
            "VBNB may provide information to government authorities when required by law or when investigating fraud."
          ]
        },
        {
          "heading": "Security and Your Rights",
          "paragraphs": [
            "Keep your password private and do not share OTP codes with strangers.",
            "To update account information, use the in-app profile page or contact VBNB."
          ]
        }
      ]
    },
    "cookies": {
      "slug": "cookies",
      "title": "Cookie Policy",
      "updated": "12/08/2026",
      "intro": "VBNB uses cookies and similar storage technologies to maintain login sessions and operate the site.",
      "sections": [
        {
          "heading": "Essential Cookies",
          "paragraphs": [
            "Login session cookies (created by the authentication system) help you avoid re-entering credentials each time you open the site.",
            "These cookies are required for login, Guest / Sale / Owner / Admin authorization, and session protection."
          ]
        },
        {
          "heading": "Cookies We Do Not Use",
          "paragraphs": [
            "VBNB currently does not use third-party advertising cookies or ad networks to track you across other websites."
          ]
        },
        {
          "heading": "Managing Cookies",
          "paragraphs": [
            "You can delete or block cookies in your browser. If you block essential cookies, some features (login, session persistence) will not work."
          ]
        }
      ]
    }
  }
} as const;

export default messages;

rms╔══════════════════════════════════════════════════════════════════════════════╗
║     rms RESTAURANT MANAGEMENT SYSTEM (RMS) - DEVELOPMENT ROADMAP          ║
║                                                                            ║
║     Step-by-step guide to build this project from scratch                  ║
╚══════════════════════════════════════════════════════════════════════════════╝


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE 1 : PROJECT SETUP & FOUNDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Step 1.1 - Initialize Spring Boot Project
  ──────────────────────────────────────────
  - Go to https://start.spring.io
  - Select: Maven, Java 17, Spring Boot 3.5.x, WAR packaging
  - Add dependencies:
      Spring Web, Spring Data JPA, MySQL Driver, Lombok,
      Spring Mail, Spring Data Redis, Validation
  - Group: com.rms   |   Artifact: Rms
  - Generate & extract project

  Step 1.2 - Add Extra Dependencies (pom.xml)
  ────────────────────────────────────────────
  - Firebase Admin SDK                 --> Push notifications
  - Apache POI                         --> Excel export
  - iText7 + PDFBox                    --> PDF generation
  - AWS SDK S3                         --> Cloud file storage
  - Google Drive API                   --> Document storage
  - Google Maps Services               --> Location APIs
  - Thumbnailator                      --> Image compression
  - Jackson                            --> JSON processing
  - Commons Codec                      --> Encryption utilities
  - Log4j2                             --> Logging

  Step 1.3 - Create Base Package Structure
  ─────────────────────────────────────────
  com.rms/
  ├── RmsApplication.java
  ├── MainController.java
  ├── common/
  ├── configuration/
  └── modules/

  Step 1.4 - Setup Configuration Files
  ─────────────────────────────────────
  - application.properties             --> Active profile selection
  - application-local.properties       --> Local DB, server port, file paths
  - application-uat.properties         --> UAT/staging environment config
  - Set: server.port=8085, spring.profiles.active=local


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE 2 : DATABASE & ENTITY LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Step 2.1 - Setup MySQL Database
  ───────────────────────────────
  - Create MySQL 8 database: rms_db
  - Create DB user with full privileges
  - Configure hibernate ddl-auto: update (auto-create tables)

  Step 2.2 - Build Core Entities First (common/entities/)
  ───────────────────────────────────────────────────────
  Build in this order (dependencies matter):

  Round 1 - Independent entities (no foreign keys):
    [x] UsersEntity           --> users table (all user roles)
    [x] StatesEntity          --> states master data
    [x] CitiesEntity          --> cities master data
    [x] PincodesEntity        --> pincodes master data
    [x] AppVersionEntity      --> app version tracking
    [x] GlobalSettingEntity   --> global platform settings

  Round 2 - Restaurant-dependent entities:
    [x] RestaurantBranchEntity    --> branches (FK: users)
    [x] RestaurantHoursEntity     --> operating hours (FK: branch)
    [x] SectionEntity             --> restaurant sections (FK: branch)
    [x] DiningTablesEntity        --> tables (FK: branch, section)
    [x] SlidersEntity             --> homepage banners (FK: restaurant)
    [x] BusinessSettingEntity     --> restaurant settings (FK: restaurant)
    [x] MarqueeMessageEntity      --> scrolling messages (FK: restaurant)
    [x] TeamMemberEntity          --> staff profiles (FK: restaurant)
    [x] UsersProfileEntity        --> extended user profiles
    [x] DeliveryZonesEntity       --> delivery areas (FK: branch)

  Round 3 - Menu entities:
    [x] MenuCategoryEntity        --> categories (FK: restaurant)
    [x] MenuSubcategoryEntity     --> subcategories (FK: category)
    [x] MenuItemsEntity           --> items (FK: subcategory, branch)
    [x] AddonsEntity              --> addon groups (FK: restaurant)
    [x] AddonsItemsEntity         --> addon items (FK: addon group)
    [x] MenuItemAddonsEntity      --> item-addon mapping
    
  Round 4 - Customer & Order entities:
    [x] CustomersEntity                   --> customer profiles
    [x] CustomerDeliveryAddressesEntity   --> delivery addresses
    [x] OrdersEntity                      --> orders (FK: branch, customer, etc.)
    [x] OrderItemsEntity                  --> order line items (FK: order)
    [x] OrderAddonsItemsEntity            --> order addon items (FK: order item)
    [x] OrderPaymentsEntity               --> payment records (FK: order)
  
  Round 5 - Finance entities:
    [x] WalletTransactionsEntity      --> wallet history
   

  Round 6 - System & Logging entities:
    [x] ActivityLogsEntity        --> user activity logs
    [x] ApiLogsEntity             --> API request logs
    [x] ApiConfigEntity           --> API configurations
    [x] OtpLogsEntity             --> OTP tracking
    [x] PasswordResetsEntity      --> password reset tokens
    [x] DeviceTokenEntity         --> FCM device tokens
    [x] SmsFormatesEntity         --> SMS templates
    [x] MessageApprovalEntity     --> message approval queue
    [x] NotificationEntity        --> notification records
    [x] SubscriptionEntity        --> user subscriptions
    [x] SubscriptionPlanEntity    --> subscription plans

  Step 2.3 - Build Repositories (common/repositories/)
  ────────────────────────────────────────────────────
  - Create one JpaRepository interface per entity
  - Add custom query methods as needed
  - Pattern: {Entity}Repository extends JpaRepository<{Entity}, Long>

  Step 2.4 - Build Service Implementations (common/serviceImplement/)
  ───────────────────────────────────────────────────────────────────
  - Shared CRUD logic used across all role modules
  - Pattern: {Entity}ServiceIMP.java with @Service annotation
  - Methods: getAll, getById, add, update, delete, custom queries


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE 3 : CONFIGURATION & SECURITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Step 3.1 - API Response Wrapper
  ───────────────────────────────
  - Create common/response/ApiResponse.java
  - Standard format: { status, statusCode, message, data }
  - All controllers return this format

  Step 3.2 - Custom Exception Handling
  ────────────────────────────────────
  - Create common/exception/ package
  - GlobalExceptionHandler.java (@ControllerAdvice)
  - Custom exceptions: UserNotFound, InvalidOTP, InvalidToken,
    BadRequest, UserAlreadyExist, InvalidPassword, OTPExpired, etc.

  Step 3.3 - Token-Based Authentication
  ─────────────────────────────────────
  - Build common/util/AES256Util.java      --> AES encryption/decryption
  - Build common/util/TokenUtil.java       --> Token generation & validation
  - Build configuration/Authorization.java --> Role validation helper

  Step 3.4 - Request Filter (Global Interceptor)
  ──────────────────────────────────────────────
  - Build configuration/CustomRequestFilter.java
  - Functions:
      1. Set CORS headers (Access-Control-Allow-*)
      2. Handle OPTIONS preflight requests
      3. Check public vs protected routes
      4. Validate access_token for protected routes
      5. Log request headers & body

  Step 3.5 - CORS Configuration
  ─────────────────────────────
  - Crosconfig.java          --> Base CORS settings
  - CrosconfigLocal.java     --> Allow localhost origins
  - CrosconfigProd.java      --> Allow production domains only

  Step 3.6 - Firebase Configuration
  ─────────────────────────────────
  - Add service_account.json to resources/
  - Build configuration/FirebaseConfig.java
  - Initialize Firebase Admin SDK on app startup


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE 4 : UTILITY LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Build these utilities in common/util/ :

  Step 4.1 - Communication
  ────────────────────────
  - FCMUtil.java            --> Send push notifications via Firebase
  - SmsUtil.java            --> Send SMS (OTP, transactional)
  - WhatsAppMessage.java    --> Send WhatsApp messages
  - EmailService.java       --> Send emails via Gmail SMTP

  Step 4.2 - File Storage
  ───────────────────────
  - LocalFileStorage.java       --> Save to local uploads/ directory
  - FileUploadService.java      --> Upload handling & validation
  - S3bucket.java               --> Upload to AWS S3
  - GoogleDriveUtil.java        --> Upload to Google Drive
  -
  Step 4.3 - Security & Encryption
  ────────────────────────────────
  - AES256Util.java             --> AES encryption for tokens
  - EncryptionUtil.java         --> General encryption
  - SHA512Util.java             --> SHA-512 hashing
  -

  Step 4.4 - Business Logic
  ─────────────────────────
  - Calculation.java            --> Price, tax, discount calculations
  
  - OutstandingHandler.java     --> Credit/outstanding management
  - CacheData.java              --> Cache management

  Step 4.5 - Export & Reporting
  ────────────────────────────
  - ExcelUtil.java              --> Generate Excel reports (Apache POI)
  - (iText7/PDFBox for PDF generation)

  Step 4.6 - External APIs
  ────────────────────────
  - Api_call.java               --> Generic HTTP client utility
  - GoogleMapsService.java      --> Distance & geocoding
  - ServiceRequestResponse.java --> API request/response logging


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE 5 : PAYMENT GATEWAY INTEGRATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Build in common/vendor/ :

  
  

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE 6 : AUTHENTICATION MODULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Build in modules/authentication/ :

  Step 6.1 - Login System
  ───────────────────────
  - LoginController.java  --> Endpoints:
      POST /login/panelLogin    --> Email + password login (admin, restaurant, branch...)
      POST /login/send_otp      --> Send OTP to mobile
      POST /login/verify_otp    --> Verify OTP & return access_token
      POST /login/forgot_password
  - LoginService.java     --> Business logic for all login flows

  Step 6.2 - Signup System
  ────────────────────────
  - SignupController.java --> Endpoints:
      POST /signup/send_otp     --> Send OTP for registration
      POST /signup/verify_otp   --> Complete restaurant registration
  - SignupService.java    --> Business logic for registration
  - Businessdetail.java   --> Business registration details


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE 7 : ROLE-BASED MODULES (Build one by one)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Each module follows the SAME pattern:
    modules/{role}/controllers/{Prefix}{Entity}Controller.java
    modules/{role}/services/{Prefix}{Entity}Service.java

  Build in this order:

  ┌────────────────────────────────────────────────────────────────────────┐
  │ STEP 7.1 - SUPERADMIN MODULE  (modules/superadmin/)                  │
  │ API: /api/superadmin/*                                               │
  │ Purpose: Platform-level management                                    │
  │ Controllers:                                                          │
  │   - SuperadminSubscriptionPlansController  --> Manage subscription    │
  │   - SuperadminSubscriptionsController      --> View/manage subs      │
  │   - SuperadminUserApprovalsController      --> Approve restaurants    │
  │   - SuperadminUserDirectoryController      --> All users directory    │
  │ Services:                                                             │
  │   - SuperadminService (shared service for all controllers)           │
  └────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────┐
  │ STEP 7.2 - ADMIN MODULE  (modules/admin/)                            │
  │ API: /api/admin/*                                                     │
  │ Prefix: Adm                                                           │
  │ Purpose: Full restaurant administration                               │
  │ Key Controllers: Dashboard, Orders, MenuItems, Customers, Users,     │
  │   RestaurantBranch, MenuCategory, Sliders, PaymentGateway,           │
  │   BusinessSetting, GlobalSetting, and 27 more                        │
  └────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────┐
  │ STEP 7.3 - RESTAURANT MODULE  (modules/restaurant/)                  │
  │ API: /api/restaurant/*                                                │
  │ Prefix: Rest                                                          │
  │ Purpose: Restaurant owner operations                                  │
  │ Key Controllers: Dashboard, Orders, MenuItems, Branches, Coupons,    │
  │   Sliders, MessageApproval, Withdrawal, PaymentGateway               │
  │ Extras: CommandController.java (special operations)                   │
  └────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────┐
  │ STEP 7.4 - BRANCH MODULE  (modules/branch/)                          │
  │ API: /api/branch/*                                                    │
  │ Prefix: Br                                                            │
  │ Purpose: Branch manager operations                                    │
  │ Key Controllers: Dashboard, Orders, MenuItems, Customers, Coupons,   │
  │   DiningTables, DeliveryZones, RestaurantHours, Users                │
  └────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────┐
  │ STEP 7.5 - CASHIER MODULE  (modules/cashier/)                        │
  │ API: /api/cashier/*                                                   │
  │ Prefix: Cash                                                          │
  │ Purpose: POS, billing, table booking, wallet                          │
  │ Key Controllers: Dashboard, Orders, OrderPayments, Customers,        │
  │   DiningTables, TableBooking, Coupons, WalletTransactions,           │
  │   Outstanding, WalletTopupRequest                                    │
  └────────────────────────────────────────────────────────────────────────┘

  

  ┌────────────────────────────────────────────────────────────────────────┐
  │ STEP 7.6 - KITCHEN MODULE  (modules/kitchen/)                        │
  │ API: /api/kitchen/*                                                   │
  │ Prefix: Kit                                                           │
  │ Purpose: Kitchen display system, order preparation tracking           │
  │ Key Controllers: Dashboard, Orders, OrderItems, MenuItems,           │
  │   DiningTables                                                       │
  │ Push Notifications: Receives FCM when new order is placed            │
  └────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────┐
  │ STEP 7.7 - DELIVERY MODULE  (modules/delivery/)                      │
  │ API: /api/delivery/*                                                  │
  │ Prefix: Del                                                           │
  │ Purpose: Delivery boy operations                                      │
  │ Key Controllers: Orders, OrderPayments, Customers, Outstanding,      │
  │   WalletTransactions, WalletTopupRequest, BankDetails                │
  └────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────┐
  │ STEP 7.8 - CUSTOMER MODULE  (modules/customer/)                      │
  │ API: /api/customer/*                                                  │
  │ Prefix: Cust                                                          │
  │ Purpose: Customer-facing - ordering, payments, wallet, ratings        │
  │ Key Controllers: Orders, MenuItems, MenuCategory, Notifications,     │
  │   CCAvenuePayment, PaymentGateway, TableBooking, Coupons,           │
  │   WalletTransactions, Withdrawal, Referral, Ratings                  │
  │ Extras:                                                               │
  │   - public_routes/ (CustPublicController - no auth needed)           │
  │   - dto/FundTransferRequest.java                                     │
  └────────────────────────────────────────────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE 8 : GLOBAL / PUBLIC APIs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Build in common/global/ :

  - GlobalApiController.java  --> Public endpoints (no auth):
      GET /api/global/theme/getByDomain       --> Restaurant theme by domain
      GET /api/global/theme/getByRestId        --> Theme by restaurant ID
      GET /api/global/branding/getByRestId     --> Branding (colors, logo)
      GET /api/global/marquee/getByRestId      --> Marquee messages

  - GlobalApiService.java     --> Business logic for global APIs


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE 9 : SCHEDULED TASKS & CRON JOBS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - configuration/ScheduledTasks.java
  - common/util/SchedularUtil.java
  - Periodic jobs: subscription expiry checks, cache cleanup,
    notification queue processing, etc.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PHASE 10 : TESTING & DEPLOYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Step 10.1 - Testing
  ───────────────────
  - Unit tests in src/test/java/com/rms/
  - Test: entity validation, service logic, API responses
  - Run: mvn test

  Step 10.2 - Build
  ─────────────────
  - Command: ./mvnw clean package
  - Output: target/Rms-0.0.1-SNAPSHOT.war

  Step 10.3 - Deploy
  ─────────────────
  - Deploy WAR to: Tomcat / any servlet container
  - OR run standalone: java -jar Rms-0.0.1-SNAPSHOT.war
  - Server starts on port 8085

  Step 10.4 - Environment Setup
  ────────────────────────────
  - MySQL 8 database running
  - Firebase service_account.json in classpath
  - AWS S3 credentials configured
  - Google Drive credentials configured
  - SMS gateway API keys configured
  - Payment gateway credentials configured



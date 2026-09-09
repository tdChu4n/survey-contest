window.CONTEST_CONFIG = Object.freeze({
  organizationName: 'TRƯỜNG X',
  unitName: 'ĐƠN VỊ NGHIÊN CỨU',
  contactEmail: 'contact@example.edu.vn',
  address: 'Thông tin được ẩn danh phục vụ vòng đánh giá',

  // Điền URL của Apps Script dành riêng cho bản dự thi sau khi triển khai
  // apps-script.gs trong thư mục này. Không dùng URL production.
  appsScriptUrl: '',

  // Điền OAuth Client ID dành riêng cho domain/deployment của bản dự thi.
  googleClientId: '84059448728-7698b8sorrp7p4qrq2shhiapvbsgd22u.apps.googleusercontent.com',

  // Chỉ dùng cho bản trình diễn cục bộ. Không xem đây là cơ chế xác thực production.
  demoAdminUser: 'reviewer',
  demoAdminPass: 'reviewer-demo'
});

window.CONTEST_CONFIG = Object.freeze({
  organizationName: 'TRƯỜNG X',
  unitName: 'ĐƠN VỊ NGHIÊN CỨU',
  contactEmail: 'contact@example.edu.vn',
  address: 'Thông tin được ẩn danh phục vụ vòng đánh giá',

  // Điền URL của Apps Script dành riêng cho bản dự thi sau khi triển khai.
  // Backend dùng cùng cấu trúc dữ liệu với web cũ nhưng vẫn triển khai tách biệt.
  appsScriptUrl: '',

  // Điền OAuth Client ID dành riêng cho domain/deployment của bản dự thi.
  googleClientId: '84059448728-7698b8sorrp7p4qrq2shhiapvbsgd22u.apps.googleusercontent.com',

  // Chỉ dùng cho bản trình diễn cục bộ. Không xem đây là cơ chế xác thực production.
  demoAdminUser: 'admin',
  demoAdminPass: 'admin123'
});

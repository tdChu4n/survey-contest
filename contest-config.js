window.CONTEST_CONFIG = Object.freeze({
  organizationName: 'TRƯỜNG X',
  unitName: 'ĐƠN VỊ NGHIÊN CỨU',
  contactEmail: 'contact@example.edu.vn',
  address: 'Thông tin được ẩn danh phục vụ vòng đánh giá',

  // Tạm thời dùng backend hiện có của web cũ cho bản dự thi.
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbyP9XvRCgVKV7y_SEtQ4Oz1bBlNkgnKzhqT19DrtqhFngE4C3qLq0Yb60buuM_12H_R/exec',

  // Điền OAuth Client ID dành riêng cho domain/deployment của bản dự thi.
  googleClientId: '84059448728-7698b8sorrp7p4qrq2shhiapvbsgd22u.apps.googleusercontent.com',

  // Chỉ dùng cho bản trình diễn cục bộ. Không xem đây là cơ chế xác thực production.
  demoAdminUser: 'admin',
  demoAdminPass: 'admin123'
});

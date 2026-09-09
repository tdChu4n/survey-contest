# Bản dự thi ẩn danh

Đây là phiên bản tách riêng của hệ thống khảo sát. Mã nguồn gốc ở thư mục cha không bị thay đổi.

## Chạy thử cục bộ

Khởi động một static server trong thư mục này, sau đó mở `index.html`. Khi chưa cấu hình OAuth và Apps Script, giao diện tự bật chế độ demo:

- Sinh viên: chọn **Đăng nhập để khảo sát** → **Sinh viên** → **Xem bản trình diễn ẩn danh**.
- Admin: đăng nhập bằng tài khoản demo trong `contest-config.js`.
- Dashboard dùng dữ liệu giả lập trong `survey-data.js` để các biểu đồ vẫn hoạt động.

## Kết nối bản dự thi

1. Tạo một Google Spreadsheet mới, độc lập với dữ liệu production.
2. Tạo Apps Script từ `apps-script.gs`.
3. Đặt Script Properties:
   - `ANONYMIZED_SPREADSHEET_ID`: bảng tính riêng của bản dự thi.
   - `SOURCE_SPREADSHEET_ID`: bảng nguồn; chỉ cần khi chạy đồng bộ thủ công.
   - `ANONYMIZATION_SALT`: chuỗi bí mật ngẫu nhiên, không ghi vào repository.
4. Chạy `syncAnonymizedSnapshot()` trong Apps Script Editor nếu cần lấy ảnh chụp dữ liệu từ hệ thống nguồn.
5. Deploy Apps Script và điền URL mới vào `contest-config.js`.
6. Tạo OAuth Client ID riêng cho deployment dự thi rồi điền vào `contest-config.js`.

Không dùng URL Apps Script, Spreadsheet ID hoặc OAuth Client ID của production trong bản này.

> Tài khoản admin trong `contest-config.js` chỉ phục vụ trình diễn giao diện. Vì mã nguồn frontend có thể được xem bởi người dùng, không dùng tài khoản demo này để bảo vệ dữ liệu nhạy cảm hoặc triển khai như một cơ chế xác thực thật.

## Nguyên tắc ẩn danh

- Hoạt động được đổi thành `Hoạt động 01`, `Hoạt động 02`, ...
- Đơn vị tổ chức được đổi thành `Đơn vị A`, `Đơn vị B`, ...
- Email được băm thành mã `P-...`; email thật không được ghi sang bảng đích.
- Họ tên, mã sinh viên, lớp, số điện thoại, email phụ và mạng xã hội bị loại bỏ.
- Khoa/ngành và khóa học được gom thành nhóm trung tính.
- Câu trả lời định tính bị lược bỏ trong quá trình đồng bộ vì văn bản tự do có thể chứa thông tin nhận diện.
- Hòm thư không được sao chép từ production.

Hàm đồng bộ chỉ chạy thủ công trong Apps Script Editor và không được xuất thành endpoint công khai.

## Phạm vi bản trình diễn

- Cả năm chức năng trên Admin Portal đều đã có luồng tương tác. Báo cáo hoạt động cơ sở được tổng hợp trực tiếp từ `Activities` và `SurveyResponses`.
- Khi chưa có Apps Script URL, dữ liệu mẫu được dùng để trình diễn; hoạt động được thêm trong chế độ này chỉ tồn tại trong phiên trình duyệt.
- Trước khi trình bày, chạy kiểm tra từ khóa nhận diện và chỉ sử dụng bảng tính đã ẩn danh.
- Khi trình bày, không hiển thị tên UEH, tên Khoa Toán - Thống kê hoặc các logo nhận diện của trường/khoa.
- Các cụm từ chung như “Đoàn - Hội” vẫn được sử dụng vì không tiết lộ tên trường hay khoa.

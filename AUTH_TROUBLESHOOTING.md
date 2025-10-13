# Authentication Troubleshooting Guide

## Vấn đề: "Authentication required" mặc dù đã đăng nhập

### Các bước debug:

1. **Mở Developer Console** (F12 trong Chrome/Edge)

2. **Chạy lệnh kiểm tra authentication:**
   ```javascript
   window.checkAuth()
   ```
   
   Lệnh này sẽ hiển thị:
   - ✅ LocalStorage có chứa token không
   - ✅ Supabase session có active không
   - ✅ User information
   - ✅ API Client status

3. **Nếu không có session, thử refresh:**
   ```javascript
   window.refreshAuth()
   ```

4. **Test API call:**
   ```javascript
   window.testApiCall()
   ```

### Các nguyên nhân thường gặp:

#### 1. Session đã hết hạn
**Triệu chứng:** localStorage có data nhưng `expiresAt` đã quá hạn

**Giải pháp:**
```javascript
window.refreshAuth()
```
Hoặc đăng xuất và đăng nhập lại:
```javascript
window.forceReauth()
```

#### 2. LocalStorage bị xóa
**Triệu chứng:** Không tìm thấy `codeforge-auth` trong localStorage

**Giải pháp:** Đăng nhập lại

#### 3. Token không được gửi trong request
**Triệu chứng:** Console log hiển thị "No session found for [METHOD] [URL]"

**Giải pháp:** Kiểm tra Network tab trong DevTools:
- Mở tab **Network**
- Gửi request (ví dụ: thử generate code)
- Click vào request
- Kiểm tra **Request Headers** xem có `Authorization: Bearer ...` không

#### 4. Backend không nhận token
**Triệu chứng:** Token được gửi nhưng backend vẫn trả về 401

**Kiểm tra:**
1. Backend có đang chạy không? (`http://localhost:3000/api/status`)
2. CORS có được cấu hình đúng không?
3. Token có hợp lệ không? (kiểm tra tại jwt.io)

### Cách khắc phục nhanh:

#### Phương pháp 1: Hard Refresh
1. Đăng xuất
2. Xóa cache: Ctrl + Shift + Delete
3. Đăng nhập lại

#### Phương pháp 2: Force Re-auth
```javascript
window.forceReauth()
```

#### Phương pháp 3: Kiểm tra Supabase Dashboard
1. Vào Supabase Dashboard
2. Kiểm tra **Authentication > Users**
3. Xác nhận user có tồn tại và active

### Debug logs nâng cao:

Các log mới đã được thêm vào `apiClient.ts`:

```
[apiClient] ✓ Adding auth token to POST /api/generate
[apiClient] 🔑 Token preview: eyJhbGciOiJIUzI1NiIs...
[apiClient] 👤 User ID: 12345678-1234-1234-1234-123456789012
```

Nếu thấy:
```
[apiClient] ✗ No session found for POST /api/generate
[apiClient] 💡 Check localStorage 'codeforge-auth' key
[apiClient] ❌ No stored auth in localStorage!
```

→ Session bị mất, cần đăng nhập lại

### Liên hệ hỗ trợ:

Nếu vẫn gặp vấn đề, hãy cung cấp:
1. Screenshot của `window.checkAuth()` output
2. Screenshot Network tab (request headers)
3. Console logs đầy đủ

# QR Code Test Page - Quick Verification

## Quick Test Instructions

### Test 1: Generate and Scan QR Code

1. **Login as Owner**
   - Go to: https://subscription-based-hotel-system.vercel.app/login
   - Email: `owner@tajpalace.com`
   - Password: `owner123`

2. **Navigate to Tables & QR**
   - Click on "Tables & QR" in sidebar
   - Or go to: https://subscription-based-hotel-system.vercel.app/owner/tables

3. **Generate QR Code**
   - Select "Table 1" from dropdown
   - Click "Generate QR Code"
   - QR code will appear

4. **Test the QR Code**
   - **Desktop Test**: Copy the URL and open in new tab
   - **Mobile Test**: Scan with phone camera
   
5. **Expected Result**
   - Menu page should open
   - Table should be pre-selected
   - No "Invalid Session" error

---

## Manual URL Test

Copy this URL and open in browser:

```
https://subscription-based-hotel-system.vercel.app/customer/hotel-1?table=table-1&token=aG90ZWwtMTp0YWJsZS0xOnNlc3NfdGVzdDEyMzoxNzA1MzM0NDAw
```

**Expected**: Menu page loads successfully

---

## Troubleshooting

### If QR Code Still Doesn't Work:

1. **Clear Browser Cache**
   ```
   Ctrl + Shift + Delete (Windows)
   Cmd + Shift + Delete (Mac)
   ```

2. **Hard Refresh**
   ```
   Ctrl + F5 (Windows)
   Cmd + Shift + R (Mac)
   ```

3. **Check Console for Errors**
   - Press F12 to open DevTools
   - Go to Console tab
   - Look for red error messages

4. **Verify Build Deployed**
   - Check if latest build is live
   - May take 1-2 minutes after deploy

---

## Token Format Verification

### Old Format (Not Working):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfcTG9kZW4iLCJpYXQiOjE3MDUzMzQ0MDAsImV4cCI6MTcwNTM0ODgwMH0...
```
❌ Too long, complex, hard to scan

### New Format (Working):
```
aG90ZWwtMTp0YWJsZS0xOnNlc3NfYWJjMTIzOjE3MDUzMzQ0MDA=
```
✅ Short, simple, easy to scan

---

## Success Criteria

✅ QR code generates in < 1 second  
✅ QR code is scannable with phone camera  
✅ URL opens menu page  
✅ No "Invalid Session" error  
✅ Table is pre-selected  
✅ Can add items to cart  
✅ Can place order  

---

## Contact

If issues persist after testing:
1. Check browser console for errors
2. Verify latest build is deployed
3. Try different browser/device
4. Generate new QR code (old ones may expire)

---

**Status**: ✅ Fixed and Tested  
**Build**: Successful  
**Deployment**: Ready

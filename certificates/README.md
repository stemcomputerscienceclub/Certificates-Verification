# STEM CS Club - Certificate Verification System

A professional, modern certificate verification system for STEM CS Club that matches the cyberpunk aesthetic of all other club subdomains.

## Features

### 🎯 Core Functionality
- **Smart Certificate ID Parsing**: Automatically parses 7-digit certificate codes into components
- **Real-time Validation**: Validates certificate format as users type
- **Certificate Database**: Mock database system with real certificate lookup
- **Glassmorphism UI**: Modern frosted glass design with backdrop blur effects
- **Responsive Design**: Fully responsive on mobile, tablet, and desktop
- **Share & Download**: Export and share verified certificates
- **Matrix Background**: Cyberpunk-themed animated background effect

### 🎨 Design Features
- **Consistent Branding**: Matches the cyberpunk theme across all STEM CSC subdomains
- **Color Scheme**:
  - Primary: `#00A3FF` (Bright Blue)
  - Secondary: `#18bce9` (Cyan)
  - Background: `#0E1636` (Dark Navy)
  - Accents: Neon glows and gradients
- **Smooth Animations**: Hover effects, loading spinners, and transitions
- **Accessibility**: Clear error messages, helpful hints, and keyboard support

## Certificate ID Format

The certificate verification code uses a specific format: **YYSSCCC**

```
verify.stemcsclub.org/2501001

├─ YY (25) → Year (2025)
├─ SS (01) → Sub-program:
│           00 = Main Club
│           01 = Online Chapter
│           02 = Bootcamp
│           03+ = Other programs
└─ CCC (001) → Serial number (001-9999)
```

### Example Certificates
- `2501001` - 2025, Online Chapter, 1st certificate
- `2502001` - 2025, Bootcamp, 1st certificate
- `2500001` - 2025, Main Club, 1st certificate

## File Structure

```
certificates/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling with theme
├── script.js           # Certificate verification logic
├── README.md           # This file
└── database.json       # (Optional) Certificate database storage
```

## How It Works

### 1. Certificate Entry
Users input a 7-digit certificate ID in the format: `YYSSCCC`

### 2. Validation
The system validates:
- Correct format (7 digits)
- Valid year (20-99, representing 2020-2099)
- Valid sub-program code (00-99)
- Valid serial number (001-9999)

### 3. Lookup
The system searches the certificate database for a match:
- Found → Display certificate with full details
- Not found → Show helpful error message

### 4. Display
On successful verification, shows:
- Certificate preview card with recipient details
- Program information and award date
- Certificate ID and verification status
- Options to share or download

## Usage

### Basic Usage
1. Navigate to the certificates page
2. Enter a 7-digit certificate ID
3. Click "Verify Certificate"
4. View certificate details if found

### Sharing a Certificate
Users can share certificates via:
- Direct URL with certificate ID: `verify.stemcsclub.org/?id=2501001`
- Share button (uses native share API or copy-to-clipboard fallback)

### Accessing Direct Certificate Links
Certificates can be accessed directly:
```
https://verify.stemcsclub.org/2501001
```

The system will automatically populate and verify the certificate.

## Customization Guide

### Adding Certificates to Database
Edit `script.js` and add to `certificateDatabase`:

```javascript
const certificateDatabase = {
    '2501001': {
        name: 'Full Name',
        program: 'Program Name - Track',
        programCode: 'Program Type',
        date: 'Month Day, Year',
        year: 2025,
        subProgram: '01',
        serial: '001'
    },
    // Add more certificates...
};
```

### Adding Sub-programs
Edit the `programMapping` object:

```javascript
const programMapping = {
    '04': { name: 'New Program', description: 'Program Description' },
    // ...
};
```

### Customizing Colors
Update CSS variables in `styles.css`:

```css
:root {
    --primary-color: #00A3FF;
    --secondary-color: #18bce9;
    --bg-color: #0E1636;
    /* ... customize other colors ... */
}
```

### Customizing Fonts
Modify font-family in CSS:

```css
* {
    font-family: 'Your Font', fallback;
}
```

## Production Deployment

### Before Going Live:

1. **Database Integration**
   - Replace mock database with real backend connection
   - Implement proper authentication/authorization
   - Use secure API endpoints

2. **PDF Generation**
   - Implement certificate PDF download functionality
   - Use libraries like `html2pdf` or `jsPDF`
   - Include security features (QR codes, watermarks)

3. **Security**
   - Validate all inputs server-side
   - Implement HTTPS
   - Add rate limiting for verification attempts
   - Use secure tokens for direct access

4. **Analytics**
   - Track certificate lookups
   - Monitor verification success rates
   - Log failed attempts

### Example Backend Integration

```javascript
// Replace this in script.js:
async function lookupCertificate(id) {
    try {
        const response = await fetch(`/api/verify/${id}`);
        const data = await response.json();
        return {
            found: data.exists,
            data: data.certificate
        };
    } catch (error) {
        console.error('Verification error:', error);
        return { found: false };
    }
}
```

## Testing

### Test Certificate IDs
```
2501001 - Online Chapter (exists in mock DB)
2501002 - Online Chapter (exists in mock DB)
2502001 - Bootcamp (exists in mock DB)
2500001 - Main Club (exists in mock DB)
9999999 - Invalid (not in database)
123456  - Invalid format (6 digits)
2525001 - Invalid year
```

### Test Cases
- [ ] Valid certificate ID displays correctly
- [ ] Invalid format shows error message
- [ ] Share button works
- [ ] Direct URL parameter works
- [ ] Responsive design on mobile
- [ ] Keyboard navigation works
- [ ] Error messages are helpful

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (with -webkit prefixes)
- Mobile browsers: Full responsive support

## Performance

- Load time: < 2 seconds
- Certificate lookup: < 1 second (with simulated delay)
- No external dependencies required for core functionality
- Optional Font Awesome icons for enhanced visuals

## Accessibility

- Keyboard navigation supported
- Clear focus indicators
- ARIA labels included
- Color contrast meets WCAG standards
- Error messages in plain language

## Troubleshooting

### Certificate Not Found
- Check spelling of certificate ID
- Verify format: must be exactly 7 digits
- Ensure certificate exists in database

### Styling Issues
- Clear browser cache (Ctrl+Shift+Delete)
- Check CSS file is loading (F12 → Network tab)
- Verify CSS variables in browser DevTools

### Share Not Working
- Check browser permissions for share API
- Fallback to copy-to-clipboard is automatic
- Ensure HTTPS for native share on some browsers

## Future Enhancements

- [ ] PDF certificate generation with QR code
- [ ] Email certificate verification
- [ ] Certificate revocation system
- [ ] Bulk certificate import from CSV
- [ ] Admin dashboard for certificate management
- [ ] Multi-language support
- [ ] Dark/Light mode toggle
- [ ] Certificate categories and filtering

## Credits

- Design: STEM CS Club Design Team
- Development: STEM CS Club Dev Team
- Theme: Cyberpunk aesthetic matching club branding

## License

© 2025 STEM CS Club. All rights reserved.

## Support

For questions or issues:
- Discord: https://discord.gg/bhNm7jc7js
- Website: https://www.stemcsclub.org

---

**Last Updated**: January 2025
**Version**: 1.0.0

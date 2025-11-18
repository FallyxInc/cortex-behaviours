# How to Add Inter Font to jsPDF

## Method 1: Using jsPDF Font Converter (Recommended)

### Step 1: Download Inter Font Files
1. Go to https://fonts.google.com/specimen/Inter
2. Download Inter-Regular.ttf and Inter-Bold.ttf (or Inter-SemiBold.ttf for bold)
3. Save them in your project (e.g., in `public/fonts/`)

### Step 2: Convert Fonts to jsPDF Format
1. Visit the jsPDF Font Converter: https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
   OR use the updated tool: https://github.com/parallax/jsPDF/tree/master/fontconverter
   
2. For each font file (Regular and Bold):
   - Upload the `.ttf` file
   - Click "Download" to get a JavaScript file
   - The generated file will look like:
   ```javascript
   jsPDF.API.events.push([
     'addFonts',
     function() {
       this.addFileToVFS('Inter-Regular.ttf', 'BASE64_STRING_HERE');
       this.addFont('Inter-Regular.ttf', 'Inter', 'normal');
     }
   ]);
   ```

### Step 3: Create Font Definition File
Create `src/lib/inter-font.js` with the converted font data:

```javascript
export function registerInterFont(pdf) {
  // Add Regular font
  pdf.addFileToVFS('Inter-Regular.ttf', 'PASTE_BASE64_HERE');
  pdf.addFont('Inter-Regular.ttf', 'Inter', 'normal');
  
  // Add Bold font
  pdf.addFileToVFS('Inter-Bold.ttf', 'PASTE_BASE64_HERE');
  pdf.addFont('Inter-Bold.ttf', 'Inter', 'bold');
}
```

### Step 4: Use in Your PDF Generation
In `BehavioursReports.js`, import and use:

```javascript
import { registerInterFont } from '@/lib/inter-font';

const handleExportPDF = async () => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: 'a4',
  });
  
  // Register Inter font
  registerInterFont(pdf);
  
  // Now use 'Inter' instead of 'helvetica'
  pdf.setFont('Inter', 'bold');
  pdf.text('Your text here', x, y);
  
  pdf.setFont('Inter', 'normal');
  pdf.text('More text', x, y);
}
```

## Method 2: Using NPM Package (Alternative)

If you prefer, you can use a pre-converted font package:
```bash
npm install inter-font-for-jsPDF
```

Then import and use:
```javascript
import 'inter-font-for-jsPDF';
// Use 'Inter' as font name directly
pdf.setFont('Inter', 'normal');
```

## Method 3: Load Font at Runtime (Advanced)

For Next.js, you might want to load the font dynamically:

```javascript
async function loadInterFont() {
  const interRegular = await fetch('/fonts/Inter-Regular.base64').then(r => r.text());
  const interBold = await fetch('/fonts/Inter-Bold.base64').then(r => r.text());
  
  return { regular: interRegular, bold: interBold };
}
```

## Notes:
- Font files can be large (hundreds of KB), which will increase your bundle size
- Consider using only Regular and Bold weights to reduce bundle size
- The font converter generates base64 strings that are quite long
- Make sure to use the correct font name ('Inter') after registration


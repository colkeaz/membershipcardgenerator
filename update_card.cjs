const fs = require('fs');
let code = fs.readFileSync('src/pages/CardPage.jsx', 'utf8');

code = code.replace(/import QRCode from 'qrcode';/, "import QRCode from 'qrcode';\nimport html2canvas from 'html2canvas';");
code = code.replace(/const toast = useToast\(\);/, "const toast = useToast();\n  const [downloading, setDownloading] = useState(false);");

const downloadFunc = `
  const downloadCardImage = async () => {
    if (!frontRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(frontRef.current, { backgroundColor: null, scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = \`SSC_AL_ID_\${member.studentId || 'Card'}.png\`;
      link.click();
      toast('Card image saved successfully!', 'success');
    } catch (error) {
      console.error(error);
      toast('Failed to save card image', 'error');
    } finally {
      setDownloading(false);
    }
  };
`;
code = code.replace(/const isPending/, downloadFunc + '\n  const isPending');

code = code.replace(/<div className="export-offscreen" aria-hidden="true">/, `<div className="export-offscreen" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>`);
code = code.replace(/<CardFront ref={frontRef} member={member} \/>/, `<div ref={frontRef} style={{ width: 'fit-content' }}><CardFront member={member} /></div>`);
code = code.replace(/<CardBack  ref={backRef}  member={member} qrDataUrl={qrDataUrl} \/>/, `<div ref={backRef} style={{ width: 'fit-content' }}><CardBack member={member} qrDataUrl={qrDataUrl} /></div>`);

const buttons = `
            <div className="card-actions" style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => window.print()}
                aria-label="Print Card"
              >
                <Download size={14} aria-hidden="true" /> Print / PDF
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={downloadCardImage}
                disabled={downloading}
                aria-label="Download Image"
              >
                {downloading ? <span className="spinner spinner-sm" /> : <FileImage size={14} aria-hidden="true" />}
                {downloading ? ' Saving...' : ' Save Image'}
              </button>
            </div>
`;
code = code.replace(/<div className="card-actions">[\s\S]*?<\/div>/, buttons);

fs.writeFileSync('src/pages/CardPage.jsx', code);
console.log('Updated CardPage.jsx');

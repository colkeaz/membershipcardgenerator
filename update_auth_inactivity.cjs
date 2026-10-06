const fs = require('fs');
let code = fs.readFileSync('src/hooks/useAuth.jsx', 'utf8');

const inactivityLogic = `
  // 15 minute inactivity timeout
  useEffect(() => {
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      if (user) {
        timeout = setTimeout(() => {
          logout();
        }, 15 * 60 * 1000);
      }
    };
    resetTimer();
    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    return () => {
      clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [user]);

  return (
`;

code = code.replace(/return \(/, inactivityLogic);
fs.writeFileSync('src/hooks/useAuth.jsx', code);
console.log('Updated useAuth.jsx with inactivity timeout');

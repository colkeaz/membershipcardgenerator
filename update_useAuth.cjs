const fs = require('fs');
let code = fs.readFileSync('src/hooks/useAuth.jsx', 'utf8');

code = code.replace(
  /const unsub = onAuthStateChanged\(auth, async \(firebaseUser\) => \{/,
  `const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const cachedMemberStr = localStorage.getItem(\`ssc_member_\${firebaseUser.uid}\`);
        if (cachedMemberStr) {
          try {
             setMember(JSON.parse(cachedMemberStr));
          } catch(e) {}
        }
      }`
);

code = code.replace(
  /setMember\(\{ id: snap\.id, \.\.\.data \}\);/,
  `const memberObj = { id: snap.id, ...data };
          setMember(memberObj);
          localStorage.setItem(\`ssc_member_\${firebaseUser.uid}\`, JSON.stringify(memberObj));`
);

code = code.replace(
  /setMember\(null\);\s*\}\s*\} else \{/,
  `setMember(null);
          localStorage.removeItem(\`ssc_member_\${firebaseUser.uid}\`);
        }
      } else {`
);

code = code.replace(
  /setMember\(snap\.exists\(\) \? \{ id: snap\.id, \.\.\.snap\.data\(\) \} : null\);/,
  `if (snap.exists()) {
      const memberObj = { id: snap.id, ...snap.data() };
      setMember(memberObj);
      localStorage.setItem(\`ssc_member_\${user.uid}\`, JSON.stringify(memberObj));
    } else {
      setMember(null);
      localStorage.removeItem(\`ssc_member_\${user.uid}\`);
    }`
);

fs.writeFileSync('src/hooks/useAuth.jsx', code);
console.log('Updated useAuth.jsx');

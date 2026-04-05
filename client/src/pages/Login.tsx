import React, { useState } from 'react';

const Login = () => {
  const [name, setName] = useState('');

  const handleLogin = () => {
    if (name) {
      localStorage.setItem('username', name);
      window.location.href = '/chat';
    }
  };

  return (
    <div style={{ background: '#121212', color: 'white', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <input type="text" placeholder="Enter Name" onChange={(e) => setName(e.target.value)} />
      <button onClick={handleLogin}>Join Chat</button>
    </div>
  );
};

export default Login;

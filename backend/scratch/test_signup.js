async function testSignup() {
  const url = 'http://localhost:3102/signup';
  const email = `test.student.${Date.now()}@ucaldas.edu.co`;
  console.log('Sending signup request to:', url, 'with email:', email);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password: 'Password123*',
        fullName: 'Nata Automata',
      }),
    });
    console.log('Status:', res.status);
    console.log('Status Text:', res.statusText);
    const json = await res.json();
    console.log('Response JSON:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testSignup();

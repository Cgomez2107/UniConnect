async function test() {
  const url = 'https://nataproyecto.app.n8n.cloud/webhook/nuevo-usuario';
  console.log('Sending request to:', url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'usuario.verificado',
        timestamp: new Date().toISOString(),
        data: {
          userId: 'test-user-id-123456',
          email: 'test.student@ucaldas.edu.co',
          fullName: 'Nata Prueba',
        },
      }),
    });
    console.log('Status:', res.status);
    console.log('Status Text:', res.statusText);
    const text = await res.text();
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();

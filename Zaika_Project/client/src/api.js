export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('zaika-token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(path, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error('Cannot reach the backend. Start the API server and MongoDB, then try again.');
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.msg || data?.error || 'Request failed');
  }

  return data;
};

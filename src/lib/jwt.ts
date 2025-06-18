// JWT utility for client-side token decoding
export interface JWTPayload {
  _id: string;
  role: 'super_admin' | 'admin' | 'teacher' | 'parent' | 'student';
  iat: number;
  exp: number;
}

export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    // JWT has 3 parts: header.payload.signature
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload) return true;
  
  const currentTime = Date.now() / 1000;
  return payload.exp < currentTime;
};

export const getUserFromToken = (token: string): { id: string; role: string } | null => {
  const payload = decodeJWT(token);
  if (!payload) return null;
  
  return {
    id: payload._id,
    role: payload.role
  };
}; 
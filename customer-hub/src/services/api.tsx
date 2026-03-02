import axios from "axios";
import { authObjVar, accessTokenVar, refreshTokenVar } from "./authService";

export const BASE_API = import.meta.env.VITE_APP_SERVER_URL;

const api = axios.create({
  baseURL:  BASE_API,  
});

const apiPrivate = axios.create({
  baseURL: BASE_API,
});

apiPrivate.interceptors.request.use((config: any) => {  
  const accessToken = localStorage.getItem(accessTokenVar);
  
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

const errorHandler = (err: any) => {
  const errors = err?.response?.data?.response?.errors;
  const code = err?.response?.data?.response?.code;
  const message = err?.message;

  const errDataRespMessage = err?.data?.response?.message;
  
  const sessionErrors = [
    "access_token_not_found",
    "access_token_expired",
    "refresh_token_not_found",
    "refresh_token_expired"
  ];

  // If errors is an array with items
  if (Array.isArray(errors) && errors.length) {
    return errors.join('. ');
  }

  // If code or errors match a session-related error
  if (sessionErrors.includes(code) || sessionErrors.includes(errors)) {
    return `You're being redirected. Please log in again.`;    
  }

  if(errDataRespMessage) {
    return errDataRespMessage;
  }

  // If there's a generic message
  if (message) {
    return message;
  }

  return 'An error occurred. Please try again later.';
};

/*****************************************************************************
 * Axios Response Interceptor for refreshing access tokens with the private api
 * 
 * This interceptor handles all failed HTTP responses (non-2xx status codes).
 * Specifically, it looks for a custom "access_token_expired" error in the response,
 * and automatically attempts to refresh the access token using the refresh token.
 * 
 * - If a token refresh is already in progress, it queues additional failed requests 
 *   and retries them once the refresh completes.
 * - If the refresh is successful, it updates localStorage with the new tokens,
 *   updates the Authorization header, and retries the original request.
 * - If the refresh fails (e.g. invalid or expired refresh token), the error is passed along.
 * 
 * This makes the token management seamless and helps keep users authenticated
 * without manual intervention.
 */

// Flag to avoid infinite loops
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiPrivate.interceptors.response.use(response => response,  async error => {
    
  const originalRequest = error.config;
  const errorResponse = error?.response?.data?.response?.errors || error?.response?.data?.code;

  if ((errorResponse === 'access_token_expired' || errorResponse === 'access_token_not_found')  && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (isRefreshing) {
        // Queue the request until the refresh is done
        return new Promise(function (resolve, reject) {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = 'Bearer ' + token;
              resolve(apiPrivate(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem(refreshTokenVar);
     
        const res = await axios.post(`${BASE_API}auth/refresh_token`, null, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        });
        
        const authObj = res.data.response[authObjVar];
        const newAccessToken = authObj[accessTokenVar];
        const newRefreshToken = authObj[refreshTokenVar];

        localStorage.setItem(accessTokenVar, newAccessToken);
        localStorage.setItem(refreshTokenVar, newRefreshToken);

        apiPrivate.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiPrivate(originalRequest);
      } catch (errRefresh) {
        
        //processQueue(errRefresh, null); //if error found in refresh token do not process

        localStorage.removeItem(accessTokenVar);
        localStorage.removeItem(refreshTokenVar);
       
        // This when we don't want an endpoint to reload the page when refresh token is expired
        // or does not exist, for example is_logged end point, it auto executes on reloading the page
        // so, in that case we don't want to reload again.              
        if (!originalRequest?._skipForceReload) {
          setTimeout(() => { window.location.reload(); }, 3000);          
        } 
        
        return Promise.reject(errRefresh);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

//*****************************************************************************

export { api, apiPrivate, errorHandler };
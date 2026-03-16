import { api, apiPrivate } from "@/services/api";

export const authObjVar = "d1a22a6f44f8b11b132a1ea";
export const accessTokenVar = "b25a9b3d0c99f288c";
export const refreshTokenVar = "564c8d74f693c47f5";

export const login = async (username: string, security_code: string, org_id: string) => {
  try {
    const response = await api.post("/auth/login", { username, security_code, org_id });
    if (response.status === 200) {
      if (response.data.response.status) {

        const authObj = response.data.response[authObjVar];
        const accessToken = authObj[accessTokenVar];
        const refreshToken = authObj[refreshTokenVar];

        localStorage.setItem(accessTokenVar, accessToken);
        localStorage.setItem(refreshTokenVar, refreshToken);
      }
    }
    return response;
  } catch (error) {
    throw error;
  }
};

function getNameBeforeAt(username: string): string | null {
  const atIndex = username.indexOf("@");

  if (
    atIndex > 0 && // not first char
    atIndex < username.length - 1 && // not last char
    username.indexOf("@") === username.lastIndexOf("@") // only one "@"
  ) {
    return username.substring(0, atIndex);
  }

  return null; // invalid format
}

export const register = async (username: string, security_code: string, org_id: string) => {
  try {
    const name = getNameBeforeAt(username);
    
    const response = await api.post("/auth/register", { username, security_code, org_id, name });
    
    if (response.status === 200) {
      if (response.data.response.status) {

        const authObj = response.data.response[authObjVar];
        const accessToken = authObj[accessTokenVar];
        const refreshToken = authObj[refreshTokenVar];

        localStorage.setItem(accessTokenVar, accessToken);
        localStorage.setItem(refreshTokenVar, refreshToken);
      }
    }
    return response;
  } catch (error) {
    throw error;
  }
};

export const accExists = async (username: string, orgId: string) => {
  try {
    const resp = await api.post("/auth/account_exists", { username, org_id: orgId });
    return resp
  } catch (error) {
    throw error;
  }
}

export const genSecCode = async (email: string, org_id: string) => {
  try {
    const response = await api.post("/auth/generate_security_code", { username: email, org_id });
    return response;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    const resp = await apiPrivate.post("/auth/sign_out");

    if (resp.status === 200) {
      if (resp.data.response.status) {
        console.log("Logout successful");
      }
    }

    localStorage.removeItem(accessTokenVar);
    localStorage.removeItem(refreshTokenVar);

    return resp;

  } catch (error) {
    throw error;
  }
};

export const checkAuth = async (orgId: string, _skipForceReload:boolean = false) => {
  try {
    const resp = await apiPrivate.post("/auth/is_logged", { org_id: orgId }, {
      _skipForceReload
    } as any);
    return resp
  } catch (error) {
    throw error;
  }
};

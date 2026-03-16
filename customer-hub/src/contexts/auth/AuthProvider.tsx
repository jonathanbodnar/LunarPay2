import React, { useState, useEffect } from "react";
import { accExists, checkAuth, genSecCode, login, logout, register } from "../../services/authService"; // Import auth service methods
import FullLoader from "@/components/ui/full-loader";
import { api } from "@/services/api";
import { useLocation, useNavigate } from "react-router-dom";
import { resetAllStatusStores } from "@/store/storeWithResetWrap";
import { AuthContext, Tenant, User, dummyTenantData } from "./AuthContext";

export const AuthProvider: React.FC<{ tenantSlug: string; children: React.ReactNode }> = ({
    tenantSlug,
    children,
  }) => {

    const navigate = useNavigate();
    const location = useLocation();
    const [tenantData, setTenantData] = useState<Tenant>(dummyTenantData);
    const [loading, setLoading] = useState<boolean>(true);
    const [tenant, setTenant] = useState<string>("");
    const [user, setUser] = useState<User | null>(null);
    
    const [doRegister, setDoRegister] = useState<boolean>(false);
  

    const handleLogedInRedirect = () => {
      const current_path = location.pathname;
  
      const isMatchingPath = [
        /^\/[A-Za-z0-9_-]+\/?$/,                          // /anything or /anything/
        /^\/[A-Za-z0-9_-]+\/login\/?$/,                   // /anything/login or /anything/login/
        /^\/customer-hub\/[A-Za-z0-9_-]+\/?$/,            // /customer-hub/anything or /customer-hub/anything/
        /^\/customer-hub\/[A-Za-z0-9_-]+\/login\/?$/      // /customer-hub/anything/login or /customer-hub/anything/login/
      ].some((regex) => regex.test(current_path));
  
      return isMatchingPath;
    }
  
    useEffect(() => {
      const loadTenant = async () => {
        let resTenant: Tenant | null = null;
        let me = null;
  
        try {
          setTenant(tenantSlug);
          const res = await api.get(`organization/get_brand_settings/${tenantSlug}`, {
            headers: {
              "X-App": "customer-hub",
            },
          });
          if (res.status !== 200) {
            throw new Error("Failed to load tenant data");
          }
  
          resTenant = res.data.response.data as Tenant;
  
          try {
            me = await checkAuth(resTenant.church_id, true);
            
          } catch (err) {
            console.log("not logged in");          
          }          
          
        } catch (err) {
          console.log("Failed to load tenant", err);
          setTenantData(dummyTenantData);
        } finally {
  
          if(resTenant) {          
            setTenantData(resTenant);
            if(me) {
              setUser(me.data.response.data);
              const isMatchingPath = handleLogedInRedirect();
              
              if (isMatchingPath) {
                navigate(`/${tenantSlug}/dash`);
              } else {
                //console.log("No match.");
              }
             
            } else {  
              if(resTenant._shopAvailable) {
                navigate(`/${tenantSlug}/shop`)
                setLoading(false);
                return;
              } else {
                navigate(`/${tenantSlug}/login`)
              }
              
            }
            
          } else {
            console.log("Tenant not found");
            navigate(`/`);
          }        
          setLoading(false);
        }
      };
  
      loadTenant();
    }, []);
  
    const reqSecurityCode = async (email: string, org_id: string) => {
      try {
        const accExistsResp = await accExists(email, org_id);
        if(accExistsResp?.data?.response?.status) {
          setDoRegister(false);
        } else {
          setDoRegister(true);
        }

        const resp = await genSecCode(email, org_id);
        return resp;
      } catch (err) {      
        throw err;
      }
    };
  
  const verifyCode = async (username: string, code: string, orgId: string) => {
    try {
      if (doRegister) {
        const resp = await register(username, code, orgId);
        if (resp?.data?.response?.status) {
          const me = await checkAuth(orgId);
          setUser(me.data.response.data);
        }
        return resp;
      } else {
        const resp = await login(username, code, orgId);
        if (resp?.data?.response?.status) {
          const me = await checkAuth(orgId);
          setUser(me.data.response.data);
        }
        return resp;
      }
    } catch (err) {
      throw err;
    }
    };

    const handleCheckAuth = async () => {
      try {
        const resp = await checkAuth(tenantData.church_id, true);
        return resp;
      } catch (err) {
        throw err;
      }
    }
  
    const handleLogout = async () => {
      try {
        const resp = await logout();    
        
        if (resp.status == 200) {
          if (resp.data.response.status) {
            setUser(null);
            resetAllStatusStores();
            navigate(`/${tenant}/login`);
            console.log("Logout successful");
          }
        } 
        return resp;      
      } catch (err) {
        throw err;
      } 
    };
  
    if (loading) {
      return <FullLoader />;
    }
  
    return (
      <AuthContext.Provider value={{
        tenant,
        tenantData,
        user,
        reqSecurityCode,
        verifyCode,
        handleLogout,
        handleCheckAuth
      }}>
        {children}
      </AuthContext.Provider>
    );
  };
  

import { createContext } from "react";

export type Tenant = {
  id: string;
  name: string;
  client_id: string;
  church_id: string;
  logo: string;
  theme_color: string;
  button_text_color: string;
  entire_logo_url: string;
  _shopAvailable: boolean;
}

export const dummyTenantData = {
  id: "0",
  name: "",
  client_id: "",
  church_id: "",
  logo: "",
  theme_color: "",
  button_text_color: "",
  entire_logo_url: "",
  _shopAvailable: false
}

export type User = {  
  email: string;
  name: string;
}

interface AuthContextType {
  tenant: string;  
  tenantData: Tenant;  
  user: User | null;  
  reqSecurityCode: (email: string, org_id: string) => any;
  verifyCode: (username: string, code: string, orgId: string) => any;
  handleLogout: () => any;
  handleCheckAuth: () => any;  
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

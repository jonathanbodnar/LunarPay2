import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { errorHandler } from "@/services/api";
import { toast } from "sonner";
import { Button } from "../ui/button";
import LoaderSmall from "../ui/loader-small";
import { CgLogOut, CgProfile } from "react-icons/cg";
import { GetAuthContext } from "@/contexts/auth/GetAuthContext";
import { MdKeyboardArrowDown, MdLogin, MdStore } from "react-icons/md";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FaCartShopping } from "react-icons/fa6";
import { User } from "@/contexts/auth/AuthContext";
import { GrMenu } from "react-icons/gr";
import { useShopStore } from "@/store/shopStore";


interface MenuProps {
  selectedMenu: string | null;
  tenant: string;
  user: User | null;
}

interface AuthLinksProps extends MenuProps {
  clickLogout: () => void;
  logoutLoading: boolean;
}

const MobileMenu: React.FC<MenuProps> = ({ selectedMenu, tenant, user }) => {
  if (!user) return <>
    <Link to={`/${tenant}/shop`} className={`my-menu-link flex items-center ${selectedMenu === "shop" ? "font-extrabold" : "text-muted-foreground"}`}>
      <MdStore className="mr-1" />Store
    </Link>
  </>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="gap-1">
        <Button variant="ghost" className="sm:hidden capitalize">
          {selectedMenu === "dash" ? <CgProfile /> :
            selectedMenu === "shop" ? <MdStore /> :
              selectedMenu === "checkout" ? <FaCartShopping /> : ""}
          <GrMenu />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="sm:hidden w-44">
        <DropdownMenuItem asChild>
          <Link to={`/${tenant}/dash`} className={`flex items-center ${selectedMenu === "dash" ? "font-extrabold" : "text-muted-foreground"}`}>
            <CgProfile className="mr-1" />My account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/${tenant}/shop`} className={`flex items-center ${selectedMenu === "shop" ? "font-extrabold" : "text-muted-foreground"}`}>
            <MdStore className="mr-1" />Store
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DesktopLinks: React.FC<MenuProps> = ({ selectedMenu, tenant, user }) => (
  <div className="hidden sm:flex">
    {user && (
      <>
        <Link to={`/${tenant}/dash`} className={`my-menu-link flex items-center ${selectedMenu === "dash" ? "font-extrabold" : "text-muted-foreground"}`}>
          <CgProfile className="mr-1" />My account
        </Link>
        <Link to={`/${tenant}/shop`} className={`my-menu-link flex items-center ${selectedMenu === "shop" ? "font-extrabold" : "text-muted-foreground"}`}>
          <MdStore className="mr-1" />Store
        </Link>
      </>
    )}

  </div>
);

const RightIcons: React.FC<AuthLinksProps> = ({ user, tenant, selectedMenu, clickLogout, logoutLoading }) => {
  if (!user) {
    return (
      <>
        <CartIcon tenant={tenant} selectedMenu={selectedMenu} />
        <Link to={`/${tenant}/login`} className={`my-menu-link flex items-center ${selectedMenu === "login" ? "font-extrabold" : "text-muted-foreground"}`}>
          <MdLogin className="mr-1" />Sign in
        </Link>
      </>
    );
  }
  return (
    <div className="ml-auto text-sm flex items-center">
      <CartIcon tenant={tenant} selectedMenu={selectedMenu} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="gap-1">
          <Button variant="ghost" className="capitalize font-medium">
            {user.email.split('@')[0]}
            <MdKeyboardArrowDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="font-semibold text-center w-full text-sm text-muted-foreground">
            {user.email}
          </DropdownMenuLabel>
          <DropdownMenuItem className="cursor-pointer w-full text-right" onClick={clickLogout}>
            {logoutLoading ? <LoaderSmall /> : (<><CgLogOut className="mr-0" />Sign out</>)}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const CartIcon: React.FC<{ tenant: string, selectedMenu: string | null }> = ({ tenant, selectedMenu }) => {
  const cartCount = useShopStore((state) => state.cartCount);

  if (cartCount === 0) return null;
  return (
    <Link to={`/${tenant}/checkout`} className={`my-menu-link flex items-center ${selectedMenu === "checkout" ? "font-extrabold" : "text-muted-foreground"}`}>
      <FaCartShopping className="mr-1" /> {cartCount} Items
    </Link>
  );
};


// --- Main TopNav Component ---

const TopNav: React.FC = () => {
  const { handleLogout, tenant, user } = GetAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const locationPathname = location.pathname.split('/').filter(Boolean);
  const selectedMenu = locationPathname[locationPathname.length - 1] || null;

  const [logoutLoading, setLogoutLoading] = useState(false);

  const clickLogout = async () => {
    setLogoutLoading(true);
    try {
      const resp = await handleLogout();
      if (!resp?.data?.response?.status) throw new Error("Failed to logout");
      navigate(`/${tenant}/login`);
    } catch (err: any) {
      toast.error(errorHandler(err), { position: "top-center" });
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <nav className={`flex mb-6 max-w-[550px] flex-wrap
      ${user === null ? "justify-center sm:justify-normal" : ""}
    `}>
      <MobileMenu selectedMenu={selectedMenu} tenant={tenant} user={user} />
      <DesktopLinks selectedMenu={selectedMenu} tenant={tenant} user={user} />
      <RightIcons
        user={user}
        tenant={tenant}
        selectedMenu={selectedMenu}
        clickLogout={clickLogout}
        logoutLoading={logoutLoading}
      />
    </nav>
  );
};

export default TopNav;

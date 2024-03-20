import { createContext, useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { Route } from "react-router-dom";
import { Routes } from "react-router-dom";
import Auth from "./auth";
import Club from "./club";
import UserHome from "./home";
import Profile from "./profile";
import { supabase } from "./utils/supabaseClient";
import Announcements from "./announcements";
import Events from "./events";
import Tos from "./tos";
import PrivacyPolicy from "./privacypolicy";

export const AppContext = createContext(null);

export default function App() {
  let [user, setUser] = useState(null);

  const loadUserData = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*, roles(*)")
      .eq("id", userId)
      .single();
    setUser(data);
  };

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUserData(session.user.id);
      } else {
        setUser(null);
      }
    });
  }, []);

  return (
    <div data-theme="dark">
      <AppContext.Provider value={{ user }}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="/tos" element={<Tos />}></Route>
            <Route path="/auth" element={<Auth />}></Route>
            <Route path="/privacypolicy" element={<PrivacyPolicy />}></Route>
            <Route element={<AuthenticatedRoute />}>
              <Route path="/" element={<UserHome />}></Route>
              <Route path="/club/:club_id" element={<Club />}></Route>
              <Route path="/events" element={<Events />}></Route>
              <Route path="/profile/:user_id" element={<Profile />}></Route>
              <Route path="/announcements" element={<Announcements />}></Route>
            </Route>
          </Route>
        </Routes>
      </AppContext.Provider>
    </div>
  );
}

function AuthenticatedRoute() {
  const { user } = useContext(AppContext);
  const location = useLocation();

  if (user) return <Outlet />;
  else {
    localStorage.setItem("redirectTo", location.pathname);
    return <Auth />;
  }
}

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow p-5"><Outlet/></div>
      <Footer />
    </div>
  );
}

function Header() {
  let { user } = useContext(AppContext);

  function signOut() {
    supabase.auth.signOut();
  }

  return (
    <div className="flex items-center border-b border-primary p-5 space-x-5">
      <div className="text-xl font-bold">
        <Link to="/">btree</Link>
      </div>
      <div className="flex-grow font-bold space-x-2">
        <Link to="/announcements">Announcements</Link>
        <Link to="/events">Events</Link>
      </div>
      {user && (
        <div className="flex items-center space-x-2">
          <Link to={`/profile/${user.id}`} className="font-bold">
            {user.full_name}
          </Link>
          <button onClick={signOut} className="btn btn-sm btn-error">
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="p-4 flex justify-center space-x-5 bg-neutral">
      <Link to="/tos">Terms</Link>
      <Link to="/privacypolicy">Privacy Policy</Link>
    </footer>
  );
}

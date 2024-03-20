import { useContext, useEffect } from "react";
import { AppContext } from "./App";
import { useNavigate } from "react-router-dom";

export default function Redirect() {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(localStorage.getItem("redirectTo") || "/");
    }
  }, [user]);

  return (
    <div>
      <h1>Redirecting...</h1>
    </div>
  );
}

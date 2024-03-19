import { useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  async function loadData() {
    console.log("loading data");
    const { data, error } = await supabase.from("items").select("*");
    console.log(data, error);
  }

  useEffect(() => {
    loadData();
  }, []);

  return <div>Club App</div>;
}
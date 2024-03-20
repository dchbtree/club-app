import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "./App";
import { supabase } from "./utils/supabaseClient";

export default function UserHome() {
  let { user } = useContext(AppContext);
  let [clubs, setClubs] = useState([]);
  let [joinClubs, setJoinClubs] = useState(false);

  useEffect(() => {
    handleLoadClubs();
  }, []);

  async function handleLoadClubs() {
    const { data, error } = await supabase
      .from("clubs")
      .select("*, club_memberships(*)")
      .eq("club_memberships.user_id", user.id);
    if (error) alert(error?.message);
    else setClubs(data);
  }

  async function handleCreateClub() {
    const name = prompt("Enter club name: ");

    if (name) {
      const { data, error } = await supabase
        .from("clubs")
        .insert({ name })
        .select();
      if (error) alert(error?.message);
      else setClubs([...clubs, ...data]);
    }
  }

  async function handleUpdateClub(club_id) {
    let name = prompt("Enter a new name for this club");
    if (name) {
      const { error } = await supabase
        .from("clubs")
        .update({ name })
        .eq("club_id", club_id);
      if (error) alert(error?.message);
      else
        setClubs(
          clubs.map((c) => (c.club_id === club_id ? { ...c, name } : c))
        );
    }
  }

  async function handleDeleteClub(club_id) {
    if (!confirm("Confirm DELETE?")) return;
    const { error } = await supabase
      .from("clubs")
      .delete()
      .eq("club_id", club_id);
    if (error) alert(error?.message);
    else setClubs(clubs.filter((c) => c.club_id !== club_id));
  }

  async function handleJoinClub(club_id) {
    if (!confirm("Confirm JOIN?")) return;
    const { data, error } = await supabase
      .from("club_memberships")
      .insert({
        user_id: user.id,
        club_id,
      })
      .select();
    if (error) alert(error?.message);
    else
      setClubs(
        clubs.map((c) =>
          c.club_id === club_id ? { ...c, club_memberships: data } : c
        )
      );
  }

  return (
    <div>
      <div>
        Welcome <strong>{user?.full_name}</strong>!
      </div>
      <div className="flex flex-col items-center space-y-3 my-3">
        {clubs
          .filter(
            (club) => club.club_memberships?.length > 0 || user?.roles.is_admin
          )
          .map((c) => (
            <Club
              handleJoinClub={handleJoinClub}
              handleDeleteClub={handleDeleteClub}
              handleUpdateClub={handleUpdateClub}
              key={c.club_id}
              club={c}
            />
          ))}
      </div>
      <div className="flex justify-between items-center">
        <button
          onClick={() => setJoinClubs(!joinClubs)}
          className="btn btn-primary btn-sm"
        >
          Join Club
        </button>
        {user?.roles.is_admin && (
          <button onClick={handleCreateClub} className="btn btn-primary btn-sm">
            Create Club
          </button>
        )}
      </div>
      {joinClubs && (
        <>
          <div className="divider divider-primary w-full" />
          <div className="flex flex-col items-center space-y-3 my-3">
            {clubs
              .filter(
                (club) =>
                  typeof club.club_memberships === "undefined" ||
                  club.club_memberships?.length === 0
              )
              .map((c) => (
                <Club
                  handleJoinClub={handleJoinClub}
                  handleDeleteClub={handleDeleteClub}
                  handleUpdateClub={handleUpdateClub}
                  key={c.club_id}
                  club={c}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
}

function Club({ club, handleJoinClub, handleUpdateClub, handleDeleteClub }) {
  let { user } = useContext(AppContext);
  return (
    <div className="border w-full rounded p-3 flex items-center justify-between">
      <Link to={`/club/${club.club_id}`} className="font-bold">
        {club.name}
      </Link>
      <div className="space-x-1">
        <button
          disabled={club.club_memberships?.length > 0}
          className="btn btn-xs btn-primary"
          onClick={() => handleJoinClub(club.club_id)}
        >
          Join
        </button>
        {user?.roles.is_admin && (
          <>
            <button
              className="btn btn-xs btn-warning"
              onClick={() => handleUpdateClub(club.club_id)}
            >
              Edit
            </button>
            <button
              className="btn btn-xs btn-error"
              onClick={() => handleDeleteClub(club.club_id)}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

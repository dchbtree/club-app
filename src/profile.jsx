import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "./App";
import { supabase } from "./utils/supabaseClient";

export default function Profile() {
  let { user_id } = useParams();
  let { user } = useContext(AppContext);
  let [profile, setProfile] = useState(undefined);
  let [editProfile, setEditProfile] = useState(false);

  useEffect(() => {
    if (user_id) handleLoadProfile();
  }, [user_id]);

  async function handleLoadProfile() {
    let { data, error } = await supabase
      .from("profiles")
      .select()
      .eq("id", user_id)
      .single();
    if (error) alert(error?.message);
    else setProfile(data);
  }

  async function handleUpdateProfile(column, newValue) {
    const { error } = await supabase
      .from("profiles")
      .update({
        [column]: newValue,
      })
      .eq("id", user_id);

    if (error) alert(error?.message);
    else
      setProfile({
        ...profile,
        [column]: newValue,
      });
  }

  return (
    <>
      <div className="flex">
        <div className="w-1/3 flex flex-col items-center space-y-1">
          <img
            className="rounded"
            src={
              profile?.profile_picture ||
              "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=2043&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            }
            alt="profile_picture"
          />
          {editProfile && (
            <button
              onClick={() => {
                let newUrl = prompt("Enter new image url: ");
                handleUpdateProfile("profile_picture", newUrl);
              }}
              className="btn btn-xs btn-neutral"
            >
              Upload Image
            </button>
          )}
        </div>
        <div className="flex-grow p-3 space-y-2">
          <div className="flex items-center space-x-1">
            <strong>Name:</strong>
            {editProfile ? (
              <form
                onSubmit={(ev) => {
                  ev.preventDefault();
                  handleUpdateProfile("full_name", ev.target.full_name.value);
                }}
              >
                <input
                  name="full_name"
                  className="input input-sm input-primary rounded-tr-none rounded-br-none"
                />
                <button className="btn btn-sm btn-primary rounded-tl-none rounded-bl-none">
                  Save
                </button>
              </form>
            ) : (
              <div>{profile?.full_name}</div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <strong>Graduation Year:</strong>
            {editProfile ? (
              <form
                onSubmit={(ev) => {
                  ev.preventDefault();
                  handleUpdateProfile(
                    "grad_year",
                    parseInt(ev.target.grad_year.value, 10)
                  );
                }}
              >
                <input
                  type="number"
                  name="grad_year"
                  className="input input-sm input-primary rounded-tr-none rounded-br-none"
                />
                <button className="btn btn-sm btn-primary rounded-tl-none rounded-bl-none">
                  Save
                </button>
              </form>
            ) : (
              <div>{profile?.grad_year}</div>
            )}
          </div>
        </div>
      </div>
      {user_id === user?.id && (
        <div className="flex justify-end p-3 space-x-1">
          {editProfile ? (
            <button
              onClick={() => setEditProfile(false)}
              className="btn btn-xs btn-error"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setEditProfile(true)}
              className="btn btn-xs btn-warning"
            >
              Edit Profile
            </button>
          )}
        </div>
      )}
    </>
  );
}

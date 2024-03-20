import { useContext, useEffect, useState } from "react";
import { AppContext } from "./App";
import { supabase } from "./utils/supabaseClient";

const PAGE_SIZE = 5;

export default function Announcements() {
  let { user } = useContext(AppContext);
  let [page, setPage] = useState(0);
  let [announcements, setAnnouncements] = useState([]);
  let [announcementCnt, setAnnouncementCnt] = useState(0);
  let [clubsMap, setClubsMap] = useState(undefined);

  useEffect(() => {
    if (user) handleLoadClubs();
  }, [user]);

  useEffect(() => {
    if (clubsMap) {
      handleLoadAnnouncementCnt();
      handleLoadAnnouncements();
    }
  }, [clubsMap]);

  useEffect(() => {
    if (clubsMap) handleLoadAnnouncements();
  }, [page]);

  async function handleLoadClubs() {
    const { data, error } = await supabase
      .from("club_memberships")
      .select("*, clubs(*)")
      .eq("user_id", user.id);
    if (error) alert(error?.message);
    else {
      let map = new Map(data.map((d) => [d.club_id, d.clubs.name]));
      setClubsMap(map);
    }
  }

  async function handleLoadAnnouncementCnt() {
    const { count, error } = await supabase
      .from("announcements")
      .select("*", { count: "exact", head: true })
      .in("club_id", Array.from(clubsMap.keys()));

    if (error) alert(error?.message);
    else setAnnouncementCnt(count);
  }

  async function handleLoadAnnouncements() {
    if (announcements.length > page * PAGE_SIZE) return;
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .in("club_id", Array.from(clubsMap.keys()))
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + (PAGE_SIZE - 1));
    if (error) alert(error?.message);
    else setAnnouncements([...announcements, ...data]);
  }

  return (
    <div className="space-y-2">
      <div className="font-bold text-center text-xl">Announcements</div>
      <div className="space-y-2">
        {announcements
          .filter(
            (_, i) =>
              page * PAGE_SIZE <= i && i <= page * PAGE_SIZE + (PAGE_SIZE - 1)
          )
          .map((a) => (
            <Announcement
              key={a.announcement_id}
              announcement={a}
              name={clubsMap.get(a.club_id)}
            />
          ))}
      </div>
      <div className="flex justify-between">
        <button
          disabled={page <= 0}
          onClick={() => setPage(page - 1)}
          className="btn btn-neutral btn-xs"
        >
          prev
        </button>
        <button
          disabled={page >= Math.ceil(announcementCnt / PAGE_SIZE) - 1}
          onClick={() => setPage(page + 1)}
          className="btn btn-neutral btn-xs"
        >
          next
        </button>
      </div>
    </div>
  );
}

function Announcement({ announcement, club_id }) {
  return (
    <div className="space-y-3 bg-base-300 p-3 rounded">
      <div>{announcement.text}</div>
      <div className="flex justify-between items-center">
        <div className="text-xs">
          {new Date(announcement.created_at).toDateString()}
        </div>
        <div className="flex items-center">
          <div className="text-sm font-bold">{announcement.author}</div>
        </div>
      </div>
    </div>
  );
}

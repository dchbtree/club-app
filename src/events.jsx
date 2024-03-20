import { useContext, useEffect, useState } from "react";
import { AppContext } from "./App";
import { supabase } from "./utils/supabaseClient";
import { Link } from "react-router-dom";

const PAGE_SIZE = 5;

export default function Events() {
  let { user } = useContext(AppContext);
  let [page, setPage] = useState(0);
  let [events, setEvents] = useState([]);
  let [eventCnt, setEventCnt] = useState(0);
  let [clubsMap, setClubsMap] = useState(undefined);

  useEffect(() => {
    if (user) handleLoadClubs();
  }, [user]);

  useEffect(() => {
    if (clubsMap) {
      handleLoadEventCnt();
      handleLoadEvents();
    }
  }, [clubsMap]);

  useEffect(() => {
    if (clubsMap) handleLoadEvents();
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

  async function handleLoadEventCnt() {
    const { count, error } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .in("club_id", Array.from(clubsMap.keys()));

    if (error) alert(error?.message);
    else setEventCnt(count);
  }

  async function handleLoadEvents() {
    if (events.length > page * PAGE_SIZE) return;
    const { data, error } = await supabase
      .from("events")
      .select("*, event_reservations(*)")
      .in("club_id", Array.from(clubsMap.keys()))
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + (PAGE_SIZE - 1));
    if (error) alert(error?.message);
    else setEvents([...events, ...data]);
  }

  async function handleReserveEvent(event_id, reserved) {
    if (reserved) {
      const { error } = await supabase
        .from("event_reservations")
        .delete()
        .eq("event_id", event_id)
        .eq("user_id", user.id);
      if (error) alert(error?.message);
      else
        setEvents(
          events.map((event) =>
            event.event_id === event_id
              ? {
                  ...event,
                  event_reservations: event.event_reservations.filter(
                    (e) => e.user_id !== user.id
                  ),
                }
              : event
          )
        );
    } else {
      const { data, error } = await supabase
        .from("event_reservations")
        .insert({
          user_id: user.id,
          event_id,
        })
        .select()
        .single();

      if (error) alert(error?.message);
      else
        setEvents(
          events.map((event) =>
            event.event_id === event_id
              ? {
                  ...event,
                  event_reservations: [...event.event_reservations, data],
                }
              : event
          )
        );
    }
  }

  return (
    <div className="space-y-2">
      <div className="font-bold text-center text-xl">Events</div>
      <div className="space-y-2">
        {events
          .filter(
            (_, i) =>
              page * PAGE_SIZE <= i && i <= page * PAGE_SIZE + (PAGE_SIZE - 1)
          )
          .map((e) => (
            <Event
              key={e.event_id}
              event={e}
              handleReserveEvent={handleReserveEvent}
              name={clubsMap.get(e.club_id)}
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
          disabled={page >= Math.ceil(eventCnt / PAGE_SIZE) - 1}
          onClick={() => setPage(page + 1)}
          className="btn btn-neutral btn-xs"
        >
          next
        </button>
      </div>
    </div>
  );
}

function Event({ event, name, handleReserveEvent }) {
  let { user } = useContext(AppContext);

  let date = new Date(event.date);
  let y = date.getFullYear();
  let m = date.getMonth() + 1; // 0 - 11
  let d = date.getDate();

  date = `${y}-${m < 10 ? `0${m}` : m}-${d < 10 ? `0${d}` : d}`;

  let reserved = event.event_reservations?.find((e) => e.user_id === user.id);

  return (
    <>
      <div className="space-y-3 bg-base-300 p-3 rounded">
        <div className="flex justify-between items-start">
          <div className="font-bold text-xl">{event.title}</div>
          <div className="flex flex-col items-end space-y-1">
            <Link
              className="btn btn-neutral btn-xs"
              to={`/club/${event.club_id}`}
            >
              {name}
            </Link>
            <div className="text-sm flex items-center space-x-1">
              <div>{new Date(event.date).toLocaleDateString()}</div>
              <div>{new Date(event.date).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
        <div>{event.text}</div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleReserveEvent(event.event_id, reserved)}
              className={`btn ${reserved ? "btn-error" : "btn-primary"} btn-xs`}
            >
              {reserved ? "Cancel RSVP" : "RSVP"}
            </button>
            {event.event_reservations?.length > 0 && (
              <div
                onClick={() => setShowReservations(true)}
                className="bg-neutral rounded-lg p-1 flex items-center justify-center font-bold text-xs"
              >
                {event.event_reservations?.length}
              </div>
            )}
          </div>
          <div className="flex items-center">
            <div className="text-sm font-bold">{event.author}</div>
          </div>
        </div>
      </div>
    </>
  );
}

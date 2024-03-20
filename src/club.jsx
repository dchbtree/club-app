import { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "./App";
import Modal from "./components/modal";
import { supabase } from "./utils/supabaseClient";

const PAGE_SIZE = 3;

export default function Club() {
  let { user } = useContext(AppContext);
  let { club_id } = useParams();
  let [club, setClub] = useState(undefined);

  const userIdNameMap = useMemo(() => {
    let m = new Map();

    for (let i = 0; i < club?.club_memberships.length; i++) {
      m.set(
        club.club_memberships[i].user_id,
        club.club_memberships[i].profiles.full_name
      );
    }

    return m;
  }, [club]);

  useEffect(() => {
    if (club_id) {
      handleLoadClub();
    }
  }, [club_id]);

  async function handleLoadClub() {
    const { data, error } = await supabase
      .from("clubs")
      .select(
        `*, 
        club_memberships(user_id, role, profiles(full_name, grad_year)), 
        announcements(*), 
        events(*, event_reservations(*))`
      )
      .single()
      .eq("club_id", club_id)
      .order("created_at", { foreignTable: "announcements", ascending: false })
      .range(0, PAGE_SIZE - 1, { foreignTable: "announcements" })
      .order("date", { foreignTable: "events", ascending: true })
      .range(0, PAGE_SIZE - 1, { foreignTable: "events" });
    if (error) alert(error?.message);
    else setClub(data);
  }

  let role = club?.club_memberships.find(
    (member) => member.user_id === user.id
  )?.role;



  if (typeof club === "undefined") return <div>Loading...</div>;

  return (
    <>
      <div>
        <div className="text-center font-bold text-2xl mb-3">{club.name}</div>
        <Description isAdmin={role === "admin" || user?.roles?.is_admin} club={club} setClub={setClub} />
        <Members role={role} club={club} setClub={setClub} />
        {(["admin", "member"].includes(role) || user?.roles?.is_admin) && (
          <>
            <Announcements
              isAdmin={role === "admin" || user?.roles?.is_admin}
              club={club}
              setClub={setClub}
            />
            <Events
              isAdmin={role === "admin" || user?.roles?.is_admin}
              userIdNameMap={userIdNameMap}
              club={club}
              setClub={setClub}
            />
          </>
        )}
        {role === "pending" && (
          <div className="font-bold text-center">
            Your application is currently pending.
          </div>
        )}
      </div>
    </>
  );
}

function Members({ role, club, setClub }) {
  let { user } = useContext(AppContext);

  async function handleUpdateRole(user_id, role) {
    const { error } = await supabase
      .from("club_memberships")
      .update({
        role,
      })
      .eq("club_id", club.club_id)
      .eq("user_id", user_id);
    if (error) alert(error?.message);
    else
      setClub({
        ...club,
        club_memberships: club.club_memberships.map((m) =>
          m.user_id === user_id ? { ...m, role: "member" } : m
        ),
      });
  }

  async function handleDeleteMember(user_id) {
    if (!confirm("Are you sure you want to DELETE this member?")) return;
    const { error } = await supabase
      .from("club_memberships")
      .delete()
      .eq("user_id", user_id);
    if (error) alert(error?.message);
    else
      setClub({
        ...club,
        club_memberships: club.club_memberships.filter(
          (m) => m.user_id !== user_id
        ),
      });
  }

  return (
    <>
      <div className="text-center font-bold text-xl mb-3">Members</div>
      <div className="overflow-x-auto bg-base-200 mb-3">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Graduation Year</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {club.club_memberships
              .filter((m) => m.role !== "pending" || role === "admin" || user?.roles?.is_admin)
              .map((member, i) => (
                <tr key={member.user_id}>
                  <th>{i + 1}</th>
                  <td>{member.profiles.full_name}</td>
                  <td>{member.profiles.grad_year}</td>
                  <td className="flex items-center space-x-2">
                    {user?.roles.is_admin && (
                      <select
                        onChange={(ev) =>
                          handleUpdateRole(member.user_id, ev.target.value)
                        }
                        defaultValue={member.role}
                        className="select select-primary select-sm"
                      >
                        <option value="admin">admin</option>
                        <option value="member">member</option>
                      </select>
                    )}
                    {role === "admin" || user?.roles?.is_admin ? (
                      <div className="flex items-center space-x-2">
                        <div>{member.role}</div>
                        {member.role === "member" && (
                          <button
                            onClick={() => handleDeleteMember(member.user_id)}
                            className="btn btn-xs btn-error"
                          >
                            Remove
                          </button>
                        )}
                        {member.role === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateRole(member.user_id, "member")
                              }
                              className="btn btn-xs btn-success"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDeleteMember(member.user_id)}
                              className="btn btn-xs btn-error"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div>{member.role}</div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Description({ isAdmin, club, setClub }) {
  let [editDescription, setEditDescription] = useState(false);
  let [newDescription, setNewDescription] = useState(club.description);

  async function handleUpdateDescription() {
    let { error } = await supabase
      .from("clubs")
      .update({
        description: newDescription,
      })
      .eq("club_id", club.club_id);
    if (error) alert(error?.message);
    else setClub({ ...club, description: newDescription });
  }

  return (
    <div className="px-5 text-sm mb-3">
      <div>{club.description}</div>
      {editDescription && (
        <>
          <div className="divider" />
          <textarea
            className="textarea textarea-bordered w-full"
            value={newDescription}
            onChange={(ev) => setNewDescription(ev.target.value)}
          ></textarea>
        </>
      )}
      {isAdmin && (
        <div className="flex justify-end my-2 space-x-1">
          <button
            onClick={handleUpdateDescription}
            className="btn btn-sm btn-primary"
          >
            Save
          </button>
          {editDescription ? (
            <button
              className="btn btn-sm btn-error"
              onClick={() => {
                setEditDescription(false);
                setNewDescription(club.description);
              }}
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setEditDescription(true)}
              className="btn btn-sm btn-warning"
            >
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Announcements({ isAdmin, club, setClub }) {
  let [showModal, setShowModal] = useState(false);
  let [page, setPage] = useState(0);
  let [announcementCnt, setAnnouncementCnt] = useState(0);
  let { user } = useContext(AppContext);

  useEffect(() => {
    handleLoadAnnouncementCnt();
  }, [club]);

  useEffect(() => {
    handleLoadAnnouncements();
  }, [page]);

  async function handleLoadAnnouncementCnt() {
    const { count, error } = await supabase
      .from("announcements")
      .select("*", { count: "exact", head: true })
      .eq("club_id", club.club_id);
    if (error) alert(error?.message);
    else setAnnouncementCnt(count);
  }

  async function handleLoadAnnouncements() {
    if (club.announcements.length > page * PAGE_SIZE) return;
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("club_id", club.club_id)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + (PAGE_SIZE - 1));
    if (error) alert(error?.message);
    else setClub({ ...club, announcements: [...club.announcements, ...data] });
  }

  async function handleAddAnnouncement(ev) {
    ev.preventDefault();

    let obj = {
      club_id: club.club_id,
      text: ev.target.text.value,
      author: user.full_name,
    };

    const { data, error } = await supabase
      .from("announcements")
      .insert(obj)
      .select()
      .single();

    if (error) alert(error?.message);
    else {
      setClub({ ...club, announcements: [...club.announcements, data] });
      setShowModal(false);
    }
  }

  async function handleEditAnnouncement(ev, announcement_id, close) {
    ev.preventDefault();

    const { error } = await supabase
      .from("announcements")
      .update({
        text: ev.target.text.value,
      })
      .eq("announcement_id", announcement_id);

    if (error) alert(error?.message);
    else {
      setClub({
        ...club,
        announcements: club.announcements.map((a) =>
          a.announcement_id === announcement_id
            ? { ...a, text: ev.target.text.value }
            : a
        ),
      });
      close();
    }
  }

  async function handleDeleteAnnouncement(announcement_id) {
    if (!confirm("Confirm DELETE?")) return;

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("announcement_id", announcement_id);

    if (error) alert(error?.message);
    else
      setClub({
        ...club,
        announcements: club.announcements.filter(
          (a) => a.announcement_id !== announcement_id
        ),
      });
  }

  return (
    <>
      <div className="space-y-3 mb-3">
        <div className="text-center font-bold text-xl">Announcements</div>
        <div className="space-y-3">
          {club.announcements
            .filter(
              (_, i) =>
                page * PAGE_SIZE <= i && i <= page * PAGE_SIZE + (PAGE_SIZE - 1)
            )
            .map((a) => (
              <Announcement
                key={a.announcement_id}
                isAdmin={isAdmin}
                announcement={a}
                handleEditAnnouncement={handleEditAnnouncement}
                handleDeleteAnnouncement={handleDeleteAnnouncement}
              />
            ))}
        </div>
        <div className="flex justify-between">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="btn btn-neutral btn-xs"
          >
            Prev
          </button>
          <button
            disabled={page === Math.ceil(announcementCnt / PAGE_SIZE) - 1}
            onClick={() => setPage(page + 1)}
            className="btn btn-neutral btn-xs"
          >
            Next
          </button>
        </div>
        {isAdmin && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-xs btn-primary"
            >
              Add Announcement
            </button>
          </div>
        )}
      </div>
      <Modal show={showModal} close={() => setShowModal(false)}>
        {showModal && (
          <form
            onSubmit={handleAddAnnouncement}
            className="w-full flex flex-col space-y-3"
          >
            <div className="font-bold text-center text-xl">
              Add Announcement
            </div>
            <textarea
              name="text"
              className="textarea textarea-primary"
            ></textarea>
            <button className="btn btn-primary btn-xs">Submit</button>
          </form>
        )}
      </Modal>
    </>
  );
}

function Announcement({
  isAdmin,
  announcement,
  handleEditAnnouncement,
  handleDeleteAnnouncement,
}) {
  let [modalText, setModalText] = useState(null);

  return (
    <>
      <div className="space-y-3 bg-base-300 p-3 rounded">
        <div>{announcement.text}</div>
        <div className="flex justify-between items-center">
          <div className="text-xs">
            {new Date(announcement.created_at).toDateString()}
          </div>
          <div className="flex items-center">
            <div className="text-sm font-bold">{announcement.author}</div>
            {isAdmin && (
              <div className="space-x-1 ml-1">
                <button
                  onClick={() => setModalText(announcement.text)}
                  className="btn btn-xs btn-warning"
                >
                  Edit
                </button>
                <button
                  className="btn btn-xs btn-error"
                  onClick={() =>
                    handleDeleteAnnouncement(announcement.announcement_id)
                  }
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal show={modalText} close={() => setModalText(null)}>
        {modalText && (
          <form
            onSubmit={(ev) => {
              handleEditAnnouncement(ev, announcement.announcement_id, () =>
                setModalText(null)
              );
            }}
            className="w-full flex flex-col space-y-3"
          >
            <div className="font-bold text-center text-xl">
              Edit Announcement
            </div>
            <textarea
              defaultValue={modalText}
              name="text"
              className="textarea textarea-primary"
            ></textarea>
            <button className="btn btn-primary btn-xs">Submit</button>
          </form>
        )}
      </Modal>
    </>
  );
}

function Events({ isAdmin, userIdNameMap, club, setClub }) {
  let [showModal, setShowModal] = useState(false);
  let { user } = useContext(AppContext);
  let [eventCnt, setEventCnt] = useState(0);
  let [page, setPage] = useState(0);

  useEffect(() => {
    handleLoadEventCnt();
  }, [club]);

  useEffect(() => {
    handleLoadEvents();
  }, [page]);

  async function handleLoadEventCnt() {
    const { count, error } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("club_id", club.club_id);
    if (error) alert(error?.message);
    else setEventCnt(count);
  }

  async function handleLoadEvents() {
    if (club.events.length > page * PAGE_SIZE) return;
    const { data, error } = await supabase
      .from("events")
      .select("*, event_reservations(*)")
      .eq("club_id", club.club_id)
      .order("date", { ascending: true })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + (PAGE_SIZE - 1));
    if (error) alert(error?.message);
    else setClub({ ...club, events: [...club.events, ...data] });
  }

  async function handleAddEvent(ev) {
    ev.preventDefault();

    let date = new Date(`${ev.target.date.value} ${ev.target.time.value}`);

    let obj = {
      club_id: club.club_id,
      text: ev.target.text.value,
      author: user.full_name,
      title: ev.target.title.value,
      date,
    };

    const { data, error } = await supabase
      .from("events")
      .insert(obj)
      .select()
      .single();

    if (error) alert(error?.message);
    else {
      setClub({ ...club, events: [...club.events, data] });
      setShowModal(false);
    }
  }

  async function handleEditEvent(ev, event_id, close) {
    ev.preventDefault();

    let date = new Date(`${ev.target.date.value} ${ev.target.time.value}`);

    const { error } = await supabase
      .from("events")
      .update({
        text: ev.target.text.value,
        title: ev.target.title.value,
        date,
      })
      .eq("event_id", event_id);

    if (error) alert(error?.message);
    else {
      setClub({
        ...club,
        events: club.events.map((a) =>
          a.event_id === event_id
            ? {
              ...a,
              text: ev.target.text.value,
              title: ev.target.title.value,
              date,
            }
            : a
        ),
      });
      close();
    }
  }

  async function handleDeleteEvent(event_id) {
    if (!confirm("Confirm DELETE?")) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("event_id", event_id);

    if (error) alert(error?.message);
    else
      setClub({
        ...club,
        events: club.events.filter((a) => a.event_id !== event_id),
      });
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
        setClub({
          ...club,
          events: club.events.map((event) =>
            event.event_id === event_id
              ? {
                ...event,
                event_reservations: event.event_reservations.filter(
                  (e) => e.user_id !== user.id
                ),
              }
              : event
          ),
        });
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
        setClub({
          ...club,
          events: club.events.map((event) =>
            event.event_id === event_id
              ? {
                ...event,
                event_reservations: [...event.event_reservations, data],
              }
              : event
          ),
        });
    }
  }

  return (
    <>
      <div className="space-y-3 mb-3">
        <div className="text-center font-bold text-xl">Events</div>
        <div className="space-y-3">
          {club.events.filter((_, i) => page * PAGE_SIZE <= i && i <= page * PAGE_SIZE + (PAGE_SIZE - 1)).map((e) => (
            <Event
              key={e.event_id}
              isAdmin={isAdmin}
              userIdNameMap={userIdNameMap}
              event={e}
              handleEditEvent={handleEditEvent}
              handleDeleteEvent={handleDeleteEvent}
              handleReserveEvent={handleReserveEvent}
            />
          ))}
        </div>
        <div className="flex justify-between">
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="btn btn-neutral btn-xs"
          >
            Prev
          </button>
          <button
            disabled={page === Math.ceil(eventCnt / PAGE_SIZE) - 1}
            onClick={() => setPage(page + 1)}
            className="btn btn-neutral btn-xs"
          >
            Next
          </button>
        </div>
        {isAdmin && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-xs btn-primary"
            >
              Add Event
            </button>
          </div>
        )}
      </div>
      <Modal show={showModal} close={() => setShowModal(false)}>
        {showModal && (
          <form
            onSubmit={handleAddEvent}
            className="w-full flex flex-col space-y-3"
          >
            <div className="font-bold text-center text-xl">Add Event</div>
            <label>Event Title</label>
            <input
              type="text"
              name="title"
              className="input input-sm input-primary"
            />
            <label>Event Description</label>
            <textarea
              name="text"
              className="textarea textarea-primary"
            ></textarea>
            <label>Event Date & Time</label>
            <input
              type="date"
              name="date"
              className="input input-sm input-primary"
            />
            <input
              type="time"
              name="time"
              className="input input-sm input-primary"
            />
            <button className="btn btn-primary btn-xs">Submit</button>
          </form>
        )}
      </Modal>
    </>
  );
}

function Event({
  isAdmin,
  userIdNameMap,
  event,
  handleEditEvent,
  handleDeleteEvent,
  handleReserveEvent,
}) {
  let [showModal, setShowModal] = useState(false);
  let [showReservations, setShowReservations] = useState(false);
  let { user } = useContext(AppContext);

  // 2024-03-08 17:30
  // 2024-03-09T01:30:00+00:00

  let date = new Date(event.date);
  let y = date.getFullYear();
  let m = date.getMonth() + 1; // 0 - 11
  let d = date.getDate();

  let time = date.toTimeString().substring(0, 5);
  date = `${y}-${m < 10 ? `0${m}` : m}-${d < 10 ? `0${d}` : d}`;

  let reserved = event.event_reservations?.find((e) => e.user_id === user.id);

  return (
    <>
      <div className="space-y-3 bg-base-300 p-3 rounded">
        <div className="flex justify-between items-center">
          <div className="font-bold text-xl">{event.title}</div>
          <div className="text-sm">
            {new Date(event.date).toLocaleDateString()}{" "}
            {new Date(event.date).toLocaleTimeString()}
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
            {isAdmin && (
              <div className="space-x-1 ml-1">
                <button
                  onClick={() => setShowModal(true)}
                  className="btn btn-xs btn-warning"
                >
                  Edit
                </button>
                <button
                  className="btn btn-xs btn-error"
                  onClick={() => handleDeleteEvent(event.event_id)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal show={showReservations} close={() => setShowReservations(false)}>
        {showReservations && (
          <div>
            <div className="text-xl text-center font-bold">RSVPs</div>
            <div className="grid grid-cols-4">
              {event.event_reservations?.map((r) => (
                <div className="text-center">
                  {userIdNameMap.get(r.user_id)}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
      <Modal show={showModal} close={() => setShowModal(false)}>
        {showModal && (
          <form
            onSubmit={(ev) => {
              handleEditEvent(ev, event.event_id, () => setShowModal(false));
            }}
            className="w-full flex flex-col space-y-3"
          >
            <div className="font-bold text-center text-xl">Edit Event</div>
            <label>Event Title</label>
            <input
              defaultValue={event.title}
              type="text"
              name="title"
              className="input input-sm input-primary"
            />
            <label>Event Description</label>
            <textarea
              defaultValue={event.text}
              name="text"
              className="textarea textarea-primary"
            ></textarea>
            <label>Event Date & Time</label>
            <input
              defaultValue={date}
              type="date"
              name="date"
              className="input input-sm input-primary"
            />
            <input
              defaultValue={time}
              type="time"
              name="time"
              className="input input-sm input-primary"
            />
            <button className="btn btn-primary btn-xs">Submit</button>
          </form>
        )}
      </Modal>
    </>
  );
}

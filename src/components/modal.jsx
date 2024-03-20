export default function Modal({ show, close, children }) {
    return (
      <div
        onClick={close}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)", top: show ? 0 : "-150%" }}
        className="w-screen h-screen fixed top-0 left-0 flex justify-center items-center duration-500"
      >
        <div
          onClick={(ev) => ev.stopPropagation()}
          className="w-4/5 bg-base-100 p-3 rounded relative"
        >
          <button
            onClick={close}
            className="absolute right-1 top-1 btn btn-error btn-xs"
          >
            X
          </button>
          {children}
        </div>
      </div>
    );
  }
  
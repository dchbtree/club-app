import { useState } from "react";
import { supabase } from "./utils/supabaseClient";
import { FcGoogle } from "react-icons/fc";

export default function Auth() {
  return (
    <div className="border border-primary p-5 rounded-lg">
      <SignUp />
      <div className="divider divider-primary" />
      <SignIn />
    </div>
  );
}

function SignUp() {
  let [error, setError] = useState(null);

  async function signUp(ev) {
    ev.preventDefault();

    setError(null);

    const data = {
      email: ev.target.email.value,
      password: ev.target.password.value,
      options: {
        data: {
          full_name: ev.target.full_name.value,
          grad_year: parseInt(ev.target.grad_year.value, 10),
        },
      },
    };

    let { error } = await supabase.auth.signUp(data);

    if (error) setError(error.message);
  }

  return (
    <>
      <div className="text-center text-xl mb-2">Sign Up</div>
      <form className="flex flex-col items-center space-y-2" onSubmit={signUp}>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">e-mail</span>
          </div>
          <input
            type="email"
            name="email"
            placeholder="name@domain.com"
            className="input input-primary w-full max-w-xs"
          />
        </label>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">password</span>
          </div>
          <input
            type="password"
            name="password"
            placeholder=""
            className="input input-primary w-full max-w-xs"
          />
        </label>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">name</span>
          </div>
          <input
            type="text"
            name="full_name"
            placeholder=""
            className="input input-primary w-full max-w-xs"
          />
        </label>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">graduation year</span>
          </div>
          <input
            type="number"
            name="grad_year"
            placeholder=""
            className="input input-primary w-full max-w-xs"
          />
        </label>
        <button className="btn btn-sm btn-primary">Sign Up</button>
      </form>
      {error && <div className="text-center text-error mt-2">{error}</div>}
    </>
  );
}

function SignIn() {
  let [error, setError] = useState(null);

  async function signIn(ev) {
    ev.preventDefault();

    setError(null);

    let { error } = await supabase.auth.signInWithPassword({
      email: ev.target.email.value,
      password: ev.target.password.value,
    });

    if (error) setError(error.message);
  }

  async function handleGooglesignin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/redirect",
      },
    });
  }

  return (
    <>
      <div className="text-center text-xl mb-2">Sign In</div>
      <form className="flex flex-col items-center space-y-2" onSubmit={signIn}>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">e-mail</span>
          </div>
          <input
            type="email"
            name="email"
            placeholder="name@domain.com"
            className="input input-primary w-full max-w-xs"
          />
        </label>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">password</span>
          </div>
          <input
            type="password"
            name="password"
            placeholder=""
            className="input input-primary w-full max-w-xs"
          />
        </label>
        <button className="btn btn-sm btn-primary">Sign In</button>
      </form>
      
      {error && <div className="text-center text-error mt-2">{error}</div>}
      <div className="divider divider-primary" />
      <div className="text-center text-xl mb-2">Other Providers</div>
      <div className="flex justify-center">
        <button className="btn btn-neutral" onClick={handleGooglesignin}>
          <FcGoogle />
        </button>
      </div>
    </>
  );
}

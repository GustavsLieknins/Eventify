import React from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import TopNav from '@/Shared/TopNav';
import './Auth.css';

export default function Login({ status, canResetPassword }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const submit = (e) => {
    e.preventDefault();
    post(route('login'), { onFinish: () => reset('password') });
  };

  return (
    <>
      <Head title="Log in" />
      <TopNav active="login" />

      <div className="auth-shell">
        <section className="auth-card" role="main" aria-labelledby="login-title">
          <div className="auth-head">
            <h1 id="login-title" className="auth-title">Welcome back</h1>
            <p className="auth-sub">Sign in to continue to Eventify</p>
          </div>

          {/* ——— Social providers (compact) ——— */}
          <div className="social-auth compact">
            <a className="provider-btn google" href="/auth/google/redirect" aria-label="Continue with Google">
              <span className="pv-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M21.35 11.1H12v2.9h5.3c-.23 1.47-1.8 4.3-5.3 4.3a5.5 5.5 0 110-11c1.56 0 2.95.54 4.04 1.6l2.03-2.03A8.78 8.78 0 0012 3.5a8.5 8.5 0 100 17c4.9 0 8.33-3.44 8.33-8.33 0-.56-.07-1.06-.18-1.57z"/>
                </svg>
              </span>
              <span className="pv-label">Continue with Google</span>
            </a>

            <a className="provider-btn github" href="/auth/github/redirect" aria-label="Continue with GitHub">
              <span className="pv-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 .5a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.41-1.35-1.79-1.35-1.79-1.1-.75.08-.73.08-.73 1.21.09 1.84 1.25 1.84 1.25 1.08 1.86 2.83 1.32 3.52 1.01.11-.79.42-1.32.76-1.62-2.67-.3-5.48-1.33-5.48-5.93 0-1.31.47-2.39 1.24-3.23-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.4 11.4 0 016 0c2.3-1.55 3.31-1.23 3.31-1.23.66 1.65.24 2.87.12 3.17.78.84 1.24 1.92 1.24 3.23 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.09.81 2.2 0 1.59-.02 2.87-.02 3.26 0 .32.21.7.83.58A12 12 0 0012 .5z"/>
                </svg>
              </span>
              <span className="pv-label">Continue with GitHub</span>
            </a>

            <div className="pv-divider"><span>or continue with email</span></div>
          </div>
          {/* ——— /Social providers ——— */}

          {status && (
            <div className="auth-status" role="status">
              {status}
            </div>
          )}

          <form onSubmit={submit} className="auth-form">
            <div className="field">
              <InputLabel htmlFor="email" value="Email" />
              <TextInput
                id="email"
                type="email"
                name="email"
                value={data.email}
                className="mt-1 block w-full"
                autoComplete="username"
                isFocused
                onChange={(e) => setData('email', e.target.value)}
                required
              />
              <InputError message={errors.email} className="mt-2" />
            </div>

            <div className="field mt-4">
              <InputLabel htmlFor="password" value="Password" />
              <TextInput
                id="password"
                type="password"
                name="password"
                value={data.password}
                className="mt-1 block w-full"
                autoComplete="current-password"
                onChange={(e) => setData('password', e.target.value)}
                required
              />
              <InputError message={errors.password} className="mt-2" />
            </div>

            <div className="row mt-4">
              <label className="remember">
                <Checkbox
                  name="remember"
                  checked={data.remember}
                  onChange={(e) => setData('remember', e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              {/* {canResetPassword && (
                <Link href={route('password.request')} className="auth-link">
                  Forgot your password?
                </Link>
              )} */}
            </div>

            <div className="row mt-6">
              <PrimaryButton className="grow" disabled={processing}>
                {processing ? 'Signing in…' : 'Log in'}
              </PrimaryButton>
            </div>

            <div className="auth-foot">
              <span className="muted">New here?</span>
              <Link href={route('register')} className="auth-link">Create an account</Link>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}

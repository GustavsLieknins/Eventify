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
                <Link
                  href={route('password.request')}
                  className="auth-link"
                >
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

'use client';

import { useState, type FormEvent } from 'react';
import {
  Eye24Regular, EyeOff24Regular, Key24Regular, LockClosed24Regular, Person24Regular,
  ShieldCheckmark24Regular,
} from '@fluentui/react-icons';

export default function LoginPage() {
  const [username,setUsername]=useState('');
  const [password,setPassword]=useState('');
  const [visible,setVisible]=useState(false);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true); setError('');
    try {
      const response=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
      const result=await response.json() as {error?:string};
      if(!response.ok){setError(result.error||'Sign-in failed.');return;}
      window.location.assign('/');
    } catch { setError('The local identity service is unavailable.'); }
    finally { setLoading(false); }
  }

  return <main className="login-page">
    <section className="login-story" aria-label="Platform introduction">
      <div className="login-brand"><span><ShieldCheckmark24Regular/></span><div><strong>Aegis</strong><small>M365 INTELLIGENCE</small></div></div>
      <div className="story-copy"><div className="story-kicker">SOVEREIGN SECURITY OPERATIONS</div><h1>See the risk.<br/><em>Prove the response.</em></h1><p>A private Microsoft 365 intelligence plane for security, governance, compliance, cost optimization, and controlled automation.</p><div className="story-points"><span><i><ShieldCheckmark24Regular/></i><b>Local-first processing<small>Enterprise data stays inside your environment</small></b></span><span><i><Key24Regular/></i><b>Zero Trust controls<small>Verified identity, least privilege, complete auditability</small></b></span><span><i><LockClosed24Regular/></i><b>Private intelligence<small>Grounded local AI without external data transfer</small></b></span></div></div>
      <footer><span>Aegis Enterprise Platform</span><span>Protected environment · TLS required in production</span></footer>
    </section>
    <section className="login-form-side">
      <div className="login-card">
        <div className="mobile-login-brand"><span><ShieldCheckmark24Regular/></span><strong>Aegis</strong></div>
        <div className="secure-chip"><LockClosed24Regular/> Protected workspace</div>
        <h2>Welcome back</h2><p>Sign in with your authorized local platform identity.</p>
        <form onSubmit={submit}>
          <label htmlFor="username">Email or username</label><div className="login-input"><Person24Regular/><input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck="false" required maxLength={254} value={username} onChange={e=>setUsername(e.target.value)} placeholder="admin@organization.local"/></div>
          <label htmlFor="password">Password</label><div className="login-input"><Key24Regular/><input id="password" name="password" type={visible?'text':'password'} autoComplete="current-password" required maxLength={256} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" onClick={()=>setVisible(!visible)} aria-label={visible?'Hide password':'Show password'}>{visible?<EyeOff24Regular/>:<Eye24Regular/>}</button></div>
          {error&&<div className="login-error" role="alert">{error}</div>}
          <button className="login-submit" disabled={loading} type="submit">{loading?<span className="spinner"/>:<LockClosed24Regular/>}{loading?'Verifying identity…':'Sign in securely'}</button>
        </form>
        <div className="login-divider"><span>Enterprise federation</span></div>
        <button className="entra-button" disabled title="Configure Entra OIDC for production deployment"><span className="ms-mark"><i/><i/><i/><i/></span>Sign in with Microsoft Entra ID<small>Requires administrator configuration</small></button>
        <div className="login-assurance"><ShieldCheckmark24Regular/><span><strong>Your session is protected</strong><small>HttpOnly cookie · 8-hour expiry · Rate-limited authentication</small></span></div>
        <p className="login-help">Need access? Contact your Platform Administrator.</p>
      </div>
    </section>
  </main>;
}


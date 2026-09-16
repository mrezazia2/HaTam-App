"use client";
import { useState } from "react";
export default function LogoutButton(){const [busy,setBusy]=useState(false);const logout=async()=>{setBusy(true);try{await fetch("/api/auth/logout",{method:"POST"})}finally{window.location.assign("/login")}};return <button className="session-logout" type="button" onClick={logout} disabled={busy}>{busy?"در حال خروج...":"خروج از حساب"}</button>}

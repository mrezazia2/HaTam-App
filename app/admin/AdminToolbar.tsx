"use client";
import Link from "next/link";
import {MoonIcon,SunIcon} from "@radix-ui/react-icons";
import {useTheme} from "../theme/ThemeProvider";

export default function AdminToolbar(){
 const {theme,toggleTheme}=useTheme();
 return <div className="admin-subpage-toolbar" dir="rtl"><Link href="/admin">بازگشت به مرکز مدیریت</Link><button type="button" onClick={toggleTheme} aria-label={theme==="dark"?"فعال‌کردن حالت روشن":"فعال‌کردن حالت تیره"} title={theme==="dark"?"حالت روشن":"حالت تیره"}>{theme==="dark"?<SunIcon/>:<MoonIcon/>}</button></div>;
}

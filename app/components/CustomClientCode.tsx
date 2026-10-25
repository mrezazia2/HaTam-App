"use client";
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
export default function CustomClientCode(){const pathname=usePathname();useEffect(()=>{if(/^(admin|consultant|agency|panel)\./.test(location.hostname)||/^\/(admin|consultant|agency|panel|login|register)(\/|$)/.test(location.pathname)||new URLSearchParams(location.search).has('safeMode'))return;const script=document.createElement('script');script.src='/api/custom-code';script.async=true;document.body.appendChild(script);return()=>{script.remove();document.querySelectorAll('style[data-hatam-custom]').forEach(x=>x.remove())}},[pathname]);return null}

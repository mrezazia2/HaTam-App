"use client";
import {useEffect} from 'react';
import {mobileHomeDestination} from './mobile-home';
export default function MobileHomeRedirect(){useEffect(()=>{
 const target=mobileHomeDestination(navigator.userAgent,location.hostname,location.search);
 if(target)location.replace(target);
 },[]);return null}

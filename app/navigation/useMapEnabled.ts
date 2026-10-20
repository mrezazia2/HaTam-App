"use client";
import {useEffect,useState} from "react";
export function useMapEnabled(){const [enabled,setEnabled]=useState(true);useEffect(()=>{let mounted=true;fetch("/api/navigation",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{if(mounted&&data)setEnabled(data.mapEnabled!==false)}).catch(()=>{});return()=>{mounted=false}},[]);return enabled}

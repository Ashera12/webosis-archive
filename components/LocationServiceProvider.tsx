"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

type LocationData = {
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  timestamp: number;
};

type LocationContextValue = {
  location: LocationData | null;
  permission: "prompt" | "granted" | "denied" | "unknown";
  refresh: () => void;
};

const LocationContext = createContext<LocationContextValue>({
  location: null,
  permission: "unknown",
  refresh: () => {},
});

export function useLiveLocation() {
  return useContext(LocationContext);
}

export default function LocationServiceProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [permission, setPermission] = useState<LocationContextValue["permission"]>("unknown");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const backoffRef = useRef<number>(30000); // 30s default

  const logLocation = async (loc: LocationData) => {
    try {
      await fetch("/api/security/log-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          timestamp: loc.timestamp,
          page: typeof window !== "undefined" ? window.location.pathname : "server",
        }),
      });
    } catch (e) {
      // Non-blocking
      console.warn("[LocationService] Log failed", (e as any)?.message);
    }
  };

  const getOnce = () => {
    if (!navigator.geolocation) {
      setPermission("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermission("granted");
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now(),
        };
        setLocation(loc);
        logLocation(loc);
        // reduce backoff when we have a good lock
        backoffRef.current = loc.accuracy <= 20 ? 30000 : 60000; // 30s if good, 60s otherwise
      },
      (err) => {
        console.warn("[LocationService]", err.code, err.message);
        if (err.code === err.PERMISSION_DENIED) setPermission("denied");
        else setPermission("prompt");
        // increase backoff on errors to avoid spamming
        backoffRef.current = Math.min(120000, backoffRef.current + 15000); // cap at 120s
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );
  };

  const refresh = () => {
    getOnce();
  };

  useEffect(() => {
    getOnce();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      getOnce();
    }, backoffRef.current);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location, permission]);

  return (
    <LocationContext.Provider value={{ location, permission, refresh }}>
      {children}
    </LocationContext.Provider>
  );
}

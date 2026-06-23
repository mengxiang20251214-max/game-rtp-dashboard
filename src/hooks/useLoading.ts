"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 模拟资源加载进度：0% → 100%，约 2.5–3.5 秒（随机增量，营造数据加载感）。
 * 到 100% 后置 ready=true。
 */
export function useLoading() {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        const inc = Math.random() * 6 + 2; // 每步 +2~8
        return Math.min(100, p + inc);
      });
    }, 160);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (progress >= 100 && !readyRef.current) {
      readyRef.current = true;
      setReady(true);
    }
  }, [progress]);

  return { progress: Math.round(progress), ready };
}

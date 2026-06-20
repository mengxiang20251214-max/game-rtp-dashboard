import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-content-secondary">加载中…</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

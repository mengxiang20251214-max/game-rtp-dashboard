import GameForm from "@/components/admin/GameForm";

export default function NewGamePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-content-primary">添加游戏</h1>
        <p className="mt-1 text-sm text-content-secondary">
          填写信息以创建新游戏，状态将根据 RTP 与目标值自动推导。
        </p>
      </div>
      <GameForm />
    </div>
  );
}

import type { User } from "../types";

/** The user's picture, or a blue circle with their first letter. */
export default function Avatar({ user, size = "h-9 w-9" }: { user: User; size?: string }) {
  if (user.avatar) {
    return <img src={user.avatar} alt="" className={`${size} rounded-full object-cover`} />;
  }
  return (
    <span className={`${size} flex items-center justify-center rounded-full bg-brand text-sm font-semibold text-white`}>
      {user.name.charAt(0).toUpperCase()}
    </span>
  );
}

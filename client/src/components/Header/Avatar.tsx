interface AvatarProps {
  userName?: string;
  className?: string;
}

export default function Avatar({ userName, className = "" }: AvatarProps) {
  // Get initials from userName
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`user-avatar ${className}`}>{getInitials(userName)}</div>
  );
}

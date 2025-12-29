import { Menu } from "@headlessui/react";
import Avatar from "./Avatar";
import { useLogout } from "../../hooks/useLogout";

interface UserMenuProps {
  userName?: string;
  onProfile?: () => void;
  onTransform?: () => void;
}

export default function UserMenu({
  userName,
  onProfile,
  onTransform,
}: UserMenuProps) {
  const { logout } = useLogout();

  return (
    <Menu as="div" className="user-menu">
      <Menu.Button className="user-menu-button">
        <Avatar userName={userName} />
        <span className="welcome-text">Welcome, {userName}!</span>
        <svg
          className="dropdown-arrow"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Menu.Button>

      <Menu.Items className="user-dropdown">
        <div className="dropdown-content">
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={onTransform}
                className={`dropdown-item mobile-only ${active ? "active" : ""}`}
              >
                <svg
                  className="dropdown-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Transform</span>
              </button>
            )}
          </Menu.Item>
          <div className="dropdown-separator mobile-only"></div>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={onProfile}
                className={`dropdown-item ${active ? "active" : ""}`}
              >
                <svg
                  className="dropdown-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Profile</span>
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={logout}
                className={`dropdown-item ${active ? "active" : ""}`}
              >
                <svg
                  className="dropdown-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Log Out</span>
              </button>
            )}
          </Menu.Item>
        </div>
      </Menu.Items>
    </Menu>
  );
}
